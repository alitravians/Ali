"""MediaStack API integration for additional news sources."""
import httpx
import hashlib
from datetime import datetime, timezone
from models import TrackerEvent, EventSource, GeoLocation, EventCategory, TrustLevel
from services.gdelt_service import _detect_category, _get_city_ar, _compute_trust, _estimate_coords
from services.news_service import _guess_location

MEDIASTACK_URL = "https://api.mediastack.com/v1/news"


async def fetch_mediastack_events(api_key: str, max_results: int = 25) -> list[TrackerEvent]:
    """Fetch news from MediaStack API."""
    if not api_key:
        print("[MediaStack] No API key configured, skipping")
        return []

    events: list[TrackerEvent] = []
    keywords = "iran israel conflict,middle east military,hezbollah missile,iran nuclear"

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            params = {
                "access_key": api_key,
                "keywords": keywords,
                "languages": "en,ar",
                "sort": "published_desc",
                "limit": str(max_results),
            }
            resp = await client.get(MEDIASTACK_URL, params=params)

            if resp.status_code == 401:
                print("[MediaStack] Invalid API key")
                return []

            resp.raise_for_status()
            data = resp.json()

            for article in data.get("data", []):
                title = article.get("title", "")
                desc = article.get("description", "") or ""
                url_str = article.get("url", "")
                source_name = article.get("source", "Unknown")
                published = article.get("published_at", "")

                if not title:
                    continue

                event_id = f"mstack-{hashlib.md5(url_str.encode()).hexdigest()[:12]}"

                try:
                    ts = datetime.fromisoformat(published.replace("Z", "+00:00"))
                except (ValueError, AttributeError):
                    ts = datetime.now(timezone.utc)

                category = _detect_category(f"{title} {desc}")
                full_text = f"{title} {desc}"
                lat, lng = _estimate_coords(full_text, "")
                location_name = _guess_location(full_text)
                location_ar = _get_city_ar(location_name)
                trust_level, trust_reason, trust_reason_ar = _compute_trust(1, source_name)

                is_breaking = any(kw in title.lower() for kw in
                                  ["breaking", "urgent", "عاجل", "explosion", "strike"])

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
                    location=GeoLocation(lat=lat, lng=lng, name=location_name, nameAr=location_ar),
                    timestamp=ts,
                    sources=[EventSource(
                        sourceId=f"mediastack-{source_name.lower().replace(' ', '-')}",
                        sourceName=source_name,
                        sourceNameAr=source_name,
                        originalText=title,
                        url=url_str,
                        timestamp=ts,
                    )],
                    isBreaking=is_breaking,
                    isDuplicate=False,
                    relatedCities=[location_ar],
                )
                events.append(event)

    except httpx.HTTPError as e:
        print(f"[MediaStack] HTTP error: {e}")
    except Exception as e:
        print(f"[MediaStack] Error: {e}")

    return events
