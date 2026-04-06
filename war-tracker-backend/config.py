import os
from dotenv import load_dotenv

load_dotenv()

# API Keys
NEWSAPI_KEY = os.getenv("NEWSAPI_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# GDELT (no key needed)
GDELT_BASE_URL = "https://api.gdeltproject.org/api/v2"

# OpenSky (no key needed for basic)
OPENSKY_BASE_URL = "https://opensky-network.org/api"

# Polling intervals (seconds)
GDELT_POLL_INTERVAL = 300  # 5 minutes
NEWS_POLL_INTERVAL = 600   # 10 minutes
OPENSKY_POLL_INTERVAL = 60 # 60 seconds (rate limit friendly)
AI_ANALYSIS_INTERVAL = 900 # 15 minutes

# CORS
FRONTEND_ORIGINS = [
    "https://dist-mvivermt.devinapps.com",
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
    "iran", "israel", "hezbollah", "hamas", "idf",
    "missile", "strike", "attack", "military",
    "tehran", "tel aviv", "haifa", "isfahan",
    "beirut", "damascus", "hormuz",
    "nuclear", "irgc", "iron dome",
    "إيران", "إسرائيل", "حزب الله", "حماس",
    "صاروخ", "ضربة", "هجوم", "عسكري",
    "طهران", "تل أبيب", "حيفا", "أصفهان",
    "بيروت", "دمشق", "هرمز",
    "نووي", "الحرس الثوري", "القبة الحديدية",
]
