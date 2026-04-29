"""Auto-announce bot deploys to a member-facing channel.

On startup, reads BOT_BUILD_SHA / BOT_BUILD_MSG / BOT_BUILD_DATE injected
at Docker build time. If the SHA differs from the one stored in
``/data/.last_announced_commit`` (or ``DB_PATH`` parent dir), posts a single
embed to the configured updates channel and persists the new SHA so simple
restarts (without a code change) do NOT re-announce.
"""
from __future__ import annotations

import datetime as _dt
import logging
import os
from pathlib import Path

import discord
from discord.ext import commands

from ..config import COLORS, Settings

_log = logging.getLogger(__name__)


def _state_path(db_path: str) -> Path:
    """Store the last-announced commit beside the DB so it survives restarts."""
    return Path(db_path).resolve().parent / ".last_announced_commit"


class UpdatesCog(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.settings: Settings = bot.settings  # type: ignore[attr-defined]
        self._announced = False  # only run once per process

    @commands.Cog.listener()
    async def on_ready(self):
        if self._announced:
            return
        self._announced = True

        sha = (os.getenv("BOT_BUILD_SHA") or "").strip()
        msg = (os.getenv("BOT_BUILD_MSG") or "").strip()
        build_date = (os.getenv("BOT_BUILD_DATE") or "").strip()

        if not sha or sha == "unknown":
            _log.info("updates: BOT_BUILD_SHA not set; skipping announce")
            return

        ch_id = self.settings.channel_bot_updates
        if not ch_id:
            _log.info("updates: channel_bot_updates not configured")
            return
        channel = self.bot.get_channel(ch_id)
        if not isinstance(channel, discord.TextChannel):
            _log.warning("updates: channel %s not a text channel", ch_id)
            return

        state_file = _state_path(self.settings.db_path)
        try:
            previous = state_file.read_text(encoding="utf-8").strip()
        except FileNotFoundError:
            previous = ""
        except OSError as e:
            _log.warning("updates: cannot read state %s: %s", state_file, e)
            previous = ""

        if previous == sha:
            _log.info("updates: SHA %s already announced; skipping", sha[:8])
            return

        embed = discord.Embed(
            title="📣 تحديث جديد للبوت",
            description=msg or "*(لا توجد رسالة commit)*",
            color=COLORS.get("primary", 0x5865F2),
            timestamp=_dt.datetime.now(_dt.timezone.utc),
        )
        short = sha[:8] if sha else "?"
        embed.add_field(name="الإصدار (commit)", value=f"`{short}`", inline=True)
        if build_date:
            embed.add_field(name="تاريخ البناء", value=build_date, inline=True)
        embed.set_footer(text=f"Bot version {short}")

        try:
            await channel.send(embed=embed)
        except (discord.HTTPException, discord.Forbidden) as e:
            _log.warning("updates: failed to post update: %s", e)
            return

        # Persist last-announced SHA only AFTER successful post.
        try:
            state_file.parent.mkdir(parents=True, exist_ok=True)
            state_file.write_text(sha, encoding="utf-8")
        except OSError as e:
            _log.warning("updates: cannot write state %s: %s", state_file, e)


async def setup(bot: commands.Bot):
    await bot.add_cog(UpdatesCog(bot))
