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


def _disable_dave_protocol() -> None:
    """Force ``max_dave_protocol_version`` to ``0`` so Discord never enables
    DAVE end-to-end voice encryption on this bot.

    Root cause this prevents: when DAVE is active (``dave_protocol_version >= 1``)
    but the MLS group handshake never completes (``can_encrypt=False`` — which is
    the steady-state for headless bots that never receive ``MLS_WELCOME`` for the
    voice channel), discord.py's ``_get_voice_packet`` falls through to sending
    *raw, non-DAVE* opus frames over the otherwise-encrypted transport. Every
    real Discord client in the channel is decrypting with the DAVE group key, so
    the bot's frames are dropped silently — listeners hear absolute silence even
    though UDP packets are flowing, opus is loaded, ffmpeg is feeding frames at
    the right rate, and transport encryption (xchacha20) is established.

    By overriding the ``max_dave_protocol_version`` property to always return 0
    *before* any ``VoiceConnectionState`` is constructed, we ensure the IDENTIFY
    payload tells Discord we don't speak DAVE; Discord then leaves the voice
    channel on the legacy non-DAVE path where every audio frame the bot sends is
    audible to all listeners.

    This is the *radical* fix -- it is independent of whether ``davey`` happens
    to be importable at runtime, and it also short-circuits ``can_encrypt`` so
    that any future code path that assumes DAVE keys exist will skip cleanly.
    """
    try:
        from discord import voice_state as _vs
    except Exception:  # pragma: no cover -- discord.py missing is fatal elsewhere
        log.warning("discord.voice_state import failed; cannot disable DAVE")
        return
    _vs.has_dave = False  # type: ignore[attr-defined]
    _vs.VoiceConnectionState.max_dave_protocol_version = property(  # type: ignore[assignment]
        lambda _self: 0
    )
    _vs.VoiceConnectionState.can_encrypt = property(  # type: ignore[assignment]
        lambda _self: False
    )
    log.info(
        "DAVE protocol disabled (max_dave_protocol_version=0, "
        "can_encrypt=False forced) -- voice will use legacy transport "
        "encryption only"
    )


def _load_opus() -> None:
    """Explicitly load libopus so PCM → Opus encoding works.

    discord.py's auto-detection (``ctypes.util.find_library('opus')``)
    relies on ``gcc``/``objdump`` being on PATH, which is not the case
    in slim Debian images. When auto-detection fails ``is_loaded()``
    stays False and ``FFmpegPCMAudio`` produces silence — Discord never
    receives any encoded audio frames. Loading by SONAME directly is
    the canonical, container-friendly fix.
    """
    if discord.opus.is_loaded():
        log.info("opus: already loaded by auto-detection")
        return
    for candidate in ("libopus.so.0", "libopus.so", "opus"):
        try:
            discord.opus.load_opus(candidate)
        except OSError:
            continue
        if discord.opus.is_loaded():
            log.info("opus: loaded via %r", candidate)
            return
    log.error(
        "opus: FAILED to load libopus — voice will be silent. "
        "Install libopus0 in the runtime image."
    )


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
    _disable_dave_protocol()
    _load_opus()
    bot = MusicBot(settings)
    async with bot:
        await bot.start(settings.bot_token)


if __name__ == "__main__":
    asyncio.run(main())
