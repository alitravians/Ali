"""WarScope Backend — Real-time war tracking API with multiple source integrations."""
import asyncio
import os
import json
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from config import (
    FRONTEND_ORIGINS, GDELT_POLL_INTERVAL, NEWS_POLL_INTERVAL,
    OPENSKY_POLL_INTERVAL, AI_ANALYSIS_INTERVAL, GEMINI_API_KEY, NEWSAPI_KEY,
)
from models import TrackerEvent, AircraftPosition, AISummary, Alert, AlertSeverity, DashboardIndicator, VesselPosition, MaritimeZoneStats
from services.maritime_service import connect_aisstream, get_vessels, get_zone_stats
from services.gdelt_service import fetch_gdelt_events
from services.news_service import fetch_news_events
from services.opensky_service import fetch_aircraft_positions
from services.gemini_service import translate_event, batch_translate_events, analyze_events, generate_why_it_matters
from services.mediastack_service import fetch_mediastack_events
from services.acled_service import fetch_acled_events
from services.dedup_engine import deduplicate_and_merge


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
            "gdelt": {"active": True, "lastUpdate": None, "eventCount": 0, "errors": 0},
            "newsapi": {"active": bool(NEWSAPI_KEY), "lastUpdate": None, "eventCount": 0, "errors": 0},
            "mediastack": {"active": bool(os.getenv("MEDIASTACK_KEY")), "lastUpdate": None, "eventCount": 0, "errors": 0},
            "acled": {"active": bool(os.getenv("ACLED_KEY")), "lastUpdate": None, "eventCount": 0, "errors": 0},
            "opensky": {"active": True, "lastUpdate": None, "eventCount": 0, "errors": 0},
            "aisstream": {"active": bool(os.getenv("AISSTREAM_API_KEY")), "lastUpdate": None, "eventCount": 0, "errors": 0},
            "gemini": {"active": bool(GEMINI_API_KEY), "lastUpdate": None, "eventCount": 0, "errors": 0},
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
        for ws in self.active_connections:
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

                # Merge with existing
                all_events = events + store.events
                store.events = deduplicate_and_merge(all_events)[:500]  # Keep max 500

                # Batch-translate ALL event titles to Arabic using Gemini
                if GEMINI_API_KEY:
                    try:
                        await batch_translate_events(events)
                    except Exception as e:
                        print(f"[Gemini] Batch translation error: {e}")

                generate_alerts_from_events(events)
                await update_indicators()

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

            # MediaStack
            ms_key = os.getenv("MEDIASTACK_KEY", "")
            if ms_key:
                print("[Scheduler] Fetching MediaStack events...")
                ms = await fetch_mediastack_events(ms_key, max_results=15)
                new_events.extend(ms)
                store.source_status["mediastack"]["lastUpdate"] = datetime.now(timezone.utc).isoformat()
                store.source_status["mediastack"]["eventCount"] += len(ms)

            # ACLED
            acled_key = os.getenv("ACLED_KEY", "")
            acled_email = os.getenv("ACLED_EMAIL", "")
            if acled_key and acled_email:
                print("[Scheduler] Fetching ACLED events...")
                acled = await fetch_acled_events(acled_key, acled_email, max_results=30)
                new_events.extend(acled)
                store.source_status["acled"]["lastUpdate"] = datetime.now(timezone.utc).isoformat()
                store.source_status["acled"]["eventCount"] += len(acled)

            if new_events:
                all_events = new_events + store.events
                store.events = deduplicate_and_merge(all_events)[:500]

                # Batch-translate ALL event titles to Arabic using Gemini
                if GEMINI_API_KEY:
                    try:
                        await batch_translate_events(new_events)
                    except Exception as e:
                        print(f"[Gemini] News batch translation error: {e}")

                generate_alerts_from_events(new_events)
                await update_indicators()

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
            if GEMINI_API_KEY and store.events:
                print("[Scheduler] Running AI analysis...")
                summary = await analyze_events(store.events[:20])
                if summary:
                    store.ai_summaries.insert(0, summary)
                    store.ai_summaries = store.ai_summaries[:10]  # Keep last 10
                    store.source_status["gemini"]["lastUpdate"] = datetime.now(timezone.utc).isoformat()
                    store.source_status["gemini"]["eventCount"] += 1

                    await ws_manager.broadcast({
                        "type": "ai_analysis",
                        "summary": summary.model_dump(mode="json"),
                    })
                    print("[AI] Analysis generated successfully")
        except Exception as e:
            store.source_status["gemini"]["errors"] += 1
            print(f"[AI] Analysis error: {e}")


async def poll_maritime_broadcast():
    """Background task: Broadcast maritime vessel positions every 30 seconds."""
    while True:
        await asyncio.sleep(30)
        try:
            vessels = get_vessels()
            zones = get_zone_stats()
            if vessels:
                store.source_status["aisstream"]["lastUpdate"] = datetime.now(timezone.utc).isoformat()
                store.source_status["aisstream"]["eventCount"] = len(vessels)

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
        asyncio.create_task(poll_opensky()),
        asyncio.create_task(poll_ai_analysis()),
        asyncio.create_task(connect_aisstream()),
        asyncio.create_task(poll_maritime_broadcast()),
    ]
    yield
    print("[WarScope] Shutting down background tasks...")
    for task in tasks:
        task.cancel()


# ──────────────────────────────────────────────
# FastAPI app
# ──────────────────────────────────────────────
app = FastAPI(
    title="WarScope API",
    description="Real-time war tracking backend with GDELT, NewsAPI, OpenSky, ACLED, MediaStack, and Gemini AI",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS + ["*"],  # Allow all for now, restrict later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
    events = store.events
    if category:
        events = [e for e in events if e.category.value == category]
    if trust:
        events = [e for e in events if e.trustLevel.value == trust]
    return {"events": [e.model_dump(mode="json") for e in events[:limit]], "total": len(events)}


@app.get("/api/events/{event_id}")
async def get_event(event_id: str):
    """Get a specific event by ID."""
    for event in store.events:
        if event.id == event_id:
            return event.model_dump(mode="json")
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="Event not found")


@app.get("/api/alerts")
async def get_alerts(limit: int = 20):
    """Get alerts."""
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


@app.post("/api/analysis/trigger")
async def trigger_analysis():
    """Manually trigger AI analysis."""
    if not GEMINI_API_KEY:
        return {"error": "Gemini API key not configured"}
    summary = await analyze_events(store.events[:20])
    if summary:
        store.ai_summaries.insert(0, summary)
        store.ai_summaries = store.ai_summaries[:10]  # Keep last 10
        return summary.model_dump(mode="json")
    return {"error": "Analysis failed"}


# ──────────────────────────────────────────────
# WebSocket endpoint
# ──────────────────────────────────────────────
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
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
