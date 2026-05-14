"""Owner-only administrative commands.

Currently:
  /reset-verification → sweep every regular member back to @unverified so they
                        re-verify in #welcome (used when seeding the new
                        verification flow against an already-populated guild).
"""

from __future__ import annotations

import logging
from typing import Any

import discord
from discord import app_commands
from discord.ext import commands

log = logging.getLogger("boon-bot.admin")


class Admin(commands.Cog):
    def __init__(self, bot: commands.Bot) -> None:
        self.bot = bot

    def _role(self, guild: discord.Guild, key: str) -> discord.Role | None:
        cfg: dict[str, Any] = getattr(self.bot, "server_config", None) or {}
        rid = cfg.get("roles", {}).get(key)
        return guild.get_role(int(rid)) if rid else None

    @app_commands.command(
        name="reset-verification",
        description="(Owner) إعادة جميع الأعضاء العاديين إلى @unverified لإعادة التحقّق",
    )
    @app_commands.default_permissions(administrator=True)
    async def reset_verification(self, interaction: discord.Interaction) -> None:
        await interaction.response.defer(ephemeral=True, thinking=True)
        guild = interaction.guild
        if guild is None:
            await interaction.followup.send("استخدم داخل سيرفر.", ephemeral=True)
            return
        if interaction.user.id != guild.owner_id:
            await interaction.followup.send("هذا الأمر للمالك فقط.", ephemeral=True)
            return

        member_role = self._role(guild, "member")
        unverified = self._role(guild, "unverified")
        if not (member_role and unverified):
            await interaction.followup.send(
                "⚠️ الرتب @member / @unverified غير مهيّأة في server_config.json.",
                ephemeral=True,
            )
            return

        # Verify the bot's top role outranks the roles it needs to assign.
        bot_member = guild.me
        if bot_member is None:
            await interaction.followup.send("لم أجد عضوية البوت في السيرفر.", ephemeral=True)
            return
        bot_top = bot_member.top_role
        if bot_top.position <= max(member_role.position, unverified.position):
            await interaction.followup.send(
                "⚠️ دور البوت أقل من @member أو @unverified. "
                "ارفع دور البوت من Server Settings → Roles ثم أعد المحاولة.",
                ephemeral=True,
            )
            return

        processed = 0
        skipped_admin = 0
        skipped_bot = 0
        skipped_already = 0
        failed = 0
        async for member in guild.fetch_members(limit=None):
            if member.bot:
                skipped_bot += 1
                continue
            if member.id == guild.owner_id:
                skipped_admin += 1
                continue
            if member.guild_permissions.administrator:
                skipped_admin += 1
                continue
            if unverified in member.roles:
                skipped_already += 1
                continue
            try:
                if member_role in member.roles:
                    await member.remove_roles(member_role, reason="reset-verification (owner sweep)")
                await member.add_roles(unverified, reason="reset-verification (owner sweep)")
                processed += 1
            except discord.Forbidden:
                failed += 1
                log.warning("forbidden resetting %s", member)
            except discord.HTTPException as exc:
                failed += 1
                log.warning("HTTP error resetting %s: %s", member, exc)

        report = (
            f"**تم: {processed}** عضو أُعيد إلى @unverified\n"
            f"تُخطّوا (مسؤولون/مالك): {skipped_admin}\n"
            f"تُخطّوا (بوتات): {skipped_bot}\n"
            f"تُخطّوا (موجود مسبقاً @unverified): {skipped_already}\n"
            f"فشل: {failed}"
        )
        await interaction.followup.send(report, ephemeral=True)
        log.info(
            "reset-verification: processed=%d skipped_admin=%d skipped_bot=%d "
            "skipped_already=%d failed=%d",
            processed, skipped_admin, skipped_bot, skipped_already, failed,
        )

        # Audit log to #admin-actions.
        cfg: dict[str, Any] = getattr(self.bot, "server_config", None) or {}
        actions_id = cfg.get("channels", {}).get("log_admin_actions")
        if actions_id:
            ch = guild.get_channel(int(actions_id))
            if isinstance(ch, discord.TextChannel):
                try:
                    await ch.send(
                        f"🔄 <@{interaction.user.id}> شغّل reset-verification\n{report}"
                    )
                except discord.Forbidden:
                    pass


async def setup(bot: commands.Bot) -> None:
    await bot.add_cog(Admin(bot))
