"""/team — clans (teams) for the trivia bot.

Members can create a team, invite/leave, and compete on a team leaderboard
ranked by aggregate member points.
"""
from __future__ import annotations

import re

import discord
from discord import app_commands
from discord.ext import commands

from ..config import COLORS


_TEAM_NAME_RE = re.compile(r"^[\w\u0600-\u06FF \-_]{3,24}$")


class TeamsCog(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    group = app_commands.Group(
        name="team",
        description="🛡️ إدارة الفرق (الكلانات)",
    )

    @group.command(name="create", description="إنشاء فريق جديد")
    @app_commands.describe(
        name="اسم الفريق (3-24 حرف)",
        description_="وصف اختياري للفريق",
        icon="رمز/إيموجي للفريق",
    )
    @app_commands.rename(description_="description")
    async def create(
        self,
        interaction: discord.Interaction,
        name: str,
        description_: str | None = None,
        icon: str | None = None,
    ):
        name = name.strip()
        if not _TEAM_NAME_RE.match(name):
            await interaction.response.send_message(
                "❌ اسم الفريق يجب أن يكون 3-24 حرفاً (عربي/لاتيني/أرقام/شرطة).",
                ephemeral=True,
            )
            return
        await self.bot.db.ensure_user(interaction.user.id, interaction.user.display_name)
        existing = await self.bot.db.get_user_team(interaction.user.id)
        if existing:
            await interaction.response.send_message(
                f"⚠️ أنت بالفعل في فريق **{existing['name']}**. اخرج منه أولاً عبر `/team leave`.",
                ephemeral=True,
            )
            return
        if await self.bot.db.get_team_by_name(name):
            await interaction.response.send_message(
                "❌ يوجد فريق بنفس الاسم بالفعل.", ephemeral=True
            )
            return
        tid = await self.bot.db.create_team(
            name, interaction.user.id, description=description_, icon=icon
        )
        embed = discord.Embed(
            title=f"{icon or '🛡️'} تم إنشاء الفريق: {name}",
            description=(description_ or "—") + f"\n\nأنشأه: {interaction.user.mention}",
            color=COLORS.get("success", 0x2ECC71),
        )
        embed.set_footer(text=f"#{tid} • استخدم `/team join {name}` للانضمام")
        await interaction.response.send_message(embed=embed)

    @group.command(name="join", description="انضمام إلى فريق موجود")
    @app_commands.describe(name="اسم الفريق")
    async def join(self, interaction: discord.Interaction, name: str):
        await self.bot.db.ensure_user(interaction.user.id, interaction.user.display_name)
        existing = await self.bot.db.get_user_team(interaction.user.id)
        if existing:
            await interaction.response.send_message(
                f"⚠️ أنت بالفعل في فريق **{existing['name']}**. اخرج منه أولاً.",
                ephemeral=True,
            )
            return
        team = await self.bot.db.get_team_by_name(name.strip())
        if not team:
            await interaction.response.send_message(
                "❌ لا يوجد فريق بهذا الاسم.", ephemeral=True
            )
            return
        await self.bot.db.add_team_member(team["id"], interaction.user.id)
        await interaction.response.send_message(
            f"✅ انضممت إلى فريق **{team['name']}**!"
        )

    @group.command(name="leave", description="مغادرة فريقك الحالي")
    async def leave(self, interaction: discord.Interaction):
        team = await self.bot.db.get_user_team(interaction.user.id)
        if not team:
            await interaction.response.send_message(
                "⚠️ أنت لست في أي فريق.", ephemeral=True
            )
            return
        if team["owner_id"] == interaction.user.id:
            members = await self.bot.db.list_team_members(team["id"])
            if len(members) > 1:
                await interaction.response.send_message(
                    "🚫 أنت قائد الفريق. حلّ الفريق عبر `/team disband` أو "
                    "انقل القيادة قبل المغادرة (لا يدعم البوت نقل القيادة بعد).",
                    ephemeral=True,
                )
                return
            await self.bot.db.disband_team(team["id"])
            await interaction.response.send_message(
                f"✅ غادرت فريق **{team['name']}** وتم حلّه (كنت العضو الوحيد).",
                ephemeral=True,
            )
            return
        await self.bot.db.remove_team_member(team["id"], interaction.user.id)
        await interaction.response.send_message(
            f"✅ غادرت فريق **{team['name']}**.", ephemeral=True
        )

    @group.command(name="disband", description="حلّ فريقك (للقائد فقط)")
    async def disband(self, interaction: discord.Interaction):
        team = await self.bot.db.get_user_team(interaction.user.id)
        if not team:
            await interaction.response.send_message(
                "⚠️ أنت لست في فريق.", ephemeral=True
            )
            return
        if team["owner_id"] != interaction.user.id:
            await interaction.response.send_message(
                "🚫 فقط قائد الفريق يقدر يحلّه.", ephemeral=True
            )
            return
        name = team["name"]
        await self.bot.db.disband_team(team["id"])
        await interaction.response.send_message(
            f"✅ تم حلّ فريق **{name}**.", ephemeral=True
        )

    @group.command(name="info", description="معلومات الفريق + قائمة الأعضاء")
    @app_commands.describe(name="اسم الفريق (افتراضي: فريقك)")
    async def info(self, interaction: discord.Interaction, name: str | None = None):
        if name:
            team = await self.bot.db.get_team_by_name(name.strip())
        else:
            team = await self.bot.db.get_user_team(interaction.user.id)
        if not team:
            await interaction.response.send_message(
                "❌ لم أجد فريقاً." if name else "⚠️ أنت لست في فريق. حدّد الاسم أو انضم لواحد.",
                ephemeral=True,
            )
            return
        members = await self.bot.db.list_team_members(team["id"])
        total_pts = sum(m["points"] or 0 for m in members)
        lines = []
        for m in members[:20]:
            role = m["role"]
            mark = "👑" if role == "owner" else "⭐" if role == "officer" else "•"
            lines.append(
                f"{mark} <@{m['user_id']}> — {m['points']} نقطة • ELO {m['elo_rating']}"
            )
        embed = discord.Embed(
            title=f"{team.get('icon') or '🛡️'} فريق: {team['name']}",
            description=team.get("description") or "—",
            color=COLORS.get("info", 0x3498DB),
        )
        embed.add_field(name="عدد الأعضاء", value=str(len(members)), inline=True)
        embed.add_field(name="مجموع النقاط", value=f"{total_pts:,}", inline=True)
        embed.add_field(name="القائد", value=f"<@{team['owner_id']}>", inline=True)
        embed.add_field(
            name="الأعضاء",
            value="\n".join(lines) or "—",
            inline=False,
        )
        await interaction.response.send_message(embed=embed)

    @group.command(name="top", description="🏆 ترتيب الفرق")
    async def top(self, interaction: discord.Interaction):
        teams = await self.bot.db.team_leaderboard(limit=10)
        if not teams:
            await interaction.response.send_message(
                "لا توجد فرق بعد. أنشئ أول فريق عبر `/team create`!",
                ephemeral=True,
            )
            return
        lines = []
        for i, t in enumerate(teams, start=1):
            medal = "🥇" if i == 1 else "🥈" if i == 2 else "🥉" if i == 3 else f"#{i}"
            icon = t.get("icon") or "🛡️"
            lines.append(
                f"{medal} {icon} **{t['name']}** — {int(t['total_points']):,} نقطة "
                f"({t['members']} عضو • ELO ~{int(t['avg_elo'])})"
            )
        embed = discord.Embed(
            title="🏆 ترتيب الفرق",
            description="\n".join(lines),
            color=COLORS.get("gold", 0xF1C40F),
        )
        await interaction.response.send_message(embed=embed)


async def setup(bot: commands.Bot):
    await bot.add_cog(TeamsCog(bot))
