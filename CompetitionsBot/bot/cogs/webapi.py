"""Wave 7 — read-only HTTP API for the public web panel.

Runs an in-process aiohttp server alongside the Discord bot. Exposes a
tiny JSON API the Next.js panel (deployed on Vercel) can fetch. Strictly
read-only — there are no write endpoints; mutating the bot still has to
go through Discord slash commands.

Endpoints (all GET, all JSON, all CORS-enabled for the configured origin):

- ``GET /api/health``       — uptime + version + bot status
- ``GET /api/leaderboard``  — top players (?scope=all|weekly|monthly, ?limit=N≤100)
- ``GET /api/stats``        — totals: users, competitions, points, answers
- ``GET /api/profile/<id>`` — single user public profile (no PII beyond display_name)
- ``GET /api/seasons``      — list of past closed seasons (Wave 2 dependency)

Configuration
-------------
- ``WEBAPI_HOST``       — bind address. Default ``0.0.0.0``.
- ``WEBAPI_PORT``       — bind port. Default ``8080``. Set to ``0`` to disable.
- ``WEBAPI_CORS_ORIGIN``— allowed origin (e.g. ``https://yourpanel.vercel.app``).
                          Default ``*`` (anywhere). Always set to a concrete
                          origin in production.

The cog binds the listener inside ``cog_load`` and tears it down in
``cog_unload``, so the lifetime is tied to the bot. Failures during bind
log a warning and skip the server (so a port conflict can never crash
the rest of the bot).
"""
from __future__ import annotations

import json
import logging
import os
import time
from typing import Any

from aiohttp import web
from discord.ext import commands


_log = logging.getLogger(__name__)


def _json(data: Any, *, status: int = 200, origin: str = "*") -> web.Response:
    return web.Response(
        body=json.dumps(data, ensure_ascii=False),
        content_type="application/json",
        status=status,
        headers={
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Cache-Control": "public, max-age=15",
        },
    )


class WebAPICog(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self._runner: web.AppRunner | None = None
        self._site: web.TCPSite | None = None
        self._started_at = time.time()
        self._origin = os.getenv("WEBAPI_CORS_ORIGIN", "*").strip() or "*"

    async def cog_load(self) -> None:
        port = int(os.getenv("WEBAPI_PORT", "8080") or "0")
        if port <= 0:
            _log.info("WEBAPI_PORT=0 — public read API disabled")
            return
        host = os.getenv("WEBAPI_HOST", "0.0.0.0")

        app = web.Application()
        app.router.add_route("GET", "/api/health", self._health)
        app.router.add_route("GET", "/api/leaderboard", self._leaderboard)
        app.router.add_route("GET", "/api/stats", self._stats)
        app.router.add_route("GET", "/api/profile/{user_id}", self._profile)
        app.router.add_route("GET", "/api/seasons", self._seasons)
        # Catch-all OPTIONS for CORS preflight.
        app.router.add_route("OPTIONS", "/api/{tail:.*}", self._preflight)

        self._runner = web.AppRunner(app)
        try:
            await self._runner.setup()
            self._site = web.TCPSite(self._runner, host=host, port=port)
            await self._site.start()
            _log.info("Public read API listening on http://%s:%d", host, port)
        except OSError as e:
            _log.warning("Failed to bind public read API: %s — disabled", e)
            self._runner = None
            self._site = None

    async def cog_unload(self) -> None:
        if self._site is not None:
            await self._site.stop()
        if self._runner is not None:
            await self._runner.cleanup()

    # ----- handlers -----

    async def _preflight(self, _request: web.Request) -> web.Response:
        return _json({"ok": True}, origin=self._origin)

    async def _health(self, _request: web.Request) -> web.Response:
        return _json(
            {
                "ok": True,
                "uptime_seconds": int(time.time() - self._started_at),
                "bot_user_id": self.bot.user.id if self.bot.user else None,
                "bot_user_name": str(self.bot.user) if self.bot.user else None,
                "guilds": len(self.bot.guilds),
            },
            origin=self._origin,
        )

    async def _stats(self, _request: web.Request) -> web.Response:
        s = await self.bot.db.stats()
        return _json(s, origin=self._origin)

    async def _leaderboard(self, request: web.Request) -> web.Response:
        scope = request.query.get("scope", "all")
        if scope not in ("all", "weekly", "monthly"):
            return _json({"error": "scope must be all|weekly|monthly"}, status=400, origin=self._origin)
        try:
            limit = max(1, min(100, int(request.query.get("limit", "25"))))
        except ValueError:
            return _json({"error": "limit must be an integer"}, status=400, origin=self._origin)
        rows = await self.bot.db.leaderboard(scope, limit=limit)
        # Project the public fields only — no last_daily, no created_at.
        public = [
            {
                "user_id": str(r.get("user_id")),
                "display_name": r.get("display_name"),
                "points": r.get("points", 0),
                "weekly_points": r.get("weekly_points", 0),
                "monthly_points": r.get("monthly_points", 0),
                "competitions": r.get("competitions", 0),
                "wins": r.get("wins", 0),
                "correct_answers": r.get("correct_answers", 0),
                "total_answers": r.get("total_answers", 0),
                "best_streak": r.get("best_streak", 0),
            }
            for r in rows
        ]
        return _json(
            {"scope": scope, "count": len(public), "rows": public},
            origin=self._origin,
        )

    async def _profile(self, request: web.Request) -> web.Response:
        try:
            uid = int(request.match_info["user_id"])
        except (KeyError, ValueError):
            return _json({"error": "invalid user_id"}, status=400, origin=self._origin)
        row = await self.bot.db.get_user(uid)
        if not row:
            return _json({"error": "not found"}, status=404, origin=self._origin)
        public = {
            "user_id": str(row.get("user_id")),
            "display_name": row.get("display_name"),
            "points": row.get("points", 0),
            "competitions": row.get("competitions", 0),
            "wins": row.get("wins", 0),
            "correct_answers": row.get("correct_answers", 0),
            "total_answers": row.get("total_answers", 0),
            "best_streak": row.get("best_streak", 0),
            "perfect_runs": row.get("perfect_runs", 0),
            "fast_answers": row.get("fast_answers", 0),
            "achievements": json.loads(row.get("achievements") or "[]"),
        }
        return _json(public, origin=self._origin)

    async def _seasons(self, _request: web.Request) -> web.Response:
        # Defensive: only present if Wave 2 (seasons) is loaded.
        get_history = getattr(self.bot.db, "list_seasons", None)
        if not callable(get_history):
            return _json({"seasons": []}, origin=self._origin)
        try:
            seasons = await get_history(closed_only=True, limit=24)
        except Exception:
            return _json({"seasons": []}, origin=self._origin)
        # Strip user IDs out of season_results for public consumption.
        public = []
        for s in seasons:
            public.append({
                "id": s.get("id"),
                "name": s.get("name"),
                "started_at": s.get("started_at"),
                "ends_at": s.get("ends_at"),
                "closed": bool(s.get("closed")),
            })
        return _json({"seasons": public}, origin=self._origin)


async def setup(bot: commands.Bot):
    await bot.add_cog(WebAPICog(bot))
