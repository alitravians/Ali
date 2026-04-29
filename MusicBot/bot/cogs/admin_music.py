"""Admin-only music commands (wavelink rewrite).

Hidden from regular members via ``default_permissions(manage_guild=True)``.
"""
from __future__ import annotations

import logging
from typing import cast

import discord
import wavelink
from discord import app_commands
from discord.ext import commands

from ..config import COLORS, Settings

_log = logging.getLogger(__name__)


_ADMIN_PERMS = app_commands.default_permissions(manage_guild=True)


class AdminMusicCog(commands.Cog):
    def __init__(self, bot: commands.Bot, settings: Settings):
        self.bot = bot
        self.settings = settings

    def _player(self, guild: discord.Guild | None) -> wavelink.Player | None:
        if not guild:
            return None
        return cast("wavelink.Player | None", guild.voice_client)

    async def _audit(
        self, action: str, by: discord.abc.User, *, detail: str = ""
    ) -> None:
        log_ch = self.bot.get_channel(self.settings.log_admin)
        if isinstance(log_ch, discord.TextChannel):
            try:
                await log_ch.send(
                    f"🛠 `{action}` بواسطة <@{by.id}> ({by})"
                    + (f"\n{detail}" if detail else "")
                )
            except Exception:
                pass

    @app_commands.command(
        name="admin_music_stop",
        description="⏹️ إجبار البوت على الإيقاف ومغادرة القناة (إدارة فقط)",
    )
    @_ADMIN_PERMS
    async def admin_stop(self, interaction: discord.Interaction) -> None:
        player = self._player(interaction.guild)
        if not player:
            await interaction.response.send_message(
                "⚠️ البوت ليس في قناة صوتية.", ephemeral=True
            )
            return
        player.queue.clear()
        await player.disconnect()
        await interaction.response.send_message("⏹️ تم الإيقاف القسري وإخراج البوت.")
        await self._audit("admin_music_stop", interaction.user)

    @app_commands.command(
        name="admin_music_clear",
        description="🧹 مسح كامل قائمة الانتظار (إدارة فقط)",
    )
    @_ADMIN_PERMS
    async def admin_clear(self, interaction: discord.Interaction) -> None:
        player = self._player(interaction.guild)
        if not player:
            await interaction.response.send_message(
                "⚠️ البوت ليس في قناة صوتية.", ephemeral=True
            )
            return
        n = len(player.queue)
        player.queue.clear()
        await interaction.response.send_message(
            f"🧹 مُسحت **{n}** أغنية من القائمة."
        )
        await self._audit(
            "admin_music_clear", interaction.user, detail=f"removed={n}"
        )

    @app_commands.command(
        name="admin_music_health",
        description="💓 حالة نظام الموسيقى (إدارة فقط)",
    )
    @_ADMIN_PERMS
    async def admin_health(self, interaction: discord.Interaction) -> None:
        guild_count = len(self.bot.guilds)
        # Count active wavelink players across all guilds.
        active_players = 0
        total_queue = 0
        for g in self.bot.guilds:
            p = cast("wavelink.Player | None", g.voice_client)
            if p is not None:
                if p.playing:
                    active_players += 1
                total_queue += len(p.queue)

        # Lavalink node status
        try:
            nodes = list(wavelink.Pool.nodes.values())
            node_status = ", ".join(
                f"{n.identifier}={n.status.name}" for n in nodes
            ) or "—"
        except Exception:
            node_status = "غير متوفر"

        embed = discord.Embed(
            title="💓 حالة بوت الموسيقى",
            color=COLORS["info"],
        )
        embed.add_field(name="السيرفرات", value=str(guild_count), inline=True)
        embed.add_field(
            name="مشغّلات نشطة", value=str(active_players), inline=True
        )
        embed.add_field(
            name="إجمالي قوائم الانتظار", value=str(total_queue), inline=True
        )
        embed.add_field(
            name="latency",
            value=f"{int(self.bot.latency * 1000)}ms",
            inline=True,
        )
        embed.add_field(name="Lavalink", value=node_status, inline=False)
        await interaction.response.send_message(embed=embed, ephemeral=True)


async def setup(bot: commands.Bot):
    settings: Settings = bot.settings  # type: ignore[attr-defined]
    await bot.add_cog(AdminMusicCog(bot, settings))
