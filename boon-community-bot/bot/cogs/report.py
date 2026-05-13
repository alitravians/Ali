"""Report cog — `/report` opens a GitHub Issue on alitravians/Ali."""

from __future__ import annotations

import logging
import textwrap

import aiohttp
import discord
from discord import app_commands
from discord.ext import commands

log = logging.getLogger("boon-bot.report")

TARGETS = ["userscript", "extension", "desktop", "other"]


class Report(commands.Cog):
    def __init__(self, bot: commands.Bot) -> None:
        self.bot = bot

    @app_commands.command(name="report", description="افتح تقرير bug على GitHub")
    @app_commands.describe(
        target="على أي target تواجه المشكلة؟",
        title="عنوان مختصر",
        description="وصف تفصيلي للمشكلة + خطوات إعادة الإنتاج",
    )
    @app_commands.choices(target=[
        app_commands.Choice(name="Userscript (web)", value="userscript"),
        app_commands.Choice(name="Browser Extension", value="extension"),
        app_commands.Choice(name="Desktop Installer", value="desktop"),
        app_commands.Choice(name="آخر / غير محدّد", value="other"),
    ])
    async def report(self, interaction: discord.Interaction,
                     target: app_commands.Choice[str],
                     title: str, description: str) -> None:
        settings = self.bot.settings  # type: ignore[attr-defined]
        if not settings.github_token:
            await interaction.response.send_message(
                "GitHub integration is not configured on this bot (admin: set "
                "`GITHUB_TOKEN` env var). راسل الإدارة مباشرة.",
                ephemeral=True,
            )
            return

        await interaction.response.defer(ephemeral=True)
        body = textwrap.dedent(f"""\
            **Target:** `{target.value}`
            **Reporter:** `{interaction.user}` (Discord ID `{interaction.user.id}`)
            **Submitted via:** BOON Community Bot (`/report`)

            ---

            {description}
            """)
        payload = {
            "title": f"[bug] {title}",
            "body": body,
            "labels": ["bug", "from-discord", f"target:{target.value}"],
        }
        url = f"https://api.github.com/repos/{settings.github_repo}/issues"
        headers = {
            "Authorization": f"Bearer {settings.github_token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "BOON-Community-Bot",
        }
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload, headers=headers,
                                        timeout=15) as r:
                    if r.status >= 300:
                        text = (await r.text())[:300]
                        log.error("GitHub responded %s: %s", r.status, text)
                        await interaction.followup.send(
                            f"GitHub رفض الطلب ({r.status}). تحقق من PAT أو حاول لاحقاً.",
                            ephemeral=True,
                        )
                        return
                    data = await r.json()
        except Exception:
            log.exception("create issue failed")
            await interaction.followup.send(
                "تعذّر الاتصال بـ GitHub. حاول لاحقاً.", ephemeral=True)
            return

        issue_url = data.get("html_url", "?")
        await interaction.followup.send(
            f"تم فتح التقرير: {issue_url}", ephemeral=True)

        # Mirror in #bug-reports for community visibility (no GitHub token leak).
        cfg = getattr(self.bot, "server_config", None) or {}
        ch_id = cfg.get("channels", {}).get("bug_reports")
        if ch_id and interaction.guild:
            ch = interaction.guild.get_channel(int(ch_id))
            if isinstance(ch, discord.TextChannel):
                try:
                    await ch.send(
                        f"🐞 **{title}** — مرفوع من <@{interaction.user.id}>: {issue_url}"
                    )
                except discord.Forbidden:
                    log.warning("cannot post to #bug-reports")


async def setup(bot: commands.Bot) -> None:
    cog = Report(bot)
    await bot.add_cog(cog)
    guild_id = bot.settings.guild_id  # type: ignore[attr-defined]
    bot.tree.add_command(cog.report, guild=discord.Object(id=guild_id))
