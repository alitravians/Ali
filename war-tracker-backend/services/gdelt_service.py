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
    "sanaa": "صنعاء", "aden": "عدن", "aleppo": "حلب",
    "erbil": "أربيل", "basra": "البصرة", "bushehr": "بوشهر",
    "dimona": "ديمونا", "jeddah": "جدة", "abu dhabi": "أبو ظبي",
    "dubai": "دبي", "west bank": "الضفة الغربية",
    "hormuz": "هرمز", "red sea": "البحر الأحمر", "suez": "السويس",
    "muharraq": "المحرق", "sitra": "سترة", "riffa": "الرفاع",
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
                        "gov.il", "irna.ir", "presstv.ir", "timesofisrael.com",
                        "bbc.co.uk", "aljazeera.net", "france24.com", "dw.com"]
    # Also match human-readable source names (from NewsAPI/MediaStack)
    official_names = ["reuters", "ap news", "apnews", "bbc", "al jazeera", "aljazeera",
                      "times of israel", "france 24", "france24", "dw"]
    source_lower = source_domain.lower() if source_domain else ""
    is_official = any(d in source_lower for d in official_domains + official_names) if source_lower else False

    if num_sources >= 3 and is_official:
        return TrustLevel.confirmed, "Confirmed by multiple official sources", "مؤكد من عدة مصادر رسمية"
    elif num_sources >= 2 or is_official:
        return TrustLevel.high, "Reported by reliable sources", "أفادت مصادر موثوقة"
    elif num_sources == 1:
        return TrustLevel.medium, "Single source, under verification", "مصدر واحد، قيد التحقق"
    else:
        return TrustLevel.low, "Unverified report", "تقرير غير مؤكد"


# Relevance keywords — an article must mention at least one to be kept
_RELEVANCE_TERMS = {
    # Countries/regions
    "iran", "israel", "lebanon", "hezbollah", "hamas", "houthi",
    "syria", "iraq", "yemen", "palestine", "gaza", "west bank",
    "bahrain", "kuwait", "qatar", "uae", "emirates", "saudi",
    "jordan", "oman", "tehran", "isfahan", "tel aviv", "haifa",
    "beirut", "damascus", "baghdad", "sanaa", "aden", "aleppo",
    "erbil", "basra", "manama", "doha", "riyadh", "jeddah",
    "abu dhabi", "dubai", "amman", "muscat", "jerusalem", "ramallah",
    "hormuz", "red sea", "suez", "middle east", "mideast",
    # Arabic
    "إيران", "إسرائيل", "حزب الله", "حماس", "غزة", "البحرين",
    "اليمن", "سوريا", "العراق", "لبنان", "فلسطين", "السعودية",
    "قطر", "الكويت", "الإمارات", "الأردن", "المنامة", "المحرق",
    "طهران", "بيروت", "دمشق", "بغداد", "صنعاء", "القدس",
    "صفارة", "إنذار", "صافرة", "صاروخ", "قصف", "غارة",
    # Military terms specific to this conflict
    "irgc", "idf", "iron dome", "القبة الحديدية", "الحرس الثوري",
}


def _is_relevant(title: str) -> bool:
    """Check if article is relevant to Middle East conflict."""
    title_lower = title.lower()
    return any(term in title_lower for term in _RELEVANCE_TERMS)


async def fetch_gdelt_events(max_results: int = 50) -> list[TrackerEvent]:
    """Fetch recent conflict events from GDELT GKG/DOC API."""
    import asyncio
    events: list[TrackerEvent] = []

    # Use 3 broad queries instead of 10 to avoid GDELT 429 rate limits
    queries = [
        '(iran OR israel OR tehran OR jerusalem OR "tel aviv") (military OR missile OR strike OR attack OR war)',
        '(bahrain OR yemen OR houthi OR lebanon OR hezbollah OR gaza OR hamas OR syria OR iraq) (military OR strike OR attack OR conflict)',
        '(hormuz OR "red sea" OR suez OR "middle east" OR saudi OR qatar OR kuwait OR uae) (military OR conflict OR attack OR threat)',
    ]

    all_articles = []
    seen_urls = set()
    headers = {"User-Agent": "WarScope/1.0 (conflict-tracker; research)"}

    async with httpx.AsyncClient(timeout=45.0, follow_redirects=True, headers=headers) as client:
        for i, keywords_query in enumerate(queries):
            # Add delay between queries to avoid GDELT rate limiting
            if i > 0:
                await asyncio.sleep(5)

            url = f"{GDELT_BASE_URL}/doc/doc"
            params = {
                "query": keywords_query,
                "mode": "ArtList",
                "maxrecords": "30",
                "format": "json",
                "sort": "DateDesc",
            }

            # Retry with exponential back-off on 429 (rate-limit) responses
            for attempt in range(3):
                try:
                    resp = await client.get(url, params=params)

                    if resp.status_code == 429:
                        wait = 5 * (2 ** attempt)  # 5s, 10s, 20s
                        print(f"[GDELT] Query {i+1}: 429 rate-limited, retrying in {wait}s (attempt {attempt+1}/3)")
                        await asyncio.sleep(wait)
                        continue

                    resp.raise_for_status()

                    content_type = resp.headers.get('content-type', '')
                    text = resp.text.strip()
                    if not text or text.startswith('<') or 'text/html' in content_type:
                        break  # non-JSON response, skip this query

                    data = resp.json()
                    articles = data.get("articles", [])
                    for art in articles:
                        art_url = art.get("url", "")
                        if art_url not in seen_urls:
                            seen_urls.add(art_url)
                            all_articles.append(art)
                    print(f"[GDELT] Query {i+1}: got {len(articles)} articles")
                    break  # success

                except Exception as e:
                    print(f"[GDELT] Query {i+1} failed (attempt {attempt+1}/3): {e}")
                    if attempt < 2:
                        await asyncio.sleep(3 * (attempt + 1))
                    continue

    # Filter for relevance — remove articles that don't mention any Middle East entity
    articles = [a for a in all_articles if _is_relevant(a.get("title", ""))]
    print(f"[GDELT] {len(all_articles)} raw → {len(articles)} relevant articles")

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

            # Determine location from title content (not source_country which is the publisher's country)
            location_name = _extract_location(title) or "Middle East"
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
                titleAr=title,  # Will be translated by AI service if available
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
                relatedCities=_extract_all_related_cities(title),
            )
            events.append(event)

    except Exception as e:
        print(f"[GDELT] Error processing articles: {e}")

    return events


# Shared location lookup table — cities first (most specific), then countries
_LOCATIONS = [
    # Cities
    ("tehran", "Tehran"), ("tel aviv", "Tel Aviv"), ("haifa", "Haifa"),
    ("isfahan", "Isfahan"), ("beirut", "Beirut"), ("damascus", "Damascus"),
    ("jerusalem", "Jerusalem"), ("baghdad", "Baghdad"), ("gaza", "Gaza"),
    ("ramallah", "Ramallah"), ("manama", "Manama"), ("doha", "Doha"),
    ("riyadh", "Riyadh"), ("jeddah", "Jeddah"), ("abu dhabi", "Abu Dhabi"),
    ("dubai", "Dubai"), ("amman", "Amman"), ("muscat", "Muscat"),
    ("sanaa", "Sanaa"), ("aden", "Aden"), ("aleppo", "Aleppo"),
    ("erbil", "Erbil"), ("basra", "Basra"), ("tabriz", "Tabriz"),
    ("shiraz", "Shiraz"), ("mashhad", "Mashhad"), ("bushehr", "Bushehr"),
    ("dimona", "Dimona"),
    # Waterways
    ("hormuz", "Hormuz"), ("red sea", "Red Sea"), ("suez", "Suez"),
    ("bab el-mandeb", "Red Sea"),
    # Countries
    ("iran", "Iran"), ("israel", "Israel"), ("lebanon", "Lebanon"),
    ("syria", "Syria"), ("iraq", "Iraq"), ("yemen", "Yemen"),
    ("bahrain", "Bahrain"), ("qatar", "Qatar"), ("kuwait", "Kuwait"),
    ("saudi", "Saudi Arabia"), ("emirates", "UAE"), ("uae", "UAE"),
    ("jordan", "Jordan"), ("oman", "Oman"), ("palestine", "Palestine"),
    ("west bank", "West Bank"),
    # Arabic — Countries
    ("إيران", "Iran"), ("إسرائيل", "Israel"), ("لبنان", "Lebanon"),
    ("سوريا", "Syria"), ("العراق", "Iraq"), ("اليمن", "Yemen"),
    ("البحرين", "Bahrain"), ("قطر", "Qatar"), ("الكويت", "Kuwait"),
    ("السعودية", "Saudi Arabia"), ("الإمارات", "UAE"), ("الأردن", "Jordan"),
    ("عُمان", "Oman"), ("عمان", "Oman"), ("فلسطين", "Palestine"),
    # Arabic — Cities
    ("طهران", "Tehran"), ("تل أبيب", "Tel Aviv"), ("حيفا", "Haifa"),
    ("أصفهان", "Isfahan"), ("بيروت", "Beirut"), ("دمشق", "Damascus"),
    ("القدس", "Jerusalem"), ("بغداد", "Baghdad"), ("غزة", "Gaza"),
    ("المنامة", "Manama"), ("المحرق", "Bahrain"), ("الدوحة", "Doha"),
    ("الرياض", "Riyadh"), ("جدة", "Jeddah"), ("أبو ظبي", "Abu Dhabi"),
    ("أبوظبي", "Abu Dhabi"), ("دبي", "Dubai"), ("عمّان", "Amman"),
    ("صنعاء", "Sanaa"), ("عدن", "Aden"), ("حلب", "Aleppo"),
    ("أربيل", "Erbil"), ("البصرة", "Basra"), ("تبريز", "Tabriz"),
    ("شيراز", "Shiraz"), ("مشهد", "Mashhad"), ("بوشهر", "Bushehr"),
    ("ديمونا", "Dimona"), ("رام الله", "Ramallah"), ("مسقط", "Muscat"),
    # Arabic — Organizations / factions (mapped to their region)
    ("حزب الله", "Lebanon"), ("حماس", "Gaza"), ("الحوثي", "Yemen"),
    ("الحوثيين", "Yemen"), ("أنصار الله", "Yemen"),
    # Arabic — Waterways
    ("هرمز", "Hormuz"), ("مضيق هرمز", "Hormuz"),
    ("البحر الأحمر", "Red Sea"), ("قناة السويس", "Suez"),
    ("باب المندب", "Red Sea"),
    # Bahrain-specific keywords for enhanced monitoring
    ("bahraini", "Bahrain"), ("manama", "Manama"), ("muharraq", "Bahrain"),
    ("sitra", "Bahrain"), ("riffa", "Bahrain"), ("isa town", "Bahrain"),
    ("juffair", "Bahrain"), ("سترة", "Bahrain"), ("الرفاع", "Bahrain"),
    ("مدينة عيسى", "Bahrain"), ("الجفير", "Bahrain"),
    ("صفارة", "Bahrain"), ("إنذار", "Bahrain"), ("صافرة", "Bahrain"),
]


def _extract_location(title: str) -> str:
    """Extract the most specific Middle East location mentioned in a title."""
    title_lower = title.lower()
    for term, name in _LOCATIONS:
        if term in title_lower:
            return name
    return ""


def _extract_all_related_cities(text: str) -> list[str]:
    """Extract ALL mentioned locations from text — returns Arabic names for relatedCities.

    This ensures country-level mentions (e.g. 'Iran') produce the Arabic country name,
    and city-level mentions (e.g. 'Tehran') produce the Arabic city name.
    Both are included so the frontend can match events to city cards.
    """
    text_lower = text.lower()
    found: list[str] = []
    seen_english: set[str] = set()

    for term, english_name in _LOCATIONS:
        if term in text_lower and english_name not in seen_english:
            seen_english.add(english_name)
            arabic = _get_city_ar(english_name)
            if arabic not in found:
                found.append(arabic)

    return found if found else ["الشرق الأوسط"]


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
