"""Admin-only music commands.

Hidden from regular members via ``default_permissions(manage_guild=True)``.
"""
from __future__ import annotations

import logging

import discord
from discord import app_commands
from discord.ext import commands

from ..config import COLORS, Settings
from .music import MusicCog

_log = logging.getLogger(__name__)


_ADMIN_PERMS = app_commands.default_permissions(manage_guild=True)


class AdminMusicCog(commands.Cog):
    def __init__(self, bot: commands.Bot, settings: Settings):
        self.bot = bot
        self.settings = settings

    def _player_cog(self) -> MusicCog | None:
        cog = self.bot.get_cog("MusicCog")
        return cog if isinstance(cog, MusicCog) else None

    async def _audit(self, action: str, by: discord.abc.User, *, detail: str = "") -> None:
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
        if not interaction.guild:
            return
        cog = self._player_cog()
        if not cog:
            await interaction.response.send_message("⚠️ نظام الموسيقى غير محمّل.", ephemeral=True)
            return
        player = cog.get_player(interaction.guild.id)
        await player.stop()
        await interaction.response.send_message("⏹️ تم الإيقاف القسري وإخراج البوت.")
        await self._audit("admin_music_stop", interaction.user)

    @app_commands.command(
        name="admin_music_clear",
        description="🧹 مسح كامل قائمة الانتظار (إدارة فقط)",
    )
    @_ADMIN_PERMS
    async def admin_clear(self, interaction: discord.Interaction) -> None:
        if not interaction.guild:
            return
        cog = self._player_cog()
        if not cog:
            await interaction.response.send_message("⚠️ نظام الموسيقى غير محمّل.", ephemeral=True)
            return
        player = cog.get_player(interaction.guild.id)
        n = len(player.queue)
        player.clear()
        await interaction.response.send_message(f"🧹 مُسحت **{n}** أغنية من القائمة.")
        await self._audit("admin_music_clear", interaction.user, detail=f"removed={n}")

    @app_commands.command(
        name="admin_music_health",
        description="💓 حالة نظام الموسيقى (إدارة فقط)",
    )
    @_ADMIN_PERMS
    async def admin_health(self, interaction: discord.Interaction) -> None:
        cog = self._player_cog()
        if not cog:
            await interaction.response.send_message("⚠️ نظام الموسيقى غير محمّل.", ephemeral=True)
            return
        guild_count = len(self.bot.guilds)
        active_players = sum(1 for p in cog.players.values() if p.is_playing())
        total_queue = sum(len(p.queue) for p in cog.players.values())
        embed = discord.Embed(
            title="💓 حالة بوت الموسيقى",
            color=COLORS["info"],
        )
        embed.add_field(name="السيرفرات", value=str(guild_count), inline=True)
        embed.add_field(name="مشغّلات نشطة", value=str(active_players), inline=True)
        embed.add_field(name="إجمالي قوائم الانتظار", value=str(total_queue), inline=True)
        embed.add_field(name="latency", value=f"{int(self.bot.latency * 1000)}ms", inline=True)
        await interaction.response.send_message(embed=embed, ephemeral=True)


async def setup(bot: commands.Bot):
    settings: Settings = bot.settings  # type: ignore[attr-defined]
    await bot.add_cog(AdminMusicCog(bot, settings))
