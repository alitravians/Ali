"""Maritime vessel tracking via AISStream.io WebSocket API.

Uses real AIS (Automatic Identification System) data to track vessels
in three critical waterways: Strait of Hormuz, Red Sea, and Suez Canal.
"""
import os
import json
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


def get_vessels() -> list[VesselPosition]:
    """Get all tracked vessels."""
    return list(_vessels.values())


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

    # Recalculate zone stats periodically
    _update_zone_stats()

    # Prune stale vessels (>10 minutes old)
    now = datetime.now(timezone.utc)
    stale = [k for k, v in _vessels.items() if (now - v.timestamp).total_seconds() > 600]
    for k in stale:
        del _vessels[k]
