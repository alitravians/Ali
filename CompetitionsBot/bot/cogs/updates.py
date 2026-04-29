"""Auto-announce bot updates to a member-facing channel.

Reads ``CHANGELOG.json`` (curated, member-friendly Arabic entries) and posts
the latest entry whose ``version`` differs from the one persisted at
``/data/.last_announced_version``. Simple machine restarts on the same
changelog do **not** repost — only fresh entries trigger announcements.

Internal commits / hotfixes that don't add a changelog entry are silently
skipped, so members only see polished, curated updates.
"""
from __future__ import annotations

import datetime as _dt
import json
import logging
from pathlib import Path

import discord
from discord.ext import commands

from ..config import COLORS, Settings

_log = logging.getLogger(__name__)

# Changelog lives at the repo root (copied into /app inside the container).
_CHANGELOG_CANDIDATES = [
    Path("/app/CHANGELOG.json"),
    Path(__file__).resolve().parents[2] / "CHANGELOG.json",
]


def _state_path(db_path: str) -> Path:
    return Path(db_path).resolve().parent / ".last_announced_version"


def _load_changelog() -> list[dict] | None:
    for p in _CHANGELOG_CANDIDATES:
        if p.is_file():
            try:
                data = json.loads(p.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError) as e:
                _log.warning("updates: cannot read %s: %s", p, e)
                return None
            entries = data.get("entries")
            if isinstance(entries, list) and entries:
                return entries
    return None


def _build_embed(entry: dict) -> discord.Embed:
    version = str(entry.get("version", "")).strip() or "—"
    title = str(entry.get("title", "")).strip() or "تحديث جديد"
    summary = str(entry.get("summary", "")).strip()
    highlights = entry.get("highlights") or []

    embed = discord.Embed(
        title=title,
        description=summary or None,
        color=COLORS.get("primary", 0x5865F2),
        timestamp=_dt.datetime.now(_dt.timezone.utc),
    )
    if highlights:
        bullets = "\n".join(f"• {str(h).strip()}" for h in highlights if str(h).strip())
        if bullets:
            # Discord field value cap = 1024.
            if len(bullets) > 1024:
                bullets = bullets[:1023] + "…"
            embed.add_field(name="✨ ما الجديد؟", value=bullets, inline=False)
    embed.set_footer(text=f"الإصدار {version} • بوت المسابقات")
    return embed


class UpdatesCog(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.settings: Settings = bot.settings  # type: ignore[attr-defined]
        self._announced = False

    @commands.Cog.listener()
    async def on_ready(self):
        if self._announced:
            return
        self._announced = True

        entries = _load_changelog()
        if not entries:
            _log.info("updates: no CHANGELOG.json entries; skipping announce")
            return

        latest = entries[0]
        version = str(latest.get("version", "")).strip()
        if not version:
            _log.warning("updates: latest changelog entry has no version; skipping")
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

        if previous == version:
            _log.info("updates: version %s already announced; skipping", version)
            return

        try:
            await channel.send(embed=_build_embed(latest))
        except (discord.HTTPException, discord.Forbidden) as e:
            _log.warning("updates: failed to post update: %s", e)
            return

        try:
            state_file.parent.mkdir(parents=True, exist_ok=True)
            state_file.write_text(version, encoding="utf-8")
        except OSError as e:
            _log.warning("updates: cannot write state %s: %s", state_file, e)

        _log.info("updates: announced %s to channel %s", version, ch_id)


async def setup(bot: commands.Bot):
    await bot.add_cog(UpdatesCog(bot))
