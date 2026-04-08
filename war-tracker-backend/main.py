"""WarScope Backend — Real-time war tracking API with multiple source integrations."""
import asyncio
import os
import json
import time
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import hashlib
import hmac
import secrets

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from config import (
    FRONTEND_ORIGINS, GDELT_POLL_INTERVAL, NEWS_POLL_INTERVAL,
    OPENSKY_POLL_INTERVAL, AI_ANALYSIS_INTERVAL, RSS_POLL_INTERVAL,
    NEWSAPI_KEY,
)
from models import TrackerEvent, AircraftPosition, AISummary, Alert, AlertSeverity, DashboardIndicator, VesselPosition, MaritimeZoneStats, EventCategory
from services.maritime_service import connect_aisstream, get_vessels, get_zone_stats
from services.gdelt_service import fetch_gdelt_events
from services.news_service import fetch_news_events
from services.opensky_service import fetch_aircraft_positions
from services.ai_service import translate_event, batch_translate_events, analyze_events, generate_why_it_matters
from services.mediastack_service import fetch_mediastack_events
from services.acled_service import fetch_acled_events
from services.rss_service import fetch_rss_events
from services.dedup_engine import deduplicate_and_merge
from services.devin_autofix import create_fix_session, get_session_status, get_fix_sessions, is_devin_configured
from health_monitor import HealthMonitor


# ──────────────────────────────────────────────
# In-memory store
# ──────────────────────────────────────────────
class DataStore:
    def __init__(self):
        self.events: list[TrackerEvent] = []
        self.aircraft: list[AircraftPosition] = []
        self.alerts: list[Alert] = []
        self.ai_summaries: list[AISummary] = []
        self.indicators: list[DashboardIndicator] = self._default_indicators()
        self.last_gdelt_fetch: datetime | None = None
        self.last_news_fetch: datetime | None = None
        self.last_opensky_fetch: datetime | None = None
        self.last_ai_analysis: datetime | None = None
        self.source_status: dict[str, dict] = {
            "gdelt": {"active": True, "lastUpdate": None, "eventCount": 0, "errors": 0, "successfulPolls": 0},
            "newsapi": {"active": bool(NEWSAPI_KEY), "lastUpdate": None, "eventCount": 0, "errors": 0, "successfulPolls": 0},
            "mediastack": {"active": bool(os.getenv("MEDIASTACK_KEY")), "lastUpdate": None, "eventCount": 0, "errors": 0, "successfulPolls": 0},
            "acled": {"active": bool(os.getenv("ACLED_KEY")), "lastUpdate": None, "eventCount": 0, "errors": 0, "successfulPolls": 0},
            "opensky": {"active": True, "lastUpdate": None, "eventCount": 0, "errors": 0, "successfulPolls": 0},
            "aisstream": {"active": bool(os.getenv("AISSTREAM_API_KEY")), "lastUpdate": None, "eventCount": 0, "errors": 0, "successfulPolls": 0},
            "rss": {"active": True, "lastUpdate": None, "eventCount": 0, "errors": 0, "successfulPolls": 0},
            "devin_ai": {"active": True, "lastUpdate": None, "eventCount": 0, "errors": 0, "successfulPolls": 0},
        }

    def _default_indicators(self) -> list[DashboardIndicator]:
        return [
            DashboardIndicator(id="military", name="Military Activity", nameAr="النشاط العسكري",
                               score=50, previousScore=50, trend="stable",
                               description="Military activity level", descriptionAr="مستوى النشاط العسكري"),
            DashboardIndicator(id="airspace", name="Airspace Risk", nameAr="مخاطر الأجواء",
                               score=40, previousScore=40, trend="stable",
                               description="Airspace risk level", descriptionAr="مستوى مخاطر الأجواء"),
            DashboardIndicator(id="maritime", name="Maritime Risk", nameAr="مخاطر الملاحة",
                               score=35, previousScore=35, trend="stable",
                               description="Maritime risk level", descriptionAr="مستوى مخاطر الملاحة"),
            DashboardIndicator(id="civilian", name="Civilian Risk", nameAr="مخاطر المدنيين",
                               score=45, previousScore=45, trend="stable",
                               description="Civilian risk level", descriptionAr="مستوى مخاطر المدنيين"),
            DashboardIndicator(id="uncertainty", name="Information Uncertainty", nameAr="عدم يقين المعلومات",
                               score=60, previousScore=60, trend="stable",
                               description="Information uncertainty", descriptionAr="مستوى عدم يقين المعلومات"),
        ]


store = DataStore()
health_monitor = HealthMonitor()


# ──────────────────────────────────────────────
# WebSocket connection manager
# ──────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active_connections.append(ws)
        print(f"[WS] Client connected. Total: {len(self.active_connections)}")

    def disconnect(self, ws: WebSocket):
        if ws in self.active_connections:
            self.active_connections.remove(ws)
        print(f"[WS] Client disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        dead: list[WebSocket] = []
        for ws in list(self.active_connections):
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


ws_manager = ConnectionManager()


# ──────────────────────────────────────────────
# Background tasks
# ──────────────────────────────────────────────
async def update_indicators():
    """Update dashboard indicators based on current events."""
    from collections import Counter

    category_count = Counter(e.category.value for e in store.events)
    total = len(store.events) or 1

    for ind in store.indicators:
        old_score = ind.score
        if ind.id == "military":
            mil = category_count.get("military", 0) + category_count.get("fire", 0)
            ind.score = min(100, int((mil / total) * 200) + 30)
        elif ind.id == "airspace":
            air = category_count.get("airspace", 0)
            ind.score = min(100, int((air / total) * 250) + 20)
        elif ind.id == "maritime":
            mar = category_count.get("maritime", 0)
            ind.score = min(100, int((mar / total) * 250) + 15)
        elif ind.id == "civilian":
            hum = category_count.get("humanitarian", 0) + category_count.get("alert", 0)
            ind.score = min(100, int((hum / total) * 200) + 25)
        elif ind.id == "uncertainty":
            unverified = sum(1 for e in store.events if e.trustLevel in ("low", "medium"))
            ind.score = min(100, int((unverified / total) * 150) + 20)

        ind.previousScore = old_score
        if ind.score > old_score + 2:
            ind.trend = "up"
        elif ind.score < old_score - 2:
            ind.trend = "down"
        else:
            ind.trend = "stable"


def generate_alerts_from_events(new_events: list[TrackerEvent]):
    """Auto-generate alerts from breaking/important events."""
    for event in new_events:
        if event.isBreaking:
            alert = Alert(
                id=f"alert-{event.id}",
                title=f"Breaking: {event.title}",
                titleAr=f"عاجل: {event.titleAr}",
                description=event.description,
                descriptionAr=event.descriptionAr,
                severity=AlertSeverity.critical if event.category.value in ("military", "fire") else AlertSeverity.high,
                type="urgent",
                timestamp=event.timestamp,
                relatedEventIds=[event.id],
                isRead=False,
                city=event.location.name,
                cityAr=event.location.nameAr,
            )
            # Avoid duplicate alerts
            if not any(a.id == alert.id for a in store.alerts):
                store.alerts.append(alert)


async def poll_gdelt():
    """Background task: Poll GDELT for new events."""
    while True:
        try:
            print("[Scheduler] Fetching GDELT events...")
            events = await fetch_gdelt_events(max_results=40)
            if events:
                store.source_status["gdelt"]["lastUpdate"] = datetime.now(timezone.utc).isoformat()
                store.source_status["gdelt"]["eventCount"] += len(events)
                store.source_status["gdelt"]["successfulPolls"] += 1

                # Merge with existing
                all_events = events + store.events
                store.events = deduplicate_and_merge(all_events)[:500]  # Keep max 500

                # Batch-translate ALL event titles to Arabic (on store.events so deduped primaries get translated)
                try:
                    await batch_translate_events(store.events)
                except Exception as e:
                    print(f"[Translation] Batch translation error: {e}")

                generate_alerts_from_events(events)
                await update_indicators()
                await _check_bahrain_critical_alert(events)

                await ws_manager.broadcast({
                    "type": "events_update",
                    "events": [e.model_dump(mode="json") for e in store.events[:50]],
                    "totalEvents": len(store.events),
                    "indicators": [i.model_dump(mode="json") for i in store.indicators],
                    "alerts": [a.model_dump(mode="json") for a in store.alerts[:20]],
                })

                print(f"[GDELT] Fetched {len(events)} events, total unique: {len(store.events)}")
            else:
                print("[GDELT] No new events")

        except Exception as e:
            store.source_status["gdelt"]["errors"] += 1
            print(f"[GDELT] Poll error: {e}")

        await asyncio.sleep(GDELT_POLL_INTERVAL)


async def poll_news():
    """Background task: Poll NewsAPI and MediaStack."""
    while True:
        try:
            new_events: list[TrackerEvent] = []

            # NewsAPI
            if NEWSAPI_KEY:
                print("[Scheduler] Fetching NewsAPI events...")
                news = await fetch_news_events(max_results=20)
                new_events.extend(news)
                store.source_status["newsapi"]["lastUpdate"] = datetime.now(timezone.utc).isoformat()
                store.source_status["newsapi"]["eventCount"] += len(news)
                store.source_status["newsapi"]["successfulPolls"] += 1

            # MediaStack
            ms_key = os.getenv("MEDIASTACK_KEY", "")
            if ms_key:
                print("[Scheduler] Fetching MediaStack events...")
                ms = await fetch_mediastack_events(ms_key, max_results=15)
                new_events.extend(ms)
                store.source_status["mediastack"]["lastUpdate"] = datetime.now(timezone.utc).isoformat()
                store.source_status["mediastack"]["eventCount"] += len(ms)
                store.source_status["mediastack"]["successfulPolls"] += 1

            # ACLED
            acled_key = os.getenv("ACLED_KEY", "")
            acled_email = os.getenv("ACLED_EMAIL", "")
            if acled_key and acled_email:
                print("[Scheduler] Fetching ACLED events...")
                acled = await fetch_acled_events(acled_key, acled_email, max_results=30)
                new_events.extend(acled)
                store.source_status["acled"]["lastUpdate"] = datetime.now(timezone.utc).isoformat()
                store.source_status["acled"]["eventCount"] += len(acled)
                store.source_status["acled"]["successfulPolls"] += 1

            if new_events:
                all_events = new_events + store.events
                store.events = deduplicate_and_merge(all_events)[:500]

                # Batch-translate ALL event titles to Arabic (on store.events so deduped primaries get translated)
                try:
                    await batch_translate_events(store.events)
                except Exception as e:
                    print(f"[Translation] News batch translation error: {e}")

                generate_alerts_from_events(new_events)
                await update_indicators()
                await _check_bahrain_critical_alert(new_events)

                await ws_manager.broadcast({
                    "type": "events_update",
                    "events": [e.model_dump(mode="json") for e in store.events[:50]],
                    "totalEvents": len(store.events),
                    "indicators": [i.model_dump(mode="json") for i in store.indicators],
                    "alerts": [a.model_dump(mode="json") for a in store.alerts[:20]],
                })

                print(f"[News] Fetched {len(new_events)} events, total unique: {len(store.events)}")

        except Exception as e:
            print(f"[News] Poll error: {e}")

        await asyncio.sleep(NEWS_POLL_INTERVAL)


async def poll_opensky():
    """Background task: Poll OpenSky for aircraft positions."""
    while True:
        try:
            positions = await fetch_aircraft_positions()
            store.aircraft = positions
            store.source_status["opensky"]["lastUpdate"] = datetime.now(timezone.utc).isoformat()
            store.source_status["opensky"]["eventCount"] = len(positions)
            store.source_status["opensky"]["successfulPolls"] += 1

            if positions and ws_manager.active_connections:
                await ws_manager.broadcast({
                    "type": "aircraft_update",
                    "aircraft": [p.model_dump(mode="json") for p in positions[:500]],
                })

        except Exception as e:
            store.source_status["opensky"]["errors"] += 1
            print(f"[OpenSky] Poll error: {e}")

        await asyncio.sleep(OPENSKY_POLL_INTERVAL)


async def poll_ai_analysis():
    """Background task: Generate AI analysis periodically."""
    while True:
        await asyncio.sleep(AI_ANALYSIS_INTERVAL)
        try:
            if store.events:
                print("[Scheduler] Running AI analysis...")
                summary = await analyze_events(store.events[:20])
                if summary:
                    store.ai_summaries.insert(0, summary)
                    store.ai_summaries = store.ai_summaries[:10]  # Keep last 10
                    store.source_status["devin_ai"]["lastUpdate"] = datetime.now(timezone.utc).isoformat()
                    store.source_status["devin_ai"]["eventCount"] += 1
                    store.source_status["devin_ai"]["successfulPolls"] += 1

                    await ws_manager.broadcast({
                        "type": "ai_analysis",
                        "summary": summary.model_dump(mode="json"),
                    })
                    print("[Devin AI] Analysis generated successfully")
        except Exception as e:
            store.source_status["devin_ai"]["errors"] += 1
            print(f"[Devin AI] Analysis error: {e}")


async def poll_rss():
    """Background task: Poll RSS feeds from trusted sources (Al Jazeera, BBC, Reuters)."""
    while True:
        try:
            print("[Scheduler] Fetching RSS feed events...")
            rss_events = await fetch_rss_events(max_results=50)
            if rss_events:
                store.source_status["rss"]["lastUpdate"] = datetime.now(timezone.utc).isoformat()
                store.source_status["rss"]["eventCount"] += len(rss_events)
                store.source_status["rss"]["successfulPolls"] += 1

                all_events = rss_events + store.events
                store.events = deduplicate_and_merge(all_events)[:500]

                # Batch-translate event titles to Arabic
                try:
                    await batch_translate_events(store.events)
                except Exception as e:
                    print(f"[Translation] RSS batch translation error: {e}")

                generate_alerts_from_events(rss_events)
                await update_indicators()
                await _check_bahrain_critical_alert(rss_events)

                await ws_manager.broadcast({
                    "type": "events_update",
                    "events": [e.model_dump(mode="json") for e in store.events[:50]],
                    "totalEvents": len(store.events),
                    "indicators": [i.model_dump(mode="json") for i in store.indicators],
                    "alerts": [a.model_dump(mode="json") for a in store.alerts[:20]],
                })

                print(f"[RSS] Fetched {len(rss_events)} events, total unique: {len(store.events)}")
            else:
                print("[RSS] No relevant events from feeds")

        except Exception as e:
            store.source_status["rss"]["errors"] += 1
            print(f"[RSS] Poll error: {e}")

        await asyncio.sleep(RSS_POLL_INTERVAL)


# Bahrain siren/alert keywords for instant detection
BAHRAIN_ALERT_KEYWORDS = [
    "صفارة", "إنذار", "صافرة", "siren", "alarm", "air raid",
    "ملجأ", "إخلاء", "shelter", "evacuate", "تحذير أمني",
    "زوال الخطر", "انتهاء التهديد", "all clear",
    "اعتراض", "شظايا", "دفاع جوي", "مكان آمن",
    "intercept", "shrapnel", "air defense",
    "الدفاع المدني", "civil defense", "civil defence",
    "الاتصال الوطني", "national communication",
]
BAHRAIN_LOCATION_KEYWORDS = [
    "bahrain", "البحرين", "المنامة", "manama", "المحرق", "muharraq",
    "سترة", "sitra", "الرفاع", "riffa", "الجفير", "juffair",
    "مدينة عيسى", "isa town",
]


async def _check_bahrain_critical_alert(events: list[TrackerEvent]):
    """Check if any events contain critical Bahrain alerts (sirens, evacuations).
    Broadcasts an immediate WebSocket alert if detected."""
    ALL_CLEAR_KEYWORDS = ["زوال الخطر", "انتهاء التهديد", "all clear", "زوال"]
    for event in events:
        text = f"{event.title} {event.titleAr or ''} {event.description or ''}".lower()
        has_bahrain = any(kw in text for kw in BAHRAIN_LOCATION_KEYWORDS)
        has_alert = any(kw in text for kw in BAHRAIN_ALERT_KEYWORDS)
        if has_bahrain and has_alert:
            # Determine if this is an "all clear" or "danger" siren
            is_all_clear = any(kw in text for kw in ALL_CLEAR_KEYWORDS)
            if is_all_clear:
                severity = "info"
                message = "تنبيه: صفارة زوال الخطر في البحرين — الوضع آمن"
                message_en = "NOTICE: All-clear siren in Bahrain — situation is safe"
            else:
                severity = "critical"
                message = "تنبيه عاجل: تم رصد صفارة إنذار في البحرين"
                message_en = "URGENT: Air raid siren detected in Bahrain"

            print(f"[BAHRAIN ALERT] {severity}: {event.title}")
            event.isBreaking = True
            event.category = EventCategory.alert
            await ws_manager.broadcast({
                "type": "bahrain_alert",
                "severity": severity,
                "event": event.model_dump(mode="json"),
                "message": message,
                "messageEn": message_en,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })


async def poll_maritime_broadcast():
    """Background task: Broadcast maritime vessel positions every 30 seconds."""
    while True:
        await asyncio.sleep(30)
        try:
            from services.maritime_service import _ws_connected as ws_connected
            vessels = get_vessels()
            zones = get_zone_stats()

            # Update source_status when WebSocket is connected, even without vessels.
            # This prevents the health monitor from marking the service as "degraded"
            # just because no vessels are in the monitored zones yet.
            if ws_connected or vessels:
                store.source_status["aisstream"]["lastUpdate"] = datetime.now(timezone.utc).isoformat()
                store.source_status["aisstream"]["eventCount"] = len(vessels)
                store.source_status["aisstream"]["successfulPolls"] += 1

            if vessels:
                await ws_manager.broadcast({
                    "type": "maritime_update",
                    "vessels": [v.model_dump(mode="json") for v in vessels[:200]],
                    "zones": [z.model_dump(mode="json") for z in zones],
                    "totalVessels": len(vessels),
                })
        except Exception as e:
            store.source_status["aisstream"]["errors"] += 1
            print(f"[Maritime] Broadcast error: {e}")


# ──────────────────────────────────────────────
# App lifecycle
# ──────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Start background polling tasks on startup."""
    print("[WarScope] Starting background tasks...")
    tasks = [
        asyncio.create_task(poll_gdelt()),
        asyncio.create_task(poll_news()),
        asyncio.create_task(poll_rss()),
        asyncio.create_task(poll_opensky()),
        asyncio.create_task(poll_ai_analysis()),
        asyncio.create_task(connect_aisstream()),
        asyncio.create_task(poll_maritime_broadcast()),
    ]
    # Start health monitor
    await health_monitor.start(store)
    print("[WarScope] Health monitor started.")
    yield
    print("[WarScope] Shutting down background tasks...")
    await health_monitor.stop()
    for task in tasks:
        task.cancel()


# ──────────────────────────────────────────────
# FastAPI app
# ──────────────────────────────────────────────
app = FastAPI(
    title="WarScope API",
    description="Real-time war tracking backend",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=None,   # Disable Swagger UI in production
    redoc_url=None,  # Disable ReDoc in production
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


# ──────────────────────────────────────────────
# Rate limiter (in-memory, per-IP)
# ──────────────────────────────────────────────
_rate_limit_store: dict[str, list[float]] = {}
RATE_LIMIT_MAX_ATTEMPTS = 5       # max login attempts
RATE_LIMIT_WINDOW_SECONDS = 300   # per 5-minute window


def _check_rate_limit(ip: str) -> bool:
    """Return True if the IP is rate-limited (too many attempts)."""
    now = time.time()
    attempts = _rate_limit_store.get(ip, [])
    # Prune old attempts outside the window
    attempts = [t for t in attempts if now - t < RATE_LIMIT_WINDOW_SECONDS]
    if attempts:
        _rate_limit_store[ip] = attempts
    else:
        _rate_limit_store.pop(ip, None)
    return len(attempts) >= RATE_LIMIT_MAX_ATTEMPTS


def _record_attempt(ip: str):
    """Record a login attempt for rate limiting."""
    now = time.time()
    if ip not in _rate_limit_store:
        _rate_limit_store[ip] = []
    _rate_limit_store[ip].append(now)


# ──────────────────────────────────────────────
# Admin authentication (server-side)
# ──────────────────────────────────────────────
ADMIN_PASSWORD_HASH = os.getenv("ADMIN_PASSWORD_HASH", "")
if not ADMIN_PASSWORD_HASH:
    # Fallback — should be overridden via env var in production
    ADMIN_PASSWORD_HASH = hashlib.sha256(b"warscope2024").hexdigest()

# Token store with expiration: token -> expiry timestamp
_admin_tokens: dict[str, float] = {}
TOKEN_TTL_SECONDS = 3600  # Tokens expire after 1 hour


def _cleanup_expired_tokens():
    """Remove expired tokens from the store."""
    now = time.time()
    expired = [t for t, exp in _admin_tokens.items() if now > exp]
    for t in expired:
        del _admin_tokens[t]


def _verify_token(token: str) -> bool:
    """Check if a token is valid and not expired."""
    _cleanup_expired_tokens()
    return token in _admin_tokens


class AdminLoginRequest(BaseModel):
    password: str


class AdminLoginResponse(BaseModel):
    success: bool
    token: str | None = None


@app.post("/api/admin/login")
async def admin_login(req: AdminLoginRequest, request: Request):
    """Validate admin password server-side and return a session token."""
    client_ip = request.client.host if request.client else "unknown"

    # Rate limit check
    if _check_rate_limit(client_ip):
        raise HTTPException(
            status_code=429,
            detail="عدد محاولات تسجيل الدخول تجاوز الحد المسموح. حاول مجدداً بعد 5 دقائق."
        )

    pwd_hash = hashlib.sha256(req.password.encode()).hexdigest()
    if hmac.compare_digest(pwd_hash, ADMIN_PASSWORD_HASH):
        token = secrets.token_hex(32)
        _admin_tokens[token] = time.time() + TOKEN_TTL_SECONDS
        return AdminLoginResponse(success=True, token=token)

    # Only record failed attempts for rate limiting
    _record_attempt(client_ip)

    raise HTTPException(status_code=401, detail="كلمة المرور غير صحيحة")


@app.post("/api/admin/verify")
async def admin_verify(authorization: str = Header(default="")):
    """Verify an admin session token from Authorization header."""
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    if token and _verify_token(token):
        return {"valid": True}
    raise HTTPException(status_code=401, detail="غير مصرح")


@app.get("/api/stats")
async def get_stats():
    """Get public stats (connected clients, today's events)."""
    today = datetime.now(timezone.utc).date()
    today_events = sum(1 for e in store.events if e.timestamp.date() == today)
    return {
        "connectedClients": len(ws_manager.active_connections),
        "todayEvents": today_events,
        "totalEvents": len(store.events),
    }


# ──────────────────────────────────────────────
# REST endpoints
# ──────────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "name": "WarScope API",
        "version": "1.0.0",
        "status": "running",
        "sources": store.source_status,
        "events_count": len(store.events),
        "aircraft_count": len(store.aircraft),
        "alerts_count": len(store.alerts),
    }


@app.get("/api/events")
async def get_events(limit: int = 50, category: str | None = None, trust: str | None = None):
    """Get all events with optional filters."""
    # Clamp limit to prevent abuse
    limit = max(1, min(limit, 500))
    events = store.events
    valid_categories = {"military", "alert", "official", "airspace", "maritime", "fire", "humanitarian"}
    valid_trust = {"confirmed", "high", "medium", "low"}
    if category and category in valid_categories:
        events = [e for e in events if e.category.value == category]
    if trust and trust in valid_trust:
        events = [e for e in events if e.trustLevel.value == trust]
    return {"events": [e.model_dump(mode="json") for e in events[:limit]], "total": len(events)}


@app.get("/api/events/{event_id}")
async def get_event(event_id: str):
    """Get a specific event by ID."""
    for event in store.events:
        if event.id == event_id:
            return event.model_dump(mode="json")
    raise HTTPException(status_code=404, detail="Event not found")


@app.get("/api/alerts")
async def get_alerts(limit: int = 20):
    """Get alerts."""
    limit = max(1, min(limit, 100))
    return {"alerts": [a.model_dump(mode="json") for a in store.alerts[:limit]]}


@app.get("/api/aircraft")
async def get_aircraft():
    """Get current aircraft positions."""
    return {"aircraft": [a.model_dump(mode="json") for a in store.aircraft[:500]], "count": len(store.aircraft)}


@app.get("/api/analysis")
async def get_analysis():
    """Get AI analysis summaries."""
    return {"summaries": [s.model_dump(mode="json") for s in store.ai_summaries]}


@app.get("/api/indicators")
async def get_indicators():
    """Get dashboard indicators."""
    return {"indicators": [i.model_dump(mode="json") for i in store.indicators]}


@app.get("/api/sources")
async def get_sources():
    """Get source status information."""
    return {"sources": store.source_status}


# City definitions matching frontend staticConfig
_CITY_DEFS = [
    {"id": "tehran", "name": "Tehran", "nameAr": "طهران", "country": "Iran", "countryAr": "إيران", "lat": 35.6892, "lng": 51.3890},
    {"id": "telaviv", "name": "Tel Aviv", "nameAr": "تل أبيب", "country": "Israel", "countryAr": "إسرائيل", "lat": 32.0853, "lng": 34.7818},
    {"id": "haifa", "name": "Haifa", "nameAr": "حيفا", "country": "Israel", "countryAr": "إسرائيل", "lat": 32.7940, "lng": 34.9896},
    {"id": "damascus", "name": "Damascus", "nameAr": "دمشق", "country": "Syria", "countryAr": "سوريا", "lat": 33.5138, "lng": 36.2765},
    {"id": "beirut", "name": "Beirut", "nameAr": "بيروت", "country": "Lebanon", "countryAr": "لبنان", "lat": 33.8938, "lng": 35.5018},
    {"id": "bahrain", "name": "Bahrain", "nameAr": "البحرين", "country": "Bahrain", "countryAr": "مملكة البحرين", "lat": 26.0667, "lng": 50.5577},
    {"id": "isfahan", "name": "Isfahan", "nameAr": "أصفهان", "country": "Iran", "countryAr": "إيران", "lat": 32.6546, "lng": 51.6680},
    {"id": "baghdad", "name": "Baghdad", "nameAr": "بغداد", "country": "Iraq", "countryAr": "العراق", "lat": 33.3152, "lng": 44.3661},
    {"id": "sanaa", "name": "Sanaa", "nameAr": "صنعاء", "country": "Yemen", "countryAr": "اليمن", "lat": 15.3694, "lng": 44.1910},
    {"id": "gaza", "name": "Gaza", "nameAr": "غزة", "country": "Palestine", "countryAr": "فلسطين", "lat": 31.5017, "lng": 34.4668},
    {"id": "jerusalem", "name": "Jerusalem", "nameAr": "القدس", "country": "Palestine", "countryAr": "فلسطين", "lat": 31.7683, "lng": 35.2137},
    {"id": "kuwait", "name": "Kuwait City", "nameAr": "الكويت", "country": "Kuwait", "countryAr": "الكويت", "lat": 29.3759, "lng": 47.9774},
    {"id": "doha", "name": "Doha", "nameAr": "الدوحة", "country": "Qatar", "countryAr": "قطر", "lat": 25.2854, "lng": 51.5310},
    {"id": "riyadh", "name": "Riyadh", "nameAr": "الرياض", "country": "Saudi Arabia", "countryAr": "السعودية", "lat": 24.7136, "lng": 46.6753},
    {"id": "abudhabi", "name": "Abu Dhabi", "nameAr": "أبو ظبي", "country": "UAE", "countryAr": "الإمارات", "lat": 24.4539, "lng": 54.6534},
    {"id": "amman", "name": "Amman", "nameAr": "عمّان", "country": "Jordan", "countryAr": "الأردن", "lat": 31.9454, "lng": 35.9284},
]

# Country name → city IDs mapping for event matching
_COUNTRY_TO_CITY_IDS: dict[str, list[str]] = {}
for _cd in _CITY_DEFS:
    _COUNTRY_TO_CITY_IDS.setdefault(_cd["country"], []).append(_cd["id"])
    _COUNTRY_TO_CITY_IDS.setdefault(_cd["countryAr"], []).append(_cd["id"])
# Also map Arabic country names used by _get_city_ar
_COUNTRY_AR_EXTRA = {
    "إيران": "Iran", "إسرائيل": "Israel", "سوريا": "Syria", "لبنان": "Lebanon",
    "العراق": "Iraq", "اليمن": "Yemen", "فلسطين": "Palestine", "البحرين": "Bahrain",
    "الكويت": "Kuwait", "قطر": "Qatar", "الإمارات": "UAE", "السعودية": "Saudi Arabia",
    "الأردن": "Jordan",
}
for _ar, _en in _COUNTRY_AR_EXTRA.items():
    if _ar not in _COUNTRY_TO_CITY_IDS and _en in _COUNTRY_TO_CITY_IDS:
        _COUNTRY_TO_CITY_IDS[_ar] = _COUNTRY_TO_CITY_IDS[_en]


def _is_event_related_to_city(event: TrackerEvent, city_def: dict) -> bool:
    """Check if an event is related to a specific city (direct or country-level match)."""
    city_id = city_def["id"]
    name = city_def["name"]
    name_ar = city_def["nameAr"]
    for rc in event.relatedCities:
        if rc == name_ar or rc == name:
            return True
        city_ids = _COUNTRY_TO_CITY_IDS.get(rc, [])
        if city_id in city_ids:
            return True
    return False


def _compute_city_risk(event_count: int, events: list[TrackerEvent]) -> str:
    """Compute dynamic risk level from event count and categories."""
    has_breaking = any(e.isBreaking for e in events)
    has_military = any(e.category in ("military", "fire") for e in events)
    if event_count >= 10 or (event_count >= 5 and has_breaking):
        return "critical"
    if event_count >= 6 or (event_count >= 3 and has_military):
        return "high"
    if event_count >= 3:
        return "elevated"
    if event_count >= 1:
        return "moderate"
    return "low"


def _compute_city_indicators(events: list[TrackerEvent]) -> dict:
    """Compute dynamic indicators from events."""
    if not events:
        return {"military": 0, "airspace": 0, "civilian": 0}
    mil = air = civ = 0.0
    for e in events:
        cat = e.category
        if cat in ("military", "fire"):
            mil += 1
        elif cat == "airspace":
            air += 1
        elif cat == "humanitarian":
            civ += 1
        elif cat == "alert":
            mil += 1; civ += 1
        elif cat == "maritime":
            mil += 1
        elif cat == "official":
            mil += 0.5
    scale = lambda c: min(100, round(c * 15))
    return {"military": scale(mil), "airspace": scale(air), "civilian": scale(civ)}


@app.get("/api/cities")
async def get_cities():
    """Get dynamic city data with real event counts, indicators, and risk levels."""
    result = []
    for cd in _CITY_DEFS:
        city_events = [e for e in store.events if _is_event_related_to_city(e, cd)]
        count = len(city_events)
        indicators = _compute_city_indicators(city_events)
        risk = _compute_city_risk(count, city_events)
        last_update = None
        if city_events:
            last_update = max(e.timestamp for e in city_events).isoformat()
        result.append({
            "id": cd["id"],
            "name": cd["name"],
            "nameAr": cd["nameAr"],
            "country": cd["country"],
            "countryAr": cd["countryAr"],
            "location": {"lat": cd["lat"], "lng": cd["lng"], "name": cd["name"], "nameAr": cd["nameAr"]},
            "riskLevel": risk,
            "lastUpdate": last_update,
            "eventCount": count,
            "indicators": indicators,
        })
    # Sort by event count descending (most active cities first)
    result.sort(key=lambda c: c["eventCount"], reverse=True)
    return {"cities": result}


@app.get("/api/vessels")
async def get_vessels_endpoint():
    """Get current vessel positions in monitored waterways."""
    vessels = get_vessels()
    zones = get_zone_stats()
    return {
        "vessels": [v.model_dump(mode="json") for v in vessels[:200]],
        "zones": [z.model_dump(mode="json") for z in zones],
        "totalVessels": len(vessels),
    }


@app.get("/api/maritime/zones")
async def get_maritime_zones():
    """Get maritime zone statistics."""
    zones = get_zone_stats()
    return {"zones": [z.model_dump(mode="json") for z in zones]}


# ──────────────────────────────────────────────
# Status Page endpoints
# ──────────────────────────────────────────────
@app.get("/api/status")
async def get_status():
    """Public status page data — no auth required."""
    summary = health_monitor.get_status_summary()

    # Add advanced monitoring data
    summary["source_monitoring"] = _get_source_monitoring()
    summary["websocket_health"] = {
        "active_connections": len(ws_manager.active_connections),
        "max_connections": MAX_WS_CONNECTIONS,
    }
    summary["bahrain_monitor"] = _get_bahrain_monitor()

    return summary


def _get_source_monitoring() -> list[dict]:
    """Get per-source monitoring metrics for Status Page."""
    result = []
    for key, info in store.source_status.items():
        successful = info.get("successfulPolls", 0)
        errors = info.get("errors", 0)
        total_polls = successful + errors
        success_rate = round((successful / total_polls * 100) if total_polls > 0 else 100, 1)
        result.append({
            "id": key,
            "active": info.get("active", False),
            "event_count": info.get("eventCount", 0),
            "errors": errors,
            "successful_polls": successful,
            "last_update": info.get("lastUpdate"),
            "success_rate": success_rate,
        })
    return result


def _get_bahrain_monitor() -> dict:
    """Get Bahrain-specific monitoring data."""
    bahrain_keywords = {"bahrain", "البحرين", "المنامة", "manama", "المحرق", "muharraq",
                        "سترة", "sitra", "الرفاع", "riffa", "الجفير", "juffair",
                        "مملكة البحرين"}
    bahrain_events = []
    today = datetime.now(timezone.utc).date()
    for e in store.events:
        text = f"{e.title} {e.titleAr} {e.description} {e.location.name} {e.location.nameAr}".lower()
        if any(kw in text for kw in bahrain_keywords):
            bahrain_events.append({
                "id": e.id,
                "title": e.title,
                "titleAr": e.titleAr,
                "category": e.category.value,
                "timestamp": e.timestamp.isoformat(),
                "isBreaking": e.isBreaking,
            })

    today_bahrain_events = [e for e in bahrain_events if datetime.fromisoformat(e["timestamp"]).date() == today]
    has_alert = any(e["isBreaking"] for e in bahrain_events)
    has_military = any(e["category"] in ("military", "fire", "alert") for e in bahrain_events)

    return {
        "event_count_today": len(today_bahrain_events),
        "events": bahrain_events[:10],
        "has_active_alert": has_alert,
        "has_military_activity": has_military,
        "risk_level": "critical" if has_alert else "high" if has_military else "elevated" if len(today_bahrain_events) >= 3 else "moderate" if len(today_bahrain_events) >= 1 else "low",
    }


@app.get("/api/status/admin")
async def get_status_admin(authorization: str = Header(default="")):
    """Admin: full status config including disabled services."""
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    if not token or not _verify_token(token):
        raise HTTPException(status_code=401, detail="غير مصرح")
    return health_monitor.get_admin_config()


@app.post("/api/status/admin/service/{service_id}")
async def update_service_status(service_id: str, request: Request, authorization: str = Header(default="")):
    """Admin: update service monitoring config."""
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    if not token or not _verify_token(token):
        raise HTTPException(status_code=401, detail="غير مصرح")
    body = await request.json()
    ok = health_monitor.update_service_config(service_id, body)
    if not ok:
        raise HTTPException(status_code=404, detail="الخدمة غير موجودة")
    return {"success": True}


@app.post("/api/status/admin/incident/{incident_id}/note")
async def add_incident_note(incident_id: str, request: Request, authorization: str = Header(default="")):
    """Admin: add manual note to an incident."""
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    if not token or not _verify_token(token):
        raise HTTPException(status_code=401, detail="غير مصرح")
    body = await request.json()
    ok = health_monitor.add_manual_incident_note(
        incident_id,
        body.get("message", ""),
        body.get("message_ar", ""),
    )
    if not ok:
        raise HTTPException(status_code=404, detail="الحادث غير موجود")
    return {"success": True}


@app.post("/api/status/admin/check/{service_id}")
async def trigger_health_check(service_id: str, authorization: str = Header(default="")):
    """Admin: trigger immediate health check for a service."""
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    if not token or not _verify_token(token):
        raise HTTPException(status_code=401, detail="غير مصرح")
    if service_id not in health_monitor.services:
        raise HTTPException(status_code=404, detail="الخدمة غير موجودة")
    result = await health_monitor.check_service(service_id, store)
    return result.model_dump(mode="json")


@app.post("/api/analysis/trigger")
async def trigger_analysis(authorization: str = Header(default="")):
    """Manually trigger AI analysis (requires admin token to prevent API quota abuse)."""
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    if not token or not _verify_token(token):
        raise HTTPException(status_code=401, detail="يتطلب تسجيل دخول المسؤول")
    summary = await analyze_events(store.events[:20])
    if summary:
        store.ai_summaries.insert(0, summary)
        store.ai_summaries = store.ai_summaries[:10]  # Keep last 10
        store.source_status["devin_ai"]["lastUpdate"] = datetime.now(timezone.utc).isoformat()
        return summary.model_dump(mode="json")
    return {"error": "No events available for analysis"}


# ──────────────────────────────────────────────
# Devin Auto-Fix endpoints
# ──────────────────────────────────────────────
@app.post("/api/autofix/trigger/{service_id}")
async def trigger_devin_fix(service_id: str, request: Request):
    """Trigger a Devin session to investigate and fix a failing service. Protected by code 3131."""
    body = await request.json()
    fix_code = body.get("fix_code", "")
    if fix_code != "3131":
        raise HTTPException(status_code=401, detail="رمز التحقق غير صحيح")

    if not is_devin_configured():
        raise HTTPException(status_code=503, detail="Devin API غير مُعرّف — يرجى إضافة DEVIN_API_KEY")

    # Get service info from health monitor
    svc = health_monitor.services.get(service_id)
    if not svc:
        raise HTTPException(status_code=404, detail="الخدمة غير موجودة")

    # Collect error context
    error_details = f"Service: {svc.config.name} ({svc.config.name_ar})\n"
    error_details += f"Status: {svc.current_status.value}\n"
    error_details += f"Consecutive failures: {svc.consecutive_failures}\n"
    error_details += f"Last check: {svc.last_check or 'Never'}\n"
    error_details += f"Last failure: {svc.last_failure or 'Never'}\n"
    error_details += f"Response time: {svc.response_time_ms}ms\n"
    error_details += f"Errors (24h): {svc.errors_24h}\n"
    error_details += f"Success rate (24h): {svc.success_rate_24h}%\n"
    error_details += f"Auto-heal attempts: {svc.heal_attempts}\n"

    # Get last check result error if available
    for check in reversed(health_monitor.check_history):
        if check.service_id == service_id and check.error:
            error_details += f"Last error: {check.error}\n"
            break

    # Collect incident info
    incident_info = None
    for inc in health_monitor.incidents:
        if service_id in inc.affected_services and inc.status.value != "resolved":
            incident_info = {
                "started_at": inc.started_at,
                "severity": inc.severity.value,
                "heal_attempts": svc.heal_attempts,
                "notes": " | ".join(n.message for n in inc.notes[-3:]),
            }
            break

    result = await create_fix_session(
        service_id=service_id,
        service_name=f"{svc.config.name} ({svc.config.name_ar})",
        error_details=error_details,
        incident_info=incident_info,
    )

    if result.get("success"):
        # Add incident note about Devin session
        for inc in health_monitor.incidents:
            if service_id in inc.affected_services and inc.status.value != "resolved":
                from health_monitor import IncidentNote, IncidentStatus
                import uuid
                inc.notes.append(IncidentNote(
                    id=f"note-{uuid.uuid4().hex[:8]}",
                    message=f"Devin AI fix session started: {result.get('session_url', '')}",
                    message_ar=f"تم بدء جلسة إصلاح Devin AI: {result.get('session_url', '')}",
                    status=IncidentStatus.identified,
                    timestamp=datetime.now(timezone.utc).isoformat(),
                ))
                break

    return result


@app.get("/api/autofix/sessions")
async def get_autofix_sessions():
    """Get all fix session history."""
    return {
        "sessions": get_fix_sessions(),
        "devin_configured": is_devin_configured(),
    }


@app.get("/api/autofix/session/{session_id}")
async def get_autofix_session_status(session_id: str):
    """Check status of a specific fix session."""
    return await get_session_status(session_id)


# ──────────────────────────────────────────────
# WebSocket endpoint
# ──────────────────────────────────────────────
MAX_WS_CONNECTIONS = 100  # Limit total concurrent WebSocket connections


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    if len(ws_manager.active_connections) >= MAX_WS_CONNECTIONS:
        await ws.close(code=1013, reason="Server too busy")
        return
    await ws_manager.connect(ws)

    # Send initial data
    try:
        await ws.send_json({
            "type": "initial_data",
            "events": [e.model_dump(mode="json") for e in store.events[:50]],
            "totalEvents": len(store.events),
            "indicators": [i.model_dump(mode="json") for i in store.indicators],
            "alerts": [a.model_dump(mode="json") for a in store.alerts[:20]],
            "aircraft": [a.model_dump(mode="json") for a in store.aircraft[:200]],
            "vessels": [v.model_dump(mode="json") for v in get_vessels()[:200]],
            "maritimeZones": [z.model_dump(mode="json") for z in get_zone_stats()],
            "summaries": [s.model_dump(mode="json") for s in store.ai_summaries],
            "sources": store.source_status,
        })
    except Exception:
        ws_manager.disconnect(ws)
        return

    try:
        while True:
            data = await ws.receive_text()
            msg = json.loads(data)
            msg_type = msg.get("type", "")

            if msg_type == "ping":
                await ws.send_json({"type": "pong"})
            elif msg_type == "request_events":
                await ws.send_json({
                    "type": "events_update",
                    "events": [e.model_dump(mode="json") for e in store.events[:50]],
                })
            elif msg_type == "request_aircraft":
                await ws.send_json({
                    "type": "aircraft_update",
                    "aircraft": [a.model_dump(mode="json") for a in store.aircraft[:500]],
                })
            elif msg_type == "request_vessels":
                await ws.send_json({
                    "type": "maritime_update",
                    "vessels": [v.model_dump(mode="json") for v in get_vessels()[:200]],
                    "zones": [z.model_dump(mode="json") for z in get_zone_stats()],
                    "totalVessels": len(get_vessels()),
                })

    except WebSocketDisconnect:
        ws_manager.disconnect(ws)
    except Exception:
        ws_manager.disconnect(ws)
