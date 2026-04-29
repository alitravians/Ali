"""/profile — user stats and achievements."""
from __future__ import annotations

import discord
from discord import app_commands
from discord.ext import commands

from .. import utils
from ..config import ACHIEVEMENTS, COLORS


class ProfileCog(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(name="profile", description="📜 ملفك الشخصي وإحصائياتك")
    @app_commands.describe(user="عضو محدد (افتراضي: أنت)")
    async def profile(
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

        level, into_level, level_size = utils.points_to_level(data["points"])
        bar = utils.progress_bar(into_level, level_size, 14)
        accuracy = (data["correct_answers"] / data["total_answers"] * 100) if data["total_answers"] else 0

        embed = discord.Embed(
            title=f"📜 ملف {target.display_name}",
            color=COLORS["primary"],
        )
        embed.set_thumbnail(url=target.display_avatar.url)
        embed.add_field(
            name="⭐ المستوى",
            value=f"**Lvl {level}**\n`{bar}` {into_level}/{level_size}",
            inline=False,
        )
        embed.add_field(name="💰 النقاط", value=f"`{data['points']}`", inline=True)
        embed.add_field(name="🏆 الانتصارات", value=f"`{data['wins']}`", inline=True)
        embed.add_field(name="🎯 المسابقات", value=f"`{data['competitions']}`", inline=True)
        embed.add_field(
            name="✅ الإجابات الصحيحة",
            value=f"`{data['correct_answers']}/{data['total_answers']}` ({accuracy:.1f}%)",
            inline=True,
        )
        embed.add_field(name="🔥 أفضل سلسلة", value=f"`{data['best_streak']}`", inline=True)
        embed.add_field(name="⚡ إجابات سريعة", value=f"`{data['fast_answers']}`", inline=True)

        # Achievements
        if data["achievements"]:
            ach_lines = []
            for aid in data["achievements"]:
                if aid in ACHIEVEMENTS:
                    name, _, _ = ACHIEVEMENTS[aid]
                    ach_lines.append(f"• {name}")
            embed.add_field(
                name=f"🎖️ الإنجازات ({len(ach_lines)}/{len(ACHIEVEMENTS)})",
                value="\n".join(ach_lines) or "—",
                inline=False,
            )
        else:
            embed.add_field(
                name=f"🎖️ الإنجازات (0/{len(ACHIEVEMENTS)})",
                value="_لا توجد إنجازات بعد. شارك في المسابقات!_",
                inline=False,
            )

        await interaction.response.send_message(embed=embed)


async def setup(bot: commands.Bot):
    await bot.add_cog(ProfileCog(bot))
