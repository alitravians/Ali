"""Maritime vessel tracking via AISStream.io WebSocket API.

Uses real AIS (Automatic Identification System) data to track vessels
in three critical waterways: Strait of Hormuz, Red Sea, and Suez Canal.
Includes Hormuz Blockade Monitor for detecting US & Iranian Navy presence.
"""
import os
import json
import asyncio
import random
import websockets
from datetime import datetime, timezone, timedelta
from typing import Optional
from models import VesselPosition, MaritimeZoneStats, HormuzBlockadeStatus

AISSTREAM_API_KEY = os.getenv("AISSTREAM_API_KEY", "")
AISSTREAM_WS_URL = "wss://stream.aisstream.io/v0/stream"

# US Navy MMSI prefixes (Maritime Mobile Service Identity)
# US MID codes: 303, 338, 366, 367, 368, 369
US_MMSI_PREFIXES = ("303", "338", "366", "367", "368", "369")

# Iranian Navy/IRGC MMSI prefixes (MID code: 422)
IRAN_MMSI_PREFIXES = ("422",)

# NATO/Allied navy MMSI prefixes for additional detection
# UK: 232-235, France: 226-228, Germany: 211, Canada: 316
ALLIED_MMSI_PREFIXES = ("232", "233", "234", "235", "226", "227", "228", "211", "316")

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
_ais_data_received = False  # True only after we actually receive vessel data
_last_ais_message_time: Optional[datetime] = None
_ais_key_valid = True  # Track if the key seems valid
_ais_disconnected_since: Optional[datetime] = None  # When real AIS stopped flowing
_using_fallback = False  # True when _vessels is populated from fallback templates

# Grace period before fallback kicks in on disconnect (avoid flapping on brief network blips)
FALLBACK_GRACE_SECONDS = 180


def get_vessels() -> list[VesselPosition]:
    """Get all tracked vessels."""
    return list(_vessels.values())


def is_ais_connected() -> bool:
    """Return whether the AIS WebSocket is currently connected and receiving data."""
    return _ws_connected and _ais_data_received


def get_zone_stats() -> list[MaritimeZoneStats]:
    """Get stats for each maritime zone."""
    return list(_zone_stats.values())


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


# ──────────────────────────────────────────────
# Known shipping lane waypoints for fallback estimation
# Based on real maritime traffic patterns in the region
# ──────────────────────────────────────────────
HORMUZ_SHIPPING_LANES = [
    # Inbound lane (eastbound) — tankers entering Persian Gulf
    {"lat": 26.55, "lng": 56.25, "name": "HORMUZ-IN-1"},
    {"lat": 26.40, "lng": 56.45, "name": "HORMUZ-IN-2"},
    {"lat": 26.30, "lng": 56.70, "name": "HORMUZ-IN-3"},
    {"lat": 26.15, "lng": 56.90, "name": "HORMUZ-IN-4"},
    # Outbound lane (westbound) — tankers exiting Persian Gulf
    {"lat": 26.70, "lng": 56.15, "name": "HORMUZ-OUT-1"},
    {"lat": 26.60, "lng": 56.35, "name": "HORMUZ-OUT-2"},
    {"lat": 26.50, "lng": 56.55, "name": "HORMUZ-OUT-3"},
    {"lat": 26.35, "lng": 56.80, "name": "HORMUZ-OUT-4"},
    # Anchorage areas
    {"lat": 25.90, "lng": 55.30, "name": "FUJAIRAH-ANCH-1"},
    {"lat": 25.95, "lng": 55.45, "name": "FUJAIRAH-ANCH-2"},
    {"lat": 26.20, "lng": 56.30, "name": "HORMUZ-ANCH-1"},
]

RED_SEA_SHIPPING_LANES = [
    {"lat": 12.65, "lng": 43.30, "name": "BAB-MANDEB-1"},
    {"lat": 12.80, "lng": 43.45, "name": "BAB-MANDEB-2"},
    {"lat": 13.10, "lng": 43.20, "name": "RED-SEA-S-1"},
    {"lat": 13.50, "lng": 42.80, "name": "RED-SEA-S-2"},
    {"lat": 14.00, "lng": 42.50, "name": "RED-SEA-MID"},
]

SUEZ_SHIPPING_LANES = [
    {"lat": 29.95, "lng": 32.55, "name": "SUEZ-S-1"},
    {"lat": 30.20, "lng": 32.35, "name": "SUEZ-MID-1"},
    {"lat": 30.55, "lng": 32.30, "name": "SUEZ-MID-2"},
    {"lat": 30.85, "lng": 32.30, "name": "SUEZ-N-1"},
    {"lat": 31.25, "lng": 32.35, "name": "SUEZ-N-2"},
]

# Known vessel names for realistic fallback data
_VESSEL_TEMPLATES = {
    "hormuz": [
        # Tankers (most common in Hormuz)
        {"mmsi": "422001001", "name": "IRAN DAMAVAND", "type": "tanker", "typeAr": "ناقلة", "flag": "🇮🇷", "speed": 12.5},
        {"mmsi": "422002001", "name": "SABITI", "type": "tanker", "typeAr": "ناقلة", "flag": "🇮🇷", "speed": 11.0},
        {"mmsi": "422003001", "name": "NOOR-1", "type": "tanker", "typeAr": "ناقلة", "flag": "🇮🇷", "speed": 10.5},
        {"mmsi": "470001001", "name": "EMIRATES STAR", "type": "tanker", "typeAr": "ناقلة", "flag": "🇦🇪", "speed": 13.0},
        {"mmsi": "461001001", "name": "RIYADH PRIDE", "type": "tanker", "typeAr": "ناقلة", "flag": "🇸🇦", "speed": 11.5},
        {"mmsi": "538001001", "name": "PACIFIC VOYAGER", "type": "tanker", "typeAr": "ناقلة", "flag": "🇲🇭", "speed": 14.0},
        {"mmsi": "477001001", "name": "HONG KONG TRADER", "type": "cargo", "typeAr": "شحن", "flag": "🇭🇰", "speed": 12.0},
        # Military vessels - US Navy
        {"mmsi": "338001001", "name": "USS EISENHOWER", "type": "military", "typeAr": "عسكري", "flag": "🇺🇸", "speed": 15.0},
        {"mmsi": "338002001", "name": "USS PHILIPPINE SEA", "type": "military", "typeAr": "عسكري", "flag": "🇺🇸", "speed": 18.0},
        {"mmsi": "366001001", "name": "USS MASON", "type": "military", "typeAr": "عسكري", "flag": "🇺🇸", "speed": 20.0},
        # Iranian Navy / IRGC
        {"mmsi": "422100001", "name": "IRIN ALVAND", "type": "military", "typeAr": "عسكري", "flag": "🇮🇷", "speed": 16.0},
        {"mmsi": "422100002", "name": "IRIN SAHAND", "type": "military", "typeAr": "عسكري", "flag": "🇮🇷", "speed": 22.0},
        {"mmsi": "422100003", "name": "IRGCN SHAHID NAZERI", "type": "military", "typeAr": "عسكري", "flag": "🇮🇷", "speed": 35.0},
        {"mmsi": "422100004", "name": "IRIN JAMARAN", "type": "military", "typeAr": "عسكري", "flag": "🇮🇷", "speed": 17.0},
        # Allied military
        {"mmsi": "232001001", "name": "HMS DIAMOND", "type": "military", "typeAr": "عسكري", "flag": "🇬🇧", "speed": 19.0},
        {"mmsi": "226001001", "name": "FS ALSACE", "type": "military", "typeAr": "عسكري", "flag": "🇫🇷", "speed": 17.5},
        # Cargo
        {"mmsi": "636001001", "name": "LIBERIA MERCHANT", "type": "cargo", "typeAr": "شحن", "flag": "🇱🇷", "speed": 13.5},
        {"mmsi": "440001001", "name": "KOREAN EXPRESS", "type": "cargo", "typeAr": "شحن", "flag": "🇰🇷", "speed": 14.5},
    ],
    "red_sea": [
        {"mmsi": "538002001", "name": "MARSHAL ISLANDS GLORY", "type": "tanker", "typeAr": "ناقلة", "flag": "🇲🇭", "speed": 12.0},
        {"mmsi": "636002001", "name": "ATLANTIC TRADER", "type": "cargo", "typeAr": "شحن", "flag": "🇱🇷", "speed": 14.0},
        {"mmsi": "353002001", "name": "BAHAMAS SPIRIT", "type": "tanker", "typeAr": "ناقلة", "flag": "🇧🇸", "speed": 11.0},
        {"mmsi": "338003001", "name": "USS LABOON", "type": "military", "typeAr": "عسكري", "flag": "🇺🇸", "speed": 16.0},
        {"mmsi": "422200001", "name": "IRIN DENA", "type": "military", "typeAr": "عسكري", "flag": "🇮🇷", "speed": 15.0},
    ],
    "suez": [
        {"mmsi": "241002001", "name": "OLYMPUS STAR", "type": "tanker", "typeAr": "ناقلة", "flag": "🇬🇷", "speed": 8.0},
        {"mmsi": "563002001", "name": "SINGAPORE BRIDGE", "type": "cargo", "typeAr": "شحن", "flag": "🇸🇬", "speed": 7.5},
        {"mmsi": "371002001", "name": "CANAL TRANSIT", "type": "cargo", "typeAr": "شحن", "flag": "🇵🇦", "speed": 7.0},
        {"mmsi": "477002001", "name": "HK NAVIGATOR", "type": "tanker", "typeAr": "ناقلة", "flag": "🇭🇰", "speed": 6.5},
    ],
}


def _generate_fallback_vessels():
    """Generate realistic vessel positions when AIS data is unavailable.
    
    Uses known shipping lanes and realistic patterns. Vessels move slightly
    each time this is called to simulate real maritime traffic.
    """
    global _vessels

    now = datetime.now(timezone.utc)
    generated = {}
    
    zone_lanes = {
        "hormuz": HORMUZ_SHIPPING_LANES,
        "red_sea": RED_SEA_SHIPPING_LANES,
        "suez": SUEZ_SHIPPING_LANES,
    }
    
    for zone_id, templates in _VESSEL_TEMPLATES.items():
        lanes = zone_lanes[zone_id]
        zone_name_ar = MARITIME_ZONES[zone_id]["nameAr"]
        
        for i, tmpl in enumerate(templates):
            # Pick a lane position and add slight random offset for realism
            lane = lanes[i % len(lanes)]
            # Use time-based offset so positions change gradually
            time_offset = (now.timestamp() / 60) % 360  # cycles every 6 hours
            lat_drift = 0.02 * random.uniform(-1, 1) + 0.001 * (time_offset % 30)
            lng_drift = 0.02 * random.uniform(-1, 1) + 0.001 * (time_offset % 20)
            
            lat = lane["lat"] + lat_drift
            lng = lane["lng"] + lng_drift
            
            # Vary speed slightly
            speed = tmpl["speed"] + random.uniform(-1.5, 1.5)
            speed = max(0.5, speed)
            
            status = "underway"
            status_ar = "مبحر"
            # Some vessels anchored near anchorage areas
            if "ANCH" in lane["name"] or random.random() < 0.1:
                status = "anchored"
                status_ar = "راسي"
                speed = 0.0
            
            course = random.uniform(40, 320)
            heading = course + random.uniform(-10, 10)
            
            # Randomize timestamp slightly so they don't all show same time
            ts = now - timedelta(seconds=random.randint(0, 180))
            
            vessel = VesselPosition(
                mmsi=tmpl["mmsi"],
                name=tmpl["name"],
                flag=tmpl["flag"],
                shipType=tmpl["type"],
                shipTypeAr=tmpl["typeAr"],
                lat=round(lat, 5),
                lng=round(lng, 5),
                speed=round(speed, 1),
                course=round(course, 1),
                heading=round(heading, 1),
                zone=zone_id,
                zoneAr=zone_name_ar,
                status=status,
                statusAr=status_ar,
                timestamp=ts,
            )
            generated[tmpl["mmsi"]] = vessel
    
    # Replace (not merge) to avoid mixing fake vessels with stale real ones.
    # This is safe because fallback mode is only entered after the grace period
    # and all real data will be replaced on reconnection anyway.
    global _using_fallback
    _vessels.clear()
    _vessels.update(generated)
    _using_fallback = True
    _update_zone_stats()
    print(f"[Maritime] Fallback: generated {len(generated)} estimated vessel positions")


def _should_activate_fallback() -> bool:
    """Return True only if the real AIS stream has been unavailable long enough."""
    if _ais_data_received:
        return False
    if _ais_disconnected_since is None:
        # No connection attempt has succeeded yet → activate immediately on first call
        return True
    elapsed = (datetime.now(timezone.utc) - _ais_disconnected_since).total_seconds()
    return elapsed >= FALLBACK_GRACE_SECONDS


async def _fallback_vessel_updater():
    """Background task: update fallback vessel positions every 60 seconds
    when AIS data is not available (and only after the disconnect grace period)."""
    # Wait 90 seconds for AIS to start providing data
    await asyncio.sleep(90)

    while True:
        if _should_activate_fallback():
            _generate_fallback_vessels()
        await asyncio.sleep(60)


async def connect_aisstream():
    """Connect to AISStream.io WebSocket and stream vessel data."""
    global _ws_connected, _ais_data_received, _last_ais_message_time, _ais_key_valid
    global _ais_disconnected_since, _using_fallback

    if not AISSTREAM_API_KEY:
        print("[Maritime] No AISSTREAM_API_KEY configured — using fallback vessel data")
        _generate_fallback_vessels()
        return

    # Build bounding boxes for all zones
    bounding_boxes = []
    for zone in MARITIME_ZONES.values():
        bounding_boxes.append(zone["bbox"])

    reconnect_delay = 30
    max_reconnect_delay = 300

    while True:
        try:
            print("[Maritime] Connecting to AISStream.io...")
            async with websockets.connect(AISSTREAM_WS_URL, open_timeout=15, close_timeout=5) as ws:
                # Subscribe to vessel positions in our zones
                subscribe_msg = {
                    "APIKey": AISSTREAM_API_KEY,
                    "BoundingBoxes": bounding_boxes,
                    "FilterMessageTypes": ["PositionReport", "ShipStaticData"],
                }
                await ws.send(json.dumps(subscribe_msg))
                _ws_connected = True
                reconnect_delay = 30  # Reset on successful connect
                print(f"[Maritime] WebSocket connected! Monitoring {len(MARITIME_ZONES)} zones. Waiting for data...")

                # Enforce a hard timeout on receiving the first message. If the
                # AIS server accepts the connection and keeps it alive via ping/
                # pong but never forwards data (common symptom of an invalid API
                # key or bad subscription params), the naïve `async for` loop
                # would hang forever, leaking a coroutine + a WebSocket.
                first_message_received = False
                connect_time = datetime.now(timezone.utc)
                FIRST_MESSAGE_TIMEOUT = 120.0  # seconds

                try:
                    first_raw = await asyncio.wait_for(ws.recv(), timeout=FIRST_MESSAGE_TIMEOUT)
                except asyncio.TimeoutError:
                    elapsed = (datetime.now(timezone.utc) - connect_time).total_seconds()
                    print(
                        f"[Maritime] No AIS data received in {elapsed:.0f}s — "
                        "API key likely invalid or subscription empty. Closing socket."
                    )
                    # Force the outer except to run the invalid-key branch and
                    # schedule a reconnect with backoff.
                    raise RuntimeError("AIS first-message timeout")

                # Process the first message synchronously using the same path
                # used below, then fall through to the streaming loop.
                try:
                    data = json.loads(first_raw)
                    first_message_received = True
                    _ais_data_received = True
                    _ais_key_valid = True
                    _ais_disconnected_since = None
                    if _using_fallback:
                        _vessels.clear()
                        _using_fallback = False
                        print("[Maritime] Real AIS data resumed — cleared fallback vessels")
                    elapsed = (datetime.now(timezone.utc) - connect_time).total_seconds()
                    print(f"[Maritime] First AIS data received after {elapsed:.1f}s — API key is valid!")
                    _last_ais_message_time = datetime.now(timezone.utc)
                    _process_ais_message(data)
                except json.JSONDecodeError:
                    pass

                async for message in ws:
                    try:
                        data = json.loads(message)
                        _last_ais_message_time = datetime.now(timezone.utc)
                        # Second source-of-truth for "we are back online".
                        # The first-message handler above is the normal path,
                        # but if its JSON parse raised (or the first message
                        # arrived after a streaming-loop reconnect without
                        # re-entering the setup block), `_ais_data_received`
                        # would stay False, `_ais_disconnected_since` would
                        # stay non-null, and the fallback updater would
                        # clobber real vessels once the 180s grace expired.
                        # So any successfully-parsed streaming message also
                        # flips the live-data flag and clears fallback state.
                        if not _ais_data_received:
                            _ais_data_received = True
                            _ais_key_valid = True
                            _ais_disconnected_since = None
                            if _using_fallback:
                                _vessels.clear()
                                _using_fallback = False
                                print("[Maritime] Real AIS data resumed (streaming loop) — cleared fallback vessels")
                        _process_ais_message(data)
                    except json.JSONDecodeError:
                        continue
                    except Exception as e:
                        print(f"[Maritime] Error processing message: {e}")

        except asyncio.CancelledError:
            _ws_connected = False
            break
        except Exception as e:
            _ws_connected = False
            had_data_before = _ais_data_received
            _ais_data_received = False
            # Mark when the stream went silent so the fallback updater can apply
            # its grace period before clobbering real data with fake vessels.
            if _ais_disconnected_since is None:
                _ais_disconnected_since = datetime.now(timezone.utc)
            print(f"[Maritime] WebSocket error: {e}")

            # If we never received data, the key is likely invalid.
            # Use the pre-reset value so a temporary disconnect on a previously
            # healthy stream does NOT mark the key invalid or overwrite real data.
            if not had_data_before and _ais_key_valid:
                _ais_key_valid = False
                print("[Maritime] WARNING: API key may be expired — no data received. Using fallback.")
                _generate_fallback_vessels()
            
            print(f"[Maritime] Reconnecting in {reconnect_delay}s...")
            await asyncio.sleep(reconnect_delay)
            # Exponential backoff
            reconnect_delay = min(reconnect_delay * 2, max_reconnect_delay)


def _process_ais_message(data: dict):
    """Process an AIS message from AISStream."""
    msg_type = data.get("MessageType", "")
    metadata = data.get("MetaData", {})
    message = data.get("Message", {})

    mmsi = str(metadata.get("MMSI", ""))
    if not mmsi:
        return

    lat = metadata.get("latitude", 0)
    lng = metadata.get("longitude", 0)
    ship_name = metadata.get("ShipName", "").strip()
    timestamp_str = metadata.get("time_utc", "")

    try:
        ts = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00")) if timestamp_str else datetime.now(timezone.utc)
    except (ValueError, AttributeError):
        ts = datetime.now(timezone.utc)

    zone_id, zone_ar = _determine_zone(lat, lng)

    if msg_type == "PositionReport":
        pos_report = message.get("PositionReport", {})
        speed = pos_report.get("Sog", None)  # Speed over ground
        course = pos_report.get("Cog", None)  # Course over ground
        heading = pos_report.get("TrueHeading", None)
        nav_status = pos_report.get("NavigationalStatus", 0)

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
                flag=_get_flag_from_mmsi(mmsi) or None,
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
        static_data = message.get("ShipStaticData", {})
        ais_type = static_data.get("Type", 0)
        ship_type, ship_type_ar = _classify_ship_type(ais_type)
        destination = static_data.get("Destination", "").strip()
        dim = static_data.get("Dimension", {})
        length = (dim.get("A", 0) or 0) + (dim.get("B", 0) or 0)
        width = (dim.get("C", 0) or 0) + (dim.get("D", 0) or 0)
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
            # Only create new vessel if we have valid position data
            if lat == 0 and lng == 0:
                return
            _vessels[mmsi] = VesselPosition(
                mmsi=mmsi,
                name=ship_name or f"VESSEL-{mmsi[-4:]}",
                flag=_get_flag_from_mmsi(mmsi) or None,
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

    # Recalculate zone stats periodically
    _update_zone_stats()

    # Prune stale vessels (>10 minutes old)
    now = datetime.now(timezone.utc)
    stale = [k for k, v in _vessels.items() if (now - v.timestamp).total_seconds() > 600]
    for k in stale:
        del _vessels[k]


def _is_us_vessel(mmsi: str) -> bool:
    """Check if an MMSI is US-flagged.

    NOTE: MMSI prefixes 366/367/368/369/338 cover *all* US-registered
    vessels (commercial + military). This function only checks nationality
    — callers must combine with `shipType == "military"` before treating
    the vessel as navy (see existing `us_navy_vessels` filter).
    """
    return mmsi.startswith(US_MMSI_PREFIXES)


def _is_iranian_vessel(mmsi: str) -> bool:
    """Check if an MMSI is Iran-flagged.

    NOTE: Prefix `422` covers both Iranian commercial tankers (IRAN
    DAMAVAND, SABITI, NOOR-1) and IRIN/IRGC navy vessels. This only
    checks nationality — combine with `shipType == "military"` to
    identify navy ships.
    """
    return mmsi.startswith(IRAN_MMSI_PREFIXES)


def _is_allied_vessel(mmsi: str) -> bool:
    """Check if an MMSI is NATO/allied-flagged.

    NOTE: Nationality check only — combine with `shipType == "military"`
    to identify allied navy vessels.
    """
    return mmsi.startswith(ALLIED_MMSI_PREFIXES)


def _get_flag_from_mmsi(mmsi: str) -> str:
    """Determine country flag from MMSI prefix."""
    mid_flags = {
        "303": "🇺🇸", "338": "🇺🇸", "366": "🇺🇸", "367": "🇺🇸", "368": "🇺🇸", "369": "🇺🇸",
        "232": "🇬🇧", "233": "🇬🇧", "234": "🇬🇧", "235": "🇬🇧",
        "226": "🇫🇷", "227": "🇫🇷", "228": "🇫🇷",
        "211": "🇩🇪",
        "316": "🇨🇦",
        "401": "🇦🇫", "422": "🇮🇷", "416": "🇮🇱",
        "470": "🇦🇪", "447": "🇰🇼", "408": "🇧🇭",
        "466": "🇶🇦", "461": "🇸🇦", "473": "🇴🇲",
        "431": "🇯🇵", "440": "🇰🇷", "477": "🇭🇰",
        "538": "🇲🇭", "636": "🇱🇷", "371": "🇵🇦",
        "353": "🇧🇸", "241": "🇬🇷", "563": "🇸🇬",
        "412": "🇨🇳", "413": "🇨🇳", "414": "🇨🇳",
        "525": "🇮🇩", "533": "🇲🇾",
    }
    prefix3 = mmsi[:3]
    return mid_flags.get(prefix3, "")


def get_hormuz_blockade_status(related_events: list = None) -> HormuzBlockadeStatus:
    """Analyze current Hormuz situation and return blockade status.
    
    Factors analyzed:
    - Military vessel count (US Navy + Iranian Navy + Allies)
    - Tanker traffic disruption (anchored/moored tankers = potential blockade)
    - Average transit speed (slowdown = congestion/blockade)
    - Related news events about Hormuz
    """
    hormuz_vessels = [v for v in _vessels.values() if v.zone == "hormuz"]
    
    military_vessels = [v for v in hormuz_vessels if v.shipType == "military"]
    us_navy_vessels = [v for v in hormuz_vessels if _is_us_vessel(v.mmsi) and v.shipType == "military"]
    iran_navy_vessels = [v for v in hormuz_vessels if _is_iranian_vessel(v.mmsi) and v.shipType == "military"]
    allied_military = [v for v in hormuz_vessels if _is_allied_vessel(v.mmsi) and v.shipType == "military"]
    tankers = [v for v in hormuz_vessels if v.shipType == "tanker"]
    blocked_tankers = [v for v in tankers if v.status in ("anchored", "moored")]
    
    # Iranian commercial vessels (not military)
    iran_commercial = [v for v in hormuz_vessels if _is_iranian_vessel(v.mmsi) and v.shipType != "military"]
    
    # Calculate average transit speed for moving vessels
    moving = [v for v in hormuz_vessels if v.speed and v.speed > 0.5]
    avg_speed = round(sum(v.speed for v in moving) / len(moving), 1) if moving else 0.0
    
    # Determine threat level based on multiple factors
    threat_score = 0

    # Military presence scoring.
    # NOTE: us_navy_vessels / iran_navy_vessels / allied_military are SUBSETS of
    # military_vessels. Scoring the general list AND the subsets would double-count
    # each identified vessel. Instead, score identified vessels via their country
    # weights and score only the *unidentified* remainder with the generic 15 pts.
    identified_mmsis = {v.mmsi for v in us_navy_vessels + iran_navy_vessels + allied_military}
    unidentified_military = [v for v in military_vessels if v.mmsi not in identified_mmsis]
    threat_score += len(unidentified_military) * 15  # Unknown-flag military
    threat_score += len(us_navy_vessels) * 25        # US Navy vessels weigh more
    threat_score += len(iran_navy_vessels) * 20      # Iranian Navy vessels also significant
    threat_score += len(allied_military) * 10        # Allied military also significant
    
    # Tanker disruption scoring
    if len(tankers) > 0:
        blocked_ratio = len(blocked_tankers) / len(tankers)
        threat_score += int(blocked_ratio * 40)  # High blocked ratio = blockade signal
    
    # Speed anomaly scoring
    if avg_speed > 0 and avg_speed < 5:  # Very slow transit = congestion
        threat_score += 20
    
    # Determine threat level
    if threat_score >= 80:
        threat_level = "critical"
        threat_level_ar = "حرج"
        status_msg = "حصار بحري نشط — وجود عسكري كثيف في مضيق هرمز"
        status_en = "Active naval blockade — heavy military presence in Hormuz"
        is_active = True
    elif threat_score >= 50:
        threat_level = "high"
        threat_level_ar = "عالي"
        status_msg = "تصعيد عسكري — وجود قطع بحرية أمريكية وإيرانية في مضيق هرمز"
        status_en = "Military escalation — US and Iranian naval assets in Hormuz"
        is_active = True
    elif threat_score >= 25:
        threat_level = "medium"
        threat_level_ar = "متوسط"
        status_msg = "نشاط عسكري ملحوظ — مراقبة مستمرة لمضيق هرمز"
        status_en = "Notable military activity — continuous monitoring of Hormuz"
        is_active = False
    else:
        threat_level = "low"
        threat_level_ar = "منخفض"
        status_msg = "الوضع طبيعي — حركة ملاحية اعتيادية"
        status_en = "Normal conditions — routine maritime traffic"
        is_active = False

    # IMPORTANT: when the vessel list is synthetic fallback, the hardcoded
    # military templates (3 US, 4 Iranian, 2 Allied) alone score ~175 —
    # far beyond the 80-point "critical" threshold. Publishing a genuine-
    # looking "حصار بحري نشط" assessment based on fabricated positions
    # would mislead users. So we cap the assessment and tag the payload as
    # "estimated" so the frontend can render a disclaimer.
    if _using_fallback:
        data_source = "estimated"
        data_source_ar = "بيانات تقديرية"
        threat_level = "low"
        threat_level_ar = "منخفض (تقديري)"
        is_active = False
        status_msg = (
            "بيانات تقديرية — بث AIS المباشر غير متوفر حالياً، "
            "التقييم مبني على أنماط حركة ملاحية معتادة وليس استخباراتياً"
        )
        status_en = (
            "Estimated data — live AIS feed unavailable. Assessment is based on "
            "typical shipping patterns, not real-time intelligence."
        )
    else:
        data_source = "live"
        data_source_ar = "بيانات حية"
    
    # Build military vessel summaries
    mil_summaries = []
    for v in military_vessels:
        flag = _get_flag_from_mmsi(v.mmsi) or v.flag or ""
        is_us = _is_us_vessel(v.mmsi)
        is_iran = _is_iranian_vessel(v.mmsi)
        mil_summaries.append({
            "mmsi": v.mmsi,
            "name": v.name or f"VESSEL-{v.mmsi[-4:]}",
            "flag": flag,
            "isUS": is_us,
            "isIran": is_iran,
            "isAllied": _is_allied_vessel(v.mmsi),
            "lat": v.lat,
            "lng": v.lng,
            "speed": v.speed,
            "status": v.status,
            "statusAr": v.statusAr,
            "heading": v.heading,
            "lastSeen": v.timestamp.isoformat(),
        })
    
    # Get related news about Hormuz from events
    related_news = []
    if related_events:
        hormuz_keywords = ["hormuz", "هرمز", "blockade", "حصار", "strait", "مضيق", 
                          "navy", "بحرية", "iran", "إيران", "ايران", "irgc", "الحرس الثوري"]
        for ev in related_events[:100]:
            text = f"{ev.title} {ev.titleAr} {ev.description}".lower()
            if any(kw in text for kw in hormuz_keywords):
                related_news.append({
                    "id": ev.id,
                    "title": ev.titleAr or ev.title,
                    "titleEn": ev.title,
                    "timestamp": ev.timestamp.isoformat(),
                    "category": ev.category.value,
                    "trustLevel": ev.trustLevel.value,
                })
                if len(related_news) >= 5:
                    break
    
    return HormuzBlockadeStatus(
        isActive=is_active,
        threatLevel=threat_level,
        threatLevelAr=threat_level_ar,
        militaryVesselCount=len(military_vessels),
        usNavyCount=len(us_navy_vessels),
        iranNavyCount=len(iran_navy_vessels),
        totalVesselsInZone=len(hormuz_vessels),
        tankerCount=len(tankers),
        blockedTankers=len(blocked_tankers),
        avgTransitSpeed=avg_speed,
        militaryVessels=mil_summaries,
        relatedNews=related_news,
        lastUpdate=datetime.now(timezone.utc),
        statusMessage=status_msg,
        statusMessageEn=status_en,
        dataSource=data_source,
        dataSourceAr=data_source_ar,
    )
