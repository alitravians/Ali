"""Idempotent enforcer for the 3-tier permission model defined in
`bot/structure.py`. Re-run after every structural change.

Tiers (see `Tier` in `bot/structure.py`):
  ADMIN_ONLY  — @everyone denied VIEW; admin/moderator/bots allowed full
  READ_ONLY   — @everyone allowed VIEW + REACT, denied SEND + slash
  OPEN_WRITE  — @everyone allowed VIEW + SEND + slash
  VOICE_OPEN  — @everyone allowed VIEW + CONNECT + SPEAK + slash
  VOICE_ADMIN — same as ADMIN_ONLY but with CONNECT/SPEAK instead of SEND

The `banned` role is explicitly denied VIEW on the OPEN_WRITE chat channels
so banned members cannot lurk in support / help rooms.

Critically: the bot's own role is granted SEND on every tier — including
ADMIN_ONLY — so it can post logs even though @everyone is denied. This
mirrors `CompetitionsBot/scripts/fix_permissions.py`.
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

from bot.structure import CATEGORIES, ChannelSpec, Tier  # noqa: E402

TOKEN = os.environ["DISCORD_BOT_TOKEN"]
GUILD = os.environ["GUILD_ID"]
CONFIG_PATH = REPO_ROOT / "server_config.json"

# Permission bit flags (https://discord.com/developers/docs/topics/permissions)
VIEW_CHANNEL = 1 << 10
SEND_MESSAGES = 1 << 11
READ_MESSAGE_HISTORY = 1 << 16
ADD_REACTIONS = 1 << 6
USE_APPLICATION_COMMANDS = 1 << 31
MANAGE_MESSAGES = 1 << 13
EMBED_LINKS = 1 << 14
ATTACH_FILES = 1 << 15
MENTION_EVERYONE = 1 << 17
CONNECT_VOICE = 1 << 20
SPEAK_VOICE = 1 << 21


def request(method: str, path: str, body: Any | None = None) -> Any:
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(
        f"https://discord.com/api/v10{path}",
        data=data,
        method=method,
        headers={
            "Authorization": f"Bot {TOKEN}",
            "Content-Type": "application/json",
            "User-Agent": "DiscordBot (BOON Community Bot, 0.1.0)",
        },
    )
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                if r.status == 204:
                    return None
                return json.loads(r.read())
        except urllib.error.HTTPError as e:
            if e.code in (502, 503, 504):
                time.sleep(2.0 + attempt * 1.5)
                continue
            if e.code == 429:
                try:
                    retry = float(json.loads(e.read()).get("retry_after", 1.0))
                except Exception:
                    retry = float(e.headers.get("Retry-After", 1.0))
                time.sleep(retry + 0.25)
                continue
            print(f"HTTP {e.code} on {method} {path}: {e.read()[:300]!r}", file=sys.stderr)
            raise
    raise RuntimeError(f"giving up after retries: {method} {path}")


def overwrite(channel_id: str, target_id: str, *, allow: int = 0, deny: int = 0,
              role: bool = True) -> None:
    request(
        "PUT",
        f"/channels/{channel_id}/permissions/{target_id}",
        {"id": target_id, "type": 0 if role else 1,
         "allow": str(allow), "deny": str(deny)},
    )
    time.sleep(0.3)


def _admin_perms() -> int:
    return (VIEW_CHANNEL | SEND_MESSAGES | READ_MESSAGE_HISTORY |
            EMBED_LINKS | ATTACH_FILES | MANAGE_MESSAGES |
            MENTION_EVERYONE | USE_APPLICATION_COMMANDS | ADD_REACTIONS)


def _bot_post_perms() -> int:
    return (VIEW_CHANNEL | SEND_MESSAGES | READ_MESSAGE_HISTORY |
            EMBED_LINKS | ATTACH_FILES)


def _voice_admin_perms() -> int:
    return (VIEW_CHANNEL | CONNECT_VOICE | SPEAK_VOICE |
            USE_APPLICATION_COMMANDS)


def main() -> int:
    cfg = json.loads(CONFIG_PATH.read_text())
    everyone = GUILD  # @everyone role id == guild id
    roles = cfg["roles"]
    admin_role = roles.get("admin")
    mod_role = roles.get("moderator")
    maint_role = roles.get("maintainer")
    bot_role_grouping = roles.get("bot")
    banned_role = roles.get("banned")
    member_role = roles.get("member")
    unverified_role = roles.get("unverified")

    # The bot's own integration role is created by Discord when the app is
    # invited. We look it up so we can guarantee it can post in admin-only
    # logs even if the manual "bots" grouping is removed.
    bot_user = request("GET", "/users/@me")
    own_member = request("GET", f"/guilds/{GUILD}/members/{bot_user['id']}")
    integration_role = next((r for r in own_member["roles"]
                             if r != GUILD), None)
    if integration_role:
        print(f"bot integration role: {integration_role}")

    channels: dict[str, ChannelSpec] = {}
    for cat in CATEGORIES:
        for ch in cat.channels:
            channels[ch.key] = ch

    targets: list[tuple[str, ChannelSpec]] = []
    for key, ch in channels.items():
        ch_id = cfg.get("voice_channels" if ch.type.name == "VOICE" else "channels",
                        {}).get(key)
        if ch_id:
            targets.append((ch_id, ch))

    for ch_id, ch in targets:
        tier = ch.tier
        print(f"\n[{tier.value:11s}] {ch.name} ({ch_id})")

        if tier == Tier.ADMIN_ONLY:
            # IMPORTANT: grant the bot its own VIEW + manage perms BEFORE
            # denying @everyone. Otherwise the bot loses access to the channel
            # the moment @everyone is denied (since the bot's grant comes from
            # @everyone + Manage Roles for the channel), and the very next
            # PUT in the iteration returns 403 Missing Access.
            if integration_role:
                overwrite(ch_id, integration_role, allow=_bot_post_perms())
            if admin_role:
                overwrite(ch_id, admin_role, allow=_admin_perms())
            if maint_role:
                overwrite(ch_id, maint_role, allow=_admin_perms())
            if mod_role:
                overwrite(ch_id, mod_role, allow=_admin_perms())
            if bot_role_grouping:
                overwrite(ch_id, bot_role_grouping, allow=_bot_post_perms())
            overwrite(ch_id, everyone, allow=0, deny=VIEW_CHANNEL)

        elif tier == Tier.READ_ONLY:
            overwrite(ch_id, everyone,
                      allow=VIEW_CHANNEL | READ_MESSAGE_HISTORY | ADD_REACTIONS,
                      deny=SEND_MESSAGES | USE_APPLICATION_COMMANDS)
            if admin_role:
                overwrite(ch_id, admin_role, allow=_admin_perms())
            if maint_role:
                overwrite(ch_id, maint_role, allow=_admin_perms())
            if mod_role:
                overwrite(ch_id, mod_role, allow=_admin_perms())
            if integration_role:
                overwrite(ch_id, integration_role, allow=_bot_post_perms())
            if bot_role_grouping:
                overwrite(ch_id, bot_role_grouping, allow=_bot_post_perms())
            if unverified_role:
                # Welcome/rules must be visible to unverified users; everything
                # else in this tier is hidden until verification.
                if ch.key in ("welcome", "rules"):
                    overwrite(ch_id, unverified_role,
                              allow=VIEW_CHANNEL | READ_MESSAGE_HISTORY | ADD_REACTIONS)
                else:
                    overwrite(ch_id, unverified_role, deny=VIEW_CHANNEL)

        elif tier == Tier.OPEN_WRITE:
            overwrite(ch_id, everyone,
                      allow=VIEW_CHANNEL | SEND_MESSAGES | READ_MESSAGE_HISTORY |
                            ADD_REACTIONS | USE_APPLICATION_COMMANDS)
            if banned_role:
                overwrite(ch_id, banned_role, deny=VIEW_CHANNEL)
            if unverified_role:
                # Hide all open-write channels from unverified members.
                overwrite(ch_id, unverified_role, deny=VIEW_CHANNEL)
            if member_role:
                # Redundant with @everyone but explicit for clarity if @everyone
                # is ever locked down later.
                overwrite(ch_id, member_role,
                          allow=VIEW_CHANNEL | SEND_MESSAGES | READ_MESSAGE_HISTORY |
                                ADD_REACTIONS | USE_APPLICATION_COMMANDS)

        elif tier == Tier.VOICE_OPEN:
            overwrite(ch_id, everyone,
                      allow=VIEW_CHANNEL | CONNECT_VOICE | SPEAK_VOICE |
                            USE_APPLICATION_COMMANDS)
            if banned_role:
                overwrite(ch_id, banned_role, deny=VIEW_CHANNEL)
            if unverified_role:
                overwrite(ch_id, unverified_role, deny=VIEW_CHANNEL)

        elif tier == Tier.VOICE_ADMIN:
            # Same ordering rationale as ADMIN_ONLY: grant bot/admin roles
            # BEFORE denying @everyone, otherwise the bot loses access.
            if integration_role:
                overwrite(ch_id, integration_role, allow=_voice_admin_perms())
            if admin_role:
                overwrite(ch_id, admin_role, allow=_voice_admin_perms())
            if maint_role:
                overwrite(ch_id, maint_role, allow=_voice_admin_perms())
            if mod_role:
                overwrite(ch_id, mod_role, allow=_voice_admin_perms())
            overwrite(ch_id, everyone, deny=VIEW_CHANNEL)

    print("\n✓ permissions applied. Run `python -m scripts.audit` to verify.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
