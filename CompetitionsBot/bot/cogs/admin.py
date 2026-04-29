"""/admin — admin commands for managing the bot."""
from __future__ import annotations

import discord
from discord import app_commands
from discord.ext import commands

from ..config import COLORS, Settings


def _is_admin_or_mod(interaction: discord.Interaction) -> bool:
    if not isinstance(interaction.user, discord.Member):
        return False
    settings: Settings = interaction.client.settings  # type: ignore[attr-defined]
    if interaction.user.guild_permissions.administrator:
        return True
    role_ids = {r.id for r in interaction.user.roles}
    return bool(settings.role_mod and settings.role_mod in role_ids)


class AdminCog(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.settings: Settings = bot.settings  # type: ignore[attr-defined]

    admin_group = app_commands.Group(
        name="admin",
        description="أوامر الإدارة",
        default_permissions=discord.Permissions(manage_guild=True),
    )

    @admin_group.command(name="reset_weekly", description="تصفير نقاط الأسبوع")
    async def reset_weekly(self, interaction: discord.Interaction):
        if not _is_admin_or_mod(interaction):
            await interaction.response.send_message("🚫 ليست لديك صلاحية.", ephemeral=True)
            return
        await self.bot.db.reset_period("weekly")
        await interaction.response.send_message("✅ تم تصفير نقاط الأسبوع.", ephemeral=True)

    @admin_group.command(name="reset_monthly", description="تصفير نقاط الشهر")
    async def reset_monthly(self, interaction: discord.Interaction):
        if not _is_admin_or_mod(interaction):
            await interaction.response.send_message("🚫 ليست لديك صلاحية.", ephemeral=True)
            return
        await self.bot.db.reset_period("monthly")
        await interaction.response.send_message("✅ تم تصفير نقاط الشهر.", ephemeral=True)

    @admin_group.command(name="announce", description="إرسال إعلان مخصص في قناة الإعلانات")
    @app_commands.describe(message="نص الإعلان")
    async def announce(self, interaction: discord.Interaction, message: str):
        if not _is_admin_or_mod(interaction):
            await interaction.response.send_message("🚫 ليست لديك صلاحية.", ephemeral=True)
            return
        ch = self.bot.get_channel(self.settings.channel_announcements)
        if not isinstance(ch, discord.TextChannel):
            await interaction.response.send_message("❌ لم أجد قناة الإعلانات.", ephemeral=True)
            return
        embed = discord.Embed(
            title="📢 إعلان جديد",
            description=message,
            color=COLORS["primary"],
        )
        embed.set_footer(text=f"بواسطة {interaction.user.display_name}")
        await ch.send(embed=embed)
        await interaction.response.send_message("✅ تم إرسال الإعلان.", ephemeral=True)

    @admin_group.command(name="grant_points", description="منح نقاط لعضو")
    @app_commands.describe(user="العضو", points="عدد النقاط")
    async def grant_points(
        self,
        interaction: discord.Interaction,
        user: discord.Member,
        points: app_commands.Range[int, -10000, 10000],
    ):
        if not _is_admin_or_mod(interaction):
            await interaction.response.send_message("🚫 ليست لديك صلاحية.", ephemeral=True)
            return
        await self.bot.db.ensure_user(user.id, user.display_name)
        await self.bot.db.add_points(user.id, points, correct=True if points > 0 else False)
        await interaction.response.send_message(
            f"✅ تم منح {user.mention} **{points}** نقطة.", ephemeral=True
        )

    @admin_group.command(name="ban", description="حظر عضو من المسابقات")
    @app_commands.describe(user="العضو", reason="السبب")
    async def ban(
        self,
        interaction: discord.Interaction,
        user: discord.Member,
        reason: str = "مخالفة قواعد المسابقات",
    ):
        if not _is_admin_or_mod(interaction):
            await interaction.response.send_message("🚫 ليست لديك صلاحية.", ephemeral=True)
            return
        if not self.settings.role_banned:
            await interaction.response.send_message("❌ لم تُعدّ رتبة الحظر.", ephemeral=True)
            return
        role = interaction.guild.get_role(self.settings.role_banned)
        if not role:
            await interaction.response.send_message("❌ رتبة الحظر مفقودة.", ephemeral=True)
            return
        try:
            await user.add_roles(role, reason=reason)
        except discord.Forbidden:
            await interaction.response.send_message(
                "❌ ليس لدي صلاحيات كافية لإضافة الرتبة.", ephemeral=True
            )
            return
        await interaction.response.send_message(
            f"🔇 تم حظر {user.mention} من المسابقات. السبب: {reason}", ephemeral=True
        )

    @admin_group.command(name="unban", description="رفع الحظر عن عضو")
    @app_commands.describe(user="العضو")
    async def unban(self, interaction: discord.Interaction, user: discord.Member):
        if not _is_admin_or_mod(interaction):
            await interaction.response.send_message("🚫 ليست لديك صلاحية.", ephemeral=True)
            return
        if not self.settings.role_banned:
            await interaction.response.send_message("❌ لم تُعدّ رتبة الحظر.", ephemeral=True)
            return
        role = interaction.guild.get_role(self.settings.role_banned)
        if role and role in user.roles:
            try:
                await user.remove_roles(role)
            except discord.Forbidden:
                await interaction.response.send_message(
                    "❌ ليس لدي صلاحيات كافية.", ephemeral=True
                )
                return
        await interaction.response.send_message(f"✅ تم رفع الحظر عن {user.mention}.", ephemeral=True)

    # ───────────────────────── Chat controls ─────────────────────────
    @admin_group.command(name="lock", description="🔒 قفل الكتابة في القناة")
    @app_commands.describe(
        channel="القناة (افتراضياً القناة الحالية)",
        reason="سبب القفل (اختياري)",
    )
    async def lock(
        self,
        interaction: discord.Interaction,
        channel: discord.TextChannel | None = None,
        reason: str | None = None,
    ):
        if not _is_admin_or_mod(interaction):
            await interaction.response.send_message("🚫 ليست لديك صلاحية.", ephemeral=True)
            return
        target = channel or interaction.channel
        if not isinstance(target, discord.TextChannel):
            await interaction.response.send_message("❌ يجب أن تكون قناة نصية.", ephemeral=True)
            return
        guild = interaction.guild
        assert guild is not None
        everyone = guild.default_role
        overwrite = target.overwrites_for(everyone)
        if overwrite.send_messages is False:
            await interaction.response.send_message(
                f"ℹ️ {target.mention} مقفولة مسبقاً.", ephemeral=True
            )
            return
        overwrite.send_messages = False
        overwrite.add_reactions = False
        overwrite.create_public_threads = False
        overwrite.create_private_threads = False
        overwrite.send_messages_in_threads = False
        try:
            await target.set_permissions(
                everyone,
                overwrite=overwrite,
                reason=f"Lock by {interaction.user} — {reason or 'no reason'}",
            )
        except discord.Forbidden:
            await interaction.response.send_message(
                "❌ ليس لدي صلاحيات كافية لتعديل القناة.", ephemeral=True
            )
            return

        embed = discord.Embed(
            title="🔒 تم قفل القناة",
            description=(
                f"**القناة:** {target.mention}\n"
                f"**بواسطة:** {interaction.user.mention}\n"
                f"**السبب:** {reason or '—'}\n\n"
                "لا يمكن للأعضاء الكتابة هنا حتى يتم فتحها مجدداً."
            ),
            color=COLORS.get("danger", 0xE74C3C),
        )
        await interaction.response.send_message(embed=embed)
        # Also send a quiet notice in the locked channel if it's not the same one
        if target.id != (interaction.channel.id if interaction.channel else 0):
            try:
                await target.send(embed=embed)
            except discord.HTTPException:
                pass

    @admin_group.command(name="unlock", description="🔓 فتح قناة مقفولة")
    @app_commands.describe(channel="القناة (افتراضياً القناة الحالية)")
    async def unlock(
        self,
        interaction: discord.Interaction,
        channel: discord.TextChannel | None = None,
    ):
        if not _is_admin_or_mod(interaction):
            await interaction.response.send_message("🚫 ليست لديك صلاحية.", ephemeral=True)
            return
        target = channel or interaction.channel
        if not isinstance(target, discord.TextChannel):
            await interaction.response.send_message("❌ يجب أن تكون قناة نصية.", ephemeral=True)
            return
        guild = interaction.guild
        assert guild is not None
        everyone = guild.default_role
        overwrite = target.overwrites_for(everyone)
        # Reset back to inheriting (None) for the relevant flags
        overwrite.send_messages = None
        overwrite.add_reactions = None
        overwrite.create_public_threads = None
        overwrite.create_private_threads = None
        overwrite.send_messages_in_threads = None
        try:
            await target.set_permissions(
                everyone,
                overwrite=overwrite,
                reason=f"Unlock by {interaction.user}",
            )
        except discord.Forbidden:
            await interaction.response.send_message(
                "❌ ليس لدي صلاحيات كافية لتعديل القناة.", ephemeral=True
            )
            return
        embed = discord.Embed(
            title="🔓 تم فتح القناة",
            description=f"**القناة:** {target.mention}\n**بواسطة:** {interaction.user.mention}",
            color=COLORS.get("success", 0x2ECC71),
        )
        await interaction.response.send_message(embed=embed)

    @admin_group.command(name="clear", description="🧹 حذف عدد من الرسائل من القناة الحالية")
    @app_commands.describe(amount="عدد الرسائل (1-100)")
    async def clear(
        self,
        interaction: discord.Interaction,
        amount: app_commands.Range[int, 1, 100],
    ):
        if not _is_admin_or_mod(interaction):
            await interaction.response.send_message("🚫 ليست لديك صلاحية.", ephemeral=True)
            return
        channel = interaction.channel
        if not isinstance(channel, discord.TextChannel):
            await interaction.response.send_message("❌ يجب استخدامه في قناة نصية.", ephemeral=True)
            return
        await interaction.response.defer(ephemeral=True, thinking=True)
        try:
            deleted = await channel.purge(limit=amount, bulk=True)
        except discord.Forbidden:
            await interaction.followup.send("❌ ليس لدي صلاحية Manage Messages.", ephemeral=True)
            return
        except discord.HTTPException as e:
            await interaction.followup.send(f"❌ خطأ: {e}", ephemeral=True)
            return
        await interaction.followup.send(
            f"🧹 تم حذف **{len(deleted)}** رسالة من {channel.mention}.",
            ephemeral=True,
        )

    @admin_group.command(name="clear_user", description="🧹 حذف رسائل عضو معيّن")
    @app_commands.describe(
        user="العضو",
        amount="عدد آخر الرسائل التي يتم فحصها (1-100، الافتراضي 50)",
    )
    async def clear_user(
        self,
        interaction: discord.Interaction,
        user: discord.Member,
        amount: app_commands.Range[int, 1, 100] = 50,
    ):
        if not _is_admin_or_mod(interaction):
            await interaction.response.send_message("🚫 ليست لديك صلاحية.", ephemeral=True)
            return
        channel = interaction.channel
        if not isinstance(channel, discord.TextChannel):
            await interaction.response.send_message("❌ يجب استخدامه في قناة نصية.", ephemeral=True)
            return
        await interaction.response.defer(ephemeral=True, thinking=True)
        try:
            deleted = await channel.purge(
                limit=amount,
                check=lambda m: m.author.id == user.id,
                bulk=True,
            )
        except discord.Forbidden:
            await interaction.followup.send("❌ ليس لدي صلاحية Manage Messages.", ephemeral=True)
            return
        except discord.HTTPException as e:
            await interaction.followup.send(f"❌ خطأ: {e}", ephemeral=True)
            return
        await interaction.followup.send(
            f"🧹 تم حذف **{len(deleted)}** رسالة من {user.mention} في {channel.mention}.",
            ephemeral=True,
        )


async def setup(bot: commands.Bot):
    await bot.add_cog(AdminCog(bot))
