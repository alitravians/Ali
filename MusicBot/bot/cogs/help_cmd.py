"""Help command for the music bot."""
from __future__ import annotations

import discord
from discord import app_commands
from discord.ext import commands

from ..config import COLORS

COMMANDS = {
    "play":        ("🎶 تشغيل أغنية أو رابط YouTube", "/play <رابط أو كلمات بحث>"),
    "skip":        ("⏭️ تخطّي الأغنية الحالية", "/skip"),
    "queue":       ("📋 عرض قائمة الانتظار", "/queue"),
    "pause":       ("⏸️ إيقاف مؤقت", "/pause"),
    "resume":      ("▶️ متابعة التشغيل", "/resume"),
    "stop":        ("⏹️ إيقاف ومسح القائمة + خروج", "/stop"),
    "loop":        ("🔁 وضع التكرار", "/loop mode:off|track|queue"),
    "volume":      ("🔊 مستوى الصوت", "/volume level:0..200"),
    "nowplaying":  ("🎵 معلومات الأغنية الحالية", "/nowplaying"),
    "join":        ("📥 ضمّ البوت لقناتك", "/join"),
    "leave":       ("📤 إخراج البوت", "/leave"),
    "remove":      ("🗑️ حذف أغنية من القائمة", "/remove position:N"),
    "shuffle":     ("🔀 خلط القائمة", "/shuffle"),
}


class HelpCog(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(name="help", description="📖 قائمة أوامر بوت الموسيقى")
    async def help(self, interaction: discord.Interaction) -> None:
        embed = discord.Embed(
            title="🎵 بوت الموسيقى — قائمة الأوامر",
            description="هذا البوت يشغّل الموسيقى من YouTube داخل القنوات الصوتية.",
            color=COLORS["music"],
        )
        for name, (desc, usage) in COMMANDS.items():
            embed.add_field(name=f"`{usage}`", value=desc, inline=False)
        embed.set_footer(text="أوامر الإدارة (`/admin_music_*`) مرئية للإدمن فقط.")
        await interaction.response.send_message(embed=embed, ephemeral=True)

    @app_commands.command(name="about", description="ℹ️ معلومات عن بوت الموسيقى")
    async def about(self, interaction: discord.Interaction) -> None:
        embed = discord.Embed(
            title="🎵 عن بوت الموسيقى",
            description=(
                "بوت موسيقى عربي مبني بـ discord.py 2.4 + yt-dlp + FFmpeg.\n"
                "مفتوح المصدر، يعمل 24/7 على fly.io."
            ),
            color=COLORS["music"],
        )
        embed.add_field(name="المصدر", value="YouTube (روابط + بحث)", inline=False)
        embed.add_field(name="الأوامر", value="`/help` لقائمة كاملة", inline=False)
        await interaction.response.send_message(embed=embed, ephemeral=True)


async def setup(bot: commands.Bot):
    await bot.add_cog(HelpCog(bot))
