"""Lightweight SQLite-backed persistence for admin tokens and repair tickets.

Both stores are critical for end-user experience:

* Admin tokens: without persistence every backend restart forces every
  logged-in admin to re-authenticate, and any in-flight admin action
  (incident notes, service config, manual health checks) returns 401.

* Repair tickets (RepairTracker3D): without persistence a user who just
  submitted a bug report loses their live-tracking modal after a
  restart — the `/api/tickets/{id}` GET returns 404 and the
  `/ws/ticket/{id}` WebSocket closes with "Ticket not found".

Design:

* SQLite file path is configurable via ``PERSISTENCE_DB_PATH`` (default
  ``warscope_state.db`` next to the backend process). All IO is
  synchronous — the writes are small and infrequent — and wrapped in
  ``try/except`` so that any filesystem/permission error silently falls
  back to pure in-memory operation. The caller still gets correct
  semantics; only the "survive restart" guarantee is lost.

* No schema migration machinery: the tables are created on first use
  with ``CREATE TABLE IF NOT EXISTS`` and we only add columns via
  additive migrations if absolutely required. For now the schema is
  stable.
"""
from __future__ import annotations

import json
import logging
import os
import sqlite3
import threading
import time
from typing import Optional


logger = logging.getLogger("warscope.persistence")

_DB_PATH = os.getenv("PERSISTENCE_DB_PATH", "warscope_state.db")
_lock = threading.Lock()
_conn: Optional[sqlite3.Connection] = None
_disabled = False  # flips to True if the database is unusable


def _get_conn() -> Optional[sqlite3.Connection]:
    global _conn, _disabled
    if _disabled:
        return None
    if _conn is not None:
        return _conn
    try:
        _conn = sqlite3.connect(_DB_PATH, check_same_thread=False, timeout=5.0)
        _conn.execute("PRAGMA journal_mode=WAL")
        _conn.execute("PRAGMA synchronous=NORMAL")
        _conn.execute(
            """
            CREATE TABLE IF NOT EXISTS admin_tokens (
                token TEXT PRIMARY KEY,
                expires_at REAL NOT NULL
            )
            """
        )
        _conn.execute(
            """
            CREATE TABLE IF NOT EXISTS tickets (
                id TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                updated_at REAL NOT NULL
            )
            """
        )
        _conn.commit()
        return _conn
    except Exception as exc:  # noqa: BLE001
        logger.warning("persistence disabled (falling back to in-memory): %s", exc)
        _disabled = True
        _conn = None
        return None


# ──────────────────────────────────────────────
# Admin tokens
# ──────────────────────────────────────────────
def load_tokens() -> dict[str, float]:
    """Load non-expired tokens from disk."""
    conn = _get_conn()
    if conn is None:
        return {}
    now = time.time()
    try:
        with _lock:
            cur = conn.execute(
                "SELECT token, expires_at FROM admin_tokens WHERE expires_at > ?",
                (now,),
            )
            rows = cur.fetchall()
        return {token: expires for token, expires in rows}
    except Exception as exc:  # noqa: BLE001
        logger.warning("failed to load tokens: %s", exc)
        return {}


def save_token(token: str, expires_at: float) -> None:
    conn = _get_conn()
    if conn is None:
        return
    try:
        with _lock:
            conn.execute(
                "INSERT OR REPLACE INTO admin_tokens (token, expires_at) VALUES (?, ?)",
                (token, expires_at),
            )
            conn.commit()
    except Exception as exc:  # noqa: BLE001
        logger.warning("failed to persist token: %s", exc)


def delete_token(token: str) -> None:
    conn = _get_conn()
    if conn is None:
        return
    try:
        with _lock:
            conn.execute("DELETE FROM admin_tokens WHERE token = ?", (token,))
            conn.commit()
    except Exception as exc:  # noqa: BLE001
        logger.warning("failed to delete token: %s", exc)


def purge_expired_tokens(now: Optional[float] = None) -> None:
    conn = _get_conn()
    if conn is None:
        return
    cutoff = now if now is not None else time.time()
    try:
        with _lock:
            conn.execute("DELETE FROM admin_tokens WHERE expires_at <= ?", (cutoff,))
            conn.commit()
    except Exception as exc:  # noqa: BLE001
        logger.warning("failed to purge expired tokens: %s", exc)


# ──────────────────────────────────────────────
# Tickets
# ──────────────────────────────────────────────
def load_tickets() -> dict[str, dict]:
    conn = _get_conn()
    if conn is None:
        return {}
    try:
        with _lock:
            cur = conn.execute("SELECT id, data FROM tickets ORDER BY updated_at DESC LIMIT 500")
            rows = cur.fetchall()
        out: dict[str, dict] = {}
        for ticket_id, data in rows:
            try:
                out[ticket_id] = json.loads(data)
            except json.JSONDecodeError:
                continue
        return out
    except Exception as exc:  # noqa: BLE001
        logger.warning("failed to load tickets: %s", exc)
        return {}


def save_ticket(ticket_id: str, ticket: dict) -> None:
    conn = _get_conn()
    if conn is None:
        return
    try:
        payload = json.dumps(ticket, ensure_ascii=False)
    except (TypeError, ValueError) as exc:
        logger.warning("ticket %s not JSON-serializable: %s", ticket_id, exc)
        return
    try:
        with _lock:
            conn.execute(
                "INSERT OR REPLACE INTO tickets (id, data, updated_at) VALUES (?, ?, ?)",
                (ticket_id, payload, time.time()),
            )
            conn.commit()
    except Exception as exc:  # noqa: BLE001
        logger.warning("failed to persist ticket %s: %s", ticket_id, exc)


def delete_ticket(ticket_id: str) -> None:
    conn = _get_conn()
    if conn is None:
        return
    try:
        with _lock:
            conn.execute("DELETE FROM tickets WHERE id = ?", (ticket_id,))
            conn.commit()
    except Exception as exc:  # noqa: BLE001
        logger.warning("failed to delete ticket %s: %s", ticket_id, exc)
