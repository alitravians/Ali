"""Harden the bot-role layout on the alitravians A❤️M's server.

This script enforces the canonical bot-permission model documented in the
"Discord Bots, Roles & Permissions" knowledge note. It:

  1. Reduces the manual ``🤖 Bots`` grouping role to zero server-level perms
     (it is purely a visual/grouping/channel-override target — not a perms
     vehicle).
  2. Strips ``Administrator`` from each bot's *managed integration role*
     (e.g. ``competitions``) and replaces it with the narrowest set of perms
     that bot actually needs (least privilege). The music bot's managed role
     is already correctly scoped and is left untouched.
  3. Repositions roles so:
       admin > all managed bot roles > 🤖 Bots grouping > member tier roles
     This is required for ``MANAGE_ROLES`` to actually take effect — a role
     can only manage roles strictly below its own position.
  4. Ensures the manual grouping role exists and every bot member is a
     holder, so future channel overrides can target ``🤖 Bots`` once and
     affect every bot at the same time.

Idempotent — re-running converges to the same end state. Re-run after
inviting a new bot.

Requires ``ADMIN_BOT_TOKEN`` env var pointing at a bot with Administrator
*and* a top role above the targets being edited.
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import discord
from discord.ext import commands

GUILD_ID = int(os.environ.get("GUILD_ID", "1165790728551669780"))
GROUPING_ROLE_NAME = "🤖 Bots"
GROUPING_ROLE_COLOR = discord.Color.from_rgb(155, 89, 182)

CONFIG_PATH = Path(__file__).resolve().parent.parent / "server_config.json"


BOT_USER_IDS: list[int] = [
    1499139313814736936,
    1498869017996300350,
]


COMPETITIONS_BOT_PERMS = discord.Permissions(
    view_channel=True,
    send_messages=True,
    send_messages_in_threads=True,
    embed_links=True,
    attach_files=True,
    read_message_history=True,
    add_reactions=True,
    use_application_commands=True,
    mention_everyone=True,
    manage_guild=True,
    manage_channels=True,
    manage_roles=True,
    manage_messages=True,
    manage_threads=True,
    kick_members=True,
    ban_members=True,
    moderate_members=True,
    view_audit_log=True,
    create_instant_invite=True,
    change_nickname=True,
    manage_nicknames=True,
)

MUSIC_BOT_PERMS = discord.Permissions(
    view_channel=True,
    send_messages=True,
    embed_links=True,
    attach_files=True,
    read_message_history=True,
    add_reactions=True,
    use_application_commands=True,
    connect=True,
    speak=True,
    use_voice_activation=True,
    priority_speaker=True,
    change_nickname=True,
)


MANAGED_ROLE_PERMS_BY_BOT_ID: dict[int, discord.Permissions] = {
    1498869017996300350: COMPETITIONS_BOT_PERMS,
    1499139313814736936: MUSIC_BOT_PERMS,
}


def load_extra_bot_ids() -> list[int]:
    if not CONFIG_PATH.exists():
        return []
    try:
        data = json.loads(CONFIG_PATH.read_text())
    except json.JSONDecodeError:
        return []
    raw = data.get("bot_user_ids") or []
    return [int(x) for x in raw if str(x).isdigit()]


def write_config(grouping_role_id: int, bot_ids: list[int]) -> None:
    if not CONFIG_PATH.exists():
        return
    data = json.loads(CONFIG_PATH.read_text())
    data["bots_role_id"] = str(grouping_role_id)
    data["bot_user_ids"] = [str(x) for x in bot_ids]
    CONFIG_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=4) + "\n")


async def ensure_grouping_role(guild: discord.Guild) -> discord.Role:
    """Create or normalise the manual ``🤖 Bots`` grouping role.

    Permissions are forced to **0** — this role is not a perms vehicle, only a
    label / hoist / channel-override target. Any prior Administrator bit
    (which an earlier version of this script granted) is stripped here.
    """
    candidates = [GROUPING_ROLE_NAME, "🤖Bots", "🎵 Music Bot", "🎵Music Bot"]
    role = None
    for n in candidates:
        role = discord.utils.get(guild.roles, name=n)
        if role is not None:
            break

    zero = discord.Permissions.none()
    if role is None:
        role = await guild.create_role(
            name=GROUPING_ROLE_NAME,
            permissions=zero,
            colour=GROUPING_ROLE_COLOR,
            hoist=False,
            mentionable=False,
            reason="Create grouping role for all server bots (no server-level perms)",
        )
        print(f"created grouping role {role.name!r} (id={role.id})")
    else:
        kwargs: dict[str, object] = {}
        if role.name != GROUPING_ROLE_NAME:
            kwargs["name"] = GROUPING_ROLE_NAME
        if role.permissions.value != 0:
            kwargs["permissions"] = zero
        if role.colour != GROUPING_ROLE_COLOR:
            kwargs["colour"] = GROUPING_ROLE_COLOR
        if role.hoist:
            kwargs["hoist"] = False
        if role.mentionable:
            kwargs["mentionable"] = False
        if kwargs:
            await role.edit(reason="Normalise grouping role to zero-perms label", **kwargs)
            print(f"normalised grouping role {role.name!r} (id={role.id})  changes={list(kwargs)}")
        else:
            print(f"grouping role unchanged: {role.name!r} (id={role.id})")
    return role


async def harden_managed_role(guild: discord.Guild, bot_user_id: int) -> discord.Role | None:
    """Replace Administrator on a bot's managed integration role with a
    least-privilege bitfield. Discord's API does allow editing perms on a
    managed role even though the UI doesn't surface a permissions tab."""
    role = next(
        (r for r in guild.roles if r.tags and r.tags.bot_id == bot_user_id),
        None,
    )
    if role is None:
        print(f"managed role for bot {bot_user_id} not found (bot not in guild?)")
        return None

    target = MANAGED_ROLE_PERMS_BY_BOT_ID.get(bot_user_id)
    if target is None:
        print(f"no perms recipe for bot {bot_user_id}; leaving managed role {role.name!r} unchanged")
        return role

    if role.permissions.value == target.value:
        print(f"managed role {role.name!r} (id={role.id}) already at target perms")
        return role

    try:
        await role.edit(
            permissions=target,
            reason="Apply least-privilege perms to managed bot role",
        )
        print(f"hardened managed role {role.name!r} (id={role.id}): {role.permissions.value} -> {target.value}")
    except discord.Forbidden as e:
        print(f"cannot edit managed role {role.name!r}: {e}")
    except discord.HTTPException as e:
        print(f"failed to edit managed role {role.name!r}: {e}")
    return role


async def reposition_roles(
    guild: discord.Guild,
    grouping_role: discord.Role,
    managed_roles: list[discord.Role],
) -> None:
    """Place managed bot roles ABOVE the grouping role and member-tier roles,
    so MANAGE_ROLES on a bot can actually affect rewards/punishment roles.

    The admin role stays on top. We don't touch its position.
    """
    me_top = guild.me.top_role
    base = me_top.position
    targets: dict[discord.Role, int] = {}
    target_pos = base - 1
    for role in managed_roles:
        if role is None or role.position == target_pos:
            target_pos -= 1
            continue
        targets[role] = target_pos
        target_pos -= 1
    if grouping_role.position != target_pos and target_pos > 0:
        targets[grouping_role] = target_pos

    if not targets:
        print("role positions already correct; no reposition needed")
        return

    try:
        await guild.edit_role_positions(targets, reason="Position bot roles above member tiers")
        print("repositioned roles:", {r.name: p for r, p in targets.items()})
    except discord.HTTPException as e:
        print(f"reposition skipped: {e}")


async def main() -> int:
    token = os.environ["ADMIN_BOT_TOKEN"]
    intents = discord.Intents.none()
    intents.guilds = True
    intents.members = True
    bot = commands.Bot(command_prefix="!", intents=intents)
    rc = {"code": 1}

    @bot.event
    async def on_ready() -> None:
        try:
            guild = bot.get_guild(GUILD_ID) or await bot.fetch_guild(GUILD_ID)
            print(f"connected to guild: {guild.name}")

            all_bot_ids = sorted({*BOT_USER_IDS, *load_extra_bot_ids()})

            grouping = await ensure_grouping_role(guild)

            managed_roles: list[discord.Role] = []
            for uid in all_bot_ids:
                r = next(
                    (rr for rr in guild.roles if rr.tags and rr.tags.bot_id == uid),
                    None,
                )
                if r is not None:
                    managed_roles.append(r)
                else:
                    print(f"managed role for bot {uid} not found (bot not in guild?)")

            await reposition_roles(guild, grouping, managed_roles)

            for uid in all_bot_ids:
                try:
                    member = guild.get_member(uid) or await guild.fetch_member(uid)
                except discord.NotFound:
                    print(f"skip: bot user {uid} not in guild")
                    continue
                if not member.bot:
                    print(f"skip: user {uid} is not a bot account")
                    continue
                if grouping not in member.roles:
                    await member.add_roles(grouping, reason="Add bot to manual grouping role")
                    print(f"added grouping role to {member} ({uid})")

                # Strip any stray member-tier / cosmetic roles that may have
                # been auto-assigned (e.g. via autorole). A bot account should
                # only ever hold:
                #   - its own managed integration role (r.tags.bot_id == uid)
                #   - the manual grouping role
                #   - @everyone (default; cannot be removed)
                stray = [
                    r for r in member.roles
                    if not r.is_default()
                    and r.id != grouping.id
                    and not (r.tags and r.tags.bot_id == uid)
                ]
                if stray:
                    try:
                        await member.remove_roles(
                            *stray,
                            reason="Bot accounts only keep managed + grouping roles",
                        )
                        print(f"stripped stray roles from {member}: {[r.name for r in stray]}")
                    except discord.Forbidden as e:
                        print(f"cannot strip stray roles from {member}: {e}")

            self_bot_id = bot.user.id if bot.user else None
            other_bot_ids = [uid for uid in all_bot_ids if uid != self_bot_id]
            for uid in other_bot_ids:
                await harden_managed_role(guild, uid)
            if self_bot_id is not None and self_bot_id in all_bot_ids:
                print(f"hardening self ({self_bot_id}) last to preserve perms during the run")
                await harden_managed_role(guild, self_bot_id)

            write_config(grouping.id, all_bot_ids)
            print(f"BOTS_GROUPING_ROLE_ID={grouping.id}")
            rc["code"] = 0
        except Exception as e:
            print(f"ERROR: {type(e).__name__}: {e}", file=sys.stderr)
            rc["code"] = 3
        finally:
            await bot.close()

    await bot.start(token)
    return rc["code"]


if __name__ == "__main__":
    import asyncio

    sys.exit(asyncio.run(main()))
