"""/leaderboard — display rankings (global or per-category)."""
from __future__ import annotations

import discord
from discord import app_commands
from discord.ext import commands

from .. import utils
from ..config import CATEGORY_EMOJIS, COLORS


CATEGORY_CHOICES = [
    app_commands.Choice(name="🌐 عام", value="عام"),
    app_commands.Choice(name="🇸🇦 عربي", value="عربي"),
    app_commands.Choice(name="📜 تاريخ", value="تاريخ"),
    app_commands.Choice(name="🗺️ جغرافيا", value="جغرافيا"),
    app_commands.Choice(name="⚽ رياضة", value="رياضة"),
    app_commands.Choice(name="💻 تقنية", value="تقنية"),
    app_commands.Choice(name="🕌 إسلامي", value="إسلامي"),
    app_commands.Choice(name="🔬 علوم", value="علوم"),
    app_commands.Choice(name="🎬 أفلام", value="أفلام"),
]


class LeaderboardCog(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(name="leaderboard", description="📊 لوحة المتصدرين (عام أو حسب فئة)")
    @app_commands.describe(
        scope="نطاق التصنيف الزمني (يُستخدم فقط مع التصنيف العام)",
        category="فئة محددة (اختياري) — يعرض ترتيب الأعضاء داخل تلك الفئة",
    )
    @app_commands.choices(
        scope=[
            app_commands.Choice(name="📅 الأسبوع", value="weekly"),
            app_commands.Choice(name="📆 الشهر", value="monthly"),
            app_commands.Choice(name="🏆 كل الوقت", value="all"),
        ],
        category=CATEGORY_CHOICES,
    )
    async def leaderboard(
        self,
        interaction: discord.Interaction,
        scope: app_commands.Choice[str] = None,
        category: app_commands.Choice[str] = None,
    ):
        if category is not None:
            await self._category_leaderboard(interaction, category.value)
            return

        scope_v = scope.value if scope else "all"
        rows = await self.bot.db.leaderboard(scope_v, 15)
        title_map = {
            "weekly": "📅 المتصدرون هذا الأسبوع",
            "monthly": "📆 المتصدرون هذا الشهر",
            "all": "🏆 المتصدرون — كل الوقت",
        }
        embed = discord.Embed(
            title=title_map[scope_v],
            description=utils.format_leaderboard(rows, scope_v),
            color=COLORS["gold"],
        )
        embed.set_footer(text="استخدم /leaderboard category لعرض ترتيب فئة معيّنة")
        await interaction.response.send_message(embed=embed)

    async def _category_leaderboard(
        self, interaction: discord.Interaction, category: str
    ) -> None:
        rows = await self.bot.db.category_leaderboard(category, limit=15)
        emoji = CATEGORY_EMOJIS.get(category, "🏷️")

        if not rows:
            embed = discord.Embed(
                title=f"{emoji} ترتيب فئة {category}",
                description="_لا يوجد لاعبون في هذه الفئة بعد. كن أول من يلعب فيها!_",
                color=COLORS["info"],
            )
            await interaction.response.send_message(embed=embed)
            return

        lines = []
        medals = ["🥇", "🥈", "🥉"]
        for i, r in enumerate(rows, start=1):
            medal = medals[i - 1] if i <= 3 else f"`#{i:>2}`"
            acc = (r["correct"] / r["total"] * 100) if r["total"] else 0
            lines.append(
                f"{medal} <@{r['user_id']}> — **{r['points']}** نقطة "
                f"({r['correct']}/{r['total']} • {acc:.0f}%)"
            )

        embed = discord.Embed(
            title=f"{emoji} ترتيب فئة {category}",
            description="\n".join(lines),
            color=COLORS["gold"],
        )
        embed.set_footer(text="الترتيب حسب مجموع النقاط في الفئة فقط")
        await interaction.response.send_message(embed=embed)


async def setup(bot: commands.Bot):
    await bot.add_cog(LeaderboardCog(bot))
