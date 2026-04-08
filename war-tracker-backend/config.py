import os
from dotenv import load_dotenv

load_dotenv()

# API Keys
NEWSAPI_KEY = os.getenv("NEWSAPI_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
DEVIN_API_KEY = os.getenv("DEVIN_API_KEY", "")
MEDIASTACK_KEY = os.getenv("MEDIASTACK_KEY", "")
ACLED_KEY = os.getenv("ACLED_KEY", "")

# Devin API (for auto-fix sessions)
DEVIN_API_URL = "https://api.devin.ai/v1"

# GDELT (no key needed)
GDELT_BASE_URL = "https://api.gdeltproject.org/api/v2"

# OpenSky (no key needed for basic)
OPENSKY_BASE_URL = "https://opensky-network.org/api"

# Polling intervals (seconds)
GDELT_POLL_INTERVAL = 120  # 2 minutes (avoid GDELT 429 rate limits)
NEWS_POLL_INTERVAL = 900   # 15 minutes (conserve free tier: 100 requests/day)
OPENSKY_POLL_INTERVAL = 60 # 60 seconds (rate limit friendly)
AI_ANALYSIS_INTERVAL = 900 # 15 minutes
RSS_POLL_INTERVAL = 180    # 3 minutes (RSS feeds are free, no rate limits)

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
