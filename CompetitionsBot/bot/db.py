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

CREATE TABLE IF NOT EXISTS automod_events (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    kind          TEXT    NOT NULL,         -- "collusion" | "rapid_fire" | etc
    channel_id    INTEGER,
    user_ids      TEXT    NOT NULL,         -- JSON array of involved user IDs
    details       TEXT,
    created_at    REAL    NOT NULL
);

CREATE TABLE IF NOT EXISTS teams (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    UNIQUE NOT NULL,
    owner_id      INTEGER NOT NULL,
    description   TEXT,
    icon          TEXT,
    created_at    REAL    NOT NULL
);

CREATE TABLE IF NOT EXISTS team_members (
    team_id       INTEGER NOT NULL,
    user_id       INTEGER NOT NULL,
    role          TEXT    NOT NULL DEFAULT 'member',  -- owner|officer|member
    joined_at     REAL    NOT NULL,
    PRIMARY KEY (team_id, user_id)
);

CREATE TABLE IF NOT EXISTS duels (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    challenger_id INTEGER NOT NULL,
    opponent_id   INTEGER NOT NULL,
    status        TEXT    NOT NULL DEFAULT 'pending',  -- pending|active|complete|expired
    winner_id     INTEGER,
    challenger_score INTEGER NOT NULL DEFAULT 0,
    opponent_score   INTEGER NOT NULL DEFAULT 0,
    elo_change    INTEGER,
    started_at    REAL,
    ended_at      REAL,
    created_at    REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS user_questions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    submitted_by    INTEGER NOT NULL,
    question        TEXT    NOT NULL,
    type            TEXT    NOT NULL,         -- "tf" or "mcq"
    choices_json    TEXT,                     -- JSON array (for mcq) or NULL
    answer_index    INTEGER,                  -- 0..3 for mcq
    answer_bool     INTEGER,                  -- 0/1 for tf
    category        TEXT    NOT NULL,
    difficulty      TEXT    NOT NULL,
    explanation     TEXT,
    status          TEXT    NOT NULL DEFAULT 'pending',  -- pending|approved|rejected
    reviewed_by     INTEGER,
    reviewed_at     REAL,
    created_at      REAL    NOT NULL
);

CREATE TABLE IF NOT EXISTS seasons (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    started_at  REAL NOT NULL,
    ends_at     REAL NOT NULL,
    closed      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS season_results (
    season_id   INTEGER NOT NULL,
    user_id     INTEGER NOT NULL,
    points      INTEGER NOT NULL,
    rank        INTEGER NOT NULL,
    tier        TEXT NOT NULL,
    PRIMARY KEY (season_id, user_id)
);

CREATE TABLE IF NOT EXISTS category_stats (
    user_id   INTEGER NOT NULL,
    category  TEXT    NOT NULL,
    correct   INTEGER NOT NULL DEFAULT 0,
    total     INTEGER NOT NULL DEFAULT 0,
    points    INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, category)
);

CREATE INDEX IF NOT EXISTS idx_users_points ON users(points DESC);
CREATE INDEX IF NOT EXISTS idx_users_weekly ON users(weekly_points DESC);
CREATE INDEX IF NOT EXISTS idx_users_monthly ON users(monthly_points DESC);
CREATE INDEX IF NOT EXISTS idx_sched_pending
    ON scheduled_announcements(fire_at)
    WHERE fired_at IS NULL AND cancelled_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_admin_q_active
    ON admin_questions(deleted_at);
CREATE INDEX IF NOT EXISTS idx_automod_events_kind ON automod_events(kind, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_duels_users ON duels(challenger_id, opponent_id, status);
CREATE INDEX IF NOT EXISTS idx_user_questions_status ON user_questions(status, created_at);
CREATE INDEX IF NOT EXISTS idx_seasons_active ON seasons(closed, ends_at);
CREATE INDEX IF NOT EXISTS idx_season_results_pts ON season_results(season_id, points DESC);
CREATE INDEX IF NOT EXISTS idx_cat_points ON category_stats(category, points DESC);
CREATE INDEX IF NOT EXISTS idx_cat_correct ON category_stats(category, correct DESC);
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
            # Wave 4: ELO rating + duel win/loss counters on users.
            ("users", "elo_rating",  "INTEGER NOT NULL DEFAULT 1000"),
            ("users", "duel_wins",   "INTEGER NOT NULL DEFAULT 0"),
            ("users", "duel_losses", "INTEGER NOT NULL DEFAULT 0"),
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
                f"UPDATE admin_questions SET {', '.join(sets)} "
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


    # ----- Automod (Wave 5) -----
    async def log_automod_event(
        self,
        kind: str,
        *,
        channel_id: int | None,
        user_ids: list[int],
        details: str | None = None,
    ) -> int:
        async with aiosqlite.connect(self.path) as db:
            cur = await db.execute(
                "INSERT INTO automod_events (kind, channel_id, user_ids, details, created_at) "
                "VALUES (?, ?, ?, ?, ?)",
                (kind, channel_id, json.dumps(user_ids), details, time.time()),
            )
            await db.commit()
            return cur.lastrowid or 0

    async def list_automod_events(
        self, *, kind: str | None = None, limit: int = 25
    ) -> list[dict[str, Any]]:
        async with aiosqlite.connect(self.path) as db:
            db.row_factory = aiosqlite.Row
            if kind:
                cur = await db.execute(
                    "SELECT * FROM automod_events WHERE kind = ? "
                    "ORDER BY created_at DESC LIMIT ?",
                    (kind, limit),
                )
            else:
                cur = await db.execute(
                    "SELECT * FROM automod_events ORDER BY created_at DESC LIMIT ?",
                    (limit,),
                )
            rows = []
            for r in await cur.fetchall():
                d = dict(r)
                d["user_ids"] = json.loads(d.get("user_ids") or "[]")
                rows.append(d)
            return rows

    # ----- Teams (Wave 4) -----
    async def create_team(
        self, name: str, owner_id: int, *, description: str | None = None,
        icon: str | None = None,
    ) -> int:
        async with aiosqlite.connect(self.path) as db:
            cur = await db.execute(
                "INSERT INTO teams (name, owner_id, description, icon, created_at) "
                "VALUES (?, ?, ?, ?, ?)",
                (name, owner_id, description, icon, time.time()),
            )
            tid = cur.lastrowid or 0
            await db.execute(
                "INSERT INTO team_members (team_id, user_id, role, joined_at) "
                "VALUES (?, ?, 'owner', ?)",
                (tid, owner_id, time.time()),
            )
            await db.commit()
            return tid

    async def get_team(self, team_id: int) -> dict[str, Any] | None:
        async with aiosqlite.connect(self.path) as db:
            db.row_factory = aiosqlite.Row
            cur = await db.execute("SELECT * FROM teams WHERE id = ?", (team_id,))
            row = await cur.fetchone()
            return dict(row) if row else None

    async def get_team_by_name(self, name: str) -> dict[str, Any] | None:
        async with aiosqlite.connect(self.path) as db:
            db.row_factory = aiosqlite.Row
            cur = await db.execute(
                "SELECT * FROM teams WHERE name = ? COLLATE NOCASE", (name,)
            )
            row = await cur.fetchone()
            return dict(row) if row else None

    async def get_user_team(self, user_id: int) -> dict[str, Any] | None:
        """Returns the (team + member) record for the user, or None."""
        async with aiosqlite.connect(self.path) as db:
            db.row_factory = aiosqlite.Row
            cur = await db.execute(
                "SELECT t.*, tm.role AS member_role FROM teams t "
                "INNER JOIN team_members tm ON tm.team_id = t.id "
                "WHERE tm.user_id = ?",
                (user_id,),
            )
            row = await cur.fetchone()
            return dict(row) if row else None

    async def add_team_member(
        self, team_id: int, user_id: int, *, role: str = "member"
    ) -> None:
        async with aiosqlite.connect(self.path) as db:
            await db.execute(
                "INSERT OR IGNORE INTO team_members (team_id, user_id, role, joined_at) "
                "VALUES (?, ?, ?, ?)",
                (team_id, user_id, role, time.time()),
            )
            await db.commit()

    async def remove_team_member(self, team_id: int, user_id: int) -> bool:
        async with aiosqlite.connect(self.path) as db:
            cur = await db.execute(
                "DELETE FROM team_members WHERE team_id = ? AND user_id = ?",
                (team_id, user_id),
            )
            await db.commit()
            return cur.rowcount > 0

    async def list_team_members(self, team_id: int) -> list[dict[str, Any]]:
        async with aiosqlite.connect(self.path) as db:
            db.row_factory = aiosqlite.Row
            cur = await db.execute(
                "SELECT tm.*, u.display_name, u.points, u.elo_rating "
                "FROM team_members tm "
                "INNER JOIN users u ON u.user_id = tm.user_id "
                "WHERE tm.team_id = ? ORDER BY u.points DESC",
                (team_id,),
            )
            return [dict(r) for r in await cur.fetchall()]

    async def disband_team(self, team_id: int) -> None:
        async with aiosqlite.connect(self.path) as db:
            await db.execute("DELETE FROM team_members WHERE team_id = ?", (team_id,))
            await db.execute("DELETE FROM teams WHERE id = ?", (team_id,))
            await db.commit()

    async def team_leaderboard(self, *, limit: int = 10) -> list[dict[str, Any]]:
        """Top teams by aggregate member points."""
        async with aiosqlite.connect(self.path) as db:
            db.row_factory = aiosqlite.Row
            cur = await db.execute(
                """
                SELECT t.id, t.name, t.icon, t.owner_id,
                       COUNT(tm.user_id) AS members,
                       COALESCE(SUM(u.points), 0) AS total_points,
                       COALESCE(AVG(u.elo_rating), 1000) AS avg_elo
                FROM teams t
                LEFT JOIN team_members tm ON tm.team_id = t.id
                LEFT JOIN users u ON u.user_id = tm.user_id
                GROUP BY t.id
                ORDER BY total_points DESC
                LIMIT ?
                """,
                (limit,),
            )
            return [dict(r) for r in await cur.fetchall()]

    # ----- Duels (Wave 4) -----
    async def create_duel(self, challenger_id: int, opponent_id: int) -> int:
        async with aiosqlite.connect(self.path) as db:
            cur = await db.execute(
                "INSERT INTO duels (challenger_id, opponent_id, created_at) "
                "VALUES (?, ?, ?)",
                (challenger_id, opponent_id, time.time()),
            )
            await db.commit()
            return cur.lastrowid or 0

    async def finalize_duel(
        self,
        duel_id: int,
        *,
        challenger_score: int,
        opponent_score: int,
        winner_id: int | None,
        elo_change: int,
    ) -> None:
        async with aiosqlite.connect(self.path) as db:
            await db.execute(
                "UPDATE duels SET status='complete', challenger_score=?, opponent_score=?, "
                "winner_id=?, elo_change=?, ended_at=? WHERE id = ?",
                (challenger_score, opponent_score, winner_id, elo_change, time.time(), duel_id),
            )
            await db.commit()

    async def update_duel_stats(
        self, user_id: int, *, won: bool | None, elo_delta: int
    ) -> None:
        """Record a duel outcome. ``won=True`` increments duel_wins,
        ``won=False`` increments duel_losses, ``won=None`` (a draw) leaves
        both counters untouched but still applies the ELO delta (which is
        typically zero or near-zero for a draw)."""
        async with aiosqlite.connect(self.path) as db:
            if won is True:
                await db.execute(
                    "UPDATE users SET duel_wins = duel_wins + 1, "
                    "elo_rating = MAX(0, elo_rating + ?), updated_at = ? "
                    "WHERE user_id = ?",
                    (elo_delta, time.time(), user_id),
                )
            elif won is False:
                await db.execute(
                    "UPDATE users SET duel_losses = duel_losses + 1, "
                    "elo_rating = MAX(0, elo_rating + ?), updated_at = ? "
                    "WHERE user_id = ?",
                    (elo_delta, time.time(), user_id),
                )
            else:
                # Draw: just nudge ELO (and keep updated_at fresh).
                await db.execute(
                    "UPDATE users SET elo_rating = MAX(0, elo_rating + ?), "
                    "updated_at = ? WHERE user_id = ?",
                    (elo_delta, time.time(), user_id),
                )
            await db.commit()

    async def get_top_elo(self, *, limit: int = 10) -> list[dict[str, Any]]:
        async with aiosqlite.connect(self.path) as db:
            db.row_factory = aiosqlite.Row
            cur = await db.execute(
                "SELECT user_id, display_name, elo_rating, duel_wins, duel_losses "
                "FROM users WHERE duel_wins + duel_losses > 0 "
                "ORDER BY elo_rating DESC LIMIT ?",
                (limit,),
            )
            return [dict(r) for r in await cur.fetchall()]

    # ----- User question submissions (Wave 3) -----
    async def submit_user_question(
        self,
        *,
        submitted_by: int,
        question: str,
        type_: str,
        choices_json: str | None,
        answer_index: int | None,
        answer_bool: bool | None,
        category: str,
        difficulty: str,
        explanation: str | None = None,
    ) -> int:
        async with aiosqlite.connect(self.path) as db:
            cur = await db.execute(
                """
                INSERT INTO user_questions
                  (submitted_by, question, type, choices_json, answer_index,
                   answer_bool, category, difficulty, explanation, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    submitted_by, question, type_, choices_json, answer_index,
                    1 if answer_bool else 0 if answer_bool is not None else None,
                    category, difficulty, explanation, time.time(),
                ),
            )
            await db.commit()
            return cur.lastrowid or 0

    async def list_user_questions(
        self, *, status: str = "pending", limit: int = 25
    ) -> list[dict[str, Any]]:
        async with aiosqlite.connect(self.path) as db:
            db.row_factory = aiosqlite.Row
            cur = await db.execute(
                "SELECT * FROM user_questions WHERE status = ? "
                "ORDER BY created_at ASC LIMIT ?",
                (status, limit),
            )
            return [dict(r) for r in await cur.fetchall()]

    async def get_user_question(self, q_id: int) -> dict[str, Any] | None:
        async with aiosqlite.connect(self.path) as db:
            db.row_factory = aiosqlite.Row
            cur = await db.execute(
                "SELECT * FROM user_questions WHERE id = ?", (q_id,)
            )
            row = await cur.fetchone()
            return dict(row) if row else None

    async def review_user_question(
        self, q_id: int, reviewer_id: int, *, approve: bool
    ) -> bool:
        new_status = "approved" if approve else "rejected"
        async with aiosqlite.connect(self.path) as db:
            cur = await db.execute(
                "UPDATE user_questions SET status = ?, reviewed_by = ?, "
                "reviewed_at = ? WHERE id = ? AND status = 'pending'",
                (new_status, reviewer_id, time.time(), q_id),
            )
            await db.commit()
            return cur.rowcount > 0

    async def get_approved_questions(self) -> list[dict[str, Any]]:
        async with aiosqlite.connect(self.path) as db:
            db.row_factory = aiosqlite.Row
            cur = await db.execute(
                "SELECT * FROM user_questions WHERE status = 'approved' "
                "ORDER BY id ASC"
            )
            return [dict(r) for r in await cur.fetchall()]

    # ----- Seasons (Wave 2) -----
    async def get_active_season(self) -> dict[str, Any] | None:
        async with aiosqlite.connect(self.path) as db:
            db.row_factory = aiosqlite.Row
            cur = await db.execute(
                "SELECT * FROM seasons WHERE closed = 0 ORDER BY started_at DESC LIMIT 1"
            )
            row = await cur.fetchone()
            return dict(row) if row else None

    async def create_season(self, name: str, started_at: float, ends_at: float) -> int:
        async with aiosqlite.connect(self.path) as db:
            cur = await db.execute(
                "INSERT INTO seasons (name, started_at, ends_at) VALUES (?, ?, ?)",
                (name, started_at, ends_at),
            )
            await db.commit()
            return cur.lastrowid or 0

    async def close_season(
        self, season_id: int, top_results: list[dict[str, Any]]
    ) -> None:
        async with aiosqlite.connect(self.path) as db:
            await db.execute(
                "UPDATE seasons SET closed = 1 WHERE id = ?", (season_id,)
            )
            for r in top_results:
                await db.execute(
                    """
                    INSERT INTO season_results (season_id, user_id, points, rank, tier)
                    VALUES (?, ?, ?, ?, ?)
                    ON CONFLICT(season_id, user_id) DO UPDATE SET
                        points = excluded.points,
                        rank = excluded.rank,
                        tier = excluded.tier
                    """,
                    (season_id, r["user_id"], r["points"], r["rank"], r["tier"]),
                )
            await db.commit()

    async def list_seasons(self, limit: int = 20) -> list[dict[str, Any]]:
        async with aiosqlite.connect(self.path) as db:
            db.row_factory = aiosqlite.Row
            cur = await db.execute(
                "SELECT * FROM seasons ORDER BY started_at DESC LIMIT ?", (limit,)
            )
            return [dict(r) for r in await cur.fetchall()]

    async def get_season(self, season_id: int) -> dict[str, Any] | None:
        async with aiosqlite.connect(self.path) as db:
            db.row_factory = aiosqlite.Row
            cur = await db.execute("SELECT * FROM seasons WHERE id = ?", (season_id,))
            row = await cur.fetchone()
            return dict(row) if row else None

    async def get_season_results(
        self, season_id: int, limit: int = 10
    ) -> list[dict[str, Any]]:
        async with aiosqlite.connect(self.path) as db:
            db.row_factory = aiosqlite.Row
            cur = await db.execute(
                """
                SELECT sr.*, u.display_name AS display_name
                  FROM season_results sr
                  LEFT JOIN users u ON u.user_id = sr.user_id
                 WHERE sr.season_id = ?
                 ORDER BY sr.rank ASC
                 LIMIT ?
                """,
                (season_id, limit),
            )
            return [dict(r) for r in await cur.fetchall()]

    async def get_user_season_rank(
        self, season_id: int, user_id: int
    ) -> dict[str, Any] | None:
        async with aiosqlite.connect(self.path) as db:
            db.row_factory = aiosqlite.Row
            cur = await db.execute(
                "SELECT * FROM season_results WHERE season_id = ? AND user_id = ?",
                (season_id, user_id),
            )
            row = await cur.fetchone()
            return dict(row) if row else None

    # ----- Category stats (Wave 1) -----
    async def bump_category_stat(
        self, user_id: int, category: str, *, correct: bool, points: int
    ) -> None:
        async with aiosqlite.connect(self.path) as db:
            await db.execute(
                """
                INSERT INTO category_stats (user_id, category, correct, total, points)
                VALUES (?, ?, ?, 1, ?)
                ON CONFLICT(user_id, category) DO UPDATE SET
                    correct = correct + excluded.correct,
                    total   = total + 1,
                    points  = points + excluded.points
                """,
                (user_id, category, 1 if correct else 0, points),
            )
            await db.commit()

    async def get_user_category_stats(self, user_id: int) -> list[dict[str, Any]]:
        async with aiosqlite.connect(self.path) as db:
            db.row_factory = aiosqlite.Row
            cur = await db.execute(
                """
                SELECT category, correct, total, points
                  FROM category_stats
                 WHERE user_id = ?
                 ORDER BY points DESC
                """,
                (user_id,),
            )
            return [dict(r) for r in await cur.fetchall()]

    async def category_leaderboard(
        self, category: str, limit: int = 15
    ) -> list[dict[str, Any]]:
        """Return top users for a single category by points."""
        async with aiosqlite.connect(self.path) as db:
            db.row_factory = aiosqlite.Row
            cur = await db.execute(
                """
                SELECT cs.user_id   AS user_id,
                       cs.correct   AS correct,
                       cs.total     AS total,
                       cs.points    AS points,
                       u.display_name AS display_name
                  FROM category_stats cs
                  LEFT JOIN users u ON u.user_id = cs.user_id
                 WHERE cs.category = ? AND cs.points > 0
                 ORDER BY cs.points DESC
                 LIMIT ?
                """,
                (category, limit),
            )
            return [dict(r) for r in await cur.fetchall()]
