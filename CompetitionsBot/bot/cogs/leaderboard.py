"""/leaderboard — display rankings."""
from __future__ import annotations

import discord
from discord import app_commands
from discord.ext import commands

from .. import utils
from ..config import COLORS


class LeaderboardCog(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(name="leaderboard", description="📊 لوحة المتصدرين")
    @app_commands.describe(scope="نطاق التصنيف")
    @app_commands.choices(scope=[
        app_commands.Choice(name="📅 الأسبوع", value="weekly"),
        app_commands.Choice(name="📆 الشهر", value="monthly"),
        app_commands.Choice(name="🏆 كل الوقت", value="all"),
    ])
    async def leaderboard(
        self,
        interaction: discord.Interaction,
        scope: app_commands.Choice[str] = None,
    ):
        scope_v = scope.value if scope else "all"
        rows = await self.bot.db.leaderboard(scope_v, 15)
        title_map = {"weekly": "📅 المتصدرون هذا الأسبوع", "monthly": "📆 المتصدرون هذا الشهر", "all": "🏆 المتصدرون — كل الوقت"}
        embed = discord.Embed(
            title=title_map[scope_v],
            description=utils.format_leaderboard(rows, scope_v),
            color=COLORS["gold"],
        )
        embed.set_footer(text="استخدم /profile لعرض ملفك الشخصي")
        await interaction.response.send_message(embed=embed)


async def setup(bot: commands.Bot):
    await bot.add_cog(LeaderboardCog(bot))
