"""BOON Community Discord bot — main entrypoint.

Runs the discord.py bot AND a small aiohttp HTTP server (for the GitHub
release webhook) inside the same asyncio loop, so a single Fly.io machine
runs the whole thing.

Operationally:
  python -m bot.main
"""

from __future__ import annotations

import asyncio
import logging
import signal
import sys
from typing import Any

import discord
from aiohttp import web
from discord.ext import commands

from bot.config import load_server_config, load_settings


async def main() -> int:
    settings = load_settings()
    logging.basicConfig(
        level=settings.log_level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    log = logging.getLogger("boon-bot")

    # If `server_config.json` is missing, the bot can still start and answer
    # /version / /install, but channel-aware features (welcome, github relay)
    # are disabled until the operator runs `scripts/setup_server.py`.
    try:
        server_config: dict[str, Any] | None = load_server_config(
            settings.server_config_path
        )
        log.info("loaded server_config.json (%d channels)",
                 len(server_config.get("channels", {})))
    except FileNotFoundError as e:
        log.warning("%s", e)
        server_config = None

    intents = discord.Intents.default()
    intents.members = True            # for welcome flow + role assignment
    intents.message_content = False   # we only use slash commands + reactions
    intents.guilds = True

    bot = commands.Bot(command_prefix="!unused!", intents=intents,
                       help_command=None)
    bot.settings = settings  # type: ignore[attr-defined]
    bot.server_config = server_config  # type: ignore[attr-defined]

    @bot.event
    async def on_ready() -> None:
        log.info("logged in as %s (%s)", bot.user, bot.user.id if bot.user else "?")
        guild = bot.get_guild(settings.guild_id)
        if guild:
            synced = await bot.tree.sync(guild=guild)
            log.info("synced %d slash commands to guild %s", len(synced),
                     guild.name)
        else:
            log.warning("guild %s not visible; slash commands NOT synced",
                        settings.guild_id)

    @bot.event
    async def on_error(event: str, *args: Any, **kwargs: Any) -> None:
        log.exception("event %s failed", event)

    cogs = [
        "bot.cogs.welcome",
        "bot.cogs.info",
        "bot.cogs.report",
        "bot.cogs.role_buttons",
        "bot.cogs.admin",
    ]
    for ext in cogs:
        try:
            await bot.load_extension(ext)
            log.info("loaded cog %s", ext)
        except Exception:
            log.exception("failed to load cog %s", ext)

    # Health endpoint + GitHub release webhook receiver, both on `settings.http_port`.
    from bot.cogs.github_listener import build_http_app
    http_app = build_http_app(bot, settings)
    runner = web.AppRunner(http_app)
    await runner.setup()
    site = web.TCPSite(runner, host="0.0.0.0", port=settings.http_port)
    await site.start()
    log.info("HTTP listener on :%d", settings.http_port)

    stop = asyncio.Event()

    def _signal_handler(*_: Any) -> None:
        log.info("received shutdown signal")
        stop.set()

    loop = asyncio.get_event_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, _signal_handler)
        except NotImplementedError:
            pass

    bot_task = asyncio.create_task(bot.start(settings.discord_token))
    await stop.wait()
    log.info("shutting down …")
    await bot.close()
    await runner.cleanup()
    bot_task.cancel()
    try:
        await bot_task
    except (asyncio.CancelledError, Exception):
        pass
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
