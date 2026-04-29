"""Async SQLite database layer for the Competitions Bot."""
from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

import aiosqlite


SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    user_id           INTEGER PRIMARY KEY,
    display_name      TEXT,
    points            INTEGER NOT NULL DEFAULT 0,
    weekly_points     INTEGER NOT NULL DEFAULT 0,
    monthly_points    INTEGER NOT NULL DEFAULT 0,
    competitions      INTEGER NOT NULL DEFAULT 0,
    wins              INTEGER NOT NULL DEFAULT 0,
    correct_answers   INTEGER NOT NULL DEFAULT 0,
    total_answers     INTEGER NOT NULL DEFAULT 0,
    streak            INTEGER NOT NULL DEFAULT 0,
    best_streak       INTEGER NOT NULL DEFAULT 0,
    perfect_runs      INTEGER NOT NULL DEFAULT 0,
    fast_answers      INTEGER NOT NULL DEFAULT 0,
    achievements      TEXT NOT NULL DEFAULT '[]',
    last_daily        TEXT,
    created_at        REAL NOT NULL,
    updated_at        REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS competitions (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    type              TEXT NOT NULL,
    category          TEXT,
    difficulty        TEXT,
    started_by        INTEGER,
    channel_id        INTEGER,
    started_at        REAL NOT NULL,
    ended_at          REAL,
    winner_id         INTEGER,
    questions_count   INTEGER NOT NULL DEFAULT 0,
    participants      TEXT NOT NULL DEFAULT '[]',
    results           TEXT
);

CREATE TABLE IF NOT EXISTS daily_state (
    user_id           INTEGER PRIMARY KEY,
    last_claim_date   TEXT NOT NULL,
    streak_days       INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS bot_state (
    key               TEXT PRIMARY KEY,
    value             TEXT
);

CREATE TABLE IF NOT EXISTS scheduled_announcements (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id    INTEGER NOT NULL,
    message       TEXT    NOT NULL,
    fire_at       REAL    NOT NULL,
    created_by    INTEGER NOT NULL,
    created_at    REAL    NOT NULL,
    fired_at      REAL,
    cancelled_at  REAL
);

CREATE TABLE IF NOT EXISTS admin_questions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    question      TEXT    NOT NULL,
    type          TEXT    NOT NULL,           -- "tf" or "mcq"
    choices_json  TEXT,                       -- JSON array (for mcq) or NULL
    answer_index  INTEGER,                    -- 0..3 for mcq
    answer_bool   INTEGER,                    -- 0/1 for tf
    category      TEXT    NOT NULL,
    difficulty    TEXT    NOT NULL,
    explanation   TEXT,
    created_by    INTEGER NOT NULL,
    created_at    REAL    NOT NULL,
    updated_at    REAL    NOT NULL,
    deleted_at    REAL
);

CREATE INDEX IF NOT EXISTS idx_users_points ON users(points DESC);
CREATE INDEX IF NOT EXISTS idx_users_weekly ON users(weekly_points DESC);
CREATE INDEX IF NOT EXISTS idx_users_monthly ON users(monthly_points DESC);
CREATE INDEX IF NOT EXISTS idx_sched_pending
    ON scheduled_announcements(fire_at)
    WHERE fired_at IS NULL AND cancelled_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_admin_q_active
    ON admin_questions(deleted_at);
"""


class Database:
    def __init__(self, path: str):
        self.path = path
        Path(path).parent.mkdir(parents=True, exist_ok=True)

    async def connect(self) -> None:
        async with aiosqlite.connect(self.path) as db:
            await db.executescript(SCHEMA)
            # Lightweight column-level migrations: SQLite has no
            # ``ALTER TABLE ADD COLUMN IF NOT EXISTS``, so we read the
            # existing schema and only add columns that are missing.
            await self._migrate_columns(db)
            await db.commit()

    async def _migrate_columns(self, db: aiosqlite.Connection) -> None:
        """Idempotent column additions for older databases.

        Each entry is ``(table, column_name, ddl_fragment)``. We check
        ``PRAGMA table_info`` first so re-running on an already-migrated
        DB is a no-op. If a future migration also needs to backfill
        data, do that here too — but always after the column exists.
        """
        migrations: list[tuple[str, str, str]] = [
            # Wave 6 follow-up: bound retry storms when a scheduled
            # announcement permanently fails to send (e.g. the bot lost
            # SEND_MESSAGES on the target channel). The scheduler reads
            # this counter to decide whether to retry transient errors
            # one more time or give up and mark the row fired.
            ("scheduled_announcements", "attempts",
             "INTEGER NOT NULL DEFAULT 0"),
            ("scheduled_announcements", "last_error", "TEXT"),
        ]
        for table, column, ddl in migrations:
            cur = await db.execute(f"PRAGMA table_info({table})")
            existing = {r[1] for r in await cur.fetchall()}
            if column not in existing:
                await db.execute(
                    f"ALTER TABLE {table} ADD COLUMN {column} {ddl}"
                )

    async def ensure_user(self, user_id: int, display_name: str) -> None:
        now = time.time()
        async with aiosqlite.connect(self.path) as db:
            await db.execute(
                """
                INSERT INTO users (user_id, display_name, created_at, updated_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(user_id) DO UPDATE SET display_name=excluded.display_name,
                                                   updated_at=excluded.updated_at
                """,
                (user_id, display_name, now, now),
            )
            await db.commit()

    async def get_user(self, user_id: int) -> dict[str, Any] | None:
        async with aiosqlite.connect(self.path) as db:
            db.row_factory = aiosqlite.Row
            cur = await db.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
            row = await cur.fetchone()
            if not row:
                return None
            data = dict(row)
            data["achievements"] = json.loads(data["achievements"] or "[]")
            return data

    async def add_points(
        self, user_id: int, points: int, *, correct: bool, fast: bool = False
    ) -> dict[str, Any]:
        async with aiosqlite.connect(self.path) as db:
            db.row_factory = aiosqlite.Row
            cur = await db.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
            row = await cur.fetchone()
            if not row:
                return {}
            new_streak = (row["streak"] + 1) if correct else 0
            best_streak = max(row["best_streak"], new_streak)
            await db.execute(
                """
                UPDATE users SET
                    points = points + ?,
                    weekly_points = weekly_points + ?,
                    monthly_points = monthly_points + ?,
                    correct_answers = correct_answers + ?,
                    total_answers = total_answers + 1,
                    streak = ?,
                    best_streak = ?,
                    fast_answers = fast_answers + ?,
                    updated_at = ?
                WHERE user_id = ?
                """,
                (
                    points,
                    points,
                    points,
                    1 if correct else 0,
                    new_streak,
                    best_streak,
                    1 if fast else 0,
                    time.time(),
                    user_id,
                ),
            )
            await db.commit()
            cur = await db.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
            new_row = await cur.fetchone()
            return dict(new_row)

    async def increment_competition(self, user_id: int, won: bool, perfect: bool) -> None:
        async with aiosqlite.connect(self.path) as db:
            await db.execute(
                """
                UPDATE users SET
                    competitions = competitions + 1,
                    wins = wins + ?,
                    perfect_runs = perfect_runs + ?,
                    updated_at = ?
                WHERE user_id = ?
                """,
                (1 if won else 0, 1 if perfect else 0, time.time(), user_id),
            )
            await db.commit()

    async def add_achievement(self, user_id: int, achievement: str) -> bool:
        """Returns True if the achievement was newly added."""
        async with aiosqlite.connect(self.path) as db:
            db.row_factory = aiosqlite.Row
            cur = await db.execute(
                "SELECT achievements FROM users WHERE user_id = ?", (user_id,)
            )
            row = await cur.fetchone()
            if not row:
                return False
            existing = json.loads(row["achievements"] or "[]")
            if achievement in existing:
                return False
            existing.append(achievement)
            await db.execute(
                "UPDATE users SET achievements = ?, updated_at = ? WHERE user_id = ?",
                (json.dumps(existing), time.time(), user_id),
            )
            await db.commit()
            return True

    async def leaderboard(
        self, scope: str = "all", limit: int = 10
    ) -> list[dict[str, Any]]:
        column = {"weekly": "weekly_points", "monthly": "monthly_points"}.get(scope, "points")
        async with aiosqlite.connect(self.path) as db:
            db.row_factory = aiosqlite.Row
            cur = await db.execute(
                f"SELECT * FROM users WHERE {column} > 0 ORDER BY {column} DESC LIMIT ?",
                (limit,),
            )
            rows = await cur.fetchall()
            return [dict(r) for r in rows]

    async def reset_period(self, scope: str) -> None:
        column = {"weekly": "weekly_points", "monthly": "monthly_points"}.get(scope)
        if not column:
            return
        async with aiosqlite.connect(self.path) as db:
            await db.execute(f"UPDATE users SET {column} = 0", ())
            await db.commit()

    async def record_competition(
        self,
        type_: str,
        category: str | None,
        difficulty: str | None,
        started_by: int,
        channel_id: int,
        questions_count: int,
        participants: list[int],
        results: dict[str, Any] | None,
        winner_id: int | None,
    ) -> int:
        async with aiosqlite.connect(self.path) as db:
            cur = await db.execute(
                """
                INSERT INTO competitions
                  (type, category, difficulty, started_by, channel_id, started_at, ended_at,
                   winner_id, questions_count, participants, results)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    type_,
                    category,
                    difficulty,
                    started_by,
                    channel_id,
                    time.time(),
                    time.time(),
                    winner_id,
                    questions_count,
                    json.dumps(participants),
                    json.dumps(results or {}),
                ),
            )
            await db.commit()
            return cur.lastrowid or 0

    async def get_daily_state(self, user_id: int) -> dict[str, Any] | None:
        async with aiosqlite.connect(self.path) as db:
            db.row_factory = aiosqlite.Row
            cur = await db.execute(
                "SELECT * FROM daily_state WHERE user_id = ?", (user_id,)
            )
            row = await cur.fetchone()
            return dict(row) if row else None

    async def upsert_daily(self, user_id: int, date: str, streak: int) -> None:
        async with aiosqlite.connect(self.path) as db:
            await db.execute(
                """
                INSERT INTO daily_state (user_id, last_claim_date, streak_days)
                VALUES (?, ?, ?)
                ON CONFLICT(user_id) DO UPDATE SET last_claim_date=excluded.last_claim_date,
                                                    streak_days=excluded.streak_days
                """,
                (user_id, date, streak),
            )
            await db.commit()

    async def stats(self) -> dict[str, int]:
        async with aiosqlite.connect(self.path) as db:
            cur = await db.execute("SELECT COUNT(*) FROM users")
            users = (await cur.fetchone())[0]
            cur = await db.execute("SELECT COUNT(*) FROM competitions")
            comps = (await cur.fetchone())[0]
            cur = await db.execute("SELECT COALESCE(SUM(correct_answers), 0) FROM users")
            answers = (await cur.fetchone())[0]
            cur = await db.execute("SELECT COALESCE(SUM(points), 0) FROM users")
            total_points = (await cur.fetchone())[0]
            return {
                "users": users,
                "competitions": comps,
                "correct_answers": answers,
                "total_points": total_points,
            }

    async def set_state(self, key: str, value: str) -> None:
        async with aiosqlite.connect(self.path) as db:
            await db.execute(
                """
                INSERT INTO bot_state (key, value) VALUES (?, ?)
                ON CONFLICT(key) DO UPDATE SET value=excluded.value
                """,
                (key, value),
            )
            await db.commit()

    async def get_state(self, key: str) -> str | None:
        async with aiosqlite.connect(self.path) as db:
            cur = await db.execute("SELECT value FROM bot_state WHERE key = ?", (key,))
            row = await cur.fetchone()
            return row[0] if row else None

    # ----- Scheduled announcements (Wave 6) -----
    async def schedule_announcement(
        self, *, channel_id: int, message: str, fire_at: float, created_by: int
    ) -> int:
        async with aiosqlite.connect(self.path) as db:
            cur = await db.execute(
                "INSERT INTO scheduled_announcements "
                "(channel_id, message, fire_at, created_by, created_at) "
                "VALUES (?, ?, ?, ?, ?)",
                (channel_id, message, fire_at, created_by, time.time()),
            )
            await db.commit()
            return cur.lastrowid or 0

    async def list_pending_announcements(self) -> list[dict[str, Any]]:
        async with aiosqlite.connect(self.path) as db:
            db.row_factory = aiosqlite.Row
            cur = await db.execute(
                "SELECT * FROM scheduled_announcements "
                "WHERE fired_at IS NULL AND cancelled_at IS NULL "
                "ORDER BY fire_at ASC"
            )
            return [dict(r) for r in await cur.fetchall()]

    async def list_due_announcements(self, *, now_ts: float) -> list[dict[str, Any]]:
        async with aiosqlite.connect(self.path) as db:
            db.row_factory = aiosqlite.Row
            cur = await db.execute(
                "SELECT * FROM scheduled_announcements "
                "WHERE fired_at IS NULL AND cancelled_at IS NULL "
                "AND fire_at <= ? ORDER BY fire_at ASC",
                (now_ts,),
            )
            return [dict(r) for r in await cur.fetchall()]

    async def mark_announcement_fired(self, sched_id: int) -> None:
        async with aiosqlite.connect(self.path) as db:
            await db.execute(
                "UPDATE scheduled_announcements SET fired_at = ? "
                "WHERE id = ? AND fired_at IS NULL AND cancelled_at IS NULL",
                (time.time(), sched_id),
            )
            await db.commit()

    async def record_announcement_failure(
        self, sched_id: int, *, error: str, max_attempts: int
    ) -> int:
        """Increment the attempts counter and persist the latest error.

        If the new attempts count reaches ``max_attempts``, the row is
        also marked ``fired_at = now`` so the scheduler stops picking it
        up (the alternative — leaving it pending forever — produces a
        log-spam loop on permanent errors like a bot that lost
        SEND_MESSAGES on the channel). Returns the new ``attempts``
        value so the caller can log it.
        """
        now = time.time()
        async with aiosqlite.connect(self.path) as db:
            await db.execute(
                "UPDATE scheduled_announcements "
                "SET attempts = COALESCE(attempts, 0) + 1, last_error = ? "
                "WHERE id = ? AND fired_at IS NULL AND cancelled_at IS NULL",
                (error[:500], sched_id),
            )
            db.row_factory = aiosqlite.Row
            cur = await db.execute(
                "SELECT attempts FROM scheduled_announcements WHERE id = ?",
                (sched_id,),
            )
            row = await cur.fetchone()
            attempts = int(row["attempts"]) if row else 0
            if attempts >= max_attempts:
                await db.execute(
                    "UPDATE scheduled_announcements SET fired_at = ? "
                    "WHERE id = ? AND fired_at IS NULL AND cancelled_at IS NULL",
                    (now, sched_id),
                )
            await db.commit()
        return attempts

    async def cancel_announcement(self, sched_id: int) -> bool:
        async with aiosqlite.connect(self.path) as db:
            cur = await db.execute(
                "UPDATE scheduled_announcements SET cancelled_at = ? "
                "WHERE id = ? AND fired_at IS NULL AND cancelled_at IS NULL",
                (time.time(), sched_id),
            )
            await db.commit()
            return (cur.rowcount or 0) > 0

    # ----- Admin-managed questions (Wave 6) -----
    async def add_admin_question(
        self,
        *,
        question: str,
        type_: str,
        choices: list[str] | None,
        answer_index: int | None,
        answer_bool: bool | None,
        category: str,
        difficulty: str,
        explanation: str | None,
        created_by: int,
    ) -> int:
        async with aiosqlite.connect(self.path) as db:
            cur = await db.execute(
                "INSERT INTO admin_questions "
                "(question, type, choices_json, answer_index, answer_bool, "
                " category, difficulty, explanation, created_by, "
                " created_at, updated_at) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (
                    question,
                    type_,
                    json.dumps(choices) if choices is not None else None,
                    answer_index,
                    1 if answer_bool else (0 if answer_bool is False else None),
                    category,
                    difficulty,
                    explanation,
                    created_by,
                    time.time(),
                    time.time(),
                ),
            )
            await db.commit()
            return cur.lastrowid or 0

    async def list_admin_questions(
        self, *, include_deleted: bool = False, limit: int = 100
    ) -> list[dict[str, Any]]:
        # ``limit <= 0`` means "no limit" — required by the cog's
        # _reload_admin_questions which must load *every* admin question
        # into the runtime pool, not just the most recent 100. SQLite
        # treats ``LIMIT -1`` as unbounded.
        effective_limit = limit if limit and limit > 0 else -1
        async with aiosqlite.connect(self.path) as db:
            db.row_factory = aiosqlite.Row
            if include_deleted:
                cur = await db.execute(
                    "SELECT * FROM admin_questions ORDER BY id DESC LIMIT ?",
                    (effective_limit,),
                )
            else:
                cur = await db.execute(
                    "SELECT * FROM admin_questions WHERE deleted_at IS NULL "
                    "ORDER BY id DESC LIMIT ?",
                    (effective_limit,),
                )
            rows = []
            for r in await cur.fetchall():
                d = dict(r)
                if d.get("choices_json"):
                    d["choices"] = json.loads(d["choices_json"])
                else:
                    d["choices"] = None
                rows.append(d)
            return rows

    async def get_admin_question(self, qid: int) -> dict[str, Any] | None:
        async with aiosqlite.connect(self.path) as db:
            db.row_factory = aiosqlite.Row
            cur = await db.execute(
                "SELECT * FROM admin_questions WHERE id = ?", (qid,)
            )
            row = await cur.fetchone()
            if not row:
                return None
            d = dict(row)
            d["choices"] = json.loads(d["choices_json"]) if d.get("choices_json") else None
            return d

    async def edit_admin_question(self, qid: int, **fields: Any) -> bool:
        if not fields:
            return False
        allowed = {
            "question", "category", "difficulty", "explanation",
            "answer_index", "answer_bool", "choices_json",
        }
        sets = []
        values: list[Any] = []
        for k, v in fields.items():
            if k not in allowed:
                continue
            sets.append(f"{k} = ?")
            values.append(v)
        if not sets:
            return False
        sets.append("updated_at = ?")
        values.append(time.time())
        values.append(qid)
        async with aiosqlite.connect(self.path) as db:
            cur = await db.execute(
                f"UPDATE admin_questions SET {", ".join(sets)} "
                "WHERE id = ? AND deleted_at IS NULL",
                values,
            )
            await db.commit()
            return (cur.rowcount or 0) > 0

    async def soft_delete_admin_question(self, qid: int) -> bool:
        async with aiosqlite.connect(self.path) as db:
            cur = await db.execute(
                "UPDATE admin_questions SET deleted_at = ? "
                "WHERE id = ? AND deleted_at IS NULL",
                (time.time(), qid),
            )
            await db.commit()
            return (cur.rowcount or 0) > 0

    async def db_size_bytes(self) -> int:
        from pathlib import Path as _P
        p = _P(self.path)
        return p.stat().st_size if p.exists() else 0

