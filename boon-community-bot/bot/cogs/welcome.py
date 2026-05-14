"""Welcome cog — legacy ✓-react verification (fallback).

The primary onboarding flow now lives in `bot.cogs.onboarding` (guided
interview in a per-member private channel). This cog is kept for two
reasons:
  1. The pinned ✓-react message in #الترحيب is still honoured for any
     long-tail member who comes back to that message; reacting ✓ swaps
     @unverified → @member just like before.
  2. The `!post_welcome` admin command remains available for re-posting
     the legacy banner if needed.

The `on_member_join` listener is intentionally NOT redefined here — the
`Onboarding` cog handles join events end-to-end (it assigns @unverified
defensively, spawns the private channel, runs the interview, and logs to
#admin-actions). Putting the same listener on two cogs would just
duplicate the admin log and the role-add API call.
"""

from __future__ import annotations

import logging
from typing import Any

import discord
from discord.ext import commands

VERIFY_EMOJI = "✅"
WELCOME_BANNER = (
    "**أهلاً وسهلاً في مجتمع BOON!** 🎉\n\n"
    "BOON هي أداة عربية لتعديل عميل Discord — Arabic-first، سايبر أخضر، "
    "مفتوحة المصدر بالكامل. هذا السيرفر للمستخدمين والمطوّرين معاً.\n\n"
    "**خطوات الانضمام:**\n"
    "١. اقرأ <#{rules}>\n"
    "٢. اضغط ✅ على هذه الرسالة\n"
    "٣. ستفتح لك بقية القنوات تلقائياً\n\n"
    "ممنوع spam، sexual content، شتائم، أو سرقة tokens. الإدارة لا تتسامح."
)
log = logging.getLogger("boon-bot.welcome")


class Welcome(commands.Cog):
    def __init__(self, bot: commands.Bot) -> None:
        self.bot = bot

    def _cfg(self) -> dict[str, Any] | None:
        return getattr(self.bot, "server_config", None)

    def _role_id(self, key: str) -> int | None:
        cfg = self._cfg()
        if not cfg:
            return None
        v = cfg.get("roles", {}).get(key)
        return int(v) if v else None

    def _channel_id(self, key: str) -> int | None:
        cfg = self._cfg()
        if not cfg:
            return None
        v = cfg.get("channels", {}).get(key)
        return int(v) if v else None

    # NOTE: `on_member_join` intentionally removed — `bot.cogs.onboarding`
    # owns the full join flow now (it assigns @unverified defensively,
    # spawns the per-member onboarding channel, runs the interview and
    # logs to #admin-actions). Re-adding it here would double-log every
    # join.

    @commands.Cog.listener()
    async def on_raw_reaction_add(self, payload: discord.RawReactionActionEvent) -> None:
        if payload.user_id == self.bot.user.id if self.bot.user else False:
            return
        welcome_ch = self._channel_id("welcome")
        if not welcome_ch or payload.channel_id != welcome_ch:
            return
        if str(payload.emoji) != VERIFY_EMOJI:
            return
        if not payload.guild_id:
            return
        guild = self.bot.get_guild(payload.guild_id)
        if not guild:
            return
        member = guild.get_member(payload.user_id) or await guild.fetch_member(payload.user_id)
        if member.bot:
            return

        unverified = self._role_id("unverified")
        member_role_id = self._role_id("member")
        if not (unverified and member_role_id):
            log.warning("verify clicked but roles not configured")
            return
        unverified_role = guild.get_role(unverified)
        member_role = guild.get_role(member_role_id)
        if not (unverified_role and member_role):
            return
        if unverified_role not in member.roles:
            return  # already verified

        try:
            await member.remove_roles(unverified_role, reason="verified via reaction")
            await member.add_roles(member_role, reason="verified via reaction")
        except discord.Forbidden:
            log.error("missing perms to swap roles for %s", member)
            return
        log.info("verified %s", member)
        await self._log_admin(guild, f"✅ <@{member.id}> ({member}) تحقّق — @member")

    @commands.command(name="post_welcome", hidden=True)
    @commands.has_permissions(manage_guild=True)
    async def post_welcome_message(self, ctx: commands.Context) -> None:
        """Posts (or re-posts) the pinned welcome message. One-time use."""
        rules_ch = self._channel_id("rules")
        if not rules_ch:
            await ctx.reply("server_config.json is missing — run setup_server.py first.")
            return
        body = WELCOME_BANNER.format(rules=rules_ch)
        msg = await ctx.send(body)
        await msg.add_reaction(VERIFY_EMOJI)
        try:
            await msg.pin(reason="welcome / verification anchor")
        except discord.Forbidden:
            await ctx.send("(ما قدرت أثبّت الرسالة — أعطي البوت Manage Messages)")

    async def _log_admin(self, guild: discord.Guild, body: str) -> None:
        cfg = self._cfg()
        if not cfg:
            return
        ch_id = cfg.get("channels", {}).get("log_admin_actions")
        if not ch_id:
            return
        ch = guild.get_channel(int(ch_id))
        if isinstance(ch, discord.TextChannel):
            try:
                await ch.send(body)
            except discord.Forbidden:
                log.warning("cannot post to #admin-actions")


async def setup(bot: commands.Bot) -> None:
    await bot.add_cog(Welcome(bot))
