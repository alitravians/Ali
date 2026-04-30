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

# Diagnostic logging for the voice handshake. Wavelink emits very rich DEBUG
# logs on voice state / voice server / Lavalink REST traffic which let us see
# exactly why a connect is being torn down.
if os.environ.get("WAVELINK_DEBUG", "1") == "1":
    logging.getLogger("wavelink").setLevel(logging.DEBUG)
    logging.getLogger("discord.gateway").setLevel(logging.INFO)


def _patch_wavelink_voice_logging() -> None:
    """Monkey-patch wavelink.Player so we see what Lavalink actually returns
    when the voice PATCH fails (default code path swallows the exception body
    and just calls disconnect)."""
    try:
        from wavelink import player as _wl_player  # type: ignore
        from wavelink.exceptions import LavalinkException  # type: ignore
    except Exception:
        log.exception("could not import wavelink for voice-logging patch")
        return

    original = _wl_player.Player._dispatch_voice_update

    async def _patched(self):  # type: ignore[no-untyped-def]
        data = self._voice_state["voice"]
        log.info(
            "voice_dispatch: guild=%s session_id=%s token=%s endpoint=%s channel_id=%s",
            getattr(self, "guild", None) and self.guild.id,
            data.get("session_id"), data.get("token"),
            data.get("endpoint"), self._voice_state.get("channel_id"),
        )
        try:
            return await original(self)
        except LavalinkException as e:
            log.error("voice_dispatch LavalinkException: %r", e)
            raise

    _wl_player.Player._dispatch_voice_update = _patched

    original_voice_state = _wl_player.Player.on_voice_state_update

    async def _patched_state(self, data):  # type: ignore[no-untyped-def]
        log.info(
            "voice_state_update: guild=%s channel_id=%s session_id=%s self_deaf=%s self_mute=%s",
            getattr(self, "guild", None) and self.guild.id,
            data.get("channel_id"), data.get("session_id"),
            data.get("self_deaf"), data.get("self_mute"),
        )
        return await original_voice_state(self, data)

    _wl_player.Player.on_voice_state_update = _patched_state

    original_server = _wl_player.Player.on_voice_server_update

    async def _patched_server(self, data):  # type: ignore[no-untyped-def]
        log.info(
            "voice_server_update: guild=%s endpoint=%s token=%s",
            getattr(self, "guild", None) and self.guild.id,
            data.get("endpoint"), data.get("token"),
        )
        return await original_server(self, data)

    _wl_player.Player.on_voice_server_update = _patched_server

    log.info("wavelink voice diagnostic patches installed")


_patch_wavelink_voice_logging()


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
