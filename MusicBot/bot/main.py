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
    but the MLS group handshake never completes (``can_encrypt`` stays False --
    the steady-state for headless bots that never receive ``MLS_WELCOME`` for
    the voice channel), discord.py's ``_get_voice_packet`` falls through to
    sending *raw, non-DAVE* opus frames over the otherwise-encrypted transport.
    Every real Discord client in the channel is decrypting with the DAVE group
    key, so the bot's frames are dropped silently -- listeners hear absolute
    silence even though UDP packets are flowing, opus is loaded, ffmpeg is
    feeding frames at the right rate, and transport encryption is established.

    Implementation:

    1. Set ``discord.voice_state.has_dave = False``. The
       ``max_dave_protocol_version`` property at ``voice_state.py`` line 268
       reads the *module-level* ``has_dave`` and returns
       ``davey.DAVE_PROTOCOL_VERSION if has_dave else 0``. Forcing
       ``has_dave = False`` makes IDENTIFY advertise ``0`` to Discord so DAVE
       is never enabled on the channel.

    2. CRITICALLY do NOT touch ``discord.voice_client.has_dave``. That module
       captured its own binding via ``from .voice_state import has_dave`` at
       import time, and uses it to gate VoiceClient construction:

           # voice_client.py line 221-222
           if not has_dave:
               raise RuntimeError('davey library needed in order to use voice')

       If we set it to False, voice cannot be created at all. The original
       True binding stays so VoiceClient is created normally.

    3. Override the ``max_dave_protocol_version`` property defensively in case
       ``davey`` is imported again later -- the property will still return 0.

    4. Override ``can_encrypt`` to always return False so any code path that
       assumes DAVE session keys exist short-circuits cleanly.
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
    try:
        from discord import voice_client as _vc
        vc_has_dave = getattr(_vc, "has_dave", None)
    except Exception:
        vc_has_dave = None
    log.info(
        "DAVE protocol disabled: voice_state.has_dave=False, "
        "max_dave_protocol_version=0, can_encrypt=False "
        "(voice_client.has_dave=%r preserved for VoiceClient construction)",
        vc_has_dave,
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
