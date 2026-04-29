"""/help — interactive command menu."""
from __future__ import annotations

import discord
from discord import app_commands
from discord.ext import commands

from ..config import COLORS


HELP_PAGES = {
    "main": discord.Embed(
        title="🏆 بوت المسابقات — قائمة الأوامر",
        description="مرحبًا بك! اضغط أي زر بالأسفل لعرض تفاصيل قسم معين.",
        color=COLORS["primary"],
    ).add_field(
        name="📚 الأقسام المتاحة",
        value=(
            "🎯 **مسابقات** — `/quiz`, `/race`, `/contest`, `/tournament`, `/daily`\n"
            "📊 **إحصائيات** — `/leaderboard`, `/profile`, `/stats`\n"
            "⚙️ **إدارة** — للإدمن فقط: `/admin`\n"
            "❓ **أخرى** — `/help`, `/about`"
        ),
        inline=False,
    ).set_footer(text="استخدم الأوامر في القناة المخصصة لها 🎮"),
    "competitions": discord.Embed(
        title="🎯 أوامر المسابقات",
        color=COLORS["primary"],
    ).add_field(name="`/quiz`", value="مسابقة ترفيا (فئة + صعوبة + عدد أسئلة)", inline=False)
        .add_field(name="`/race`", value="سباق سرعة — أول من يضغط الزر يفوز", inline=False)
        .add_field(name="`/contest`", value="مسابقة مخصصة (للإدمن/المنسق)", inline=False)
        .add_field(name="`/tournament`", value="بطولة 1v1 إقصائية", inline=False)
        .add_field(name="`/daily`", value="السؤال اليومي بنقاط مضاعفة", inline=False),
    "stats": discord.Embed(
        title="📊 الإحصائيات",
        color=COLORS["info"],
    ).add_field(name="`/leaderboard scope:weekly|monthly|all`", value="لوحة المتصدرين", inline=False)
        .add_field(name="`/profile [user]`", value="ملفك الشخصي وإحصائياتك", inline=False)
        .add_field(name="`/stats`", value="إحصائيات السيرفر العامة", inline=False),
    "admin": discord.Embed(
        title="⚙️ أوامر الإدارة",
        description="هذه الأوامر للإدمن أو منسق المسابقات فقط.",
        color=COLORS["warning"],
    ).add_field(name="`/admin reset_weekly`", value="تصفير نقاط الأسبوع", inline=False)
        .add_field(name="`/admin reset_monthly`", value="تصفير نقاط الشهر", inline=False)
        .add_field(name="`/admin announce`", value="إرسال إعلان مخصص", inline=False)
        .add_field(name="`/admin grant_points user points`", value="منح نقاط يدوي", inline=False)
        .add_field(name="`/admin ban user`", value="حظر عضو من المسابقات", inline=False)
        .add_field(name="`/admin unban user`", value="رفع الحظر", inline=False)
        .add_field(name="`/admin lock [channel] [reason]`", value="🔒 قفل الكتابة في قناة", inline=False)
        .add_field(name="`/admin unlock [channel]`", value="🔓 فتح قناة مقفولة", inline=False)
        .add_field(name="`/admin clear amount`", value="🧹 حذف عدد رسائل (1-100)", inline=False)
        .add_field(name="`/admin clear_user user [amount]`", value="🧹 حذف رسائل عضو معين", inline=False),
}


class HelpView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=180)
        self.current = "main"

    @discord.ui.button(label="الرئيسية", emoji="🏠", style=discord.ButtonStyle.secondary, row=0)
    async def home_btn(self, interaction: discord.Interaction, _button: discord.ui.Button):
        await interaction.response.edit_message(embed=HELP_PAGES["main"], view=self)

    @discord.ui.button(label="مسابقات", emoji="🎯", style=discord.ButtonStyle.primary, row=0)
    async def comp_btn(self, interaction: discord.Interaction, _button: discord.ui.Button):
        await interaction.response.edit_message(embed=HELP_PAGES["competitions"], view=self)

    @discord.ui.button(label="إحصائيات", emoji="📊", style=discord.ButtonStyle.success, row=0)
    async def stats_btn(self, interaction: discord.Interaction, _button: discord.ui.Button):
        await interaction.response.edit_message(embed=HELP_PAGES["stats"], view=self)

    @discord.ui.button(label="إدارة", emoji="⚙️", style=discord.ButtonStyle.danger, row=0)
    async def admin_btn(self, interaction: discord.Interaction, _button: discord.ui.Button):
        await interaction.response.edit_message(embed=HELP_PAGES["admin"], view=self)


class HelpCog(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(name="help", description="عرض قائمة الأوامر التفاعلية")
    async def help_cmd(self, interaction: discord.Interaction):
        await interaction.response.send_message(
            embed=HELP_PAGES["main"], view=HelpView(), ephemeral=True
        )

    @app_commands.command(name="about", description="معلومات عن البوت")
    async def about(self, interaction: discord.Interaction):
        embed = discord.Embed(
            title="🤖 بوت المسابقات",
            description=(
                "بوت احترافي متخصص في إدارة المسابقات داخل سيرفر **A💗M's**.\n\n"
                "✨ **مميزاته:**\n"
                "• 8+ أوامر للمسابقات المتنوعة\n"
                "• ترحيب تلقائي قبل كل مسابقة\n"
                "• 4+ أنماط بصرية مختلفة للأسئلة\n"
                "• نظام نقاط وXP وشارات\n"
                "• لوحة متصدرين أسبوعية وشهرية وإجمالية\n"
                "• 70+ سؤال عربي بـ 9 فئات\n"
                "• قاعدة بيانات SQLite دائمة"
            ),
            color=COLORS["primary"],
        )
        embed.add_field(name="الإصدار", value="`v1.0`", inline=True)
        embed.add_field(name="المكتبة", value="discord.py 2.4", inline=True)
        embed.add_field(name="الاستضافة", value="fly.io 24/7", inline=True)
        embed.set_footer(text="من تطوير Devin بمعرفة Cognition AI 🚀")
        await interaction.response.send_message(embed=embed, ephemeral=True)


async def setup(bot: commands.Bot):
    await bot.add_cog(HelpCog(bot))
