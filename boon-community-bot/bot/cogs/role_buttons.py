"""Self-assign interest roles via persistent buttons.

Flow:
  1. Owner runs `/setup-roles-message` once in #choose-roles. The bot posts
     an Arabic explainer embed + a row of toggle buttons.
  2. Any verified member clicks a button → bot toggles the matching
     interest role on/off and replies ephemerally with the result.

Persistence:
  Buttons survive bot restarts because the View uses fixed `custom_id`s and
  the View is `add_view`-registered in `on_ready` (see `Bot.add_view`).
  Discord routes interactions back to the registered View by `custom_id`.
"""

from __future__ import annotations

import logging
from typing import Any

import discord
from discord import app_commands
from discord.ext import commands

log = logging.getLogger("boon-bot.role_buttons")

# (role_key in server_config["roles"], button label, leading emoji, description)
# Order matters — it's the visible order in the embed AND on the button row.
INTEREST_ROLES: list[tuple[str, str, str, str]] = [
    ("interest_releases",     "إشعارات الإصدارات", "🔔", "ping عند كل إصدار جديد"),
    ("interest_tech",         "نقاشات تقنية",      "💬", "ping للنقاشات التقنية العميقة"),
    ("interest_install_help", "مساعدة في التثبيت", "🆘", "ping عند طلبات المساعدة"),
    ("interest_bug_reports",  "تقارير الأخطاء",    "🐛", "ping عند بحوث repro / debug"),
    ("interest_features",     "طلبات الميزات",     "💡", "ping عند نقاش features جديدة"),
    ("interest_translate",    "ترجمة وتوطين",      "🌐", "ping لمهام الترجمة"),
]

CUSTOM_ID_PREFIX = "boon-role:"


class _RoleButton(discord.ui.Button["_InterestRolesView"]):
    def __init__(self, role_key: str, label: str, emoji: str) -> None:
        super().__init__(
            style=discord.ButtonStyle.secondary,
            label=label,
            emoji=emoji,
            custom_id=f"{CUSTOM_ID_PREFIX}{role_key}",
        )
        self.role_key = role_key

    async def callback(self, interaction: discord.Interaction) -> None:
        bot = interaction.client
        cfg: dict[str, Any] = getattr(bot, "server_config", None) or {}
        role_id_raw = cfg.get("roles", {}).get(self.role_key)
        if not role_id_raw:
            await interaction.response.send_message(
                "⚠️ هذا الدور غير مهيّأ. أبلغ admin.",
                ephemeral=True,
            )
            return

        member = interaction.user
        guild = interaction.guild
        if not isinstance(member, discord.Member) or guild is None:
            await interaction.response.send_message(
                "هذا الزر للأعضاء داخل السيرفر فقط.",
                ephemeral=True,
            )
            return

        role = guild.get_role(int(role_id_raw))
        if role is None:
            await interaction.response.send_message(
                "⚠️ لم أجد الدور في السيرفر. أبلغ admin.",
                ephemeral=True,
            )
            return

        try:
            if role in member.roles:
                await member.remove_roles(role, reason="self-removed via #choose-roles button")
                msg = f"❎ تم إزالة دور **{role.name}** عنك."
                log.info("removed %s from %s", role.name, member)
            else:
                await member.add_roles(role, reason="self-added via #choose-roles button")
                msg = f"✅ تم إعطاؤك دور **{role.name}**."
                log.info("added %s to %s", role.name, member)
        except discord.Forbidden:
            log.warning("missing perms to toggle %s on %s", role.name, member)
            await interaction.response.send_message(
                "⚠️ ليس لدي صلاحية تعديل أدوارك. أبلغ admin (تأكّد أن دور البوت أعلى من أدوار الاهتمامات).",
                ephemeral=True,
            )
            return
        except discord.HTTPException as exc:
            log.warning("HTTP error toggling %s on %s: %s", role.name, member, exc)
            await interaction.response.send_message(
                "⚠️ حدث خطأ شبكي مؤقّت. جرّب مرة أخرى.",
                ephemeral=True,
            )
            return

        await interaction.response.send_message(msg, ephemeral=True)


class _InterestRolesView(discord.ui.View):
    def __init__(self) -> None:
        super().__init__(timeout=None)
        for key, label, emoji, _desc in INTEREST_ROLES:
            self.add_item(_RoleButton(key, label, emoji))


def _build_embed() -> discord.Embed:
    body = "\n".join(
        f"{emoji}  **{label}** — {desc}"
        for _key, label, emoji, desc in INTEREST_ROLES
    )
    embed = discord.Embed(
        title="🎯 اختر اهتماماتك",
        description=(
            "اضغط على أي زر أدناه لإعطاء/إزالة الدور المقابل.\n"
            "هذه الأدوار للإشعارات فقط — **لا تغيّر صلاحياتك** ولا تفتح/تقفل قنوات.\n\n"
            + body
            + "\n\n"
            "اضغط مرّة لإعطاء، ومرّة ثانية لإزالة. الردّ يصلك بشكل سرّي."
        ),
        color=0x00FF88,
    )
    embed.set_footer(text="alitravians community · يمكنك تغيير اختياراتك في أي وقت")
    return embed


class RoleButtons(commands.Cog):
    def __init__(self, bot: commands.Bot) -> None:
        self.bot = bot

    @commands.Cog.listener()
    async def on_ready(self) -> None:
        # Register the persistent view ONCE per process lifetime so Discord
        # routes button clicks back to it by custom_id, even for messages
        # posted in a previous boot.
        if getattr(self.bot, "_interest_roles_view_registered", False):
            return
        self.bot.add_view(_InterestRolesView())
        self.bot._interest_roles_view_registered = True  # type: ignore[attr-defined]
        log.info("registered persistent InterestRolesView")

    @app_commands.command(
        name="setup-roles-message",
        description="(Owner) نشر/إعادة نشر رسالة اختيار الاهتمامات في القناة الحالية",
    )
    @app_commands.default_permissions(manage_guild=True)
    async def setup_roles_message(self, interaction: discord.Interaction) -> None:
        guild = interaction.guild
        channel = interaction.channel
        if guild is None or not isinstance(channel, discord.TextChannel):
            await interaction.response.send_message(
                "استخدم هذا الأمر داخل قناة نصّية في السيرفر.",
                ephemeral=True,
            )
            return
        if interaction.user.id != guild.owner_id:
            await interaction.response.send_message(
                "هذا الأمر للمالك فقط.",
                ephemeral=True,
            )
            return

        embed = _build_embed()
        view = _InterestRolesView()
        try:
            msg = await channel.send(embed=embed, view=view)
        except discord.Forbidden:
            await interaction.response.send_message(
                "⚠️ ليس لدي صلاحية الإرسال في هذه القناة.",
                ephemeral=True,
            )
            return
        try:
            await msg.pin(reason="interest roles selector")
        except discord.Forbidden:
            log.info("cannot pin role selector (missing Manage Messages)")
        await interaction.response.send_message(
            f"تم نشر رسالة اختيار الاهتمامات في {channel.mention}.",
            ephemeral=True,
        )


async def setup(bot: commands.Bot) -> None:
    await bot.add_cog(RoleButtons(bot))
