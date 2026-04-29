"""Create '🎵 Music Bot' role with proper voice permissions and assign it to the music bot.

Idempotent: re-running it updates the existing role rather than creating a duplicate.
Uses the CompetitionsBot's token (which has Administrator) to create/edit the role,
since the music bot itself was invited without Manage Roles.
"""
from __future__ import annotations

import os
import sys

import discord
from discord.ext import commands

GUILD_ID = int(os.environ.get("GUILD_ID", "1165790728551669780"))
MUSIC_BOT_USER_ID = int(os.environ.get("MUSIC_BOT_USER_ID", "1499139313814736936"))
ROLE_NAME = "🎵 Music Bot"
ROLE_COLOR = discord.Color.from_rgb(155, 89, 182)

ROLE_PERMS = discord.Permissions(
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


async def main() -> int:
    token = os.environ["ADMIN_BOT_TOKEN"]

    intents = discord.Intents.none()
    intents.guilds = True
    intents.members = True
    bot = commands.Bot(command_prefix="!", intents=intents)

    result = {"code": 1}

    @bot.event
    async def on_ready() -> None:
        try:
            guild = bot.get_guild(GUILD_ID) or await bot.fetch_guild(GUILD_ID)
            print(f"connected to guild: {guild.name}")

            existing = discord.utils.get(guild.roles, name=ROLE_NAME)
            if existing is None:
                role = await guild.create_role(
                    name=ROLE_NAME,
                    permissions=ROLE_PERMS,
                    colour=ROLE_COLOR,
                    hoist=False,
                    mentionable=False,
                    reason="Dedicated role for the standalone music bot",
                )
                print(f"created role: {role.name} (id={role.id})")
            else:
                role = existing
                if role.permissions.value != ROLE_PERMS.value or role.colour != ROLE_COLOR:
                    await role.edit(
                        permissions=ROLE_PERMS,
                        colour=ROLE_COLOR,
                        hoist=False,
                        mentionable=False,
                        reason="Sync music bot role permissions",
                    )
                    print(f"updated role: {role.name} (id={role.id})")
                else:
                    print(f"role unchanged: {role.name} (id={role.id})")

            try:
                member = guild.get_member(MUSIC_BOT_USER_ID) or await guild.fetch_member(MUSIC_BOT_USER_ID)
            except discord.NotFound:
                print(f"music bot member {MUSIC_BOT_USER_ID} not found in guild")
                result["code"] = 2
                return

            if role in member.roles:
                print(f"music bot already has role {role.name}")
            else:
                await member.add_roles(role, reason="Assign dedicated music bot role")
                print(f"assigned role {role.name} to music bot {member}")

            print(f"ROLE_ID={role.id}")
            result["code"] = 0
        except Exception as e:
            print(f"ERROR: {type(e).__name__}: {e}", file=sys.stderr)
            result["code"] = 3
        finally:
            await bot.close()

    await bot.start(token)
    return result["code"]


if __name__ == "__main__":
    import asyncio

    sys.exit(asyncio.run(main()))
