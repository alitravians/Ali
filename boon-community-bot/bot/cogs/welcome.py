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

    # `bot.cogs.onboarding` owns the canonical join flow (assigns
    # @unverified, spawns the per-member onboarding channel, runs the
    # interview, and logs to #admin-actions). The listener below is a
    # defence-in-depth fallback: it ONLY fires when the Onboarding cog
    # failed to load (e.g. a transient ImportError on a dependency).
    # Without this guard, a new joiner during such an outage would land
    # at @everyone perms and could see all open channels.
    @commands.Cog.listener()
    async def on_member_join(self, member: discord.Member) -> None:
        if member.bot:
            return
        # Onboarding cog present? It owns the join flow — silently defer.
        if self.bot.get_cog("Onboarding") is not None:
            return
        unverified = self._role_id("unverified")
        if not unverified:
            return
        role = member.guild.get_role(unverified)
        if role is None or role in member.roles:
            return
        try:
            await member.add_roles(role, reason="fallback: onboarding cog unavailable")
        except (discord.Forbidden, discord.HTTPException) as exc:
            log.info("fallback assign @unverified failed for %s: %s", member, exc)

    @commands.Cog.listener()
    async def on_raw_reaction_add(self, payload: discord.RawReactionActionEvent) -> None:
        # Parenthesise the bot-self check explicitly. The previous form
        # `if payload.user_id == self.bot.user.id if self.bot.user else False`
        # is parsed by Python as `(payload.user_id == ...) if self.bot.user
        # else False` — which is what we want, but is easy to misread and
        # one stray edit away from a bug. Make the intent unambiguous.
        bot_user = self.bot.user
        if bot_user is not None and payload.user_id == bot_user.id:
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
        member = guild.get_member(payload.user_id)
        if member is None:
            # The member may have left the guild before we processed the
            # reaction (or the cache may simply be cold on the first event
            # after a restart). Fall back to a REST fetch — and treat a
            # 404 as "left, nothing to do" rather than letting the
            # NotFound propagate up and crash the event handler.
            try:
                member = await guild.fetch_member(payload.user_id)
            except discord.NotFound:
                return
            except discord.HTTPException as exc:
                log.info("fetch_member failed for %s: %s", payload.user_id, exc)
                return
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

        # If the Onboarding cog is loaded, the canonical path is the guided
        # interview (captcha + nickname + experience + interests). Granting
        # @member from a bare ✓-react would bypass the anti-bot captcha and
        # the interest-role assignment entirely. Refuse the bypass: undo
        # the reaction, point the user at the retroactive button, and log
        # the attempt. Only fall through to the legacy role-swap if the
        # Onboarding cog isn't loaded (defence-in-depth — should never
        # happen in production but keeps the fallback semantics sane).
        if self.bot.get_cog("Onboarding") is not None:
            await self._undo_react_and_redirect(guild, payload, member)
            return

        try:
            await member.remove_roles(unverified_role, reason="verified via reaction")
            await member.add_roles(member_role, reason="verified via reaction")
        except discord.Forbidden:
            log.error("missing perms to swap roles for %s", member)
            return
        log.info("verified %s", member)
        await self._log_admin(guild, f"✅ <@{member.id}> ({member}) تحقّق — @member")

    async def _undo_react_and_redirect(
        self,
        guild: discord.Guild,
        payload: discord.RawReactionActionEvent,
        member: discord.Member,
    ) -> None:
        """Cancel a legacy ✓-react verification when Onboarding is active.

        Removes the user's reaction so it doesn't look like the verify
        worked, DMs them the new instructions, and logs the bypass attempt
        so admins can see who's hitting the old message.
        """
        try:
            ch = guild.get_channel(payload.channel_id)
            if isinstance(ch, discord.TextChannel):
                msg = await ch.fetch_message(payload.message_id)
                await msg.remove_reaction(payload.emoji, member)
        except (discord.HTTPException, discord.NotFound, discord.Forbidden) as exc:
            log.info("could not remove legacy verify reaction for %s: %s", member, exc)
        try:
            await member.send(
                "نظام التحقّق تغيّر إلى مقابلة مرحّبة جديدة. "
                "افتح <#" + str(payload.channel_id) + "> واضغط زر "
                "**ابدأ التحقّق الجديد** لاستكمال الانضمام."
            )
        except (discord.HTTPException, discord.Forbidden) as exc:
            log.info("could not DM %s redirect: %s", member, exc)
        await self._log_admin(
            guild,
            f"↩️ <@{member.id}> ({member}) ضغط ✅ على رسالة الترحيب القديمة — "
            "تمّ التوجيه للـ onboarding الجديد بدون منح @member.",
        )

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
