"""MusicBot v2 entry point — discord.py + wavelink + Lavalink.

Architecture (radical rewrite, 2026-04-29):

* The Python bot speaks ONLY the Discord gateway (text WebSocket) and the
  Lavalink REST/WS API. It never opens a Discord voice WebSocket itself, so
  `davey`/PyNaCl/libopus are NOT installed in the image.

* All voice handling -- the voice WS, UDP socket, opus encoding, transport
  encryption, and most importantly the DAVE/MLS end-to-end key exchange --
  happens inside Lavalink (separate fly.io app `music-lavalink-am`,
  Lavalink 4.2.2 bundling libdave >= 0.1.3).

This sidesteps the davey 0.1.5 MLS handshake stall (`can_encrypt` stuck on
False, listeners hear silence) that motivated the rebuild from scratch.
"""
from __future__ import annotations

import asyncio
import logging
import os
import sys

import discord
import wavelink
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
        intents.message_content = bool(
            int(os.environ.get("ENABLE_MESSAGE_CONTENT_INTENT", "0"))
        )
        super().__init__(
            command_prefix="!",  # legacy prefix; we use slash commands.
            intents=intents,
            help_command=None,
        )
        self.settings = settings

    async def setup_hook(self) -> None:
        # Connect to Lavalink BEFORE loading the music cog so wavelink.Pool
        # is ready when commands fire.
        lavalink_uri = os.getenv("LAVALINK_URI", "http://music-lavalink-am.flycast:2333")
        lavalink_password = os.getenv("LAVALINK_PASSWORD", "youshallnotpass")
        node = wavelink.Node(uri=lavalink_uri, password=lavalink_password)
        try:
            await wavelink.Pool.connect(nodes=[node], client=self, cache_capacity=100)
            log.info("wavelink: connected to Lavalink at %s", lavalink_uri)
        except Exception:
            log.exception("wavelink: failed to connect to Lavalink at %s", lavalink_uri)
            # Don't crash the whole bot -- it can still respond to slash
            # commands with a graceful "music service unavailable" message.

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
                activity=discord.Activity(
                    type=discord.ActivityType.listening, name="🎵 /play"
                ),
                status=discord.Status.online,
            )
        except Exception:
            log.exception("failed to set presence")

    async def on_wavelink_node_ready(
        self, payload: wavelink.NodeReadyEventPayload
    ) -> None:
        log.info(
            "wavelink: node %s ready (session_id=%s, resumed=%s)",
            payload.node.identifier, payload.session_id, payload.resumed,
        )


async def main() -> None:
    settings = Settings.load()
    bot = MusicBot(settings)
    async with bot:
        await bot.start(settings.bot_token)


if __name__ == "__main__":
    asyncio.run(main())
