"""Maritime vessel tracking via AISStream.io WebSocket API.

Uses real AIS (Automatic Identification System) data to track vessels
in three critical waterways: Strait of Hormuz, Red Sea, and Suez Canal.
"""
import os
import json
import time
import asyncio
import websockets
from datetime import datetime, timezone
from typing import Optional
from models import VesselPosition, MaritimeZoneStats

AISSTREAM_API_KEY = os.getenv("AISSTREAM_API_KEY", "")
AISSTREAM_WS_URL = "wss://stream.aisstream.io/v0/stream"

# AIS ship type codes to our categories
# https://coast.noaa.gov/data/marinecadastre/ais/VesselTypeCodes2018.pdf
SHIP_TYPE_MAP: dict[range | int, tuple[str, str]] = {}

def _classify_ship_type(ais_type: int) -> tuple[str, str]:
    """Classify AIS ship type code into our categories."""
    if 70 <= ais_type <= 79:
        return "cargo", "شحن"
    elif 80 <= ais_type <= 89:
        return "tanker", "ناقلة"
    elif 60 <= ais_type <= 69:
        return "passenger", "ركاب"
    elif 35 <= ais_type <= 39:
        return "military", "عسكري"
    elif 30 <= ais_type <= 34:
        return "fishing", "صيد"
    elif 40 <= ais_type <= 49:
        return "other", "أخرى"  # high-speed craft
    else:
        return "other", "أخرى"

def _get_status(nav_status: int) -> tuple[str, str]:
    """Convert AIS navigation status to our status."""
    if nav_status == 0:
        return "underway", "مبحر"
    elif nav_status == 1:
        return "anchored", "راسي"
    elif nav_status == 5:
        return "moored", "مرسى"
    else:
        return "underway", "مبحر"


# Maritime monitoring zones — bounding boxes [lat_min, lng_min, lat_max, lng_max]
MARITIME_ZONES = {
    "hormuz": {
        "name": "Strait of Hormuz",
        "nameAr": "مضيق هرمز",
        "bbox": [[24.5, 54.0], [27.5, 58.0]],
    },
    "red_sea": {
        "name": "Red Sea (Bab el-Mandeb)",
        "nameAr": "البحر الأحمر (باب المندب)",
        "bbox": [[12.0, 41.0], [16.0, 45.0]],
    },
    "suez": {
        "name": "Suez Canal",
        "nameAr": "قناة السويس",
        "bbox": [[29.5, 32.0], [31.5, 33.5]],
    },
}

def _determine_zone(lat: float, lng: float) -> tuple[str, str]:
    """Determine which maritime zone a vessel is in."""
    for zone_id, zone in MARITIME_ZONES.items():
        bbox = zone["bbox"]
        if bbox[0][0] <= lat <= bbox[1][0] and bbox[0][1] <= lng <= bbox[1][1]:
            return zone_id, zone["nameAr"]
    return "unknown", "غير محدد"


# In-memory vessel store (updated by WebSocket stream)
_vessels: dict[str, VesselPosition] = {}
_zone_stats: dict[str, MaritimeZoneStats] = {
    zone_id: MaritimeZoneStats(
        id=zone_id,
        name=zone["name"],
        nameAr=zone["nameAr"],
    )
    for zone_id, zone in MARITIME_ZONES.items()
}
_ws_connected = False

# Throttle expensive per-message work (zone stats recompute + stale prune).
# AIS streams can deliver many messages per second; doing an O(N) recompute
# on each one pinned the event loop under load. We coalesce these into at
# most one recompute every _STATS_THROTTLE_SECONDS.
_STATS_THROTTLE_SECONDS = 5.0
_last_stats_update: float = 0.0
_last_stale_prune: float = 0.0
_STALE_PRUNE_THROTTLE_SECONDS = 30.0

# Hard cap on the in-memory vessel store. The 30-second stale-prune
# throttle is enough under normal conditions, but a misbehaving or
# hostile AIS feed could deliver thousands of unique MMSIs per second
# during the window between prunes. Without an absolute upper bound the
# ``_vessels`` dict could swell to GB and OOM the backend before the
# stale-prune ever runs again. When the cap is exceeded we evict the
# oldest entries (by recorded ``timestamp``) until the dict is at half
# the cap — amortising the cost of eviction so we don't pay it on every
# subsequent insert.
_VESSEL_HARD_CAP = 10000


# ──────────────────────────────────────────────────────────────────────────
# Defensive coercion helpers.
#
# AISStream occasionally ships MetaData fields where the key is *present*
# but the value is JSON ``null`` — e.g. ``{"ShipName": null}`` — rather
# than omitted. ``dict.get(key, default)`` only returns the default when
# the key is *missing*; when the key is present-but-None it returns None.
# That broke three code paths:
#
#   * ``metadata.get("ShipName", "").strip()`` → ``AttributeError`` on
#     ``None.strip()`` for every message whose ShipName was explicitly
#     null. The outer ``except Exception`` in ``connect_aisstream``
#     swallowed it, so every such message was silently dropped.
#   * ``metadata.get("MMSI", "")`` then ``str(...)`` coerced ``None``
#     into the literal string ``"None"``. ``if not mmsi: return`` sees
#     a truthy "None" and *creates a ghost vessel keyed by "None"* that
#     persists in ``_vessels`` and pollutes every zone's counts until
#     the stale-prune sweeps it out 10 minutes later.
#   * ``static_data.get("Dimension", {})`` → ``None`` when Dimension is
#     explicitly null, then ``.get("A", 0)`` raises AttributeError.
#
# These helpers coerce defensively so a misbehaving or spoofed AIS
# feed cannot poison the store or spam the logs.
# ──────────────────────────────────────────────────────────────────────────
def _clean_str(value) -> str:
    """Return a stripped string, tolerating None/non-string inputs."""
    if value is None:
        return ""
    if not isinstance(value, str):
        try:
            value = str(value)
        except Exception:
            return ""
    return value.strip()


def _clean_dict(value) -> dict:
    """Return a dict, coercing None/non-dict inputs to an empty dict."""
    return value if isinstance(value, dict) else {}


def _clean_int(value, default: int = 0) -> int:
    """Return an int, tolerating None/non-numeric inputs."""
    if value is None:
        return default
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def get_vessels() -> list[VesselPosition]:
    """Get all tracked vessels."""
    return list(_vessels.values())


def get_zone_stats() -> list[MaritimeZoneStats]:
    """Get stats for each maritime zone."""
    return list(_zone_stats.values())


def is_ws_connected() -> bool:
    """Return True iff the AISStream WebSocket is currently connected.

    Used by the maritime broadcaster to distinguish "stream healthy but
    no vessels in monitored zones right now" (quiet night, low shipping
    window) from "stream is actually broken". Without this signal the
    health monitor could only observe ``eventCount=0`` and would
    misreport a healthy-but-quiet stream as degraded.
    """
    return _ws_connected


def _update_zone_stats():
    """Recalculate zone statistics from current vessel data."""
    for zone_id in _zone_stats:
        zone_vessels = [v for v in _vessels.values() if v.zone == zone_id]
        stats = _zone_stats[zone_id]
        stats.vesselCount = len(zone_vessels)
        stats.tankerCount = sum(1 for v in zone_vessels if v.shipType == "tanker")
        stats.cargoCount = sum(1 for v in zone_vessels if v.shipType == "cargo")
        stats.militaryCount = sum(1 for v in zone_vessels if v.shipType == "military")
        speeds = [v.speed for v in zone_vessels if v.speed and v.speed > 0]
        stats.avgSpeed = round(sum(speeds) / len(speeds), 1) if speeds else 0.0
        stats.lastUpdate = datetime.now(timezone.utc)


async def connect_aisstream():
    """Connect to AISStream.io WebSocket and stream vessel data."""
    global _ws_connected

    if not AISSTREAM_API_KEY:
        print("[Maritime] No AISSTREAM_API_KEY configured, skipping vessel tracking")
        return

    # Build bounding boxes for all zones
    bounding_boxes = []
    for zone in MARITIME_ZONES.values():
        bounding_boxes.append(zone["bbox"])

    while True:
        try:
            print("[Maritime] Connecting to AISStream.io...")
            async with websockets.connect(AISSTREAM_WS_URL) as ws:
                # Subscribe to vessel positions in our zones
                subscribe_msg = {
                    "APIKey": AISSTREAM_API_KEY,
                    "BoundingBoxes": bounding_boxes,
                    "FilterMessageTypes": ["PositionReport", "ShipStaticData"],
                }
                await ws.send(json.dumps(subscribe_msg))
                _ws_connected = True
                print(f"[Maritime] Connected! Monitoring {len(MARITIME_ZONES)} zones")

                async for message in ws:
                    try:
                        data = json.loads(message)
                        _process_ais_message(data)
                    except json.JSONDecodeError:
                        continue
                    except Exception as e:
                        print(f"[Maritime] Error processing message: {e}")

        except Exception as e:
            _ws_connected = False
            print(f"[Maritime] WebSocket error: {e}, reconnecting in 30s...")
            await asyncio.sleep(30)


def _process_ais_message(data: dict):
    """Process an AIS message from AISStream."""
    if not isinstance(data, dict):
        return
    msg_type = _clean_str(data.get("MessageType"))
    metadata = _clean_dict(data.get("MetaData"))
    message = _clean_dict(data.get("Message"))

    # AIS MMSI is a 9-digit identifier. Reject blank, literally "None"
    # (which is what ``str(metadata.get("MMSI"))`` would produce when
    # the feed sends ``{"MMSI": null}``), and anything obviously
    # non-numeric so it cannot land in ``_vessels`` as a ghost key.
    mmsi_raw = metadata.get("MMSI")
    if mmsi_raw is None:
        return
    mmsi = _clean_str(mmsi_raw)
    if not mmsi or mmsi.lower() == "none" or not mmsi.isdigit():
        return

    # Reject messages missing latitude/longitude. Previously we defaulted to
    # 0 which would place vessels at (0, 0) — a point in the Gulf of Guinea
    # thousands of kilometres from our monitored zones — and pollute the
    # zone stats. For PositionReport messages, lat/lng are mandatory; we
    # still accept ShipStaticData updates for known vessels even when their
    # MetaData does not include fresh position fields.
    lat_raw = metadata.get("latitude")
    lng_raw = metadata.get("longitude")
    try:
        lat = float(lat_raw) if lat_raw is not None else None
        lng = float(lng_raw) if lng_raw is not None else None
    except (TypeError, ValueError):
        lat = None
        lng = None
    # Reject the (0, 0) sentinel too. Some upstream AIS feeds emit
    # latitude=0 longitude=0 to mean "unknown" rather than omitting the
    # fields, and a vessel parked exactly on the equator/prime-meridian
    # intersection is effectively never a real report in any of our
    # monitored zones.
    if lat is not None and lng is not None and lat == 0.0 and lng == 0.0:
        lat = None
        lng = None
    if (lat is None or lng is None) and msg_type == "PositionReport":
        return
    # ``_clean_str`` tolerates the null-value case that ``.strip()``
    # previously crashed on (see module-level comment).
    ship_name = _clean_str(metadata.get("ShipName"))
    timestamp_str = _clean_str(metadata.get("time_utc"))

    try:
        ts = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00")) if timestamp_str else datetime.now(timezone.utc)
    except (ValueError, AttributeError):
        ts = datetime.now(timezone.utc)
    # Clamp future-dated timestamps to ``now``. The stale prune below
    # compares ``(now - v.timestamp).total_seconds() > 600`` — a feed
    # (or a spoofed AIS message) that reports a timestamp in the future
    # would yield a negative diff, the vessel would never match the
    # stale predicate, and the entry would persist forever. Clamping
    # also keeps the "newest wins" eviction key honest when we apply
    # the hard cap below.
    server_now = datetime.now(timezone.utc)
    if ts.tzinfo is None:
        # AIS feeds occasionally drop the trailing 'Z'/offset; assume UTC
        # rather than crashing the comparison with a naive/aware mix.
        ts = ts.replace(tzinfo=timezone.utc)
    if ts > server_now:
        ts = server_now

    have_position = lat is not None and lng is not None
    zone_id, zone_ar = _determine_zone(lat, lng) if have_position else ("unknown", "غير محدد")

    if msg_type == "PositionReport":
        # Guaranteed to have position here (earlier guard returns if missing).
        pos_report = _clean_dict(message.get("PositionReport"))
        speed = pos_report.get("Sog", None)  # Speed over ground
        course = pos_report.get("Cog", None)  # Course over ground
        heading = pos_report.get("TrueHeading", None)
        nav_status = _clean_int(pos_report.get("NavigationalStatus"), 0)

        status, status_ar = _get_status(nav_status)

        if mmsi in _vessels:
            # Update existing vessel
            v = _vessels[mmsi]
            v.lat = lat
            v.lng = lng
            v.speed = speed
            v.course = course
            v.heading = heading if heading != 511 else course  # 511 = not available
            v.zone = zone_id
            v.zoneAr = zone_ar
            v.status = status
            v.statusAr = status_ar
            v.timestamp = ts
            if ship_name:
                v.name = ship_name
        else:
            # New vessel
            _vessels[mmsi] = VesselPosition(
                mmsi=mmsi,
                name=ship_name or f"VESSEL-{mmsi[-4:]}",
                lat=lat,
                lng=lng,
                speed=speed,
                course=course,
                heading=heading if heading != 511 else course,
                zone=zone_id,
                zoneAr=zone_ar,
                status=status,
                statusAr=status_ar,
                timestamp=ts,
            )

    elif msg_type == "ShipStaticData":
        static_data = _clean_dict(message.get("ShipStaticData"))
        ais_type = _clean_int(static_data.get("Type"), 0)
        ship_type, ship_type_ar = _classify_ship_type(ais_type)
        # ``_clean_str`` tolerates the null-value case (Destination: null).
        destination = _clean_str(static_data.get("Destination"))
        dim = _clean_dict(static_data.get("Dimension"))
        length = _clean_int(dim.get("A")) + _clean_int(dim.get("B"))
        width = _clean_int(dim.get("C")) + _clean_int(dim.get("D"))
        draught = static_data.get("MaximumStaticDraught", None)

        if mmsi in _vessels:
            v = _vessels[mmsi]
            v.shipType = ship_type
            v.shipTypeAr = ship_type_ar
            v.destination = destination if destination else None
            v.length = length if length > 0 else None
            v.width = width if width > 0 else None
            v.draught = draught
            if ship_name:
                v.name = ship_name
        else:
            # Only create new vessel if we have a real position. Refuse both
            # missing and the (0, 0) fallback — the latter would park a
            # vessel thousands of km off Africa in the Gulf of Guinea.
            if not have_position or (lat == 0 and lng == 0):
                return
            _vessels[mmsi] = VesselPosition(
                mmsi=mmsi,
                name=ship_name or f"VESSEL-{mmsi[-4:]}",
                shipType=ship_type,
                shipTypeAr=ship_type_ar,
                lat=lat,
                lng=lng,
                destination=destination if destination else None,
                length=length if length > 0 else None,
                width=width if width > 0 else None,
                draught=draught,
                zone=zone_id,
                zoneAr=zone_ar,
                timestamp=ts,
            )

    # Recalculate zone stats periodically — throttled to protect the event loop
    # when the AIS stream bursts (thousands of messages per minute).
    global _last_stats_update, _last_stale_prune
    now_monotonic = time.monotonic()
    if now_monotonic - _last_stats_update >= _STATS_THROTTLE_SECONDS:
        _update_zone_stats()
        _last_stats_update = now_monotonic

    # Prune stale vessels (>10 minutes old) less aggressively.
    if now_monotonic - _last_stale_prune >= _STALE_PRUNE_THROTTLE_SECONDS:
        now = datetime.now(timezone.utc)
        stale = [k for k, v in _vessels.items() if (now - v.timestamp).total_seconds() > 600]
        for k in stale:
            del _vessels[k]
        _last_stale_prune = now_monotonic

    # Defence-in-depth: enforce an absolute upper bound on ``_vessels``.
    # Even with the 30-second stale-prune above, an AIS storm or a
    # hostile feed delivering many unique MMSIs per second could push
    # memory usage to GB before the next prune ever runs. When the cap
    # is exceeded, evict the oldest entries (by recorded timestamp,
    # which is now clamped to ``now``) down to half the cap so we
    # amortise the O(N log N) sort across many subsequent inserts.
    if len(_vessels) > _VESSEL_HARD_CAP:
        target = _VESSEL_HARD_CAP // 2
        # ``sorted`` materialises a list of items; for N=10k this is a
        # one-time ~1ms cost paid only when the cap is breached.
        ordered = sorted(_vessels.items(), key=lambda kv: kv[1].timestamp)
        for k, _v in ordered[: len(_vessels) - target]:
            _vessels.pop(k, None)
