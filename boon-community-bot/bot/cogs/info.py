"""Info cog — public slash commands.

  /install [target?]   — تثبيت BOON
  /plugin <name>       — معلومات عن plugin
  /version             — آخر إصدار من GitHub
"""

from __future__ import annotations

import logging

import aiohttp
import discord
from discord import app_commands
from discord.ext import commands

log = logging.getLogger("boon-bot.info")

INSTALL_LINKS = {
    "userscript": (
        "**Userscript (web Discord)**\n"
        "١. ثبّت Tampermonkey: https://www.tampermonkey.net/\n"
        "٢. افتح: https://raw.githubusercontent.com/alitravians/Ali/main/boon/dist/boon.user.js\n"
        "٣. Tampermonkey يفتح صفحة Install — اضغطها.\n"
        "٤. افتح https://discord.com/app ثم Ctrl+Shift+B."
    ),
    "extension": (
        "**Browser Extension**\n"
        "حمّل آخر `extension.zip` من Releases:\n"
        "https://github.com/alitravians/Ali/releases\n"
        "وفك ضغطه، ثم Chrome → Extensions → Developer Mode → Load Unpacked."
    ),
    "desktop": (
        "**Desktop Installer**\n"
        "حمّل المثبّت لنظامك من Releases:\n"
        "https://github.com/alitravians/Ali/releases\n"
        "شغّله ثم اضغط (1) Patch. يعيد فتح Discord تلقائياً."
    ),
}

PLUGINS = {
    "aliThemes": ("AliThemes", "ثيمات + لون مخصّص + CSS مخصّص."),
    "serverTools": ("ServerTools", "`..purge` / `..purgefrom` / `..channelinfo` / `..boon`"),
    "autoTranslate": ("AutoTranslate", "ترجمة الرسائل بـ Google أو Gemini (right-click)."),
    "musicPlayer": ("MusicPlayer", "مشغّل YouTube عائم + `..play` + chat-button."),
    "noNitroAds": ("NoNitroAds", "إخفاء كل عناصر الترقية لـ Nitro."),
}


class Info(commands.Cog):
    def __init__(self, bot: commands.Bot) -> None:
        self.bot = bot

    @app_commands.command(name="install", description="روابط تثبيت BOON لكل المنصات")
    @app_commands.describe(target="userscript / extension / desktop (اختياري)")
    async def install(self, interaction: discord.Interaction,
                      target: str | None = None) -> None:
        if target and target in INSTALL_LINKS:
            await interaction.response.send_message(INSTALL_LINKS[target],
                                                    ephemeral=True)
            return
        body = (
            "**روابط تثبيت BOON:**\n\n"
            f"{INSTALL_LINKS['userscript']}\n\n"
            f"{INSTALL_LINKS['extension']}\n\n"
            f"{INSTALL_LINKS['desktop']}"
        )
        await interaction.response.send_message(body, ephemeral=True)

    @app_commands.command(name="plugin", description="معلومات عن plugin")
    @app_commands.describe(name="اسم الـ plugin")
    @app_commands.choices(name=[
        app_commands.Choice(name="AliThemes", value="aliThemes"),
        app_commands.Choice(name="ServerTools", value="serverTools"),
        app_commands.Choice(name="AutoTranslate", value="autoTranslate"),
        app_commands.Choice(name="MusicPlayer", value="musicPlayer"),
        app_commands.Choice(name="NoNitroAds", value="noNitroAds"),
    ])
    async def plugin(self, interaction: discord.Interaction,
                     name: app_commands.Choice[str]) -> None:
        title, desc = PLUGINS[name.value]
        embed = discord.Embed(title=title, description=desc, color=0x00FF88)
        embed.add_field(name="الكود",
                        value=f"https://github.com/alitravians/Ali/tree/main/boon/src/plugins/{name.value}",
                        inline=False)
        await interaction.response.send_message(embed=embed, ephemeral=True)

    @app_commands.command(name="version", description="آخر إصدار من GitHub")
    async def version(self, interaction: discord.Interaction) -> None:
        await interaction.response.defer(ephemeral=True)
        repo = self.bot.settings.github_repo  # type: ignore[attr-defined]
        url = f"https://api.github.com/repos/{repo}/releases/latest"
        try:
            async with aiohttp.ClientSession() as session:
                # aiohttp 3.11+ deprecates bare-int timeouts and emits a
                # DeprecationWarning that ends up in the bot's logs. Use an
                # explicit ClientTimeout so the call is forward-compatible
                # with aiohttp 4.x (which will reject ints outright).
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as r:
                    if r.status == 404:
                        await interaction.followup.send(
                            "ما فيه releases بعد على GitHub.", ephemeral=True)
                        return
                    r.raise_for_status()
                    data = await r.json()
        except Exception:
            log.exception("failed to fetch GitHub release")
            await interaction.followup.send(
                "تعذّر جلب الإصدار من GitHub.", ephemeral=True)
            return

        embed = discord.Embed(
            title=f"BOON {data.get('tag_name', '?')}",
            url=data.get("html_url"),
            description=(data.get("body") or "")[:1500],
            color=0x00FF88,
        )
        embed.set_footer(text=f"published: {data.get('published_at', '?')}")
        await interaction.followup.send(embed=embed, ephemeral=True)


async def setup(bot: commands.Bot) -> None:
    cog = Info(bot)
    await bot.add_cog(cog)
    guild_id = bot.settings.guild_id  # type: ignore[attr-defined]
    guild = discord.Object(id=guild_id)
    # ``app_commands.Command`` instances bound to a cog appear to mypy as
    # plain ``object`` because ``commands.Cog`` doesn't propagate the
    # descriptor type. The runtime is correct (the loop iterates over
    # already-decorated ``app_commands.Command`` objects), so silence the
    # arg-type complaint at the single call site.
    for cmd in [cog.install, cog.plugin, cog.version]:
        bot.tree.add_command(cmd, guild=guild)  # type: ignore[arg-type]
