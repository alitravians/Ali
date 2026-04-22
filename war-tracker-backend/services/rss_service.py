"""RSS Feed integration for trusted news sources (Al Jazeera, BBC, Reuters, AP)."""
import httpx
import hashlib
import feedparser
from datetime import datetime, timezone
from models import TrackerEvent, EventSource, GeoLocation, EventCategory, TrustLevel
from services.gdelt_service import _detect_category, _get_city_ar, _compute_trust, _estimate_coords, _extract_location, _extract_all_related_cities, _is_relevant
from services._url_safety import is_safe_event_url


# Trusted RSS feeds — ranked by global credibility
RSS_FEEDS = [
    {
        "name": "Al Jazeera Arabic",
        "nameAr": "الجزيرة العربية",
        "url": "https://www.aljazeera.net/aljazeerarss/a7c186be-1baa-4571-a604-f603f57c4571/73d0e1b4-532f-45ef-b135-bfdff8b8cab9",
        "domain": "aljazeera.net",
        "lang": "ar",
        "type": "إعلامي",
        "trust": "official",
    },
    {
        "name": "Al Jazeera English",
        "nameAr": "الجزيرة الإنجليزية",
        "url": "https://www.aljazeera.com/xml/rss/all.xml",
        "domain": "aljazeera.com",
        "lang": "en",
        "type": "إعلامي",
        "trust": "official",
    },
    {
        "name": "BBC Arabic",
        "nameAr": "بي بي سي عربي",
        "url": "https://feeds.bbci.co.uk/arabic/rss.xml",
        "domain": "bbc.com",
        "lang": "ar",
        "type": "إعلامي",
        "trust": "official",
    },
    {
        "name": "Reuters World",
        "nameAr": "رويترز العالمية",
        "url": "https://www.reutersagency.com/feed/?best-topics=political-general&post_type=best",
        "domain": "reuters.com",
        "lang": "en",
        "type": "إعلامي",
        "trust": "official",
    },
    {
        "name": "BBC World",
        "nameAr": "بي بي سي العالمية",
        "url": "https://feeds.bbci.co.uk/news/world/middle_east/rss.xml",
        "domain": "bbc.co.uk",
        "lang": "en",
        "type": "إعلامي",
        "trust": "official",
    },
    # Bahrain-specific feeds
    {
        "name": "Al Ayam Bahrain",
        "nameAr": "الأيام البحرينية",
        "url": "https://www.alayam.com/rss",
        "domain": "alayam.com",
        "lang": "ar",
        "type": "إعلامي",
        "trust": "official",
    },
    {
        "name": "BNA Bahrain News",
        "nameAr": "وكالة أنباء البحرين",
        "url": "https://www.bna.bh/rss/allnews",
        "domain": "bna.bh",
        "lang": "ar",
        "type": "رسمي",
        "trust": "official",
    },
    {
        "name": "Gulf Daily News",
        "nameAr": "أخبار الخليج اليومية",
        "url": "https://www.gdnonline.com/rss",
        "domain": "gdnonline.com",
        "lang": "en",
        "type": "إعلامي",
        "trust": "verified",
    },
    {
        "name": "Al Watan Bahrain",
        "nameAr": "صحيفة الوطن البحرينية",
        "url": "https://alwatannews.net/rssFeed/100",
        "domain": "alwatannews.net",
        "lang": "ar",
        "type": "إعلامي",
        "trust": "official",
    },
    {
        "name": "Al Bilad Bahrain",
        "nameAr": "صحيفة البلاد البحرينية",
        "url": "https://albiladpress.com/rss",
        "domain": "albiladpress.com",
        "lang": "ar",
        "type": "إعلامي",
        "trust": "verified",
    },
    {
        "name": "Gulf Insider",
        "nameAr": "غلف إنسايدر",
        "url": "https://www.gulf-insider.com/feed",
        "domain": "gulf-insider.com",
        "lang": "en",
        "type": "إعلامي",
        "trust": "verified",
    },
    # Gulf region feeds for broader coverage
    {
        "name": "Al Arabiya",
        "nameAr": "العربية",
        "url": "https://www.alarabiya.net/.mrss/en.xml",
        "domain": "alarabiya.net",
        "lang": "en",
        "type": "إعلامي",
        "trust": "official",
    },
]


async def fetch_rss_events(max_results: int = 50) -> list[TrackerEvent]:
    """Fetch news from trusted RSS feeds (Al Jazeera, BBC, Reuters)."""
    events: list[TrackerEvent] = []
    seen_urls: set[str] = set()

    headers = {"User-Agent": "WarScope/1.0 (conflict-tracker; research)"}

    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True, headers=headers) as client:
        for feed_info in RSS_FEEDS:
            try:
                resp = await client.get(feed_info["url"])
                if resp.status_code != 200:
                    print(f"[RSS] {feed_info['name']}: HTTP {resp.status_code}")
                    continue

                feed = feedparser.parse(resp.text)

                if not feed.entries:
                    print(f"[RSS] {feed_info['name']}: No entries found")
                    continue

                feed_count = 0
                for entry in feed.entries[:20]:  # Max 20 per feed
                    title = entry.get("title", "").strip()
                    link = entry.get("link", "").strip()
                    summary = entry.get("summary", "") or entry.get("description", "") or ""

                    if not title or not link:
                        continue

                    # Reject entries whose ``link`` is not plain http(s).
                    # A hostile or compromised feed could otherwise push
                    # ``javascript:…`` / ``data:…`` URIs into the event
                    # store — this is defence in depth behind the
                    # frontend ``safeExternalUrl`` render guard.
                    if not is_safe_event_url(link):
                        print(f"[RSS] {feed_info['name']}: dropped entry with unsafe link scheme")
                        continue

                    # Skip duplicates
                    if link in seen_urls:
                        continue
                    seen_urls.add(link)

                    # Check relevance to Middle East conflict
                    # Bahrain-specific feeds bypass relevance filter (all local news is relevant)
                    is_bahrain_feed = feed_info["domain"] in ("alayam.com", "bna.bh", "gdnonline.com", "alwatannews.net", "albiladpress.com", "gulf-insider.com")
                    full_text = f"{title} {summary}"
                    if not is_bahrain_feed and not _is_relevant(full_text):
                        continue

                    # Generate stable ID
                    event_id = f"rss-{hashlib.md5(link.encode()).hexdigest()[:12]}"

                    # Parse timestamp
                    ts = _parse_feed_date(entry)

                    # Detect category
                    category = _detect_category(full_text)

                    # Location
                    location_name = _extract_location(full_text) or "Middle East"
                    location_ar = _get_city_ar(location_name)
                    lat, lng = _estimate_coords(full_text, location_name)

                    # Trust level — RSS feeds are from official trusted sources
                    trust_level, trust_reason, trust_reason_ar = _compute_trust(1, feed_info["domain"])

                    # Breaking detection
                    is_breaking = any(kw in title.lower() for kw in
                                      ["breaking", "urgent", "عاجل", "explosion", "strike", "missile",
                                       "صاروخ", "ضربة", "هجوم", "انفجار", "صفارة", "إنذار", "صافرة",
                                       "siren", "alarm", "shelter", "ملجأ", "إخلاء", "زوال الخطر",
                                       "اعتراض", "شظايا", "دفاع جوي", "مكان آمن",
                                       "intercept", "shrapnel", "air defense", "all clear"])

                    # For Arabic feeds, title is already in Arabic
                    title_ar = title if feed_info["lang"] == "ar" else title

                    event = TrackerEvent(
                        id=event_id,
                        title=title,
                        titleAr=title_ar,
                        description=summary[:300] if summary else f"Source: {feed_info['name']}",
                        descriptionAr=summary[:300] if feed_info["lang"] == "ar" and summary else f"المصدر: {feed_info['nameAr']}",
                        category=category,
                        trustLevel=trust_level,
                        trustReason=trust_reason,
                        trustReasonAr=trust_reason_ar,
                        location=GeoLocation(lat=lat, lng=lng, name=location_name, nameAr=location_ar),
                        timestamp=ts,
                        sources=[EventSource(
                            sourceId=f"rss-{feed_info['domain']}",
                            sourceName=feed_info["name"],
                            sourceNameAr=feed_info["nameAr"],
                            originalText=title,
                            url=link,
                            timestamp=ts,
                        )],
                        isBreaking=is_breaking,
                        isDuplicate=False,
                        relatedCities=_extract_all_related_cities(full_text),
                    )
                    events.append(event)
                    feed_count += 1

                print(f"[RSS] {feed_info['name']}: {feed_count} relevant articles")

            except Exception as e:
                print(f"[RSS] {feed_info['name']} error: {e}")
                continue

    print(f"[RSS] Total: {len(events)} relevant events from {len(RSS_FEEDS)} feeds")
    return events[:max_results]


def _parse_feed_date(entry) -> datetime:
    """Parse date from RSS feed entry."""
    # Try published_parsed first
    if hasattr(entry, "published_parsed") and entry.published_parsed:
        try:
            from calendar import timegm
            return datetime.fromtimestamp(timegm(entry.published_parsed), tz=timezone.utc)
        except (ValueError, OverflowError, TypeError):
            pass

    # Try updated_parsed
    if hasattr(entry, "updated_parsed") and entry.updated_parsed:
        try:
            from calendar import timegm
            return datetime.fromtimestamp(timegm(entry.updated_parsed), tz=timezone.utc)
        except (ValueError, OverflowError, TypeError):
            pass

    # Try raw date string
    for field in ["published", "updated", "dc_date"]:
        date_str = entry.get(field, "")
        if date_str:
            try:
                return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
            except ValueError:
                pass

    return datetime.now(timezone.utc)
