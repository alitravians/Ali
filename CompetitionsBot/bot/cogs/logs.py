"""Bot-logs cog: streams Discord events into the dedicated logs category.

This cog listens to Discord gateway events and posts an embed in the matching
admin-only log channel. It also exposes ``log_event`` so other cogs can write
custom audit entries (e.g. /admin commands, quiz results, errors).

Channels (see server_config.json -> bot_logs_channels):
    activity   — quiz/race/tournament/daily activity
    admin_log  — every /admin command invocation
    errors     — exceptions / tracebacks
    joins      — member join / leave events
    deletes    — message deletions
    edits      — message edits
    server     — channel/role/permission changes
"""
from __future__ import annotations

import datetime as _dt
import logging
import traceback
from typing import Optional

import discord
from discord.ext import commands

from ..config import COLORS, Settings

_log = logging.getLogger(__name__)


def _truncate(text: str, limit: int = 1000) -> str:
    if not text:
        return "*(فارغ)*"
    return text if len(text) <= limit else text[: limit - 1] + "…"


class LogsCog(commands.Cog):
    """Listens to gateway events and posts to the admin-only log channels."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.settings: Settings = bot.settings  # type: ignore[attr-defined]

    # ---------- Public helpers usable from other cogs ----------
    async def post(
        self,
        category: str,
        embed: discord.Embed,
        *,
        content: Optional[str] = None,
    ) -> Optional[discord.Message]:
        """Post an embed to a named log channel.

        ``category`` must be one of: activity, admin, errors, joins, deletes,
        edits, server. Falls back silently if the channel is not configured.
        """
        ch_id = {
            "activity": self.settings.log_activity,
            "admin": self.settings.log_admin,
            "errors": self.settings.log_errors,
            "joins": self.settings.log_joins,
            "deletes": self.settings.log_deletes,
            "edits": self.settings.log_edits,
            "server": self.settings.log_server,
        }.get(category, 0)
        if not ch_id:
            return None
        ch = self.bot.get_channel(ch_id)
        if not isinstance(ch, discord.TextChannel):
            return None
        try:
            return await ch.send(content=content, embed=embed)
        except (discord.HTTPException, discord.Forbidden) as e:
            _log.warning("failed to post log to %s: %s", category, e)
            return None

    # ---------- Listeners ----------
    @commands.Cog.listener()
    async def on_member_join(self, member: discord.Member):
        embed = discord.Embed(
            title="🟢 عضو جديد انضم",
            description=f"{member.mention} (`{member}`)",
            color=COLORS.get("success", 0x2ECC71),
            timestamp=_dt.datetime.now(_dt.timezone.utc),
        )
        embed.add_field(name="ID", value=str(member.id), inline=True)
        embed.add_field(
            name="تاريخ إنشاء الحساب",
            value=f"<t:{int(member.created_at.timestamp())}:R>",
            inline=True,
        )
        if member.avatar:
            embed.set_thumbnail(url=member.avatar.url)
        await self.post("joins", embed)

    @commands.Cog.listener()
    async def on_member_remove(self, member: discord.Member):
        embed = discord.Embed(
            title="🔴 عضو غادر",
            description=f"{member} (`{member.id}`)",
            color=COLORS.get("danger", 0xE74C3C),
            timestamp=_dt.datetime.now(_dt.timezone.utc),
        )
        if member.joined_at:
            embed.add_field(
                name="انضم منذ",
                value=f"<t:{int(member.joined_at.timestamp())}:R>",
                inline=True,
            )
        if member.avatar:
            embed.set_thumbnail(url=member.avatar.url)
        await self.post("joins", embed)

    @commands.Cog.listener()
    async def on_message_delete(self, message: discord.Message):
        if message.author.bot or not message.guild:
            return
        embed = discord.Embed(
            title="🗑️ رسالة محذوفة",
            color=COLORS.get("warning", 0xF39C12),
            timestamp=_dt.datetime.now(_dt.timezone.utc),
        )
        embed.add_field(
            name="الكاتب",
            value=f"{message.author.mention} (`{message.author.id}`)",
            inline=True,
        )
        embed.add_field(name="القناة", value=message.channel.mention, inline=True)
        embed.add_field(name="المحتوى", value=_truncate(message.content), inline=False)
        if message.attachments:
            embed.add_field(
                name="مرفقات",
                value="\n".join(a.url for a in message.attachments[:3]),
                inline=False,
            )
        await self.post("deletes", embed)

    @commands.Cog.listener()
    async def on_bulk_message_delete(self, messages: list[discord.Message]):
        """Triggered by ``channel.purge(bulk=True)`` (e.g. /admin clear*)."""
        if not messages:
            return
        # Filter out bot messages — keep only human-authored ones.
        humans = [m for m in messages if not m.author.bot and m.guild]
        if not humans:
            return
        channel = humans[0].channel
        embed = discord.Embed(
            title="🗑️ حذف جماعي للرسائل",
            description=(
                f"**القناة:** {getattr(channel, 'mention', f'#{channel}')}\n"
                f"**عدد الرسائل المحذوفة:** {len(humans)}"
            ),
            color=COLORS.get("warning", 0xF39C12),
            timestamp=_dt.datetime.now(_dt.timezone.utc),
        )
        # Build a compact preview of up to 10 messages (cached only).
        preview_lines: list[str] = []
        for m in humans[:10]:
            content = (m.content or "*(فارغ / غير مخزّن)*").replace("\n", " ")
            if len(content) > 100:
                content = content[:99] + "…"
            preview_lines.append(f"• **{m.author}**: {content}")
        if preview_lines:
            embed.add_field(
                name="معاينة (آخر المخزّن)",
                value="\n".join(preview_lines),
                inline=False,
            )
        if len(humans) > 10:
            embed.set_footer(text=f"تم عرض 10 من {len(humans)} رسالة")
        await self.post("deletes", embed)

    @commands.Cog.listener()
    async def on_message_edit(self, before: discord.Message, after: discord.Message):
        if before.author.bot or not before.guild:
            return
        if before.content == after.content:
            return
        embed = discord.Embed(
            title="✏️ رسالة معدّلة",
            color=COLORS.get("info", 0x3498DB),
            timestamp=_dt.datetime.now(_dt.timezone.utc),
            url=after.jump_url,
        )
        embed.add_field(
            name="الكاتب",
            value=f"{after.author.mention} (`{after.author.id}`)",
            inline=True,
        )
        embed.add_field(name="القناة", value=after.channel.mention, inline=True)
        embed.add_field(name="قبل", value=_truncate(before.content, 500), inline=False)
        embed.add_field(name="بعد", value=_truncate(after.content, 500), inline=False)
        await self.post("edits", embed)

    @commands.Cog.listener()
    async def on_guild_channel_create(self, channel: discord.abc.GuildChannel):
        embed = discord.Embed(
            title="➕ قناة جديدة",
            description=f"{getattr(channel, 'mention', channel.name)} (`{channel.id}`)",
            color=COLORS.get("success", 0x2ECC71),
            timestamp=_dt.datetime.now(_dt.timezone.utc),
        )
        embed.add_field(name="النوع", value=str(channel.type), inline=True)
        await self.post("server", embed)

    @commands.Cog.listener()
    async def on_guild_channel_delete(self, channel: discord.abc.GuildChannel):
        embed = discord.Embed(
            title="➖ قناة محذوفة",
            description=f"#{channel.name} (`{channel.id}`)",
            color=COLORS.get("danger", 0xE74C3C),
            timestamp=_dt.datetime.now(_dt.timezone.utc),
        )
        embed.add_field(name="النوع", value=str(channel.type), inline=True)
        await self.post("server", embed)

    @commands.Cog.listener()
    async def on_guild_role_create(self, role: discord.Role):
        embed = discord.Embed(
            title="➕ رتبة جديدة",
            description=f"{role.mention} (`{role.id}`)",
            color=role.color or COLORS.get("info", 0x3498DB),
            timestamp=_dt.datetime.now(_dt.timezone.utc),
        )
        await self.post("server", embed)

    @commands.Cog.listener()
    async def on_guild_role_delete(self, role: discord.Role):
        embed = discord.Embed(
            title="➖ رتبة محذوفة",
            description=f"@{role.name} (`{role.id}`)",
            color=COLORS.get("danger", 0xE74C3C),
            timestamp=_dt.datetime.now(_dt.timezone.utc),
        )
        await self.post("server", embed)

    @commands.Cog.listener()
    async def on_app_command_completion(
        self,
        interaction: discord.Interaction,
        command: discord.app_commands.Command,
    ):
        # Only audit /admin commands here; activity logs are written by each cog.
        if not command.qualified_name.startswith("admin "):
            return
        embed = discord.Embed(
            title=f"🛠️ /{command.qualified_name}",
            color=COLORS.get("warning", 0xF39C12),
            timestamp=_dt.datetime.now(_dt.timezone.utc),
        )
        embed.add_field(
            name="بواسطة",
            value=f"{interaction.user.mention} (`{interaction.user.id}`)",
            inline=True,
        )
        if interaction.channel:
            embed.add_field(
                name="القناة",
                value=getattr(interaction.channel, "mention", str(interaction.channel)),
                inline=True,
            )
        # Include slash arguments where available
        if interaction.namespace:
            args = []
            for k, v in vars(interaction.namespace).items():
                args.append(f"**{k}**: `{v}`")
            if args:
                embed.add_field(name="المعاملات", value="\n".join(args), inline=False)
        await self.post("admin", embed)

    @commands.Cog.listener()
    async def on_app_command_error(
        self,
        interaction: discord.Interaction,
        error: discord.app_commands.AppCommandError,
    ):
        embed = discord.Embed(
            title="⚠️ خطأ في أمر",
            description=f"```\n{_truncate(str(error), 1500)}\n```",
            color=COLORS.get("danger", 0xE74C3C),
            timestamp=_dt.datetime.now(_dt.timezone.utc),
        )
        if interaction.command:
            embed.add_field(name="الأمر", value=f"/{interaction.command.qualified_name}", inline=True)
        embed.add_field(
            name="بواسطة",
            value=f"{interaction.user.mention} (`{interaction.user.id}`)",
            inline=True,
        )
        tb = "".join(traceback.format_exception(type(error), error, error.__traceback__))
        embed.add_field(name="Traceback", value=f"```py\n{_truncate(tb, 1000)}\n```", inline=False)
        await self.post("errors", embed)


async def setup(bot: commands.Bot):
    await bot.add_cog(LogsCog(bot))
