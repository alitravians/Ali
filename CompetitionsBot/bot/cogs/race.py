"""/race — speed competition. First to click wins."""
from __future__ import annotations

import asyncio
import random
import time

import discord
from discord import app_commands
from discord.ext import commands

from .. import utils
from ..config import COLORS, Settings


class RaceCog(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.settings: Settings = bot.settings  # type: ignore[attr-defined]

    @app_commands.command(name="race", description="سباق سرعة — أول من يضغط الزر يفوز ⚡")
    @app_commands.describe(rounds="عدد الجولات (1-5)")
    async def race(
        self,
        interaction: discord.Interaction,
        rounds: app_commands.Range[int, 1, 5] = 3,
    ):
        target_channel = self.bot.get_channel(self.settings.channel_current) or interaction.channel
        if not isinstance(target_channel, discord.TextChannel):
            await interaction.response.send_message("❌ لم أجد قناة مناسبة.", ephemeral=True)
            return
        if target_channel.id in self.bot.active_competitions:
            await interaction.response.send_message("⚠️ مسابقة جارية بالفعل.", ephemeral=True)
            return

        await interaction.response.send_message(
            f"⚡ بدأ سباق السرعة في {target_channel.mention}!", ephemeral=True
        )

        self.bot.active_competitions[target_channel.id] = {"type": "race", "host": interaction.user.id}
        try:
            # Welcome
            embed = utils.build_welcome_embed("⚡ سباق السرعة", interaction.user if isinstance(interaction.user, discord.Member) else None)
            embed.add_field(name="🏁 القاعدة", value=f"أول من يضغط الزر في كل جولة يفوز. `{rounds}` جولات.", inline=False)
            await target_channel.send(embed=embed)
            await asyncio.sleep(2)
            await utils.countdown_message(target_channel, seconds=3)

            wins: dict[int, int] = {}

            for r in range(1, rounds + 1):
                # Random delay before button shows
                pre = random.uniform(2.0, 6.0)
                wait_msg = await target_channel.send(
                    embed=discord.Embed(
                        title=f"🚦 الجولة {r}/{rounds}",
                        description="⏳ استعداد… انتظر ظهور الزر!",
                        color=COLORS["warning"],
                    )
                )
                await asyncio.sleep(pre)

                view = utils.RaceButtonView(timeout=15.0)
                go_msg = await target_channel.send(
                    embed=discord.Embed(
                        title="🚀 الآن! الآن! اضغط!",
                        description="**أسرع من فاز!**",
                        color=COLORS["success"],
                    ),
                    view=view,
                )
                # Wait until first user or timeout
                start = time.time()
                while view.first_user is None and (time.time() - start) < 15:
                    await asyncio.sleep(0.2)

                # Disable button
                for c in view.children:
                    c.disabled = True  # type: ignore[attr-defined]
                try:
                    await go_msg.edit(view=view)
                except discord.HTTPException:
                    pass

                if view.first_user:
                    wins[view.first_user.id] = wins.get(view.first_user.id, 0) + 1
                    points = 25
                    await self.bot.db.ensure_user(view.first_user.id, view.first_user.display_name)
                    await self.bot.db.add_points(view.first_user.id, points, correct=True, fast=True)
                    await target_channel.send(
                        embed=discord.Embed(
                            title=f"🏆 الفائز بالجولة {r}",
                            description=f"{view.first_user.mention} فاز! +{points} نقطة",
                            color=COLORS["gold"],
                        )
                    )
                else:
                    await target_channel.send(
                        embed=discord.Embed(
                            title="🤷 لم يضغط أحد!",
                            description="انتهت الجولة بدون فائز.",
                            color=COLORS["danger"],
                        )
                    )
                if r < rounds:
                    await asyncio.sleep(2)

            # Final scores
            if wins:
                sorted_wins = sorted(wins.items(), key=lambda x: -x[1])
                lines = []
                medals = ["🥇", "🥈", "🥉"]
                for i, (uid, w) in enumerate(sorted_wins[:10]):
                    prefix = medals[i] if i < 3 else f"`#{i + 1}`"
                    lines.append(f"{prefix} <@{uid}> — **{w}** فوز")
                embed = discord.Embed(
                    title="🏁 نتائج سباق السرعة",
                    description="\n".join(lines),
                    color=COLORS["gold"],
                )
                winner_id = sorted_wins[0][0]
                participants = list(wins.keys())
                for uid in participants:
                    user = self.bot.get_user(uid)
                    name = user.display_name if user else f"User {uid}"
                    await self.bot.db.ensure_user(uid, name)
                    await self.bot.db.increment_competition(uid, won=(uid == winner_id), perfect=False)
                await self.bot.db.record_competition(
                    type_="race", category=None, difficulty=None,
                    started_by=interaction.user.id, channel_id=target_channel.id,
                    questions_count=rounds, participants=participants,
                    results={str(u): {"wins": w} for u, w in wins.items()},
                    winner_id=winner_id,
                )
                await target_channel.send(embed=embed)
            else:
                await target_channel.send("🤷 انتهى السباق بدون فائزين.")
        finally:
            self.bot.active_competitions.pop(target_channel.id, None)


async def setup(bot: commands.Bot):
    await bot.add_cog(RaceCog(bot))
