"""GDELT Project integration for real-time conflict event monitoring."""
import httpx
import hashlib
from datetime import datetime, timezone
from typing import Optional
from models import TrackerEvent, EventSource, GeoLocation, EventCategory, TrustLevel
from config import GDELT_BASE_URL, CONFLICT_KEYWORDS, REGION_BBOX

# City name mappings for Arabic
CITY_AR_MAP = {
    "tehran": "طهران", "tel aviv": "تل أبيب", "haifa": "حيفا",
    "isfahan": "أصفهان", "beirut": "بيروت", "damascus": "دمشق",
    "jerusalem": "القدس", "baghdad": "بغداد", "amman": "عمّان",
    "riyadh": "الرياض", "cairo": "القاهرة", "ankara": "أنقرة",
    "doha": "الدوحة", "manama": "المنامة", "muscat": "مسقط",
    "kuwait": "الكويت", "gaza": "غزة", "ramallah": "رام الله",
    "tabriz": "تبريز", "shiraz": "شيراز", "mashhad": "مشهد",
    "iran": "إيران", "israel": "إسرائيل", "lebanon": "لبنان",
    "syria": "سوريا", "iraq": "العراق", "jordan": "الأردن",
    "egypt": "مصر", "turkey": "تركيا", "saudi arabia": "السعودية",
    "bahrain": "البحرين", "qatar": "قطر", "uae": "الإمارات",
    "oman": "عُمان", "yemen": "اليمن", "palestine": "فلسطين",
}

# Category detection keywords
CATEGORY_KEYWORDS = {
    EventCategory.military: ["strike", "missile", "attack", "military", "bomb", "weapon", "army", "troops", "combat",
                             "صاروخ", "ضربة", "هجوم", "عسكري", "قصف", "سلاح", "جيش"],
    EventCategory.alert: ["siren", "alarm", "warning", "evacuate", "shelter", "alert",
                          "صفارة", "إنذار", "تحذير", "إخلاء", "ملجأ"],
    EventCategory.official: ["statement", "official", "government", "minister", "president", "parliament",
                             "بيان", "رسمي", "حكومة", "وزير", "رئيس", "برلمان"],
    EventCategory.airspace: ["airspace", "flight", "aviation", "aircraft", "notam", "airline",
                             "مجال جوي", "طيران", "طائرة", "رحلات"],
    EventCategory.maritime: ["ship", "naval", "maritime", "strait", "shipping", "vessel", "port",
                             "سفينة", "بحري", "مضيق", "ملاحة", "ميناء"],
    EventCategory.fire: ["fire", "explosion", "thermal", "satellite", "infrared",
                         "حريق", "انفجار", "حراري", "أقمار"],
    EventCategory.humanitarian: ["humanitarian", "civilian", "refugee", "aid", "red cross", "evacuation",
                                 "إنساني", "مدني", "لاجئ", "مساعدات", "صليب أحمر"],
}


def _detect_category(text: str) -> EventCategory:
    """Detect event category from text content."""
    text_lower = text.lower()
    scores: dict[EventCategory, int] = {}
    for cat, keywords in CATEGORY_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text_lower)
        if score > 0:
            scores[cat] = score
    if scores:
        return max(scores, key=scores.get)
    return EventCategory.military


def _get_city_ar(name: str) -> str:
    """Get Arabic name for a city/location."""
    name_lower = name.lower().strip()
    for eng, ar in CITY_AR_MAP.items():
        if eng in name_lower:
            return ar
    return name


def _compute_trust(num_sources: int, source_domain: str) -> tuple[TrustLevel, str, str]:
    """Compute trust level based on source count and domain."""
    official_domains = ["reuters.com", "apnews.com", "bbc.com", "aljazeera.com",
                        "gov.il", "irna.ir", "presstv.ir", "timesofisrael.com"]
    is_official = any(d in source_domain.lower() for d in official_domains) if source_domain else False

    if num_sources >= 3 and is_official:
        return TrustLevel.confirmed, "Confirmed by multiple official sources", "مؤكد من عدة مصادر رسمية"
    elif num_sources >= 2 or is_official:
        return TrustLevel.high, "Reported by reliable sources", "أفادت مصادر موثوقة"
    elif num_sources == 1:
        return TrustLevel.medium, "Single source, under verification", "مصدر واحد، قيد التحقق"
    else:
        return TrustLevel.low, "Unverified report", "تقرير غير مؤكد"


async def fetch_gdelt_events(max_results: int = 50) -> list[TrackerEvent]:
    """Fetch recent conflict events from GDELT GKG/DOC API."""
    events: list[TrackerEvent] = []

    # Try multiple query strategies
    queries = [
        '(iran OR israel) (military OR missile OR strike OR attack)',
        'iran israel conflict',
        '(bahrain OR manama OR kuwait OR qatar OR doha) (military OR security OR conflict)',
        '(yemen OR houthi OR sanaa) (military OR strike OR attack)',
        '(lebanon OR hezbollah OR beirut) (military OR strike OR attack)',
        '(syria OR damascus) (military OR conflict OR strike)',
        '(iraq OR baghdad) (military OR security OR attack)',
        '(gaza OR palestine OR west bank) (military OR strike OR conflict)',
        '(saudi OR riyadh) (military OR security OR iran)',
        '(uae OR emirates OR abu dhabi) (military OR security OR iran)',
        " OR ".join(CONFLICT_KEYWORDS[:10]),
    ]

    articles = []
    for keywords_query in queries:
        url = f"{GDELT_BASE_URL}/doc/doc"
        params = {
            "query": keywords_query,
            "mode": "ArtList",
            "maxrecords": str(max_results),
            "format": "json",
            "sort": "DateDesc",
        }

        try:
            headers = {"User-Agent": "WarScope/1.0 (conflict-tracker; research)"}
            async with httpx.AsyncClient(timeout=45.0, follow_redirects=True, headers=headers) as client:
                resp = await client.get(url, params=params)
                resp.raise_for_status()

                # Check if response is actually JSON
                content_type = resp.headers.get('content-type', '')
                text = resp.text.strip()
                if not text or text.startswith('<') or 'text/html' in content_type:
                    print(f"[GDELT] Got HTML/empty response for query: {keywords_query[:40]}...")
                    continue

                data = resp.json()
                articles = data.get("articles", [])
                if articles:
                    print(f"[GDELT] Got {len(articles)} articles from query: {keywords_query[:40]}...")
                    break
        except Exception as e:
            print(f"[GDELT] Query failed ({keywords_query[:30]}...): {e}")
            continue

    if not articles:
        return events

    try:
        for i, article in enumerate(articles):
            title = article.get("title", "")
            url_str = article.get("url", "")
            domain = article.get("domain", "")
            seendate = article.get("seendate", "")
            source_country = article.get("sourcecountry", "")
            language = article.get("language", "")
            socialimage = article.get("socialimage", "")

            # Generate stable ID from URL
            event_id = f"gdelt-{hashlib.md5(url_str.encode()).hexdigest()[:12]}"

            # Parse date
            try:
                ts = datetime.strptime(seendate[:14], "%Y%m%d%H%M%S").replace(tzinfo=timezone.utc)
            except (ValueError, IndexError):
                ts = datetime.now(timezone.utc)

            # Detect category
            category = _detect_category(title)

            # Determine location (GDELT doesn't always provide coordinates in doc API)
            location_name = source_country or "Middle East"
            location_ar = _get_city_ar(location_name)

            # Default coordinates for the region if not available
            lat, lng = _estimate_coords(title, location_name)

            # Trust level
            trust_level, trust_reason, trust_reason_ar = _compute_trust(1, domain)

            # Check if breaking
            is_breaking = any(kw in title.lower() for kw in
                              ["breaking", "urgent", "عاجل", "explosion", "strike", "missile"])

            event = TrackerEvent(
                id=event_id,
                title=title,
                titleAr=title,  # Will be translated by Gemini if available
                description=f"Source: {domain}",
                descriptionAr=f"المصدر: {domain}",
                category=category,
                trustLevel=trust_level,
                trustReason=trust_reason,
                trustReasonAr=trust_reason_ar,
                location=GeoLocation(lat=lat, lng=lng, name=location_name, nameAr=location_ar),
                timestamp=ts,
                sources=[EventSource(
                    sourceId=f"gdelt-{domain}",
                    sourceName=domain,
                    sourceNameAr=domain,
                    originalText=title,
                    url=url_str,
                    timestamp=ts,
                )],
                isBreaking=is_breaking,
                isDuplicate=False,
                relatedCities=[location_ar],
            )
            events.append(event)

    except Exception as e:
        print(f"[GDELT] Error processing articles: {e}")

    return events


def _estimate_coords(title: str, country: str) -> tuple[float, float]:
    """Estimate coordinates based on mentioned locations."""
    COORDS = {
        "tehran": (35.69, 51.39), "tel aviv": (32.08, 34.78), "haifa": (32.79, 34.99),
        "isfahan": (32.65, 51.67), "beirut": (33.89, 35.50), "damascus": (33.51, 36.29),
        "jerusalem": (31.77, 35.23), "baghdad": (33.31, 44.37), "gaza": (31.50, 34.47),
        "iran": (32.43, 53.69), "israel": (31.05, 34.85), "lebanon": (33.85, 35.86),
        "syria": (34.80, 38.99), "iraq": (33.22, 43.68), "yemen": (15.55, 48.52),
        "bahrain": (26.07, 50.55), "hormuz": (26.59, 56.28), "dimona": (31.07, 35.21),
        "amman": (31.95, 35.93), "riyadh": (24.71, 46.67),
        "kuwait": (29.37, 47.98), "doha": (25.29, 51.53), "qatar": (25.29, 51.53),
        "abu dhabi": (24.45, 54.65), "dubai": (25.20, 55.27), "uae": (24.45, 54.65), "emirates": (24.45, 54.65),
        "sanaa": (15.37, 44.19), "aden": (12.78, 45.04), "houthi": (15.37, 44.19),
        "jeddah": (21.54, 39.17), "saudi": (24.71, 46.67),
        "muscat": (23.59, 58.54), "oman": (23.59, 58.54),
        "aleppo": (36.20, 37.16), "erbil": (36.19, 44.01), "basra": (30.51, 47.81),
        "ramallah": (31.90, 35.20), "west bank": (31.95, 35.30), "palestine": (31.90, 35.20),
        "jordan": (31.95, 35.93), "manama": (26.23, 50.59),
        "tabriz": (38.08, 46.29), "shiraz": (29.59, 52.58), "mashhad": (36.30, 59.61), "bushehr": (28.97, 50.84),
        "red sea": (20.00, 38.00), "suez": (29.97, 32.55),
    }
    text_lower = f"{title} {country}".lower()
    for place, coords in COORDS.items():
        if place in text_lower:
            return coords
    return (32.0, 44.0)  # Default: Middle East center
