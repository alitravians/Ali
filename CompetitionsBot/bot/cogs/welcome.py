"""Welcome cog — greets new members and provides reusable welcome helpers."""
from __future__ import annotations

import discord
from discord.ext import commands

from ..config import COLORS, Settings


class WelcomeCog(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.settings: Settings = bot.settings  # type: ignore[attr-defined]

    @commands.Cog.listener()
    async def on_member_join(self, member: discord.Member):
        if member.guild.id != self.settings.guild_id:
            return
        # Auto-assign newbie role
        if self.settings.role_newbie:
            role = member.guild.get_role(self.settings.role_newbie)
            if role:
                try:
                    await member.add_roles(role, reason="مشارك جديد تلقائيًا")
                except discord.Forbidden:
                    pass

        ch = member.guild.get_channel(self.settings.channel_welcome)
        if not isinstance(ch, discord.TextChannel):
            return
        embed = discord.Embed(
            title=f"🎉 أهلاً {member.display_name}!",
            description=(
                f"مرحبًا بك في **{member.guild.name}** 💗\n\n"
                f"أنت العضو رقم **#{member.guild.member_count}** — يسعدنا انضمامك!\n\n"
                "🎮 ابدأ من <#{}> واستخدم `/quiz` لأول مسابقة\n"
                "📋 اقرأ القواعد في <#{}>\n"
                "🏅 شوف ترتيبك في <#{}>"
            ).format(
                self.settings.channel_start,
                self.settings.channel_rules,
                self.settings.channel_leaderboard,
            ),
            color=COLORS["pink"],
        )
        embed.set_thumbnail(url=member.display_avatar.url)
        embed.set_footer(text="تم منحك رتبة 🆕 مشارك جديد تلقائيًا")
        try:
            await ch.send(content=member.mention, embed=embed)
        except discord.Forbidden:
            pass


async def setup(bot: commands.Bot):
    await bot.add_cog(WelcomeCog(bot))
