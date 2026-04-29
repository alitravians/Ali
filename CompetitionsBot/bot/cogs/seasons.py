"""/season — monthly seasons (leagues) with auto-close + tier system.

Lifecycle:
- A "season" is one calendar month. On bot startup, ensure an active season
  exists for the current month; if not, create it.
- A background task wakes every 5 minutes and checks if the active season's
  ends_at has passed. If so, it snapshots the top 50 users by monthly_points,
  assigns tiers, posts a celebratory embed in #announcements, resets
  monthly_points across all users, and creates the next month's season.
- Past seasons can be inspected via /season history and /season top.
"""
from __future__ import annotations

import asyncio
import calendar
import datetime as _dt
import logging
from typing import Any

import discord
from discord import app_commands
from discord.ext import commands, tasks

from ..config import COLORS, SEASON_TIERS, Settings, season_tier_for


_log = logging.getLogger(__name__)

CHECK_INTERVAL_MINUTES = 5

# Arabic month names for season titles
AR_MONTHS = {
    1: "يناير", 2: "فبراير", 3: "مارس", 4: "أبريل",
    5: "مايو", 6: "يونيو", 7: "يوليو", 8: "أغسطس",
    9: "سبتمبر", 10: "أكتوبر", 11: "نوفمبر", 12: "ديسمبر",
}


def _month_bounds(year: int, month: int) -> tuple[float, float]:
    """Returns (start_ts, end_ts) for the given UTC month."""
    start = _dt.datetime(year, month, 1, tzinfo=_dt.timezone.utc)
    last_day = calendar.monthrange(year, month)[1]
    end = _dt.datetime(year, month, last_day, 23, 59, 59, tzinfo=_dt.timezone.utc)
    return start.timestamp(), end.timestamp()


def _season_name_for(year: int, month: int) -> str:
    return f"موسم {AR_MONTHS[month]} {year}"


class SeasonsCog(commands.Cog):
    group = app_commands.Group(name="season", description="🏆 المواسم الشهرية والترتيب")

    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.settings: Settings = bot.settings  # type: ignore[attr-defined]
        self._closing_lock = asyncio.Lock()

    async def cog_load(self) -> None:
        # Ensure an active season exists at startup
        await self._ensure_active_season()
        self.season_tick.start()

    async def cog_unload(self) -> None:
        self.season_tick.cancel()

    @tasks.loop(minutes=CHECK_INTERVAL_MINUTES)
    async def season_tick(self) -> None:
        try:
            await self._maybe_close_and_rotate()
        except Exception as e:
            _log.exception("season_tick failed: %s", e)

    @season_tick.before_loop
    async def _before_tick(self) -> None:
        await self.bot.wait_until_ready()

    async def _create_season_for_now(self) -> dict[str, Any]:
        """Internal helper that always creates a season for the current UTC
        month. Caller must already hold ``_closing_lock``."""
        active = await self.bot.db.get_active_season()
        if active:
            return active
        now = _dt.datetime.now(_dt.timezone.utc)
        start_ts, end_ts = _month_bounds(now.year, now.month)
        name = _season_name_for(now.year, now.month)
        sid = await self.bot.db.create_season(name, start_ts, end_ts)
        _log.info("Created new season id=%s name=%s", sid, name)
        return {"id": sid, "name": name, "started_at": start_ts, "ends_at": end_ts, "closed": 0}

    async def _ensure_active_season(self) -> dict[str, Any]:
        """Public entry-point used by slash commands. Acquires the close-lock
        so it can't interleave with ``_maybe_close_and_rotate`` (which would
        otherwise allow two ``closed=0`` rows to be created for the same
        month — see Devin Review on PR #111)."""
        async with self._closing_lock:
            return await self._create_season_for_now()

    async def _maybe_close_and_rotate(self) -> None:
        """If the active season has expired, close it + rotate to next month."""
        async with self._closing_lock:
            active = await self.bot.db.get_active_season()
            if not active:
                await self._create_season_for_now()
                return
            now = _dt.datetime.now(_dt.timezone.utc).timestamp()
            if now < active["ends_at"]:
                return  # still running

            # Snapshot top 50 by monthly_points, assign tiers
            rows = await self.bot.db.leaderboard("monthly", limit=50)
            results: list[dict[str, Any]] = []
            for rank, row in enumerate(rows, start=1):
                tier_id, _label, _color = season_tier_for(row["monthly_points"])
                results.append({
                    "user_id": row["user_id"],
                    "points":  row["monthly_points"],
                    "rank":    rank,
                    "tier":    tier_id,
                })

            # Persist results + mark closed
            await self.bot.db.close_season(active["id"], results)

            # Reset monthly_points so new season starts fresh
            await self.bot.db.reset_period("monthly")

            # Announce in announcements channel (if configured)
            await self._announce_season_close(active, results)

            # Start next month — base it on the *old* season's end (plus a
            # second) rather than `now`. If the tick fires inside the final
            # sub-second of the month (`23:59:59.xxx`), `now.month` may still
            # equal the closed season's month, which would create a duplicate
            # same-month season with an already-expired `ends_at`. We also
            # take max() with the wall-clock month to handle bot-downtime
            # gaps (skipping multiple months at once is fine — we just open
            # the *current* month, not every intermediate one).
            old_end_dt = _dt.datetime.fromtimestamp(active["ends_at"], _dt.timezone.utc)
            next_after_old = old_end_dt + _dt.timedelta(seconds=1)
            now_dt = _dt.datetime.now(_dt.timezone.utc)
            target_dt = next_after_old if next_after_old >= now_dt else now_dt
            year, month = target_dt.year, target_dt.month
            start_ts, end_ts = _month_bounds(year, month)
            new_name = _season_name_for(year, month)
            new_id = await self.bot.db.create_season(new_name, start_ts, end_ts)
            _log.info("Closed season %s, opened %s (id=%s)", active["id"], new_name, new_id)

    async def _announce_season_close(
        self, season: dict[str, Any], results: list[dict[str, Any]]
    ) -> None:
        ch_id = self.settings.channel_announcements
        ch = self.bot.get_channel(ch_id) if ch_id else None
        if not isinstance(ch, discord.TextChannel):
            return

        embed = discord.Embed(
            title=f"🏁 انتهى {season['name']}!",
            description="تهانينا للأبطال! تم تصفير نقاط الموسم وبدأ موسم جديد. الترتيب النهائي للموسم المنقضي:",
            color=COLORS["gold"],
        )

        # Top 10 winners
        if results:
            medals = ["🥇", "🥈", "🥉"]
            lines = []
            for r in results[:10]:
                medal = medals[r["rank"] - 1] if r["rank"] <= 3 else f"`#{r['rank']:>2}`"
                _, label, _ = season_tier_for(r["points"])
                lines.append(f"{medal} <@{r['user_id']}> — **{r['points']}** نقطة • {label}")
            embed.add_field(name="🏆 المتصدرون", value="\n".join(lines), inline=False)
        else:
            embed.add_field(
                name="🏆 المتصدرون",
                value="_لا يوجد مشاركون في هذا الموسم._",
                inline=False,
            )

        # Tier distribution
        from collections import Counter
        tier_counts = Counter(r["tier"] for r in results)
        tier_lines = []
        for tier_id, label, _min, _ in SEASON_TIERS:
            count = tier_counts.get(tier_id, 0)
            if count:
                tier_lines.append(f"{label}: **{count}** لاعب")
        if tier_lines:
            embed.add_field(name="📊 توزيع الرتب", value="\n".join(tier_lines), inline=False)

        embed.set_footer(text=f"معرف الموسم: {season['id']} • للاطلاع على السجل: /season history")

        try:
            await ch.send(embed=embed)
        except discord.Forbidden:
            _log.warning("Cannot post season-close to channel %s", ch_id)

    # ----- Slash commands -----

    @group.command(name="info", description="معلومات الموسم الحالي + ترتيبك")
    async def season_info(self, interaction: discord.Interaction) -> None:
        active = await self._ensure_active_season()
        ends_dt = _dt.datetime.fromtimestamp(active["ends_at"], tz=_dt.timezone.utc)
        days_left = max(0, (ends_dt - _dt.datetime.now(_dt.timezone.utc)).days)

        # User's current monthly points and tier
        await self.bot.db.ensure_user(interaction.user.id, interaction.user.display_name)
        user = await self.bot.db.get_user(interaction.user.id)
        monthly_pts = (user or {}).get("monthly_points", 0)
        _tier_id, tier_label, tier_color = season_tier_for(monthly_pts)

        # Position in current monthly leaderboard
        leaders = await self.bot.db.leaderboard("monthly", limit=1000)
        position = None
        for i, row in enumerate(leaders, start=1):
            if row["user_id"] == interaction.user.id:
                position = i
                break

        embed = discord.Embed(
            title=f"🏆 {active['name']}",
            color=tier_color,
        )
        embed.add_field(
            name="⏳ الوقت المتبقي",
            value=f"**{days_left}** يوم — ينتهي <t:{int(active['ends_at'])}:R>",
            inline=False,
        )
        embed.add_field(name="📊 نقاطك في الموسم", value=f"**{monthly_pts}** نقطة", inline=True)
        embed.add_field(name="🎖️ رتبتك الحالية", value=tier_label, inline=True)
        if position:
            embed.add_field(name="📍 ترتيبك", value=f"`#{position}`", inline=True)

        # Tier thresholds reference
        tier_lines = []
        for _id, label, min_pts, _ in SEASON_TIERS:
            tier_lines.append(f"{label} — **{min_pts}+** نقطة")
        embed.add_field(name="📋 شروط الرتب", value="\n".join(tier_lines), inline=False)

        embed.set_footer(text="نهاية الموسم: تصفير تلقائي + إعلان الفائزين • /season history للسجل")
        await interaction.response.send_message(embed=embed)

    @group.command(name="history", description="عرض سجل المواسم السابقة")
    async def season_history(self, interaction: discord.Interaction) -> None:
        seasons = await self.bot.db.list_seasons(limit=12)
        closed = [s for s in seasons if s["closed"]]

        if not closed:
            embed = discord.Embed(
                title="📜 سجل المواسم",
                description="_لا يوجد مواسم منقضية بعد. الموسم الأول قيد التشغيل._",
                color=COLORS["info"],
            )
            await interaction.response.send_message(embed=embed)
            return

        embed = discord.Embed(
            title="📜 سجل المواسم السابقة",
            description=f"عدد المواسم المنقضية: **{len(closed)}**",
            color=COLORS["primary"],
        )
        for s in closed[:10]:
            top = await self.bot.db.get_season_results(s["id"], limit=3)
            if top:
                medals = ["🥇", "🥈", "🥉"]
                lines = [
                    f"{medals[r['rank'] - 1]} <@{r['user_id']}> — {r['points']} نقطة"
                    for r in top
                ]
                value = "\n".join(lines)
            else:
                value = "_لا يوجد مشاركون_"
            embed.add_field(name=f"🏁 {s['name']}", value=value, inline=False)

        embed.set_footer(text="استخدم /season top season_id للاطلاع على ترتيب موسم بعينه")
        await interaction.response.send_message(embed=embed)

    @group.command(name="top", description="عرض أفضل 10 لاعبين في موسم محدد")
    @app_commands.describe(season_id="معرف الموسم (من /season history)")
    async def season_top(
        self, interaction: discord.Interaction, season_id: int
    ) -> None:
        season = await self.bot.db.get_season(season_id)
        if not season:
            await interaction.response.send_message(
                f"❌ لم أجد موسماً برقم `{season_id}`.", ephemeral=True
            )
            return

        results = await self.bot.db.get_season_results(season_id, limit=10)
        if not results:
            await interaction.response.send_message(
                f"_لا يوجد نتائج محفوظة لـ {season['name']}_", ephemeral=True
            )
            return

        embed = discord.Embed(
            title=f"🏆 ترتيب {season['name']}",
            color=COLORS["gold"],
        )
        medals = ["🥇", "🥈", "🥉"]
        lines = []
        for r in results:
            medal = medals[r["rank"] - 1] if r["rank"] <= 3 else f"`#{r['rank']:>2}`"
            _, tier_label, _ = season_tier_for(r["points"])
            lines.append(f"{medal} <@{r['user_id']}> — **{r['points']}** نقطة • {tier_label}")
        embed.description = "\n".join(lines)
        embed.set_footer(text=f"حالة الموسم: {'مغلق' if season['closed'] else 'نشط'}")
        await interaction.response.send_message(embed=embed)


async def setup(bot: commands.Bot):
    await bot.add_cog(SeasonsCog(bot))
