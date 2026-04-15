"""Maritime vessel tracking via AISStream.io WebSocket API.

Uses real AIS (Automatic Identification System) data to track vessels
in three critical waterways: Strait of Hormuz, Red Sea, and Suez Canal.
Includes Hormuz Blockade Monitor for detecting US Navy presence.
"""
import os
import json
import asyncio
import websockets
from datetime import datetime, timezone
from typing import Optional
from models import VesselPosition, MaritimeZoneStats, HormuzBlockadeStatus

AISSTREAM_API_KEY = os.getenv("AISSTREAM_API_KEY", "")
AISSTREAM_WS_URL = "wss://stream.aisstream.io/v0/stream"

# US Navy MMSI prefixes (Maritime Mobile Service Identity)
# US MID codes: 303, 338, 366, 367, 368, 369
US_MMSI_PREFIXES = ("303", "338", "366", "367", "368", "369")

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
    """Check if a vessel MMSI belongs to a US-registered ship."""
    return mmsi.startswith(US_MMSI_PREFIXES)


def _is_allied_vessel(mmsi: str) -> bool:
    """Check if a vessel MMSI belongs to a NATO/allied navy."""
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
    }
    prefix3 = mmsi[:3]
    return mid_flags.get(prefix3, "")


def get_hormuz_blockade_status(related_events: list = None) -> HormuzBlockadeStatus:
    """Analyze current Hormuz situation and return blockade status.
    
    Factors analyzed:
    - Military vessel count (especially US Navy)
    - Tanker traffic disruption (anchored/moored tankers = potential blockade)
    - Average transit speed (slowdown = congestion/blockade)
    - Related news events about Hormuz
    """
    hormuz_vessels = [v for v in _vessels.values() if v.zone == "hormuz"]
    
    military_vessels = [v for v in hormuz_vessels if v.shipType == "military"]
    us_navy_vessels = [v for v in hormuz_vessels if _is_us_vessel(v.mmsi) and v.shipType == "military"]
    allied_military = [v for v in hormuz_vessels if _is_allied_vessel(v.mmsi) and v.shipType == "military"]
    tankers = [v for v in hormuz_vessels if v.shipType == "tanker"]
    blocked_tankers = [v for v in tankers if v.status in ("anchored", "moored")]
    
    # Calculate average transit speed for moving vessels
    moving = [v for v in hormuz_vessels if v.speed and v.speed > 0.5]
    avg_speed = round(sum(v.speed for v in moving) / len(moving), 1) if moving else 0.0
    
    # Determine threat level based on multiple factors
    threat_score = 0
    
    # Military presence scoring
    threat_score += len(military_vessels) * 15
    threat_score += len(us_navy_vessels) * 25  # US Navy vessels weigh more
    threat_score += len(allied_military) * 10  # Allied military also significant
    
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
        status_msg = "تصعيد عسكري — وجود قطع بحرية عسكرية في مضيق هرمز"
        status_en = "Military escalation — naval assets detected in Hormuz"
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
    
    # Build military vessel summaries
    mil_summaries = []
    for v in military_vessels:
        flag = _get_flag_from_mmsi(v.mmsi) or v.flag or ""
        is_us = _is_us_vessel(v.mmsi)
        mil_summaries.append({
            "mmsi": v.mmsi,
            "name": v.name or f"VESSEL-{v.mmsi[-4:]}",
            "flag": flag,
            "isUS": is_us,
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
        hormuz_keywords = ["hormuz", "هرمز", "blockade", "حصار", "strait", "مضيق", "navy", "بحرية"]
        for ev in related_events[:100]:
            text = f"{ev.title} {ev.titleAr} {ev.description}".lower()
            if any(kw in text for kw in hormuz_keywords):
                related_news.append({
                    "id": ev.id,
                    "title": ev.titleAr or ev.title,
                    "titleEn": ev.title,
                    "timestamp": ev.timestamp.isoformat(),
                    "category": ev.category,
                    "trustLevel": ev.trustLevel,
                })
                if len(related_news) >= 5:
                    break
    
    return HormuzBlockadeStatus(
        isActive=is_active,
        threatLevel=threat_level,
        threatLevelAr=threat_level_ar,
        militaryVesselCount=len(military_vessels),
        usNavyCount=len(us_navy_vessels),
        totalVesselsInZone=len(hormuz_vessels),
        tankerCount=len(tankers),
        blockedTankers=len(blocked_tankers),
        avgTransitSpeed=avg_speed,
        militaryVessels=mil_summaries,
        relatedNews=related_news,
        lastUpdate=datetime.now(timezone.utc),
        statusMessage=status_msg,
        statusMessageEn=status_en,
    )
