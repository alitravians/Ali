"""MusicBot entry point — loads cogs, syncs slash commands, runs forever."""
from __future__ import annotations

import asyncio
import logging
import os
import sys

import discord
from discord.ext import commands

from .config import Settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger("musicbot")


class MusicBot(commands.Bot):
    def __init__(self, settings: Settings):
        intents = discord.Intents.default()
        intents.voice_states = True
        intents.members = bool(int(os.environ.get("ENABLE_MEMBERS_INTENT", "0")))
        intents.message_content = bool(int(os.environ.get("ENABLE_MESSAGE_CONTENT_INTENT", "0")))
        super().__init__(
            command_prefix="!",   # legacy prefix; we use slash commands.
            intents=intents,
            help_command=None,
        )
        self.settings = settings

    async def setup_hook(self) -> None:
        for cog in (
            "bot.cogs.help_cmd",
            "bot.cogs.music",
            "bot.cogs.admin_music",
        ):
            try:
                await self.load_extension(cog)
                log.info("loaded cog: %s", cog)
            except Exception:
                log.exception("failed to load cog %s", cog)

        guild_id = self.settings.guild_id
        if guild_id:
            guild = discord.Object(id=guild_id)
            try:
                self.tree.copy_global_to(guild=guild)
                synced = await self.tree.sync(guild=guild)
                log.info("synced %d guild commands to %s", len(synced), guild_id)
            except Exception:
                log.exception("failed to sync slash commands to guild")
        else:
            log.warning("GUILD_ID not set — falling back to global sync (slow)")
            try:
                await self.tree.sync()
            except Exception:
                log.exception("failed to sync slash commands globally")

    async def on_ready(self) -> None:
        log.info(
            "Logged in as %s (id=%s) — guilds=%d",
            self.user, self.user and self.user.id, len(self.guilds),
        )
        try:
            await self.change_presence(
                activity=discord.Activity(type=discord.ActivityType.listening, name="🎵 /play"),
                status=discord.Status.online,
            )
        except Exception:
            log.exception("failed to set presence")


async def main() -> None:
    settings = Settings.load()
    bot = MusicBot(settings)
    async with bot:
        await bot.start(settings.bot_token)


if __name__ == "__main__":
    asyncio.run(main())
