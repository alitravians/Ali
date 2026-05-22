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
from bot.observability import capture_exception, init_sentry


async def main() -> int:
    settings = load_settings()
    logging.basicConfig(
        level=settings.log_level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    log = logging.getLogger("boon-bot")

    # Init Sentry as early as possible — *after* logging is configured
    # (so the LoggingIntegration sees the same level the operator set)
    # but *before* any cogs load, so a cog import error is reported too.
    init_sentry()

    # If `server_config.json` is missing, the bot can still start and answer
    # /version / /install, but channel-aware features (welcome, github relay)
    # are disabled until the operator runs `scripts/setup_server.py`.
    try:
        server_config: dict[str, Any] | None = load_server_config(
            settings.server_config_path
        )
    except FileNotFoundError as e:
        log.warning("%s", e)
        server_config = None
    if server_config is not None:
        # Narrow ``server_config`` to a concrete dict before accessing
        # ``.get``; without this mypy (correctly) flags the call as an
        # attribute access on the ``None`` branch even though we are
        # inside the success branch of the try/except above.
        log.info(
            "loaded server_config.json (%d channels)",
            len(server_config.get("channels", {})),
        )

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
        exc = sys.exc_info()[1]
        if exc is not None:
            capture_exception(exc, discord_event=event)

    @bot.tree.error
    async def on_app_command_error(
        interaction: discord.Interaction,
        error: discord.app_commands.AppCommandError,
    ) -> None:
        # discord.py wraps the original exception inside CommandInvokeError;
        # unwrap it so Sentry groups by the *real* root cause rather than
        # grouping every slash-command failure into one giant issue.
        root = getattr(error, "original", error)
        command_name = (
            interaction.command.qualified_name if interaction.command else "<unknown>"
        )
        log.exception("slash command %s failed", command_name, exc_info=root)
        capture_exception(
            root,
            discord_command=command_name,
            discord_guild_id=interaction.guild_id,
            discord_user_id=interaction.user.id,
        )
        # Without a reply Discord shows "The application did not respond"
        # (or freezes a deferred ``thinking…`` spinner forever). Send an
        # ephemeral apology so the user gets immediate feedback even on
        # an uncaught crash. Wrap in try/except so a failure to reply
        # (closed connection, permission missing, etc.) doesn't itself
        # propagate back into the error handler.
        try:
            msg = "حصل خطأ غير متوقع. تم إبلاغ الإدارة تلقائياً."
            if interaction.response.is_done():
                await interaction.followup.send(msg, ephemeral=True)
            else:
                await interaction.response.send_message(msg, ephemeral=True)
        except Exception as reply_exc:
            # Best-effort apology — discord.HTTPException is the common
            # case (closed websocket, missing perms, 3-second window
            # expired), but raw aiohttp.ClientError or anything else
            # raised during the reply must not propagate back into the
            # error handler and turn one bug into two Sentry issues.
            log.warning(
                "failed to send ephemeral error reply for %s: %s",
                command_name, reply_exc,
            )

    cogs = [
        "bot.cogs.welcome",
        "bot.cogs.info",
        "bot.cogs.report",
        "bot.cogs.role_buttons",
        "bot.cogs.admin",
        "bot.cogs.onboarding",
    ]
    for ext in cogs:
        try:
            await bot.load_extension(ext)
            log.info("loaded cog %s", ext)
        except Exception as exc:
            log.exception("failed to load cog %s", ext)
            capture_exception(exc, cog=ext)

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
    stop_task = asyncio.create_task(stop.wait())
    # Wait for whichever happens first: a graceful shutdown signal *or*
    # the bot task terminating on its own (which it should never do under
    # normal operation, but can if Discord rejects the token mid-session
    # or aiohttp's websocket loop dies). Previously we awaited only
    # ``stop.wait()`` — a crashed bot_task would sit silently with a
    # process kept alive by the HTTP server, masking the failure from
    # Fly.io's restart machinery.
    done, _pending = await asyncio.wait(
        {bot_task, stop_task}, return_when=asyncio.FIRST_COMPLETED,
    )
    if bot_task in done and not stop_task.done():
        # Surface the underlying exception so production debugging has
        # something to grep for. ``Task.exception()`` returns None if the
        # task completed cleanly (which would itself be unexpected for
        # bot.start()) — log either way so the operator sees the
        # transition. ``.exception()`` raises ``CancelledError`` if the
        # task was cancelled; nothing in this path cancels bot_task so it
        # shouldn't happen, but we defend against it so a future edit
        # can't accidentally short-circuit the shutdown logger.
        try:
            bot_exc: BaseException | None = bot_task.exception()
        except asyncio.CancelledError:
            bot_exc = None
            log.warning("bot task was cancelled before we observed completion")
        if bot_exc is not None:
            log.error(
                "bot task exited with %s: %s",
                type(bot_exc).__name__, bot_exc, exc_info=bot_exc,
            )
            # LoggingIntegration is configured with event_level=None
            # (see bot.observability) so this log line alone wouldn't
            # reach Sentry. Capture explicitly so a dead gateway, a
            # revoked token, or any other terminal bot.start() failure
            # surfaces as an alert instead of being buried in Fly logs.
            capture_exception(bot_exc, discord_event="bot_task_crashed")
        else:
            log.error("bot task exited cleanly (unexpected); shutting down")
        stop_task.cancel()
        # ``stop_task`` was awaiting an asyncio.Event — cancelling it raises
        # CancelledError inside the awaiter, which the surrounding
        # ``asyncio.wait`` has already consumed. Drain the cancellation
        # explicitly so the task is fully resolved before we move on.
        try:
            await stop_task
        except asyncio.CancelledError:
            pass
    log.info("shutting down …")
    await bot.close()
    await runner.cleanup()
    bot_task.cancel()
    try:
        await bot_task
    except (asyncio.CancelledError, Exception):  # noqa: BLE001
        pass
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
