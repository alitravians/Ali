"""Bot entry point — loads cogs, syncs slash commands, runs forever."""
from __future__ import annotations

import asyncio
import logging
import sys

import discord
from discord.ext import commands

from .config import Settings
from .db import Database

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger("bot")


class CompetitionsBot(commands.Bot):
    def __init__(self, settings: Settings):
        intents = discord.Intents.default()
        # Privileged intents — only enabled if the developer portal toggles them on.
        # The bot still functions without these; on_member_join just won't fire and
        # /contest's open-text mode will require slash interactions instead of raw messages.
        intents.members = bool(int(__import__("os").environ.get("ENABLE_MEMBERS_INTENT", "0")))
        intents.message_content = bool(int(__import__("os").environ.get("ENABLE_MESSAGE_CONTENT_INTENT", "0")))
        super().__init__(
            command_prefix="!",  # legacy; we mainly use slash commands
            intents=intents,
            help_command=None,
        )
        self.settings = settings
        self.db = Database(settings.db_path)
        self.active_competitions: dict[int, dict] = {}  # channel_id -> state

    async def setup_hook(self) -> None:
        await self.db.connect()
        for cog in (
            "bot.cogs.help_cmd",
            "bot.cogs.welcome",
            "bot.cogs.quiz",
            "bot.cogs.race",
            "bot.cogs.daily",
            "bot.cogs.leaderboard",
            "bot.cogs.profile",
            "bot.cogs.seasons",
            "bot.cogs.achievements",
            "bot.cogs.admin",
            "bot.cogs.tournament",
            "bot.cogs.contest",
            "bot.cogs.stats_loop",
            "bot.cogs.logs",
            "bot.cogs.updates",
        ):
            try:
                await self.load_extension(cog)
                log.info("loaded cog: %s", cog)
            except Exception:
                log.exception("failed to load cog %s", cog)

        guild = discord.Object(id=self.settings.guild_id)
        try:
            self.tree.copy_global_to(guild=guild)
            synced = await self.tree.sync(guild=guild)
            log.info("synced %d guild commands to %s", len(synced), self.settings.guild_id)
        except Exception:
            log.exception("failed to sync slash commands")

    async def on_ready(self) -> None:
        log.info("Logged in as %s (id=%s) — guilds=%d", self.user, self.user and self.user.id, len(self.guilds))
        await self.change_presence(
            activity=discord.Game(name="🏆 /quiz لبدء مسابقة"),
            status=discord.Status.online,
        )


async def main() -> None:
    settings = Settings.load()
    bot = CompetitionsBot(settings)
    async with bot:
        await bot.start(settings.bot_token)


if __name__ == "__main__":
    asyncio.run(main())
