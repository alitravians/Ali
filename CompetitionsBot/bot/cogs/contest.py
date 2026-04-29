"""/contest — admin-driven custom competition with one trivia question."""
from __future__ import annotations

import asyncio
import time

import discord
from discord import app_commands
from discord.ext import commands

from .. import utils
from ..config import COLORS, Settings


def _is_admin_or_mod(interaction: discord.Interaction) -> bool:
    if not isinstance(interaction.user, discord.Member):
        return False
    settings: Settings = interaction.client.settings  # type: ignore[attr-defined]
    if interaction.user.guild_permissions.administrator:
        return True
    role_ids = {r.id for r in interaction.user.roles}
    return bool(settings.role_mod and settings.role_mod in role_ids)


class ContestCog(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.settings: Settings = bot.settings  # type: ignore[attr-defined]

    @app_commands.command(name="contest", description="🎮 مسابقة مخصصة (للإدمن/المنسق فقط)")
    @app_commands.default_permissions(manage_messages=True)
    @app_commands.describe(
        question="نص السؤال",
        answer="الإجابة الصحيحة",
        choice_a="الخيار A (اختياري للأسئلة المفتوحة)",
        choice_b="الخيار B",
        choice_c="الخيار C",
        choice_d="الخيار D",
        time_limit="مدة الإجابة بالثواني (10-120)",
        points="نقاط الإجابة الصحيحة",
    )
    async def contest(
        self,
        interaction: discord.Interaction,
        question: str,
        answer: str,
        choice_a: str | None = None,
        choice_b: str | None = None,
        choice_c: str | None = None,
        choice_d: str | None = None,
        time_limit: app_commands.Range[int, 10, 120] = 30,
        points: app_commands.Range[int, 5, 200] = 50,
    ):
        if not _is_admin_or_mod(interaction):
            await interaction.response.send_message("🚫 هذا الأمر للإدمن أو المنسقين فقط.", ephemeral=True)
            return
        target_channel = self.bot.get_channel(self.settings.channel_current) or interaction.channel
        if not isinstance(target_channel, discord.TextChannel):
            await interaction.response.send_message("❌ لم أجد قناة مناسبة.", ephemeral=True)
            return
        if target_channel.id in self.bot.active_competitions:
            await interaction.response.send_message("⚠️ مسابقة جارية بالفعل.", ephemeral=True)
            return

        choices = [c for c in [choice_a, choice_b, choice_c, choice_d] if c]
        await interaction.response.send_message(
            f"✅ بدأت المسابقة المخصصة في {target_channel.mention}!", ephemeral=True
        )

        self.bot.active_competitions[target_channel.id] = {"type": "contest", "host": interaction.user.id}
        try:
            embed = utils.build_welcome_embed("🎮 مسابقة مخصصة", interaction.user if isinstance(interaction.user, discord.Member) else None)
            embed.add_field(name="🎁 الجائزة", value=f"`{points}` نقطة للفائز", inline=True)
            embed.add_field(name="⏱️ الوقت", value=f"`{time_limit}` ثانية", inline=True)
            await target_channel.send(embed=embed)
            await asyncio.sleep(2)
            await utils.countdown_message(target_channel, seconds=3)

            if choices:
                # MCQ — find correct index by exact match (case-insensitive)
                correct_index = next(
                    (i for i, c in enumerate(choices) if c.strip().lower() == answer.strip().lower()),
                    -1,
                )
                if correct_index == -1:
                    # Append answer as last choice
                    choices.append(answer)
                    correct_index = len(choices) - 1

                theme = utils.random_theme()
                embed = discord.Embed(
                    title=f"{theme['icon']} سؤال المسابقة المخصصة",
                    description=f"```yml\n{theme['border']}\n```\n## {question}\n```yml\n{theme['border']}\n```",
                    color=theme["color"],
                )
                embed.add_field(
                    name="الخيارات",
                    value="\n".join(
                        f"{utils.CHOICE_EMOJIS[i]} **{utils.CHOICE_LETTERS[i]}.** {c}"
                        for i, c in enumerate(choices)
                    ),
                    inline=False,
                )
                view = utils.MultipleChoiceView(choices, correct_index, timeout=float(time_limit))
                msg = await target_channel.send(embed=embed, view=view)
                await asyncio.sleep(time_limit)
                view.stop()

                # Score
                start_ts = msg.created_at.timestamp()
                rankings = []
                for uid, (idx, ts) in view.answers.items():
                    if idx == correct_index:
                        rankings.append((uid, ts - start_ts))
                rankings.sort(key=lambda x: x[1])
                if rankings:
                    winner_id = rankings[0][0]
                    user = self.bot.get_user(winner_id)
                    name = user.display_name if user else f"User {winner_id}"
                    await self.bot.db.ensure_user(winner_id, name)
                    await self.bot.db.add_points(winner_id, points, correct=True)
                    await self.bot.db.increment_competition(winner_id, won=True, perfect=True)
                    await target_channel.send(
                        embed=discord.Embed(
                            title="🏆 الفائز!",
                            description=(
                                f"<@{winner_id}> فاز بـ **{points}** نقطة!\n"
                                f"الإجابة الصحيحة: ` {answer} `"
                            ),
                            color=COLORS["gold"],
                        )
                    )
                else:
                    await target_channel.send(
                        embed=discord.Embed(
                            title="🤷 لم يجاوب أحد بشكل صحيح",
                            description=f"الإجابة الصحيحة: ` {answer} `",
                            color=COLORS["danger"],
                        )
                    )
            else:
                # Open-text answer — first user to type the correct answer wins
                theme = utils.random_theme()
                embed = discord.Embed(
                    title=f"{theme['icon']} سؤال مفتوح — اكتب إجابتك في الشات",
                    description=f"## {question}\n\n_أول من يكتب الإجابة الصحيحة يفوز!_",
                    color=theme["color"],
                )
                embed.set_footer(text=f"الجائزة: {points} نقطة • الوقت: {time_limit} ثانية")
                await target_channel.send(embed=embed)

                def check(m: discord.Message):
                    return m.channel.id == target_channel.id and m.content.strip().lower() == answer.strip().lower()

                try:
                    msg = await self.bot.wait_for("message", check=check, timeout=float(time_limit))
                    await self.bot.db.ensure_user(msg.author.id, msg.author.display_name)
                    await self.bot.db.add_points(msg.author.id, points, correct=True)
                    await self.bot.db.increment_competition(msg.author.id, won=True, perfect=True)
                    await target_channel.send(
                        embed=discord.Embed(
                            title="🏆 الفائز!",
                            description=f"{msg.author.mention} فاز بـ **{points}** نقطة!",
                            color=COLORS["gold"],
                        )
                    )
                except asyncio.TimeoutError:
                    await target_channel.send(
                        embed=discord.Embed(
                            title="⏰ انتهى الوقت",
                            description=f"الإجابة الصحيحة: ` {answer} `",
                            color=COLORS["danger"],
                        )
                    )
        finally:
            self.bot.active_competitions.pop(target_channel.id, None)


async def setup(bot: commands.Bot):
    await bot.add_cog(ContestCog(bot))
