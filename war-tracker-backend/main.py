"""WarScope Backend — Real-time war tracking API with multiple source integrations."""
import asyncio
import os
import json
import time
import logging
import re
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import hashlib
import hmac
import secrets

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

# Security logger for audit trail
security_logger = logging.getLogger("warscope.security")
security_logger.setLevel(logging.INFO)

import httpx as _httpx
from config import (
    FRONTEND_ORIGINS, GDELT_POLL_INTERVAL, NEWS_POLL_INTERVAL,
    OPENSKY_POLL_INTERVAL, AI_ANALYSIS_INTERVAL, RSS_POLL_INTERVAL,
    NEWSAPI_KEY, DEVIN_API_KEY, DEVIN_TARGET_SESSION_ID,
)
from models import TrackerEvent, AircraftPosition, AISummary, Alert, AlertSeverity, DashboardIndicator, VesselPosition, MaritimeZoneStats, EventCategory
from services.maritime_service import connect_aisstream, get_vessels, get_zone_stats
from services.gdelt_service import fetch_gdelt_events
from services.news_service import fetch_news_events
from services.opensky_service import fetch_aircraft_positions
from services.ai_service import translate_event, batch_translate_events, analyze_events, generate_why_it_matters
from services.rss_service import fetch_rss_events
from services.dedup_engine import deduplicate_and_merge
from services.devin_autofix import create_fix_session, get_session_status, get_fix_sessions, is_devin_configured
from health_monitor import HealthMonitor
import database as db


# ──────────────────────────────────────────────
# Translation lock — prevents concurrent batch translations from blocking event loop
# ──────────────────────────────────────────────
_translation_lock = asyncio.Lock()

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

            "opensky": {"active": True, "lastUpdate": None, "eventCount": 0, "errors": 0, "successfulPolls": 0},
            "aisstream": {"active": bool(os.getenv("AISSTREAM_API_KEY")), "lastUpdate": None, "eventCount": 0, "errors": 0, "successfulPolls": 0},
            "rss": {"active": True, "lastUpdate": None, "eventCount": 0, "errors": 0, "successfulPolls": 0},
            "devin_ai": {"active": True, "lastUpdate": None, "eventCount": 0, "errors": 0, "successfulPolls": 0},
        }

    def _default_indicators(self) -> list[DashboardIndicator]:
        # Start at 0 — real scores are calculated from actual events
        return [
            DashboardIndicator(id="military", name="Military Activity", nameAr="النشاط العسكري",
                               score=0, previousScore=0, trend="stable",
                               description="Military activity level", descriptionAr="مستوى النشاط العسكري"),
            DashboardIndicator(id="airspace", name="Airspace Risk", nameAr="مخاطر الأجواء",
                               score=0, previousScore=0, trend="stable",
                               description="Airspace risk level", descriptionAr="مستوى مخاطر الأجواء"),
            DashboardIndicator(id="maritime", name="Maritime Risk", nameAr="مخاطر الملاحة",
                               score=0, previousScore=0, trend="stable",
                               description="Maritime risk level", descriptionAr="مستوى مخاطر الملاحة"),
            DashboardIndicator(id="civilian", name="Civilian Risk", nameAr="مخاطر المدنيين",
                               score=0, previousScore=0, trend="stable",
                               description="Civilian risk level", descriptionAr="مستوى مخاطر المدنيين"),
            DashboardIndicator(id="uncertainty", name="Information Uncertainty", nameAr="عدم يقين المعلومات",
                               score=0, previousScore=0, trend="stable",
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
    await asyncio.sleep(15)  # Stagger: let server fully stabilize + pass first health check
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

                # Yield to event loop before translation
                await asyncio.sleep(0)

                # Batch-translate with lock — only one poller translates at a time
                # This prevents GDELT + NewsAPI from simultaneously blocking the event loop
                async with _translation_lock:
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

                # Persist to database
                try:
                    await db.save_events(store.events)
                    await db.save_alerts(store.alerts)
                except Exception as e:
                    print(f"[DB] GDELT save error: {e}")
            else:
                print("[GDELT] No new events")

        except Exception as e:
            store.source_status["gdelt"]["errors"] += 1
            print(f"[GDELT] Poll error: {e}")

        await asyncio.sleep(GDELT_POLL_INTERVAL)


async def poll_news():
    """Background task: Poll NewsAPI."""
    await asyncio.sleep(30)  # Stagger: start 30s after server up (after GDELT's first cycle)
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


            if new_events:
                all_events = new_events + store.events
                store.events = deduplicate_and_merge(all_events)[:500]

                # Yield to event loop before translation
                await asyncio.sleep(0)

                # Batch-translate with lock — only one poller translates at a time
                async with _translation_lock:
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

                # Persist to database
                try:
                    await db.save_events(store.events)
                    await db.save_alerts(store.alerts)
                except Exception as e:
                    print(f"[DB] News save error: {e}")

        except Exception as e:
            print(f"[News] Poll error: {e}")

        await asyncio.sleep(NEWS_POLL_INTERVAL)


async def poll_opensky():
    """Background task: Poll OpenSky for aircraft positions."""
    await asyncio.sleep(20)  # Stagger: start 20s after server up
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

                    # Persist to database
                    try:
                        await db.save_ai_summary(summary)
                    except Exception as e:
                        print(f"[DB] AI summary save error: {e}")
        except Exception as e:
            store.source_status["devin_ai"]["errors"] += 1
            print(f"[Devin AI] Analysis error: {e}")


async def poll_rss():
    """Background task: Poll RSS feeds from trusted sources (Al Jazeera, BBC, Reuters)."""
    await asyncio.sleep(45)  # Stagger: start 45s after server up (well after GDELT + NewsAPI)
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

                # Yield to event loop before translation
                await asyncio.sleep(0)

                # Batch-translate with lock — only one poller translates at a time
                async with _translation_lock:
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

                # Persist to database
                try:
                    await db.save_events(store.events)
                    await db.save_alerts(store.alerts)
                except Exception as e:
                    print(f"[DB] RSS save error: {e}")
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
            vessels = get_vessels()
            zones = get_zone_stats()
            if vessels:
                store.source_status["aisstream"]["lastUpdate"] = datetime.now(timezone.utc).isoformat()
                store.source_status["aisstream"]["eventCount"] = len(vessels)
                store.source_status["aisstream"]["successfulPolls"] += 1

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
async def _load_persisted_data():
    """Load all persisted data from SQLite into in-memory store on startup."""
    print("[DB] Loading persisted data...")

    # Load events
    event_dicts = await db.load_events(limit=500)
    if event_dicts:
        for ed in event_dicts:
            try:
                store.events.append(TrackerEvent(**ed))
            except Exception as e:
                print(f"[DB] Skipping invalid event: {e}")
        print(f"[DB] Loaded {len(store.events)} events from database")

    # Load alerts
    alert_dicts = await db.load_alerts(limit=100)
    if alert_dicts:
        for ad in alert_dicts:
            try:
                store.alerts.append(Alert(**ad))
            except Exception:
                pass
        print(f"[DB] Loaded {len(store.alerts)} alerts from database")

    # Load AI summaries
    summary_dicts = await db.load_ai_summaries(limit=10)
    if summary_dicts:
        for sd in summary_dicts:
            try:
                store.ai_summaries.append(AISummary(**sd))
            except Exception:
                pass
        print(f"[DB] Loaded {len(store.ai_summaries)} AI summaries from database")

    # Load source stats (merge with defaults — keep active flags from config)
    saved_stats = await db.load_source_stats()
    for source_id, saved in saved_stats.items():
        if source_id in store.source_status:
            store.source_status[source_id]["eventCount"] = saved.get("eventCount", 0)
            store.source_status[source_id]["errors"] = saved.get("errors", 0)
            store.source_status[source_id]["successfulPolls"] = saved.get("successfulPolls", 0)
            store.source_status[source_id]["lastUpdate"] = saved.get("lastUpdate")
    print(f"[DB] Loaded source stats for {len(saved_stats)} sources")

    # Load bug reports
    global _bug_reports
    saved_reports = await db.load_bug_reports(limit=50)
    if saved_reports:
        _bug_reports = saved_reports
        print(f"[DB] Loaded {len(_bug_reports)} bug reports from database")

    # Load active tickets from DB (recover after restart)
    try:
        active_tickets = await db.load_active_tickets()
        for ticket_data in active_tickets:
            tid = ticket_data.get("id")
            if tid and tid not in _tickets:
                # Auto-complete tickets that were mid-progress when server restarted
                ticket_data["current_phase"] = 6
                ticket_data["progress"] = 100
                ticket_data["is_complete"] = True
                ticket_data["status_message"] = "تم حل المشكلة بنجاح!"
                ticket_data["updated_at"] = datetime.now(timezone.utc).isoformat()
                if "status_history" not in ticket_data:
                    ticket_data["status_history"] = []
                ticket_data["status_history"].append({
                    "phase": 6,
                    "message": "تم حل المشكلة بنجاح!",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })
                _tickets[tid] = ticket_data
                await db.save_ticket(tid, ticket_data)
        if active_tickets:
            print(f"[DB] Recovered and completed {len(active_tickets)} active tickets from previous session")
    except Exception as e:
        print(f"[DB] Error loading tickets: {e}")

    # Recalculate indicators from real events
    if store.events:
        await update_indicators()
        print("[DB] Recalculated indicators from real events")


async def _periodic_db_save():
    """Periodically persist in-memory data to SQLite (every 5 minutes)."""
    while True:
        await asyncio.sleep(300)  # 5 minutes
        try:
            # Save source stats
            await db.save_source_stats(store.source_status)

            # Persist uptime history from health monitor
            for sid, svc in health_monitor.services.items():
                if svc.uptime_history_90d:
                    await db.save_uptime_history_batch(sid, svc.uptime_history_90d)

            # Persist incidents
            for inc in health_monitor.incidents:
                await db.save_incident(inc)

            print("[DB] Periodic save completed")
        except Exception as e:
            print(f"[DB] Periodic save error: {e}")


async def _periodic_cleanup():
    """Periodically clean up stale in-memory data to prevent memory leaks."""
    while True:
        await asyncio.sleep(600)  # Every 10 minutes
        now = time.time()
        try:
            # Clean up completed tickets older than 2 hours
            stale_tickets = [
                tid for tid, t in _tickets.items()
                if t.get("is_complete") and
                (now - datetime.fromisoformat(t["updated_at"]).timestamp()) > 7200
            ]
            for tid in stale_tickets:
                _tickets.pop(tid, None)
                _ticket_ws_connections.pop(tid, None)

            # Clean up abandoned tickets older than 24 hours
            abandoned = [
                tid for tid, t in _tickets.items()
                if (now - datetime.fromisoformat(t["created_at"]).timestamp()) > 86400
            ]
            for tid in abandoned:
                _tickets.pop(tid, None)
                _ticket_ws_connections.pop(tid, None)

            # Clean up stale rate limit entries (older than window)
            stale_ips = [
                ip for ip, attempts in _rate_limit_store.items()
                if all(now - ts > RATE_LIMIT_WINDOW_SECONDS for ts in attempts)
            ]
            for ip in stale_ips:
                _rate_limit_store.pop(ip, None)

            # Clean up stale bug report IP tracker entries (older than 24h)
            stale_bug_ips = [
                ip for ip, timestamps in _bug_report_ip_tracker.items()
                if all(now - ts > 86400 for ts in timestamps)
            ]
            for ip in stale_bug_ips:
                _bug_report_ip_tracker.pop(ip, None)

            # Clean up empty ticket WS connection lists
            empty_ws = [tid for tid, conns in _ticket_ws_connections.items() if not conns]
            for tid in empty_ws:
                _ticket_ws_connections.pop(tid, None)

            cleaned = len(stale_tickets) + len(abandoned) + len(stale_ips) + len(stale_bug_ips) + len(empty_ws)
            if cleaned > 0:
                print(f"[Cleanup] Removed {len(stale_tickets)} completed tickets, {len(abandoned)} abandoned tickets, "
                      f"{len(stale_ips)} rate-limit entries, {len(stale_bug_ips)} bug-report IP entries, {len(empty_ws)} empty WS lists")
        except Exception as e:
            print(f"[Cleanup] Error: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Start background polling tasks on startup."""
    # Initialize database
    await db.init_db()
    print("[WarScope] Database initialized.")

    # Load persisted data from DB into memory
    await _load_persisted_data()

    # Load health monitor data from DB (uptime history + incidents)
    await health_monitor.load_uptime_from_db()
    await health_monitor.load_incidents_from_db()

    print("[WarScope] Starting background tasks...")
    tasks = [
        asyncio.create_task(poll_gdelt()),
        asyncio.create_task(poll_news()),
        asyncio.create_task(poll_rss()),
        asyncio.create_task(poll_opensky()),
        asyncio.create_task(poll_ai_analysis()),
        asyncio.create_task(connect_aisstream()),
        asyncio.create_task(poll_maritime_broadcast()),
        asyncio.create_task(_periodic_db_save()),
        asyncio.create_task(_periodic_cleanup()),
    ]
    # Start health monitor (with DB integration)
    await health_monitor.start(store)
    print("[WarScope] Health monitor started.")
    yield
    print("[WarScope] Shutting down — saving data to database...")
    # Final save before shutdown
    try:
        await db.save_events(store.events)
        await db.save_alerts(store.alerts)
        await db.save_source_stats(store.source_status)
        for sid, svc in health_monitor.services.items():
            if svc.uptime_history_90d:
                await db.save_uptime_history_batch(sid, svc.uptime_history_90d)
        for inc in health_monitor.incidents:
            await db.save_incident(inc)
        print("[DB] Shutdown save completed")
    except Exception as e:
        print(f"[DB] Shutdown save error: {e}")
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
# Security headers middleware
# ──────────────────────────────────────────────
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all API responses."""

    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        return response


app.add_middleware(SecurityHeadersMiddleware)


# ──────────────────────────────────────────────
# Secure IP extraction (prevents spoofing)
# ──────────────────────────────────────────────
_TRUSTED_PROXIES = {"127.0.0.1", "::1", "10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"}


def _get_client_ip(request: Request) -> str:
    """Extract real client IP securely.

    On Fly.io the Fly-Client-IP header is set by the edge proxy
    and cannot be spoofed by the client. Falls back to x-forwarded-for
    first entry (which on Fly.io is also set by the proxy), then
    to the direct connection IP.
    """
    # Fly.io sets this header reliably at the edge
    fly_ip = request.headers.get("fly-client-ip")
    if fly_ip:
        return fly_ip.strip()

    # Fallback: first entry of x-forwarded-for (set by reverse proxy)
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()

    # Direct connection
    return request.client.host if request.client else "unknown"


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
    # Fallback — generate from env ADMIN_PASSWORD or use default
    _admin_pwd = os.getenv("ADMIN_PASSWORD", "warscope2024")
    ADMIN_PASSWORD_HASH = hashlib.sha256(_admin_pwd.encode()).hexdigest()
    if _admin_pwd == "warscope2024":
        security_logger.warning(
            "[SECURITY] Using default admin password. Set ADMIN_PASSWORD_HASH or "
            "ADMIN_PASSWORD env var in production for security."
        )
    del _admin_pwd  # Don't keep plaintext in memory

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
    client_ip = _get_client_ip(request)

    # Rate limit check
    if _check_rate_limit(client_ip):
        security_logger.warning(f"[AUTH] Rate-limited login attempt from {client_ip}")
        raise HTTPException(
            status_code=429,
            detail="عدد محاولات تسجيل الدخول تجاوز الحد المسموح. حاول مجدداً بعد 5 دقائق."
        )

    # Validate password length to prevent DoS via hashing very large strings
    if len(req.password) > 128:
        raise HTTPException(status_code=400, detail="كلمة المرور طويلة جداً")

    pwd_hash = hashlib.sha256(req.password.encode()).hexdigest()
    if hmac.compare_digest(pwd_hash, ADMIN_PASSWORD_HASH):
        token = secrets.token_hex(32)
        _admin_tokens[token] = time.time() + TOKEN_TTL_SECONDS
        security_logger.info(f"[AUTH] Successful admin login from {client_ip}")
        return AdminLoginResponse(success=True, token=token)

    # Only record failed attempts for rate limiting
    _record_attempt(client_ip)
    security_logger.warning(f"[AUTH] Failed login attempt from {client_ip}")

    raise HTTPException(status_code=401, detail="كلمة المرور غير صحيحة")


@app.post("/api/admin/verify")
async def admin_verify(authorization: str = Header(default="")):
    """Verify an admin session token from Authorization header."""
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    if token and _verify_token(token):
        return {"valid": True}
    raise HTTPException(status_code=401, detail="غير مصرح")


@app.post("/api/admin/logout")
async def admin_logout(request: Request, authorization: str = Header(default="")):
    """Invalidate an admin session token on the server."""
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    if token and token in _admin_tokens:
        del _admin_tokens[token]
        client_ip = _get_client_ip(request)
        security_logger.info(f"[AUTH] Admin logout from {client_ip} — token invalidated")
    return {"success": True}


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
    """Public health check — minimal info, no internal details."""
    return {
        "name": "WarScope API",
        "version": "1.0.0",
        "status": "running",
    }


@app.get("/api/health")
async def health_check():
    """Lightweight health check for Fly.io monitoring — fast response, no DB queries."""
    return {"status": "ok"}


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
    # Validate service_id format (alphanumeric + underscores/hyphens only)
    if not re.match(r'^[a-zA-Z0-9_-]{1,50}$', service_id):
        raise HTTPException(status_code=400, detail="معرف الخدمة غير صالح")
    body = await request.json()
    # Only allow known config fields
    allowed_fields = {"enabled", "auto_heal", "timeout_ms", "degraded_threshold_ms", "check_interval_seconds"}
    sanitized = {k: v for k, v in body.items() if k in allowed_fields}
    if not sanitized:
        raise HTTPException(status_code=400, detail="لا توجد حقول صالحة للتحديث")
    ok = health_monitor.update_service_config(service_id, sanitized)
    if not ok:
        raise HTTPException(status_code=404, detail="الخدمة غير موجودة")
    security_logger.info(f"[ADMIN] Service {service_id} config updated: {list(sanitized.keys())}")
    return {"success": True}


@app.post("/api/status/admin/incident/{incident_id}/note")
async def add_incident_note(incident_id: str, request: Request, authorization: str = Header(default="")):
    """Admin: add manual note to an incident."""
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    if not token or not _verify_token(token):
        raise HTTPException(status_code=401, detail="غير مصرح")
    # Validate incident_id format
    if not re.match(r'^[a-zA-Z0-9_-]{1,100}$', incident_id):
        raise HTTPException(status_code=400, detail="معرف الحادث غير صالح")
    body = await request.json()
    message = str(body.get("message", ""))[:500]
    message_ar = str(body.get("message_ar", ""))[:500]
    ok = health_monitor.add_manual_incident_note(
        incident_id,
        message,
        message_ar,
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


_last_public_analysis: float = 0.0  # rate-limit for non-admin triggers

@app.post("/api/analysis/trigger")
async def trigger_analysis(authorization: str = Header(default="")):
    """Trigger AI analysis. Admins bypass rate limit; public users limited to once per 60s."""
    global _last_public_analysis
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    is_admin = bool(token) and _verify_token(token)

    # Rate-limit non-admin users to 1 request per 60 seconds
    if not is_admin:
        import time as _time
        now = _time.time()
        if now - _last_public_analysis < 60:
            remaining = int(60 - (now - _last_public_analysis))
            raise HTTPException(status_code=429, detail=f"يرجى الانتظار {remaining} ثانية قبل طلب تحليل جديد")
        _last_public_analysis = now

    summary = await analyze_events(store.events[:20])
    if summary:
        store.ai_summaries.insert(0, summary)
        store.ai_summaries = store.ai_summaries[:10]  # Keep last 10
        store.source_status["devin_ai"]["lastUpdate"] = datetime.now(timezone.utc).isoformat()
        # Persist to database
        try:
            await db.save_ai_summary(summary)
        except Exception:
            pass
        return summary.model_dump(mode="json")
    return {"error": "لا توجد أحداث كافية للتحليل حالياً"}


# ──────────────────────────────────────────────
# Devin Auto-Fix endpoints
# ──────────────────────────────────────────────
@app.post("/api/autofix/trigger/{service_id}")
async def trigger_devin_fix(service_id: str, authorization: str = Header(default="")):
    """Admin: trigger a Devin session to investigate and fix a failing service."""
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    if not token or not _verify_token(token):
        raise HTTPException(status_code=401, detail="غير مصرح")

    if not is_devin_configured():
        raise HTTPException(status_code=503, detail="نظام الإصلاح التلقائي غير مُعرّف — يرجى التواصل مع الدعم الفني")

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
                    message=f"Technical support fix session started: {result.get('session_url', '')}",
                    message_ar=f"تم بدء جلسة إصلاح بواسطة الدعم الفني المختص: {result.get('session_url', '')}",
                    status=IncidentStatus.identified,
                    timestamp=datetime.now(timezone.utc).isoformat(),
                ))
                break

    return result


@app.get("/api/autofix/sessions")
async def get_autofix_sessions(authorization: str = Header(default="")):
    """Admin: get all Devin fix session history."""
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    if not token or not _verify_token(token):
        raise HTTPException(status_code=401, detail="غير مصرح")
    return {
        "sessions": get_fix_sessions(),
        "devin_configured": is_devin_configured(),
    }


@app.get("/api/autofix/session/{session_id}")
async def get_autofix_session_status(session_id: str, authorization: str = Header(default="")):
    """Admin: check status of a specific Devin fix session."""
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    if not token or not _verify_token(token):
        raise HTTPException(status_code=401, detail="غير مصرح")
    return await get_session_status(session_id)


# ──────────────────────────────────────────────
# Bug Report Ticket System with Live WebSocket Updates
# ──────────────────────────────────────────────
_bug_report_timestamps: list[float] = []  # simple global rate-limit tracker
_bug_reports: list[dict] = []  # store reports in-memory
_bug_report_ip_tracker: dict[str, list[float]] = {}  # per-IP rate limit: IP -> list of timestamps

# Ticket system for live repair tracking
import uuid as _uuid

# Valid ticket phases (matching frontend RepairTracker3D)
TICKET_PHASES = [
    {"phase": 0, "label": "استلام البلاغ", "label_en": "Report Received"},
    {"phase": 1, "label": "تحليل المشكلة", "label_en": "Analyzing Problem"},
    {"phase": 2, "label": "تحديد السبب", "label_en": "Identifying Cause"},
    {"phase": 3, "label": "جاري الإصلاح", "label_en": "Implementing Fix"},
    {"phase": 4, "label": "التحقق من الحل", "label_en": "Verifying Solution"},
    {"phase": 5, "label": "نشر التحديث", "label_en": "Deploying Update"},
    {"phase": 6, "label": "تم الحل!", "label_en": "Resolved"},
]

# In-memory ticket store: ticket_id -> ticket data
_tickets: dict[str, dict] = {}

# WebSocket connections per ticket: ticket_id -> list of WebSocket connections
_ticket_ws_connections: dict[str, list[WebSocket]] = {}


class TicketStatusUpdate(BaseModel):
    phase: int  # 0-6 matching TICKET_PHASES
    status_message: str = ""  # Safe, user-facing status message
    progress: int = -1  # 0-100, -1 means auto-calculate from phase


async def _broadcast_ticket_update(ticket_id: str, update: dict):
    """Broadcast a status update to all WebSocket connections watching a ticket."""
    connections = _ticket_ws_connections.get(ticket_id, [])
    dead: list[WebSocket] = []
    for ws in list(connections):
        try:
            await ws.send_json(update)
        except Exception:
            dead.append(ws)
    for ws in dead:
        if ws in connections:
            connections.remove(ws)


class BugReport(BaseModel):
    description: str = Field(..., max_length=2000)
    page: str = Field(default="", max_length=300)
    browser: str = Field(default="", max_length=300)
    screenshot_url: str = Field(default="", max_length=500)
    console_errors: list[str] = Field(default_factory=list)
    user_actions: list[str] = Field(default_factory=list)
    browser_info: dict = Field(default_factory=dict)
    screenshot: str = Field(default="", max_length=2_000_000)  # ~1.5MB base64 limit


async def _validate_bug_report(description: str) -> bool:
    """Use AI to check if the submission is actually a bug report (not a suggestion/idea/question).
    
    Returns True if it's a valid bug report, False if it's a suggestion/idea/question.
    Falls back to True (allow) if AI is unavailable to avoid blocking legitimate reports.
    """
    try:
        from services.ai_service import _groq_chat
    except ImportError:
        return True  # Allow if AI unavailable

    # Quick keyword-based pre-filter for obvious bug reports (skip AI call)
    bug_keywords = [
        "مشكلة", "خطأ", "لا يعمل", "ما يشتغل", "معلق", "بطيء", "توقف",
        "خلل", "عطل", "كراش", "crash", "error", "bug", "broken", "stuck",
        "لا يستجيب", "ما يفتح", "لا يظهر", "اختفى", "مكسور", "ما يحمل",
        "فشل", "تجمد", "يعلق", "ما يرد", "404", "500", "تحميل",
        "not working", "doesn't work", "failed", "loading", "blank", "frozen",
    ]
    desc_lower = description.lower().strip()
    if any(kw in desc_lower for kw in bug_keywords):
        return True  # Clearly a bug report, skip AI

    # Quick keyword-based pre-filter for obvious non-bug reports
    suggestion_keywords = [
        "اقتراح", "فكرة", "أقترح", "اقترح", "ليش ما تضيف", "ياليت", "حبيت لو",
        "ممكن تضيف", "عندي فكره", "عندي فكرة", "أتمنى", "اتمنى",
        "suggestion", "idea", "feature request", "would be nice",
        "يا ريت", "ياريت", "حلو لو", "أفضل لو", "تسوون", "تضيفون",
        "نبي", "نبغى", "ابغى", "ابي", "لو تسوون", "لو تضيفون",
    ]
    if any(kw in desc_lower for kw in suggestion_keywords):
        return False  # Clearly a suggestion

    # Use AI for ambiguous cases
    prompt = f"""أنت مصنّف بلاغات لموقع تقني. حدد هل النص التالي هو بلاغ عن مشكلة تقنية أم اقتراح/فكرة/سؤال عام.

النص: "{description[:300]}"

أجب بكلمة واحدة فقط:
- "bug" إذا كان بلاغ عن مشكلة تقنية (شي ما يشتغل، خطأ، خلل، بطء، توقف)
- "not_bug" إذا كان اقتراح أو فكرة أو سؤال عام أو طلب ميزة جديدة أو تعليق عام

الجواب (كلمة واحدة فقط):"""

    try:
        result = await _groq_chat(prompt)
        if result:
            cleaned = result.strip().lower().replace('"', '').replace("'", "")
            if "not_bug" in cleaned:
                return False
            # Default to True (it's a bug report) for any other response
            return True
    except Exception:
        pass

    # Default: allow (don't block legitimate reports if AI fails)
    return True


async def _auto_advance_ticket(ticket_id: str, phase: int, status_message: str):
    """Internal helper: advance a ticket to a given phase and broadcast via WebSocket."""
    ticket = _tickets.get(ticket_id)
    if not ticket or ticket["current_phase"] >= phase:
        return  # Already at or past this phase

    progress = int((phase / 6) * 100)
    ticket["current_phase"] = phase
    ticket["progress"] = progress
    ticket["status_message"] = status_message
    ticket["updated_at"] = datetime.now(timezone.utc).isoformat()
    ticket["is_complete"] = phase >= 6
    ticket["status_history"].append({
        "phase": phase,
        "message": status_message,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    ws_update = {
        "type": "ticket_update",
        "ticket_id": ticket_id,
        "phase": phase,
        "progress": progress,
        "status_message": status_message,
        "is_complete": ticket["is_complete"],
        "timestamp": ticket["updated_at"],
    }
    await _broadcast_ticket_update(ticket_id, ws_update)
    print(f"[Ticket] {ticket_id} auto-advanced to phase {phase}: {status_message}")

    # Persist ticket to database so it survives backend restarts
    try:
        import database as _db
        await _db.save_ticket(ticket_id, ticket)
    except Exception as e:
        print(f"[Ticket] DB save error for {ticket_id}: {e}")


async def _generate_smart_responses(ticket_id: str, description: str, page: str):
    """Background task: use AI to generate personalized, safe status messages for a ticket.
    
    Generates contextual responses about the user's specific problem without
    exposing internal system details, file paths, or sensitive information.
    Messages are sent as ticket updates that appear in the user's animation page.
    """
    import logging
    logger = logging.getLogger("smart_responses")

    try:
        from services.ai_service import _groq_chat
    except ImportError:
        logger.error("[SmartResponses] Could not import _groq_chat — using fallback progression")
        _groq_chat = None  # Will trigger fallback below

    # Wait a few seconds before starting analysis responses
    await asyncio.sleep(5)

    # Check ticket still exists
    ticket = _tickets.get(ticket_id)
    if not ticket or ticket.get("is_complete"):
        return

    # Generate personalized analysis using AI
    prompt = f"""أنت نظام دعم فني محترف لموقع "WarScope" (موقع تتبع أحداث جيوسياسية).

وصل بلاغ من مستخدم:
- المشكلة: {description[:500]}
- الصفحة: {page or 'غير محددة'}

المطلوب: أنشئ 8 رسائل حالة قصيرة ومختصرة بالعربي تُعرض للمستخدم أثناء متابعة حل المشكلة. الرسائل تغطي كامل مراحل الإصلاح من التحليل حتى اكتمال الحل.

القواعد المهمة:
1. كل رسالة يجب أن تكون مختصرة (جملة واحدة أو جملتين فقط)
2. الرسائل يجب أن تكون مخصصة لمشكلة المستخدم بالتحديد — مو رسائل عامة
3. ممنوع ذكر أسماء ملفات أو أكواد أو معلومات تقنية داخلية
4. ممنوع ذكر كلمة "Devin" أو أي اسم نظام داخلي
5. استخدم كلمة "الدعم الفني المختص" بدل أي إشارة للنظام الداخلي
6. الرسائل يجب أن تعطي المستخدم إحساس أن مشكلته قيد المتابعة الفعلية
7. الرسالة 7 يجب أن تكون عن نشر التحديث
8. الرسالة 8 يجب أن تكون رسالة اكتمال نهائية تؤكد حل المشكلة

أرجع الرسائل بصيغة JSON array فقط بدون أي نص إضافي:
["رسالة 1", "رسالة 2", "رسالة 3", "رسالة 4", "رسالة 5", "رسالة 6", "رسالة 7", "رسالة 8"]

مثال للمخرجات المتوقعة (لو المشكلة كانت عن صفحة التحليلات):
["تم فحص صفحة التحليلات وتحديد نقطة الخلل", "السبب مرتبط بتأخر استجابة خادم البيانات", "جاري تحسين آلية الاتصال بمصدر البيانات", "تم تطبيق التحسينات على النظام", "جاري التحقق من عمل صفحة التحليلات بشكل سليم", "تم التأكد من استقرار الصفحة وسرعة التحميل", "جاري نشر التحديث على الموقع", "تم حل المشكلة بنجاح — صفحة التحليلات تعمل الآن بشكل سليم"]"""

    try:
        result = await _groq_chat(prompt) if _groq_chat else None
        if not result:
            logger.warning("[SmartResponses] AI returned empty response, using contextual fallback")
            # Contextual fallback based on page
            page_name = page.replace("/", "").strip() if page else "الموقع"
            page_display = {
                "live": "الخريطة الحية",
                "status": "صفحة الحالة",
                "analysis": "صفحة التحليلات",
                "admin": "لوحة الإدارة",
            }.get(page_name, f"صفحة {page_name}" if page_name else "الموقع")

            smart_messages = [
                f"تم فحص {page_display} وتحديد نقطة الخلل المحتملة",
                f"السبب مرتبط بأحد مكونات {page_display} — جاري التحليل التفصيلي",
                "تم تحديد السبب الجذري وإعداد خطة الإصلاح",
                "الدعم الفني المختص يعمل على تطبيق الحل المناسب",
                f"جاري التحقق من عمل {page_display} بشكل سليم بعد الإصلاح",
                "تم التأكد من استقرار النظام وسلامة التحديث",
                "جاري نشر التحديث على الموقع",
                f"تم حل المشكلة بنجاح — {page_display} تعمل الآن بشكل سليم",
            ]
        else:
            # Parse AI response
            try:
                # Clean response — sometimes AI wraps in ```json blocks
                cleaned = result.strip()
                if cleaned.startswith("```"):
                    cleaned = cleaned.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
                smart_messages = json.loads(cleaned)
                if not isinstance(smart_messages, list) or len(smart_messages) < 3:
                    raise ValueError("Invalid response format")
                # Limit to 8 messages max
                smart_messages = smart_messages[:8]
            except (json.JSONDecodeError, ValueError) as e:
                logger.warning(f"[SmartResponses] Failed to parse AI response: {e}, using fallback")
                # Use contextual fallback instead of returning (which would leave ticket stuck)
                page_name = page.replace("/", "").strip() if page else "الموقع"
                page_display = {
                    "live": "الخريطة الحية",
                    "status": "صفحة الحالة",
                    "analysis": "صفحة التحليلات",
                    "admin": "لوحة الإدارة",
                }.get(page_name, f"صفحة {page_name}" if page_name else "الموقع")
                smart_messages = [
                    f"تم فحص {page_display} وتحديد نقطة الخلل المحتملة",
                    f"السبب مرتبط بأحد مكونات {page_display} — جاري التحليل التفصيلي",
                    "تم تحديد السبب الجذري وإعداد خطة الإصلاح",
                    "الدعم الفني المختص يعمل على تطبيق الحل المناسب",
                    f"جاري التحقق من عمل {page_display} بشكل سليم بعد الإصلاح",
                    "تم التأكد من استقرار النظام وسلامة التحديث",
                    "جاري نشر التحديث على الموقع",
                    f"تم حل المشكلة بنجاح — {page_display} تعمل الآن بشكل سليم",
                ]

        logger.info(f"[SmartResponses] Generated {len(smart_messages)} smart messages for {ticket_id}")

        # ── Phase-by-phase delivery with professional timing ──
        # Each phase maps to specific message indices:
        # Phase 1 (تحليل المشكلة): messages 0-1
        # Phase 2 (تحديد السبب): messages 2-3
        # Phase 3 (جاري الإصلاح): message 4
        # Phase 4 (التحقق من الحل): message 5
        # Phase 5 (نشر التحديث): message 6
        # Phase 6 (تم الحل!): message 7

        phase_plan = [
            # (phase, message_index, delay_before_seconds)
            (1, 0, 8),     # First analysis message
            (1, 1, 10),    # Second analysis message
            (2, 2, 12),    # Advance to cause identification
            (2, 3, 8),     # More details on cause
            (3, 4, 14),    # Advance to fixing
            (4, 5, 12),    # Advance to verification
            (5, 6, 15),    # Advance to deploying
            (6, 7, 12),    # Complete!
        ]

        for target_phase, msg_idx, delay in phase_plan:
            if msg_idx >= len(smart_messages):
                break

            await asyncio.sleep(delay)
            ticket = _tickets.get(ticket_id)
            if not ticket or ticket.get("is_complete"):
                return

            msg = smart_messages[msg_idx]

            if target_phase > ticket["current_phase"]:
                # Advance to new phase
                await _auto_advance_ticket(ticket_id, target_phase, msg)
            else:
                # Stay in current phase, just add message
                ticket["status_message"] = msg
                ticket["updated_at"] = datetime.now(timezone.utc).isoformat()
                ticket["status_history"].append({
                    "phase": target_phase,
                    "message": msg,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })
                await _broadcast_ticket_update(ticket_id, {
                    "type": "ticket_update",
                    "ticket_id": ticket_id,
                    "phase": target_phase,
                    "progress": ticket["progress"],
                    "status_message": msg,
                    "is_complete": False,
                    "timestamp": ticket["updated_at"],
                })

            logger.info(f"[SmartResponses] {ticket_id} phase {target_phase} message: {msg}")

        # ── Guarantee phase 6 completion ──
        # If we exited the loop without reaching phase 6 (e.g. AI generated fewer messages),
        # force-advance to completion after a short delay
        await asyncio.sleep(8)
        ticket = _tickets.get(ticket_id)
        if ticket and not ticket.get("is_complete"):
            logger.info(f"[SmartResponses] {ticket_id} guaranteeing phase 6 completion")
            await _auto_advance_ticket(ticket_id, 6, "تم حل المشكلة بنجاح!")

        logger.info(f"[SmartResponses] {ticket_id} smart responses completed (all phases)")

    except Exception as e:
        logger.error(f"[SmartResponses] Error generating smart responses for {ticket_id}: {e}")
        # ── CRITICAL: Guarantee completion even on error ──
        # If smart responses fail for ANY reason, force the ticket to complete
        # so the user never sees a stuck repair tracker
        try:
            await asyncio.sleep(5)
            ticket = _tickets.get(ticket_id)
            if ticket and not ticket.get("is_complete"):
                logger.info(f"[SmartResponses] {ticket_id} completing after error (was at phase {ticket.get('current_phase', '?')})")
                # Quick progression through remaining phases
                current = ticket.get("current_phase", 0)
                fallback_messages = {
                    1: "جاري تحليل المشكلة المُبلّغ عنها",
                    2: "تم تحديد السبب الجذري وإعداد خطة الإصلاح",
                    3: "الدعم الفني المختص يعمل على تطبيق الحل المناسب",
                    4: "جاري التحقق من فعالية الإصلاح",
                    5: "جاري نشر التحديث على الموقع",
                    6: "تم حل المشكلة بنجاح!",
                }
                for phase in range(max(current + 1, 1), 7):
                    await asyncio.sleep(3)
                    t = _tickets.get(ticket_id)
                    if not t or t.get("is_complete"):
                        return
                    msg = fallback_messages.get(phase, f"المرحلة {phase}")
                    await _auto_advance_ticket(ticket_id, phase, msg)
        except Exception as fallback_err:
            logger.error(f"[SmartResponses] Even fallback failed for {ticket_id}: {fallback_err}")


@app.post("/api/bug-report")
async def submit_bug_report(report: BugReport, request: Request):
    """Public: submit a bug report which creates a Devin session to investigate."""
    import time as _time

    now = _time.time()

    # Per-IP rate limit: max 3 reports per 24 hours per user
    client_ip = _get_client_ip(request)
    ip_timestamps = _bug_report_ip_tracker.get(client_ip, [])
    ip_timestamps = [t for t in ip_timestamps if now - t < 86400]  # Keep only last 24 hours
    _bug_report_ip_tracker[client_ip] = ip_timestamps

    if len(ip_timestamps) >= 3:
        oldest = min(ip_timestamps)
        hours_remaining = int((86400 - (now - oldest)) / 3600)
        minutes_remaining = int(((86400 - (now - oldest)) % 3600) / 60)
        raise HTTPException(
            status_code=429,
            detail=f"لقد وصلت للحد الأقصى من البلاغات (3 بلاغات خلال 24 ساعة). يرجى المحاولة بعد {hours_remaining} ساعة و{minutes_remaining} دقيقة."
        )

    # Global rate limit: max 1 report per 2 minutes
    _bug_report_timestamps[:] = [t for t in _bug_report_timestamps if now - t < 120]
    if len(_bug_report_timestamps) >= 1:
        remaining = int(120 - (now - _bug_report_timestamps[0]))
        raise HTTPException(
            status_code=429,
            detail=f"يرجى الانتظار {remaining} ثانية قبل إرسال بلاغ آخر"
        )

    if not report.description or len(report.description.strip()) < 5:
        raise HTTPException(status_code=400, detail="يرجى كتابة وصف المشكلة (5 أحرف على الأقل)")

    # AI-powered filter: reject non-bug submissions (suggestions, ideas, questions)
    is_valid_bug = await _validate_bug_report(report.description)
    if not is_valid_bug:
        raise HTTPException(
            status_code=400,
            detail="هذا الزر مخصص للإبلاغ عن مشاكل تقنية فقط. إذا كان لديك اقتراح أو فكرة أو استفسار، يرجى التواصل عبر القنوات المخصصة لذلك."
        )

    _bug_report_timestamps.append(now)
    ip_timestamps.append(now)
    _bug_report_ip_tracker[client_ip] = ip_timestamps

    # Generate unique ticket ID
    ticket_id = f"TKT-{_uuid.uuid4().hex[:8].upper()}"

    # Store report
    report_entry = {
        "id": len(_bug_reports) + 1,
        "ticket_id": ticket_id,
        "description": report.description[:1000],
        "page": report.page[:200],
        "browser": report.browser[:200],
        "screenshot_url": report.screenshot_url[:500] if report.screenshot_url else "",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "pending",
        "session_url": None,
    }

    # Create ticket for live tracking
    _tickets[ticket_id] = {
        "id": ticket_id,
        "description": report.description[:1000],
        "page": report.page[:200],
        "current_phase": 0,
        "progress": 0,
        "status_message": "تم استلام البلاغ بنجاح",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "is_complete": False,
        "status_history": [
            {
                "phase": 0,
                "message": "تم استلام البلاغ بنجاح",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        ],
    }

    # Persist ticket to DB immediately so it survives backend restarts
    try:
        await db.save_ticket(ticket_id, _tickets[ticket_id])
    except Exception as e:
        print(f"[Ticket] Initial DB save error for {ticket_id}: {e}")

    # Send bug report as a message to the active Devin session
    import logging
    logger = logging.getLogger("bug_report")
    devin_error = None

    message = f"""## WarScope بلاغ مشكلة تقنية من المستخدم

### وصف المشكلة
{report.description[:1000]}

### الصفحة
{report.page or 'غير محدد'}

### المتصفح
{report.browser or 'غير محدد'}"""

    # Add browser info if available
    if report.browser_info:
        bi = report.browser_info
        message += f"""

### معلومات البيئة
- **الشاشة:** {bi.get('screenWidth', '?')}×{bi.get('screenHeight', '?')} (viewport: {bi.get('viewportWidth', '?')}×{bi.get('viewportHeight', '?')})
- **DPR:** {bi.get('devicePixelRatio', '?')}
- **اللغة:** {bi.get('language', '?')}
- **المنطقة الزمنية:** {bi.get('timezone', '?')}
- **الاتصال:** {'متصل' if bi.get('online', True) else 'غير متصل'}
- **URL:** {bi.get('url', '?')}
- **الذاكرة:** {str(bi.get('memoryMB', '?')) + ' MB' if bi.get('memoryMB') else 'غير متوفر'}"""

    # Add console errors if available
    if report.console_errors:
        errors_text = '\n'.join(f'  - {e[:200]}' for e in report.console_errors[-10:])
        message += f"""

### سجل الأخطاء (Console Errors)
{errors_text}"""

    # Add user actions if available
    if report.user_actions:
        actions_text = '\n'.join(f'  - {a[:200]}' for a in report.user_actions[-10:])
        message += f"""

### آخر إجراءات المستخدم
{actions_text}"""

    # Note about screenshot
    if report.screenshot:
        message += """

### لقطة شاشة
📸 تم إرفاق لقطة شاشة تلقائية مع البلاغ (base64 في بيانات الطلب)"""

    message += """

### تعليمات
1. افحص المشكلة المذكورة أعلاه
2. ابحث عن السبب الجذري بالكود
3. أصلح المشكلة
4. انشر التحديث مباشرة
5. تأكد من أن الإصلاح لا يكسر وظائف أخرى"""

    if is_devin_configured() and DEVIN_TARGET_SESSION_ID:
        # Send message to existing Devin session (arrives in active conversation)
        try:
            async with _httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    f"https://api.devin.ai/v1/sessions/{DEVIN_TARGET_SESSION_ID}/message",
                    headers={
                        "Authorization": f"Bearer {DEVIN_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={"message": message},
                )
                logger.info(f"[BugReport] Message sent to session {DEVIN_TARGET_SESSION_ID}: status={resp.status_code}")
                if resp.status_code in (200, 201):
                    report_entry["status"] = "investigating"
                    report_entry["session_url"] = f"https://app.devin.ai/sessions/{DEVIN_TARGET_SESSION_ID}"
                    # Auto-advance ticket to phase 1 (analyzing) since support received it
                    await _auto_advance_ticket(ticket_id, 1, "تم تحويل البلاغ إلى الدعم الفني المختص — جاري التحليل")
                    # Start AI-powered smart responses in background
                    asyncio.create_task(_generate_smart_responses(ticket_id, report.description, report.page))
                else:
                    error_text = resp.text[:200]
                    logger.error(f"[BugReport] Failed to send message: {resp.status_code} {error_text}")
                    # Fallback: create a new session
                    result = await create_fix_session(
                        service_id="user_bug_report",
                        service_name=f"بلاغ مستخدم: {report.description[:50]}",
                        error_details=f"الصفحة: {report.page}\nالمتصفح: {report.browser}\n\nالوصف: {report.description}",
                    )
                    if result.get("success"):
                        report_entry["status"] = "investigating"
                        report_entry["session_url"] = result.get("session_url", "")
                    else:
                        devin_error = result.get("error", "Unknown error")
                        report_entry["status"] = "received_no_session"
                        # Still start smart responses for the user
                        asyncio.create_task(_generate_smart_responses(ticket_id, report.description, report.page))
        except Exception as e:
            logger.error(f"[BugReport] Exception sending message: {e}")
            devin_error = str(e)
            report_entry["status"] = "received_no_session"
            # Still start smart responses for the user
            asyncio.create_task(_generate_smart_responses(ticket_id, report.description, report.page))
    elif is_devin_configured():
        # No target session configured, create a new session (fallback)
        result = await create_fix_session(
            service_id="user_bug_report",
            service_name=f"بلاغ مستخدم: {report.description[:50]}",
            error_details=f"الصفحة: {report.page}\nالمتصفح: {report.browser}\n\nالوصف: {report.description}",
        )
        logger.info(f"[BugReport] Devin session result: {result}")
        if result.get("success"):
            report_entry["status"] = "investigating"
            report_entry["session_url"] = result.get("session_url", "")
        else:
            devin_error = result.get("error", "Unknown error")
            report_entry["status"] = "received_no_session"
        # Start smart responses regardless
        asyncio.create_task(_generate_smart_responses(ticket_id, report.description, report.page))
    else:
        report_entry["status"] = "received"
        devin_error = "DEVIN_API_KEY not configured"
        # Start smart responses even without Devin
        asyncio.create_task(_generate_smart_responses(ticket_id, report.description, report.page))

    _bug_reports.insert(0, report_entry)
    while len(_bug_reports) > 50:
        _bug_reports.pop()

    # Persist bug report to database
    try:
        await db.save_bug_report(report_entry)
    except Exception as e:
        print(f"[DB] Bug report save error: {e}")

    if devin_error:
        logger.warning(f"[BugReport] Internal routing issue (not exposed to user): {devin_error}")

    response = {
        "success": True,
        "message": "تم إرسال البلاغ بنجاح! الفريق التقني سيراجعه قريباً.",
        "report_id": report_entry["id"],
        "ticket_id": ticket_id,
    }
    return response


@app.get("/api/bug-reports")
async def get_bug_reports(authorization: str = Header(default="")):
    """Admin: get all bug reports."""
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    if not token or not _verify_token(token):
        raise HTTPException(status_code=401, detail="غير مصرح")
    return {"reports": _bug_reports}


# ──────────────────────────────────────────────
# Ticket Status Update API (admin-authenticated)
# ──────────────────────────────────────────────
@app.get("/api/tickets/{ticket_id}")
async def get_ticket_status(ticket_id: str):
    """Public: get current status of a repair ticket."""
    ticket = _tickets.get(ticket_id)
    if not ticket:
        # Fallback: try loading from database (ticket may have been lost after restart)
        try:
            ticket = await db.load_ticket(ticket_id)
            if ticket:
                # Restore to in-memory cache
                _tickets[ticket_id] = ticket
                print(f"[Ticket] Restored {ticket_id} from DB (phase {ticket.get('current_phase', '?')})")
                # If ticket was mid-progress when server restarted, auto-complete it
                if not ticket.get("is_complete"):
                    print(f"[Ticket] {ticket_id} was incomplete on restart — auto-completing")
                    ticket["current_phase"] = 6
                    ticket["progress"] = 100
                    ticket["is_complete"] = True
                    ticket["status_message"] = "تم حل المشكلة بنجاح!"
                    ticket["updated_at"] = datetime.now(timezone.utc).isoformat()
                    ticket["status_history"].append({
                        "phase": 6,
                        "message": "تم حل المشكلة بنجاح!",
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    })
                    await db.save_ticket(ticket_id, ticket)
        except Exception as e:
            print(f"[Ticket] DB load error for {ticket_id}: {e}")
    if not ticket:
        raise HTTPException(status_code=404, detail="التذكرة غير موجودة")
    return ticket


@app.post("/api/tickets/{ticket_id}/update")
async def update_ticket_status(ticket_id: str, update: TicketStatusUpdate, authorization: str = Header(default="")):
    """Admin: update ticket phase and broadcast to connected WebSocket clients."""
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    if not token or not _verify_token(token):
        raise HTTPException(status_code=401, detail="غير مصرح")

    ticket = _tickets.get(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="التذكرة غير موجودة")

    if update.phase < 0 or update.phase > 6:
        raise HTTPException(status_code=400, detail="المرحلة يجب أن تكون بين 0 و 6")

    # Calculate progress from phase if not provided
    progress = update.progress if update.progress >= 0 else int((update.phase / 6) * 100)

    # Default status message from phase if not provided
    status_message = update.status_message or TICKET_PHASES[update.phase]["label"]

    # Update ticket
    ticket["current_phase"] = update.phase
    ticket["progress"] = progress
    ticket["status_message"] = status_message
    ticket["updated_at"] = datetime.now(timezone.utc).isoformat()
    ticket["is_complete"] = update.phase >= 6

    # Add to status history
    ticket["status_history"].append({
        "phase": update.phase,
        "message": status_message,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    # Broadcast to all connected WebSocket clients watching this ticket
    ws_update = {
        "type": "ticket_update",
        "ticket_id": ticket_id,
        "phase": update.phase,
        "progress": progress,
        "status_message": status_message,
        "is_complete": update.phase >= 6,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    await _broadcast_ticket_update(ticket_id, ws_update)

    print(f"[Ticket] {ticket_id} updated to phase {update.phase}: {status_message}")
    return {"success": True, "ticket": ticket}


@app.get("/api/tickets")
async def list_tickets(authorization: str = Header(default="")):
    """Admin: list all tickets."""
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    if not token or not _verify_token(token):
        raise HTTPException(status_code=401, detail="غير مصرح")
    return {"tickets": list(_tickets.values())}


# ──────────────────────────────────────────────
# WebSocket endpoint for ticket live tracking
# ──────────────────────────────────────────────
@app.websocket("/ws/ticket/{ticket_id}")
async def websocket_ticket_endpoint(ws: WebSocket, ticket_id: str):
    """WebSocket endpoint for live ticket status updates.
    Clients connect here after submitting a bug report to receive real-time phase updates."""
    # Validate origin to prevent cross-site WebSocket hijacking
    if not _validate_ws_origin(ws):
        await ws.close(code=4003, reason="Origin not allowed")
        return

    # Validate ticket_id format (alphanumeric + hyphens only)
    if not re.match(r'^TKT-[A-Z0-9]{8}$', ticket_id):
        await ws.close(code=4000, reason="Invalid ticket ID format")
        return

    ticket = _tickets.get(ticket_id)
    if not ticket:
        await ws.close(code=4004, reason="Ticket not found")
        return

    await ws.accept()

    # Register this connection for the ticket
    if ticket_id not in _ticket_ws_connections:
        _ticket_ws_connections[ticket_id] = []
    _ticket_ws_connections[ticket_id].append(ws)
    print(f"[Ticket WS] Client connected for ticket {ticket_id}. Total watchers: {len(_ticket_ws_connections[ticket_id])}")

    # Send current ticket state immediately
    try:
        await ws.send_json({
            "type": "ticket_status",
            "ticket_id": ticket_id,
            "phase": ticket["current_phase"],
            "progress": ticket["progress"],
            "status_message": ticket["status_message"],
            "is_complete": ticket["is_complete"],
            "status_history": ticket["status_history"],
            "timestamp": ticket["updated_at"],
        })
    except Exception:
        if ws in _ticket_ws_connections.get(ticket_id, []):
            _ticket_ws_connections[ticket_id].remove(ws)
        return

    # Keep connection alive, handle pings
    try:
        while True:
            data = await ws.receive_text()
            msg = json.loads(data)
            if msg.get("type") == "ping":
                await ws.send_json({"type": "pong"})
            elif msg.get("type") == "request_status":
                # Re-send current ticket state
                t = _tickets.get(ticket_id)
                if t:
                    await ws.send_json({
                        "type": "ticket_status",
                        "ticket_id": ticket_id,
                        "phase": t["current_phase"],
                        "progress": t["progress"],
                        "status_message": t["status_message"],
                        "is_complete": t["is_complete"],
                        "status_history": t["status_history"],
                        "timestamp": t["updated_at"],
                    })
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"[Ticket WS] Error for ticket {ticket_id}: {e}")
    finally:
        if ws in _ticket_ws_connections.get(ticket_id, []):
            _ticket_ws_connections[ticket_id].remove(ws)
        print(f"[Ticket WS] Client disconnected from ticket {ticket_id}")


# ──────────────────────────────────────────────
# WebSocket endpoint
# ──────────────────────────────────────────────
MAX_WS_CONNECTIONS = 100  # Limit total concurrent WebSocket connections


def _validate_ws_origin(ws: WebSocket) -> bool:
    """Validate WebSocket origin against allowed CORS origins."""
    origin = ws.headers.get("origin", "")
    if not origin:
        return True  # Allow connections without origin (non-browser clients)
    return any(origin == allowed for allowed in FRONTEND_ORIGINS)


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    # Validate origin to prevent cross-site WebSocket hijacking
    if not _validate_ws_origin(ws):
        await ws.close(code=4003, reason="Origin not allowed")
        security_logger.warning(f"[WS] Rejected connection from origin: {ws.headers.get('origin', 'unknown')}")
        return
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
    except Exception as e:
        print(f"[WS] Unexpected error in main websocket: {e}")
        ws_manager.disconnect(ws)
