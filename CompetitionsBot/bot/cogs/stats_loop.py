"""Background stats updater + /stats command."""
from __future__ import annotations

import discord
from discord import app_commands
from discord.ext import commands, tasks

from .. import questions as qbank
from ..config import COLORS, Settings


class StatsLoopCog(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.settings: Settings = bot.settings  # type: ignore[attr-defined]
        self.update_stats.start()

    def cog_unload(self):
        self.update_stats.cancel()

    @tasks.loop(minutes=5)
    async def update_stats(self):
        await self.bot.wait_until_ready()
        ch = self.bot.get_channel(self.settings.channel_stats)
        if not isinstance(ch, discord.TextChannel):
            return
        try:
            stats = await self.bot.db.stats()
            embed = self._build_embed(stats, ch.guild)
            async for msg in ch.history(limit=10):
                if msg.author.id == self.bot.user.id and msg.embeds and msg.embeds[0].title == "📊 إحصائيات السيرفر":
                    await msg.edit(embed=embed)
                    return
            await ch.send(embed=embed)
        except Exception:
            pass

    def _build_embed(self, stats: dict, guild: discord.Guild) -> discord.Embed:
        embed = discord.Embed(
            title="📊 إحصائيات السيرفر",
            color=COLORS["info"],
            timestamp=discord.utils.utcnow(),
        )
        embed.add_field(name="👥 الأعضاء الكلي", value=f"`{guild.member_count}`", inline=True)
        embed.add_field(name="🤖 لاعبو البوت", value=f"`{stats['users']}`", inline=True)
        embed.add_field(name="🎯 المسابقات الكلية", value=f"`{stats['competitions']}`", inline=True)
        embed.add_field(name="✅ الإجابات الصحيحة", value=f"`{stats['correct_answers']}`", inline=True)
        embed.add_field(name="💰 إجمالي النقاط", value=f"`{stats['total_points']}`", inline=True)
        embed.add_field(name="📚 بنك الأسئلة", value=f"`{qbank.total()}` سؤال", inline=True)
        embed.set_footer(text="يحدّث كل 5 دقائق تلقائيًا")
        return embed

    @app_commands.command(name="stats", description="📊 إحصائيات السيرفر العامة")
    async def stats_cmd(self, interaction: discord.Interaction):
        stats = await self.bot.db.stats()
        embed = self._build_embed(stats, interaction.guild)
        await interaction.response.send_message(embed=embed)


async def setup(bot: commands.Bot):
    await bot.add_cog(StatsLoopCog(bot))
