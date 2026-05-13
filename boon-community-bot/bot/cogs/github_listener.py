"""GitHub webhook listener — relays releases/issues to Discord channels.

Endpoints (mounted on the bot's aiohttp app, port from `PORT` env var):

  GET  /health             → 200 "ok"
  POST /webhooks/github    → release / issues events → routed to channels

Webhook configuration on GitHub:
  • Payload URL: https://<fly-app>.fly.dev/webhooks/github
  • Content type: application/json
  • Secret: same value as GITHUB_WEBHOOK_SECRET env var
  • Events: Releases, Issues, Pull requests
  • Active: yes
"""

from __future__ import annotations

import hashlib
import hmac
import json
import logging
from typing import Any

import discord
from aiohttp import web
from discord.ext import commands

from bot.config import Settings

log = logging.getLogger("boon-bot.github")


def _verify_signature(secret: str, body: bytes, sig_header: str | None) -> bool:
    if not sig_header or not sig_header.startswith("sha256="):
        return False
    mac = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(f"sha256={mac}", sig_header)


def _channel(bot: commands.Bot, key: str) -> discord.TextChannel | None:
    cfg = getattr(bot, "server_config", None) or {}
    ch_id = cfg.get("channels", {}).get(key)
    if not ch_id:
        return None
    settings: Settings = bot.settings  # type: ignore[attr-defined]
    guild = bot.get_guild(settings.guild_id)
    if not guild:
        return None
    ch = guild.get_channel(int(ch_id))
    return ch if isinstance(ch, discord.TextChannel) else None


async def _send(ch: discord.TextChannel | None, **kwargs: Any) -> None:
    if not ch:
        return
    try:
        await ch.send(**kwargs)
    except discord.Forbidden:
        log.warning("cannot post to #%s (forbidden)", ch.name)


async def _handle_release(bot: commands.Bot, payload: dict[str, Any]) -> None:
    if payload.get("action") != "published":
        return
    rel = payload.get("release", {})
    tag = rel.get("tag_name", "?")
    body = (rel.get("body") or "")[:1800]
    url = rel.get("html_url")
    embed = discord.Embed(
        title=f"🎉 BOON {tag}",
        url=url,
        description=body,
        color=0x00FF88,
    )
    embed.set_footer(text="GitHub Releases")
    for key in ("announcements", "plugin_news"):
        await _send(_channel(bot, key), embed=embed)


async def _handle_issue(bot: commands.Bot, payload: dict[str, Any]) -> None:
    if payload.get("action") != "opened":
        return
    issue = payload.get("issue", {})
    if "pull_request" in issue:
        return  # PRs go through pull_request event
    if any(label.get("name") == "bug" for label in issue.get("labels", [])):
        await _send(
            _channel(bot, "bug_reports"),
            content=(f"🐞 **#{issue.get('number')}** — {issue.get('title')}\n"
                     f"{issue.get('html_url')}"),
        )


async def _handle_pr(bot: commands.Bot, payload: dict[str, Any]) -> None:
    if payload.get("action") not in ("opened", "closed", "reopened"):
        return
    pr = payload.get("pull_request", {})
    action = payload["action"]
    if action == "closed" and pr.get("merged"):
        verb = "merged"
        color = 0x6F42C1
    elif action == "closed":
        verb = "closed"
        color = 0xCB2431
    elif action == "reopened":
        verb = "reopened"
        color = 0x238636
    else:
        verb = "opened"
        color = 0x2EA043
    embed = discord.Embed(
        title=f"PR #{pr.get('number')} {verb}: {pr.get('title')}",
        url=pr.get("html_url"),
        description=(pr.get("body") or "")[:1000],
        color=color,
    )
    embed.set_footer(text=f"by {pr.get('user', {}).get('login', '?')}")
    await _send(_channel(bot, "github_prs"), embed=embed)


def build_http_app(bot: commands.Bot, settings: Settings) -> web.Application:
    async def health(_req: web.Request) -> web.Response:
        return web.Response(text="ok")

    async def webhook(req: web.Request) -> web.Response:
        body = await req.read()
        if settings.github_webhook_secret:
            sig = req.headers.get("X-Hub-Signature-256")
            if not _verify_signature(settings.github_webhook_secret, body, sig):
                return web.Response(status=401, text="bad signature")
        event = req.headers.get("X-GitHub-Event", "")
        try:
            payload = json.loads(body or b"{}")
        except json.JSONDecodeError:
            return web.Response(status=400, text="bad json")

        try:
            if event == "release":
                await _handle_release(bot, payload)
            elif event == "issues":
                await _handle_issue(bot, payload)
            elif event == "pull_request":
                await _handle_pr(bot, payload)
            else:
                log.info("ignored event: %s", event)
        except Exception:
            log.exception("webhook handler failed for event=%s", event)
            return web.Response(status=500, text="handler error")

        return web.Response(text="ok")

    app = web.Application()
    app.router.add_get("/health", health)
    app.router.add_post("/webhooks/github", webhook)
    return app
