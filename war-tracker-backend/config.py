import os
from dotenv import load_dotenv

load_dotenv()

# API Keys
NEWSAPI_KEY = os.getenv("NEWSAPI_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
DEVIN_API_KEY = os.getenv("DEVIN_API_KEY", "")

# Devin API (for auto-fix sessions)
DEVIN_API_URL = "https://api.devin.ai/v1"

# Target Devin session for bug reports (send message to existing session instead of creating new ones)
DEVIN_TARGET_SESSION_ID = os.getenv("DEVIN_TARGET_SESSION_ID", "")

# GDELT (no key needed)
GDELT_BASE_URL = "https://api.gdeltproject.org/api/v2"

# OpenSky (no key needed for basic)
OPENSKY_BASE_URL = "https://opensky-network.org/api"

# Polling intervals (seconds) — CRITICAL: Use prime numbers so intervals NEVER align
# LCM of primes is their product, meaning pollers won't collide for hours/days
# This prevents multiple pollers from blocking the event loop simultaneously
GDELT_POLL_INTERVAL = 127   # ~2 minutes (prime — avoids GDELT 429 rate limits)
NEWS_POLL_INTERVAL = 907     # ~15 minutes (prime — conserve free tier: 100 requests/day)
OPENSKY_POLL_INTERVAL = 61   # ~60 seconds (prime — rate limit friendly)
AI_ANALYSIS_INTERVAL = 911   # ~15 minutes (prime — different from NEWS)
RSS_POLL_INTERVAL = 181      # ~3 minutes (prime — RSS feeds are free, no rate limits)

# CORS — production origins only; set CORS_DEV=1 to include localhost
FRONTEND_ORIGINS = [
    "https://dist-mvivermt.devinapps.com",
    "https://dist-danynpxi.devinapps.com",
    "https://dist-mu-taupe-70.vercel.app",
    "https://war-tracker-backend-v2.fly.dev",
]

if os.getenv("CORS_DEV"):
    FRONTEND_ORIGINS += [
        "http://localhost:5173",
        "http://localhost:3000",
    ]

# Region of interest
REGION_BBOX = {
    "min_lat": 24.0,
    "max_lat": 40.0,
    "min_lng": 30.0,
    "max_lng": 65.0,
}

# Keywords for filtering
CONFLICT_KEYWORDS = [
    # Core conflict parties
    "iran", "israel", "hezbollah", "hamas", "idf",
    "missile", "strike", "attack", "military",
    "nuclear", "irgc", "iron dome",
    # Iran cities
    "tehran", "isfahan", "shiraz", "tabriz", "mashhad", "bushehr",
    # Israel cities
    "tel aviv", "haifa", "jerusalem", "dimona",
    # Lebanon
    "beirut", "lebanon",
    # Syria
    "damascus", "syria", "aleppo",
    # Iraq
    "baghdad", "iraq", "erbil", "basra",
    # Yemen
    "yemen", "sanaa", "houthi", "aden",
    # Palestine
    "palestine", "gaza", "ramallah", "west bank",
    # Bahrain
    "bahrain", "manama",
    # Kuwait
    "kuwait",
    # Qatar
    "qatar", "doha",
    # UAE
    "uae", "emirates", "abu dhabi", "dubai",
    # Saudi Arabia
    "saudi", "riyadh", "jeddah",
    # Jordan
    "jordan", "amman",
    # Oman
    "oman", "muscat",
    # Key waterways
    "hormuz", "red sea", "suez",
    # Arabic keywords
    "إيران", "إسرائيل", "حزب الله", "حماس",
    "صاروخ", "ضربة", "هجوم", "عسكري",
    "طهران", "تل أبيب", "حيفا", "أصفهان",
    "بيروت", "دمشق", "بغداد", "صنعاء",
    "غزة", "القدس", "رام الله",
    "البحرين", "المنامة", "الكويت", "قطر", "الدوحة",
    "الإمارات", "أبو ظبي", "دبي",
    "السعودية", "الرياض", "جدة",
    "الأردن", "عمّان", "عُمان", "مسقط",
    "اليمن", "الحوثيين", "عدن",
    "هرمز", "البحر الأحمر", "السويس",
    "نووي", "الحرس الثوري", "القبة الحديدية",
    "لبنان", "سوريا", "العراق", "فلسطين",
]
