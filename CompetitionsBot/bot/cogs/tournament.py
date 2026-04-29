"""/tournament — simple bracket tournament. (MVP: signup phase + announce)"""
from __future__ import annotations

import asyncio
import random

import discord
from discord import app_commands
from discord.ext import commands

from .. import questions as qbank
from .. import utils
from ..config import COLORS, DIFFICULTY, Settings


class TournamentSignupView(discord.ui.View):
    def __init__(self, max_players: int = 8, timeout: float = 60.0):
        super().__init__(timeout=timeout)
        self.players: list[discord.Member] = []
        self.max_players = max_players
        self.full = asyncio.Event()

    @discord.ui.button(label="انضم للبطولة!", emoji="✋", style=discord.ButtonStyle.success)
    async def join_btn(self, interaction: discord.Interaction, _button: discord.ui.Button):
        if not isinstance(interaction.user, discord.Member):
            await interaction.response.send_message("❌ خطأ.", ephemeral=True)
            return
        if interaction.user in self.players:
            await interaction.response.send_message("⚠️ أنت مسجل بالفعل.", ephemeral=True)
            return
        if len(self.players) >= self.max_players:
            await interaction.response.send_message("⚠️ البطولة ممتلئة.", ephemeral=True)
            return
        self.players.append(interaction.user)
        await interaction.response.send_message(
            f"✅ انضممت! المسجلون: **{len(self.players)}/{self.max_players}**", ephemeral=True
        )
        if len(self.players) >= self.max_players:
            self.full.set()


class TournamentCog(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.settings: Settings = bot.settings  # type: ignore[attr-defined]

    @app_commands.command(name="tournament", description="🏆 بطولة 1v1 إقصائية")
    @app_commands.describe(
        max_players="عدد المتسابقين (4 أو 8)",
        signup_seconds="مدة التسجيل بالثواني",
    )
    @app_commands.choices(max_players=[
        app_commands.Choice(name="4 لاعبين (نصف نهائي)", value=4),
        app_commands.Choice(name="8 لاعبين (ربع نهائي)", value=8),
    ])
    async def tournament(
        self,
        interaction: discord.Interaction,
        max_players: app_commands.Choice[int] = None,
        signup_seconds: app_commands.Range[int, 30, 600] = 90,
    ):
        max_p = max_players.value if max_players else 4
        target_channel = self.bot.get_channel(self.settings.channel_current) or interaction.channel
        if not isinstance(target_channel, discord.TextChannel):
            await interaction.response.send_message("❌ لم أجد قناة مناسبة.", ephemeral=True)
            return
        if target_channel.id in self.bot.active_competitions:
            await interaction.response.send_message("⚠️ مسابقة جارية بالفعل.", ephemeral=True)
            return

        await interaction.response.send_message(
            f"🏆 فُتح التسجيل في {target_channel.mention}!", ephemeral=True
        )

        self.bot.active_competitions[target_channel.id] = {"type": "tournament", "host": interaction.user.id}
        try:
            view = TournamentSignupView(max_p, timeout=float(signup_seconds))
            embed = utils.build_welcome_embed("🏆 بطولة إقصائية", interaction.user if isinstance(interaction.user, discord.Member) else None)
            embed.add_field(name="🎯 العدد المطلوب", value=f"**{max_p}** لاعبين", inline=True)
            embed.add_field(name="⏰ التسجيل ينتهي بعد", value=f"**{signup_seconds}** ثانية", inline=True)
            embed.add_field(name="📢 كيف تشارك؟", value="اضغط زر **انضم للبطولة!** بالأسفل", inline=False)

            msg = await target_channel.send(embed=embed, view=view)
            try:
                await asyncio.wait_for(view.full.wait(), timeout=float(signup_seconds))
            except asyncio.TimeoutError:
                pass
            view.stop()

            players = view.players
            if len(players) < 2:
                await target_channel.send(
                    embed=discord.Embed(
                        title="❌ التسجيل غير مكتمل",
                        description=f"عدد المسجلين: {len(players)}. لا يمكن بدء البطولة بأقل من لاعبين.",
                        color=COLORS["danger"],
                    )
                )
                return

            # Pad to next power of 2 with byes (None) if needed
            random.shuffle(players)
            current_round = list(players)
            round_num = 1

            while len(current_round) > 1:
                next_round: list[discord.Member] = []
                pairs = []
                while current_round:
                    a = current_round.pop(0)
                    b = current_round.pop(0) if current_round else None
                    pairs.append((a, b))

                bracket_text = "\n".join(
                    f"{i+1}. {p[0].mention} 🆚 {(p[1].mention if p[1] else '_(تأهل تلقائي)_')}"
                    for i, p in enumerate(pairs)
                )
                await target_channel.send(
                    embed=discord.Embed(
                        title=f"⚔️ الجولة {round_num}",
                        description=bracket_text,
                        color=COLORS["primary"],
                    )
                )
                await asyncio.sleep(2)

                for a, b in pairs:
                    if b is None:
                        next_round.append(a)
                        continue
                    winner = await self._run_match(target_channel, a, b)
                    next_round.append(winner)
                    await asyncio.sleep(2)

                current_round = next_round
                round_num += 1

            champion = current_round[0]
            await self.bot.db.ensure_user(champion.id, champion.display_name)
            await self.bot.db.add_points(champion.id, 200, correct=True)
            await self.bot.db.increment_competition(champion.id, won=True, perfect=False)
            await target_channel.send(
                embed=discord.Embed(
                    title="👑 بطل البطولة!",
                    description=f"🏆 **{champion.mention}** هو البطل! +200 نقطة",
                    color=COLORS["gold"],
                )
            )
            if self.settings.role_champion:
                role = target_channel.guild.get_role(self.settings.role_champion)
                if role:
                    try:
                        await champion.add_roles(role, reason="فاز ببطولة")
                    except discord.Forbidden:
                        pass
        finally:
            self.bot.active_competitions.pop(target_channel.id, None)

    async def _run_match(
        self,
        channel: discord.TextChannel,
        player_a: discord.Member,
        player_b: discord.Member,
    ) -> discord.Member:
        """A 1v1 match: 3 questions, first to get 2 correct wins."""
        await channel.send(
            embed=discord.Embed(
                title="🥊 المباراة بدأت",
                description=f"{player_a.mention} 🆚 {player_b.mention}",
                color=COLORS["warning"],
            )
        )
        await asyncio.sleep(2)

        score = {player_a.id: 0, player_b.id: 0}
        questions = qbank.filter_questions(difficulty="متوسط", count=5)

        for q in questions:
            if max(score.values()) >= 2:
                break
            theme = utils.random_theme()
            time_limit = DIFFICULTY[q["difficulty"]]["time"]
            embed = discord.Embed(
                title=f"{theme['icon']} سؤال المباراة",
                description=f"## {q['question']}",
                color=theme["color"],
            )
            if q["type"] == "tf":
                view = utils.TrueFalseView(q["answer"], timeout=float(time_limit))
                correct_text = "✅ صحيح" if q["answer"] else "❌ خطأ"
            else:
                choices = list(q["choices"])
                indexed = list(enumerate(choices))
                random.shuffle(indexed)
                new_correct = next(i for i, (orig, _) in enumerate(indexed) if orig == q["answer_index"])
                shuffled = [c for _, c in indexed]
                embed.add_field(
                    name="الخيارات",
                    value="\n".join(
                        f"{utils.CHOICE_EMOJIS[i]} **{utils.CHOICE_LETTERS[i]}.** {c}"
                        for i, c in enumerate(shuffled)
                    ),
                    inline=False,
                )
                view = utils.MultipleChoiceView(shuffled, new_correct, timeout=float(time_limit))
                correct_text = f"{utils.CHOICE_LETTERS[new_correct]}. {shuffled[new_correct]}"

            await channel.send(embed=embed, view=view)
            await asyncio.sleep(time_limit)
            view.stop()

            # Check answers - only A and B count
            for uid, (val, _ts) in view.answers.items():
                if uid not in (player_a.id, player_b.id):
                    continue
                if q["type"] == "tf":
                    if val == q["answer"]:
                        score[uid] += 1
                else:
                    if val == new_correct:
                        score[uid] += 1
            await channel.send(
                embed=discord.Embed(
                    description=(
                        f"الصحيح: ` {correct_text} `\n"
                        f"النتيجة: {player_a.mention} **{score[player_a.id]}** — **{score[player_b.id]}** {player_b.mention}"
                    ),
                    color=COLORS["info"],
                )
            )

        if score[player_a.id] > score[player_b.id]:
            winner = player_a
        elif score[player_b.id] > score[player_a.id]:
            winner = player_b
        else:
            winner = random.choice([player_a, player_b])  # tiebreak random
        await channel.send(
            embed=discord.Embed(
                title=f"🏅 فائز المباراة: {winner.display_name}",
                color=COLORS["success"],
            )
        )
        return winner


async def setup(bot: commands.Bot):
    await bot.add_cog(TournamentCog(bot))
