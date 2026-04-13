"""
WarScope Database — SQLite persistence layer for events, alerts, summaries,
incidents, uptime history, bug reports, and source stats.

Uses aiosqlite for async access compatible with FastAPI.
DB file lives on a Fly.io persistent volume at /data/warscope.db.
"""
import json
import os
import aiosqlite
from datetime import datetime, timezone

DB_PATH = os.getenv("DB_PATH", "/data/warscope.db")

# Fallback for local dev (no /data volume)
if not os.path.isdir(os.path.dirname(DB_PATH)) and DB_PATH.startswith("/data"):
    DB_PATH = os.path.join(os.path.dirname(__file__), "warscope.db")


async def get_db() -> aiosqlite.Connection:
    """Get a database connection."""
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA journal_mode=WAL")  # better concurrent reads
    await db.execute("PRAGMA busy_timeout=5000")
    return db


async def init_db():
    """Create all tables if they don't exist."""
    db = await get_db()
    try:
        await db.executescript("""
            CREATE TABLE IF NOT EXISTS events (
                id TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                category TEXT NOT NULL,
                trust_level TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                is_breaking INTEGER DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp DESC);
            CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);

            CREATE TABLE IF NOT EXISTS alerts (
                id TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                severity TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp DESC);

            CREATE TABLE IF NOT EXISTS ai_summaries (
                id TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS incidents (
                id TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                status TEXT NOT NULL,
                started_at TEXT NOT NULL,
                resolved_at TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);

            CREATE TABLE IF NOT EXISTS uptime_history (
                service_id TEXT NOT NULL,
                date TEXT NOT NULL,
                uptime_percent REAL DEFAULT 100.0,
                had_incident INTEGER DEFAULT 0,
                status TEXT DEFAULT 'operational',
                PRIMARY KEY (service_id, date)
            );

            CREATE TABLE IF NOT EXISTS bug_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticket_id TEXT UNIQUE,
                description TEXT NOT NULL,
                page TEXT DEFAULT '',
                browser TEXT DEFAULT '',
                screenshot_url TEXT DEFAULT '',
                status TEXT DEFAULT 'pending',
                session_url TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS source_stats (
                id TEXT PRIMARY KEY,
                event_count INTEGER DEFAULT 0,
                errors INTEGER DEFAULT 0,
                successful_polls INTEGER DEFAULT 0,
                last_update TEXT,
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
        """)
        await db.commit()
        print(f"[DB] Initialized at {DB_PATH}")
    finally:
        await db.close()


# ──────────────────────────────────────────────
# Events CRUD
# ──────────────────────────────────────────────
async def save_events(events: list) -> int:
    """Save/upsert a list of TrackerEvent objects. Returns count saved."""
    if not events:
        return 0
    db = await get_db()
    try:
        count = 0
        for event in events:
            data = event.model_dump(mode="json")
            ts = data.get("timestamp", "")
            await db.execute(
                """INSERT OR REPLACE INTO events (id, data, category, trust_level, timestamp, is_breaking)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (
                    event.id,
                    json.dumps(data, ensure_ascii=False),
                    event.category.value,
                    event.trustLevel.value,
                    ts,
                    1 if event.isBreaking else 0,
                ),
            )
            count += 1
        await db.commit()
        return count
    finally:
        await db.close()


async def load_events(limit: int = 500) -> list[dict]:
    """Load events from DB, newest first. Returns list of dicts."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT data FROM events ORDER BY timestamp DESC LIMIT ?", (limit,)
        )
        rows = await cursor.fetchall()
        return [json.loads(row[0]) for row in rows]
    finally:
        await db.close()


async def count_events() -> int:
    """Get total event count in DB."""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT COUNT(*) FROM events")
        row = await cursor.fetchone()
        return row[0] if row else 0
    finally:
        await db.close()


# ──────────────────────────────────────────────
# Alerts CRUD
# ──────────────────────────────────────────────
async def save_alerts(alerts: list) -> int:
    """Save/upsert a list of Alert objects."""
    if not alerts:
        return 0
    db = await get_db()
    try:
        count = 0
        for alert in alerts:
            data = alert.model_dump(mode="json")
            await db.execute(
                """INSERT OR REPLACE INTO alerts (id, data, severity, timestamp)
                   VALUES (?, ?, ?, ?)""",
                (
                    alert.id,
                    json.dumps(data, ensure_ascii=False),
                    alert.severity.value,
                    data.get("timestamp", ""),
                ),
            )
            count += 1
        await db.commit()
        return count
    finally:
        await db.close()


async def load_alerts(limit: int = 100) -> list[dict]:
    """Load alerts from DB, newest first."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT data FROM alerts ORDER BY timestamp DESC LIMIT ?", (limit,)
        )
        rows = await cursor.fetchall()
        return [json.loads(row[0]) for row in rows]
    finally:
        await db.close()


# ──────────────────────────────────────────────
# AI Summaries CRUD
# ──────────────────────────────────────────────
async def save_ai_summary(summary) -> bool:
    """Save an AISummary object."""
    db = await get_db()
    try:
        data = summary.model_dump(mode="json")
        await db.execute(
            """INSERT OR REPLACE INTO ai_summaries (id, data, timestamp)
               VALUES (?, ?, ?)""",
            (
                summary.id,
                json.dumps(data, ensure_ascii=False),
                data.get("timestamp", ""),
            ),
        )
        await db.commit()
        return True
    finally:
        await db.close()


async def load_ai_summaries(limit: int = 10) -> list[dict]:
    """Load AI summaries from DB, newest first."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT data FROM ai_summaries ORDER BY timestamp DESC LIMIT ?", (limit,)
        )
        rows = await cursor.fetchall()
        return [json.loads(row[0]) for row in rows]
    finally:
        await db.close()


# ──────────────────────────────────────────────
# Incidents CRUD
# ──────────────────────────────────────────────
async def save_incident(incident) -> bool:
    """Save/update an Incident object."""
    db = await get_db()
    try:
        data = incident.model_dump(mode="json")
        await db.execute(
            """INSERT OR REPLACE INTO incidents (id, data, status, started_at, resolved_at)
               VALUES (?, ?, ?, ?, ?)""",
            (
                incident.id,
                json.dumps(data, ensure_ascii=False),
                incident.status.value,
                incident.started_at,
                incident.resolved_at,
            ),
        )
        await db.commit()
        return True
    finally:
        await db.close()


async def load_incidents(limit: int = 100) -> list[dict]:
    """Load incidents from DB, newest first."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT data FROM incidents ORDER BY started_at DESC LIMIT ?", (limit,)
        )
        rows = await cursor.fetchall()
        return [json.loads(row[0]) for row in rows]
    finally:
        await db.close()


# ──────────────────────────────────────────────
# Uptime History CRUD
# ──────────────────────────────────────────────
async def save_uptime_record(service_id: str, date: str, uptime_percent: float,
                              had_incident: bool, status: str):
    """Save/update a single daily uptime record."""
    db = await get_db()
    try:
        await db.execute(
            """INSERT OR REPLACE INTO uptime_history
               (service_id, date, uptime_percent, had_incident, status)
               VALUES (?, ?, ?, ?, ?)""",
            (service_id, date, uptime_percent, 1 if had_incident else 0, status),
        )
        await db.commit()
    finally:
        await db.close()


async def load_uptime_history(service_id: str, days: int = 90) -> list[dict]:
    """Load uptime history for a service, newest first."""
    db = await get_db()
    try:
        cursor = await db.execute(
            """SELECT date, uptime_percent, had_incident, status
               FROM uptime_history
               WHERE service_id = ?
               ORDER BY date DESC
               LIMIT ?""",
            (service_id, days),
        )
        rows = await cursor.fetchall()
        return [
            {
                "date": row[0],
                "uptime_percent": row[1],
                "had_incident": bool(row[2]),
                "status": row[3],
            }
            for row in reversed(rows)  # Return oldest→newest for display
        ]
    finally:
        await db.close()


async def save_uptime_history_batch(service_id: str, records: list):
    """Save multiple uptime records at once (for bulk persistence)."""
    if not records:
        return
    db = await get_db()
    try:
        for rec in records:
            date_str = rec.date if hasattr(rec, "date") else rec.get("date", "")
            uptime = rec.uptime_percent if hasattr(rec, "uptime_percent") else rec.get("uptime_percent", 100.0)
            incident = rec.had_incident if hasattr(rec, "had_incident") else rec.get("had_incident", False)
            status = rec.status if hasattr(rec, "status") else rec.get("status", "operational")
            await db.execute(
                """INSERT OR REPLACE INTO uptime_history
                   (service_id, date, uptime_percent, had_incident, status)
                   VALUES (?, ?, ?, ?, ?)""",
                (service_id, date_str, uptime, 1 if incident else 0, status),
            )
        await db.commit()
    finally:
        await db.close()


# ──────────────────────────────────────────────
# Bug Reports CRUD
# ──────────────────────────────────────────────
async def save_bug_report(report: dict) -> int:
    """Save a bug report. Returns the report ID."""
    db = await get_db()
    try:
        cursor = await db.execute(
            """INSERT INTO bug_reports
               (ticket_id, description, page, browser, screenshot_url, status, session_url, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                report.get("ticket_id", ""),
                report.get("description", ""),
                report.get("page", ""),
                report.get("browser", ""),
                report.get("screenshot_url", ""),
                report.get("status", "pending"),
                report.get("session_url"),
                report.get("created_at", datetime.now(timezone.utc).isoformat()),
            ),
        )
        await db.commit()
        return cursor.lastrowid or 0
    finally:
        await db.close()


async def load_bug_reports(limit: int = 50) -> list[dict]:
    """Load bug reports, newest first."""
    db = await get_db()
    try:
        cursor = await db.execute(
            """SELECT id, ticket_id, description, page, browser, screenshot_url,
                      status, session_url, created_at
               FROM bug_reports ORDER BY id DESC LIMIT ?""",
            (limit,),
        )
        rows = await cursor.fetchall()
        return [
            {
                "id": row[0],
                "ticket_id": row[1],
                "description": row[2],
                "page": row[3],
                "browser": row[4],
                "screenshot_url": row[5],
                "status": row[6],
                "session_url": row[7],
                "created_at": row[8],
            }
            for row in rows
        ]
    finally:
        await db.close()


# ──────────────────────────────────────────────
# Source Stats CRUD
# ──────────────────────────────────────────────
async def save_source_stats(source_status: dict):
    """Save all source stats to DB."""
    db = await get_db()
    try:
        now = datetime.now(timezone.utc).isoformat()
        for source_id, info in source_status.items():
            await db.execute(
                """INSERT OR REPLACE INTO source_stats
                   (id, event_count, errors, successful_polls, last_update, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (
                    source_id,
                    info.get("eventCount", 0),
                    info.get("errors", 0),
                    info.get("successfulPolls", 0),
                    info.get("lastUpdate"),
                    now,
                ),
            )
        await db.commit()
    finally:
        await db.close()


async def load_source_stats() -> dict[str, dict]:
    """Load source stats from DB. Returns {source_id: {eventCount, errors, ...}}."""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM source_stats")
        rows = await cursor.fetchall()
        result = {}
        for row in rows:
            result[row[0]] = {
                "eventCount": row[1],
                "errors": row[2],
                "successfulPolls": row[3],
                "lastUpdate": row[4],
            }
        return result
    finally:
        await db.close()
