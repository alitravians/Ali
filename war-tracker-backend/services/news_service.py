"""NewsAPI integration for news aggregation."""
import httpx
import hashlib
from datetime import datetime, timezone
from models import TrackerEvent, EventSource, GeoLocation, EventCategory, TrustLevel
from config import NEWSAPI_KEY
from services.gdelt_service import _detect_category, _get_city_ar, _compute_trust, _estimate_coords, _extract_all_related_cities
from services._url_safety import is_safe_event_url


NEWSAPI_URL = "https://newsapi.org/v2/everything"

# Major reliable sources for conflict news
TRUSTED_DOMAINS = "reuters.com,apnews.com,bbc.com,aljazeera.com,timesofisrael.com,france24.com,dw.com"


async def fetch_news_events(max_results: int = 30) -> list[TrackerEvent]:
    """Fetch recent news about Iran-Israel conflict from NewsAPI."""
    if not NEWSAPI_KEY:
        print("[NewsAPI] No API key configured, skipping")
        return []

    events: list[TrackerEvent] = []

    # Use fewer queries to conserve free tier quota (100 requests/day)
    queries = [
        "Iran Israel military strike missile attack",
        "Middle East conflict Bahrain Yemen Houthi Gaza Hezbollah",
    ]

    try:
        async with httpx.AsyncClient(timeout=30.0, headers={"User-Agent": "WarScope/1.0"}) as client:
            for query in queries:
                params = {
                    "q": query,
                    "apiKey": NEWSAPI_KEY,
                    "language": "en",
                    "sortBy": "publishedAt",
                    "pageSize": str(min(15, max_results // len(queries))),
                    "domains": TRUSTED_DOMAINS,
                }
                resp = await client.get(NEWSAPI_URL, params=params)

                if resp.status_code == 401:
                    print("[NewsAPI] Invalid API key")
                    return []
                if resp.status_code == 429:
                    print("[NewsAPI] Rate limited")
                    break

                resp.raise_for_status()
                data = resp.json()

                for article in data.get("articles", []):
                    title = article.get("title", "")
                    desc = article.get("description", "") or ""
                    url_str = article.get("url", "")
                    source_name = article.get("source", {}).get("name", "Unknown")
                    published = article.get("publishedAt", "")

                    if not title or title == "[Removed]":
                        continue

                    # Drop articles with a non-http(s) URL — defence in
                    # depth behind the frontend ``safeExternalUrl`` guard.
                    if not is_safe_event_url(url_str):
                        continue

                    event_id = f"news-{hashlib.md5(url_str.encode()).hexdigest()[:12]}"

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
                                      ["breaking", "urgent", "just in", "explosion", "strike"])

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
                            sourceId=f"newsapi-{source_name.lower().replace(' ', '-')}",
                            sourceName=source_name,
                            sourceNameAr=source_name,
                            originalText=title,
                            url=url_str,
                            timestamp=ts,
                        )],
                        isBreaking=is_breaking,
                        isDuplicate=False,
                        relatedCities=_extract_all_related_cities(f"{title} {desc}"),
                    )
                    events.append(event)

    except httpx.HTTPError as e:
        print(f"[NewsAPI] HTTP error: {e}")
    except Exception as e:
        print(f"[NewsAPI] Error: {e}")

    return events


def _guess_location(text: str) -> str:
    """Guess the primary location from article text."""
    locations = [
        "Tehran", "Tel Aviv", "Haifa", "Isfahan", "Beirut", "Damascus",
        "Jerusalem", "Baghdad", "Gaza", "Ramallah", "West Bank",
        "Sanaa", "Aden", "Aleppo", "Erbil", "Basra",
        "Kuwait", "Doha", "Manama", "Abu Dhabi", "Dubai", "Riyadh", "Jeddah",
        "Amman", "Muscat", "Tabriz", "Shiraz", "Mashhad", "Bushehr",
        "Iran", "Israel", "Lebanon", "Syria", "Iraq", "Yemen",
        "Bahrain", "Qatar", "UAE", "Emirates", "Saudi", "Jordan", "Oman",
        "Palestine", "Hormuz", "Red Sea", "Suez",
    ]
    text_lower = text.lower()
    for loc in locations:
        if loc.lower() in text_lower:
            return loc
    return "Middle East"
