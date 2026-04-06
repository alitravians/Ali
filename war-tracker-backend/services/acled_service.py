"""ACLED (Armed Conflict Location & Event Data) integration."""
import httpx
import hashlib
from datetime import datetime, timezone
from models import TrackerEvent, EventSource, GeoLocation, EventCategory, TrustLevel
from services.gdelt_service import _get_city_ar, _compute_trust

ACLED_URL = "https://api.acleddata.com/acled/read"

# ACLED event type to our category mapping
ACLED_CATEGORY_MAP = {
    "Battles": EventCategory.military,
    "Explosions/Remote violence": EventCategory.fire,
    "Violence against civilians": EventCategory.humanitarian,
    "Protests": EventCategory.humanitarian,
    "Riots": EventCategory.alert,
    "Strategic developments": EventCategory.official,
}

# ACLED countries of interest
ACLED_COUNTRIES = ["Iran", "Israel", "Lebanon", "Syria", "Iraq", "Yemen", "Palestine", "Bahrain"]


async def fetch_acled_events(api_key: str, email: str, max_results: int = 50) -> list[TrackerEvent]:
    """Fetch conflict events from ACLED API."""
    if not api_key or not email:
        print("[ACLED] No API key/email configured, skipping")
        return []

    events: list[TrackerEvent] = []

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            params = {
                "key": api_key,
                "email": email,
                "country": "|".join(ACLED_COUNTRIES),
                "limit": str(max_results),
                "order": "desc",
                "sort": "event_date",
            }
            resp = await client.get(ACLED_URL, params=params)

            if resp.status_code in (401, 403):
                print("[ACLED] Invalid API key or unauthorized")
                return []

            resp.raise_for_status()
            data = resp.json()

            for item in data.get("data", []):
                event_type = item.get("event_type", "")
                sub_event_type = item.get("sub_event_type", "")
                notes = item.get("notes", "")
                location = item.get("location", "Unknown")
                country = item.get("country", "")
                lat_str = item.get("latitude", "")
                lng_str = item.get("longitude", "")
                event_date = item.get("event_date", "")
                source_name = item.get("source", "ACLED")
                fatalities = item.get("fatalities", 0)
                data_id = item.get("data_id", "")

                event_id = f"acled-{data_id or hashlib.md5(notes.encode()).hexdigest()[:12]}"

                try:
                    ts = datetime.strptime(event_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                except (ValueError, AttributeError):
                    ts = datetime.now(timezone.utc)

                try:
                    lat = float(lat_str)
                    lng = float(lng_str)
                except (ValueError, TypeError):
                    lat, lng = 32.0, 44.0

                category = ACLED_CATEGORY_MAP.get(event_type, EventCategory.military)
                location_ar = _get_city_ar(f"{location} {country}")

                title = f"{sub_event_type or event_type}: {location}, {country}"
                desc = notes[:300] if notes else f"{event_type} in {location}"

                trust_level = TrustLevel.confirmed
                trust_reason = "Verified by ACLED research team"
                trust_reason_ar = "تم التحقق من قبل فريق أبحاث ACLED"

                is_breaking = int(fatalities or 0) > 5

                event = TrackerEvent(
                    id=event_id,
                    title=title,
                    titleAr=title,
                    description=desc,
                    descriptionAr=desc,
                    category=category,
                    trustLevel=trust_level,
                    trustReason=trust_reason,
                    trustReasonAr=trust_reason_ar,
                    location=GeoLocation(lat=lat, lng=lng, name=f"{location}, {country}", nameAr=location_ar),
                    timestamp=ts,
                    sources=[EventSource(
                        sourceId="acled",
                        sourceName="ACLED",
                        sourceNameAr="قاعدة بيانات النزاعات المسلحة",
                        originalText=notes[:500] if notes else None,
                        url="https://acleddata.com",
                        timestamp=ts,
                    )],
                    isBreaking=is_breaking,
                    isDuplicate=False,
                    relatedCities=[location_ar],
                )
                events.append(event)

    except httpx.HTTPError as e:
        print(f"[ACLED] HTTP error: {e}")
    except Exception as e:
        print(f"[ACLED] Error: {e}")

    return events
