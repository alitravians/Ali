"""/achievements — show earned + locked badges with progress hints."""
from __future__ import annotations

import discord
from discord import app_commands
from discord.ext import commands

from ..config import ACHIEVEMENTS, ACHIEVEMENT_TIER_COLOR, COLORS


TIER_ORDER = ["bronze", "silver", "gold", "diamond"]
TIER_LABEL = {
    "bronze":  "🥉 برونزي",
    "silver":  "🥈 فضّي",
    "gold":    "🥇 ذهبي",
    "diamond": "💎 ماسي",
}


class AchievementsCog(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(
        name="achievements",
        description="🎖️ عرض كل الإنجازات (المفتوحة والمقفلة) لك أو لعضو آخر",
    )
    @app_commands.describe(user="عضو محدد (افتراضي: أنت)")
    async def achievements(
        self,
        interaction: discord.Interaction,
        user: discord.Member | None = None,
    ):
        target = user or interaction.user
        await self.bot.db.ensure_user(target.id, target.display_name)
        data = await self.bot.db.get_user(target.id)
        if not data:
            await interaction.response.send_message("❌ لم أجد بيانات.", ephemeral=True)
            return

        # Only count achievement IDs that still exist in the current config —
        # historical IDs (e.g. removed in a refactor) shouldn't inflate the count.
        earned = set(data.get("achievements", [])) & set(ACHIEVEMENTS.keys())
        total = len(ACHIEVEMENTS)

        # Group by tier
        by_tier: dict[str, list[tuple[str, tuple[str, str, str, str]]]] = {
            t: [] for t in TIER_ORDER
        }
        for aid, meta in ACHIEVEMENTS.items():
            by_tier[meta[3]].append((aid, meta))

        embed = discord.Embed(
            title=f"🎖️ إنجازات {target.display_name}",
            description=f"**{len(earned)}/{total}** إنجاز مفتوح",
            color=COLORS["gold"],
        )
        embed.set_thumbnail(url=target.display_avatar.url)

        for tier in TIER_ORDER:
            items = by_tier[tier]
            if not items:
                continue
            lines = []
            for aid, meta in items:
                name, desc, req, _ = meta
                status = "✅" if aid in earned else "🔒"
                lines.append(f"{status} **{name}** — _{desc}_")
            embed.add_field(
                name=TIER_LABEL[tier],
                value="\n".join(lines),
                inline=False,
            )

        # Color shifts to highest unlocked tier
        highest_tier = "bronze"
        for tier in TIER_ORDER:
            if any(aid in earned for aid, _ in by_tier[tier]):
                highest_tier = tier
        embed.color = ACHIEVEMENT_TIER_COLOR.get(highest_tier, COLORS["gold"])

        embed.set_footer(text="✅ مفتوح • 🔒 مقفل — استخدم /profile لإحصائياتك")
        await interaction.response.send_message(embed=embed)


async def setup(bot: commands.Bot):
    await bot.add_cog(AchievementsCog(bot))
