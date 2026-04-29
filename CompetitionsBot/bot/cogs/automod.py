"""Automod — collusion detection for trivia rounds.

The cog exposes a single helper :meth:`AutomodCog.record_answer` that quiz
and race cogs are expected to call after each answer is submitted. The
helper maintains a sliding in-memory window keyed by ``(channel_id,
round_id, answer_token)`` and flags rounds where ≥3 distinct accounts
submit the *same* answer within ``COLLUSION_WINDOW`` seconds of each
other.

When a flag is raised:
- An entry is written to ``automod_events`` (kind="collusion") with the
  involved user IDs + details.
- A summary embed is posted to the admin log channel (``🛠 مسابقات-إدارة``)
  if configured.
- The flag is rate-limited per ``(channel, round, token)`` so the same
  group only fires a single alert per round.

The feature is enabled by default but can be toggled at runtime via
``/admin_automod toggle``. State persists in ``bot_state`` under the
key ``automod_enabled`` (``"1"`` / ``"0"``).
"""
from __future__ import annotations

import asyncio
import time
from collections import defaultdict
from typing import Any

import discord
from discord import app_commands
from discord.ext import commands

from ..config import COLORS, Settings


COLLUSION_WINDOW = 3.0  # seconds
COLLUSION_THRESHOLD = 3  # accounts
ALERT_TTL = 600.0  # drop a "(channel, round, token) already alerted" entry
                   # after 10 minutes — far longer than any realistic round.
GC_EVERY = 64       # opportunistic GC frequency (every Nth record_answer)


def _is_admin_or_mod(interaction: discord.Interaction) -> bool:
    if not isinstance(interaction.user, discord.Member):
        return False
    settings: Settings = interaction.client.settings  # type: ignore[attr-defined]
    if interaction.user.guild_permissions.administrator:
        return True
    role_ids = {r.id for r in interaction.user.roles}
    return bool(settings.role_mod and settings.role_mod in role_ids)


class AutomodCog(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.settings: Settings = bot.settings  # type: ignore[attr-defined]
        # (channel_id, round_id, answer_token) -> list[(user_id, ts)]
        self._buckets: dict[tuple[int, str, str], list[tuple[int, float]]] = defaultdict(list)
        # rate-limit cache: (channel, round, token) -> ts of the alert. We
        # store a timestamp (rather than a plain set) so old entries can be
        # garbage-collected by `_gc_alerted`. After ALERT_TTL seconds the
        # round is treated as "long over" and a stale entry is dropped —
        # keeping the structure bounded over the bot's lifetime.
        self._alerted: dict[tuple[int, str, str], float] = {}
        self._lock = asyncio.Lock()
        self._enabled: bool = True
        # Counter for opportunistic GC: every Nth record_answer call we
        # walk the structures and drop dead entries.
        self._gc_counter: int = 0

    async def cog_load(self) -> None:
        val = await self.bot.db.get_state("automod_enabled")
        self._enabled = (val or "1") == "1"

    async def is_enabled(self) -> bool:
        return self._enabled

    async def record_answer(
        self,
        *,
        channel_id: int,
        round_id: str,
        user_id: int,
        answer_token: str,
    ) -> None:
        """Record an answer and possibly emit a collusion alert.

        ``round_id`` should uniquely identify a quiz/race round (e.g.
        ``f"quiz-{message_id}-{question_index}"``). ``answer_token`` is the
        normalized answer (e.g. ``"A"``, ``"B"``, ``"true"``).
        """
        if not self._enabled:
            return
        key = (channel_id, round_id, answer_token)
        now = time.time()
        async with self._lock:
            bucket = self._buckets[key]
            bucket.append((user_id, now))
            # Prune timestamps outside the collusion window
            pruned = [(u, t) for (u, t) in bucket if now - t <= COLLUSION_WINDOW]
            if pruned:
                self._buckets[key] = pruned
                distinct = {u for (u, _t) in pruned}
                if len(distinct) >= COLLUSION_THRESHOLD and key not in self._alerted:
                    self._alerted[key] = now
                    await self._raise_alert(
                        channel_id, round_id, answer_token, list(distinct), pruned
                    )
            else:
                # Empty after pruning — drop the key so the dict stays bounded.
                self._buckets.pop(key, None)
            # Opportunistic GC of long-dead entries to keep memory bounded
            # over many months of operation.
            self._gc_counter += 1
            if self._gc_counter >= GC_EVERY:
                self._gc_counter = 0
                self._gc_locked(now)

    def _gc_locked(self, now: float) -> None:
        """Drop bucket-keys with no live entries and alert-keys older than
        :data:`ALERT_TTL`. Caller must hold ``_lock``."""
        dead_buckets = [
            k for k, v in self._buckets.items()
            if not v or all(now - t > COLLUSION_WINDOW for (_u, t) in v)
        ]
        for k in dead_buckets:
            self._buckets.pop(k, None)
        dead_alerts = [k for k, ts in self._alerted.items() if now - ts > ALERT_TTL]
        for k in dead_alerts:
            self._alerted.pop(k, None)

    async def _raise_alert(
        self,
        channel_id: int,
        round_id: str,
        answer_token: str,
        users: list[int],
        bucket: list[tuple[int, float]],
    ) -> None:
        ts_first = min(t for (_u, t) in bucket)
        ts_last = max(t for (_u, t) in bucket)
        details = (
            f"round={round_id} answer={answer_token!r} "
            f"window={ts_last - ts_first:.2f}s users={users}"
        )
        await self.bot.db.log_automod_event(
            "collusion",
            channel_id=channel_id,
            user_ids=users,
            details=details,
        )
        admin_log_id = getattr(self.settings, "log_admin", 0)
        ch = self.bot.get_channel(admin_log_id) if admin_log_id else None
        if not isinstance(ch, discord.TextChannel):
            return
        embed = discord.Embed(
            title="🚨 احتمال تواطؤ في المسابقات",
            description=(
                f"رصد البوت **{len(users)}** أعضاء قدّموا نفس الإجابة "
                f"`{answer_token}` خلال **{ts_last - ts_first:.2f}** ثانية في الجولة "
                f"`{round_id}`."
            ),
            color=COLORS.get("danger", 0xE74C3C),
        )
        embed.add_field(
            name="الأعضاء",
            value="\n".join(f"<@{u}>" for u in users) or "—",
            inline=False,
        )
        embed.set_footer(text="راجع السلوك يدوياً قبل اتخاذ أي إجراء.")
        try:
            await ch.send(embed=embed)
        except discord.HTTPException:
            pass

    # --- admin commands ---
    automod_group = app_commands.Group(
        name="admin_automod",
        description="إعدادات المراقبة التلقائية",
        default_permissions=discord.Permissions(manage_guild=True),
    )

    @automod_group.command(name="toggle", description="تفعيل/تعطيل المراقبة التلقائية")
    async def toggle(self, interaction: discord.Interaction):
        if not _is_admin_or_mod(interaction):
            await interaction.response.send_message("🚫 ليست لديك صلاحية.", ephemeral=True)
            return
        self._enabled = not self._enabled
        await self.bot.db.set_state("automod_enabled", "1" if self._enabled else "0")
        await interaction.response.send_message(
            f"✅ المراقبة التلقائية الآن: **{'مفعّلة' if self._enabled else 'مُعطّلة'}**.",
            ephemeral=True,
        )

    @automod_group.command(name="recent", description="عرض آخر التنبيهات")
    @app_commands.describe(limit="عدد التنبيهات (افتراضي 10)")
    async def recent(self, interaction: discord.Interaction, limit: int = 10):
        if not _is_admin_or_mod(interaction):
            await interaction.response.send_message("🚫 ليست لديك صلاحية.", ephemeral=True)
            return
        limit = max(1, min(limit, 25))
        rows = await self.bot.db.list_automod_events(limit=limit)
        if not rows:
            await interaction.response.send_message(
                "✨ لا توجد تنبيهات.", ephemeral=True
            )
            return
        lines = []
        for r in rows[:limit]:
            users = ", ".join(f"<@{u}>" for u in (r.get("user_ids") or [])[:5])
            lines.append(
                f"`#{r['id']}` {r['kind']} — {users}\n"
                f"  └ {(r.get('details') or '—')[:120]}"
            )
        embed = discord.Embed(
            title="🚨 آخر تنبيهات المراقبة",
            description="\n\n".join(lines),
            color=COLORS.get("warning", 0xE67E22),
        )
        embed.set_footer(text=f"الحالة: {'مفعّلة' if self._enabled else 'مُعطّلة'}")
        await interaction.response.send_message(embed=embed, ephemeral=True)


async def setup(bot: commands.Bot):
    await bot.add_cog(AutomodCog(bot))
