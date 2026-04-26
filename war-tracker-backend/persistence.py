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

# Hard cap on the number of ticket rows kept on disk. The in-memory
# ``_tickets`` cache is already capped (see ``main.py::_TICKET_HARD_CAP``)
# but without a parallel cap on the SQLite ``tickets`` table the file
# grows by one row for every ``/api/bug-report`` submission and never
# shrinks. The endpoint is anonymous (only IP-rate-limited) so a sustained
# spam burst could fill the volume; even normal load over months would
# bloat the WAL and slow ``load_tickets`` on cold start. We prune on
# every ``save_ticket`` so the working set on disk tracks the working set
# in memory.
_TICKET_DISK_CAP = 1000


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
                expires_at REAL NOT NULL,
                password_hash TEXT NOT NULL DEFAULT ''
            )
            """
        )
        # Additive migration for older DBs created before password_hash
        # binding existed. Safe to run on every startup — SQLite ignores
        # duplicate-column errors only when we catch them ourselves.
        try:
            _conn.execute("ALTER TABLE admin_tokens ADD COLUMN password_hash TEXT NOT NULL DEFAULT ''")
        except sqlite3.OperationalError:
            pass
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
def load_tokens(current_password_hash: str = "") -> dict[str, float]:
    """Load non-expired tokens from disk that were issued under the current
    admin password hash.

    ``current_password_hash`` binds every persisted token to the exact
    admin password that authorized its creation. On restart, tokens whose
    stored ``password_hash`` no longer matches the current environment's
    hash are discarded and deleted. This preserves the per-process
    security contract when ``ADMIN_PASSWORD_HASH`` is unset (random
    password regenerated every start) and also rotates sessions cleanly
    when an operator changes the password. Passing an empty string
    disables the check (for callers that don't care or for tests).
    """
    conn = _get_conn()
    if conn is None:
        return {}
    now = time.time()
    try:
        with _lock:
            cur = conn.execute(
                "SELECT token, expires_at, password_hash FROM admin_tokens WHERE expires_at > ?",
                (now,),
            )
            rows = cur.fetchall()
        valid: dict[str, float] = {}
        stale: list[str] = []
        for token, expires, stored_hash in rows:
            if current_password_hash and stored_hash and stored_hash != current_password_hash:
                stale.append(token)
                continue
            if current_password_hash and not stored_hash:
                # Legacy row persisted before binding was introduced — cannot
                # verify which password authorized it, so drop it rather than
                # trust it.
                stale.append(token)
                continue
            valid[token] = expires
        if stale:
            with _lock:
                conn.executemany("DELETE FROM admin_tokens WHERE token = ?", [(t,) for t in stale])
                conn.commit()
            logger.info("discarded %d stale token(s) from previous password", len(stale))
        return valid
    except Exception as exc:  # noqa: BLE001
        logger.warning("failed to load tokens: %s", exc)
        return {}


def save_token(token: str, expires_at: float, password_hash: str = "") -> None:
    conn = _get_conn()
    if conn is None:
        return
    try:
        with _lock:
            conn.execute(
                "INSERT OR REPLACE INTO admin_tokens (token, expires_at, password_hash) VALUES (?, ?, ?)",
                (token, expires_at, password_hash),
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
            # Disk-side FIFO cap: drop the oldest rows beyond ``_TICKET_DISK_CAP``
            # so a sustained ``/api/bug-report`` burst (the endpoint is
            # anonymous and only rate-limited per IP) cannot grow the
            # SQLite file without bound. ``ROWID`` ordering is monotonic
            # for INSERT OR REPLACE because SQLite assigns the existing
            # ROWID on UPDATE, so ordering by ``updated_at ASC`` is the
            # correct eviction key (oldest write first).
            conn.execute(
                """
                DELETE FROM tickets
                WHERE id IN (
                    SELECT id FROM tickets
                    ORDER BY updated_at ASC
                    LIMIT MAX(0, (SELECT COUNT(*) FROM tickets) - ?)
                )
                """,
                (_TICKET_DISK_CAP,),
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
