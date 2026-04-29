"""/duel — 1-vs-1 ELO-rated trivia matches.

Two members face off on the same set of TF questions; whoever has more
correct answers wins. ELO is updated on both players using the standard
chess-style formula with K=32. Ties leave ratings unchanged but still
record the match.
"""
from __future__ import annotations

import asyncio

import discord
from discord import app_commands
from discord.ext import commands

from .. import questions as qbank
from ..config import COLORS

K_FACTOR = 32
QUESTIONS_PER_DUEL = 5
QUESTION_TIMEOUT = 20.0


def _expected(rating_a: int, rating_b: int) -> float:
    return 1.0 / (1.0 + 10 ** ((rating_b - rating_a) / 400.0))


def _elo_delta(rating: int, opp_rating: int, score: float) -> int:
    """Return the integer ELO change for a player who scored ``score`` (1=win,
    0.5=draw, 0=loss) against an opponent rated ``opp_rating``."""
    return round(K_FACTOR * (score - _expected(rating, opp_rating)))


class _AcceptView(discord.ui.View):
    def __init__(self, opponent_id: int):
        super().__init__(timeout=60.0)
        self.opponent_id = opponent_id
        self.accepted: asyncio.Event = asyncio.Event()
        self.declined: asyncio.Event = asyncio.Event()

    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        if interaction.user.id != self.opponent_id:
            await interaction.response.send_message(
                "🚫 هذا التحدي ليس لك.", ephemeral=True
            )
            return False
        return True

    @discord.ui.button(label="قبول", style=discord.ButtonStyle.success, emoji="⚔️")
    async def accept(self, interaction: discord.Interaction, _btn: discord.ui.Button):
        for c in self.children:
            c.disabled = True  # type: ignore[attr-defined]
        await interaction.response.edit_message(content="✅ قُبل التحدي!", view=self)
        self.accepted.set()
        self.stop()

    @discord.ui.button(label="رفض", style=discord.ButtonStyle.danger, emoji="✋")
    async def decline(self, interaction: discord.Interaction, _btn: discord.ui.Button):
        for c in self.children:
            c.disabled = True  # type: ignore[attr-defined]
        await interaction.response.edit_message(content="❌ رُفض التحدي.", view=self)
        self.declined.set()
        self.stop()


class _DuelAnswerView(discord.ui.View):
    """Both players answer the same TF question; first answer locks per-player
    so they can't change their mind."""

    def __init__(self, p1_id: int, p2_id: int, correct: bool):
        super().__init__(timeout=QUESTION_TIMEOUT)
        self.p1_id = p1_id
        self.p2_id = p2_id
        self.correct = correct
        self.answers: dict[int, bool] = {}
        self._done = asyncio.Event()

    async def _record(self, interaction: discord.Interaction, answer: bool) -> None:
        if interaction.user.id not in (self.p1_id, self.p2_id):
            await interaction.response.send_message(
                "🚫 أنت لست في هذا التحدي.", ephemeral=True
            )
            return
        if interaction.user.id in self.answers:
            await interaction.response.send_message(
                "تم تسجيل إجابتك.", ephemeral=True
            )
            return
        self.answers[interaction.user.id] = answer
        await interaction.response.send_message(
            f"📝 تم تسجيل إجابتك ({'صح' if answer else 'خطأ'}).", ephemeral=True
        )
        if len(self.answers) == 2:
            self._done.set()
            self.stop()

    @discord.ui.button(label="صح", style=discord.ButtonStyle.success, emoji="✅")
    async def yes(self, interaction: discord.Interaction, _btn: discord.ui.Button):
        await self._record(interaction, True)

    @discord.ui.button(label="خطأ", style=discord.ButtonStyle.danger, emoji="❌")
    async def no(self, interaction: discord.Interaction, _btn: discord.ui.Button):
        await self._record(interaction, False)

    async def wait_for_both(self) -> None:
        try:
            await asyncio.wait_for(self._done.wait(), timeout=QUESTION_TIMEOUT)
        except asyncio.TimeoutError:
            pass


class DuelsCog(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self._active: set[frozenset[int]] = set()

    @app_commands.command(
        name="duel",
        description="⚔️ تحدّي عضو آخر في 5 أسئلة مع تحديث تصنيف ELO",
    )
    @app_commands.describe(opponent="العضو الذي تتحدّاه")
    async def duel(self, interaction: discord.Interaction, opponent: discord.Member):
        if opponent.bot or opponent.id == interaction.user.id:
            await interaction.response.send_message(
                "❌ اختر عضواً مختلفاً (وغير بوت).", ephemeral=True
            )
            return
        pair = frozenset((interaction.user.id, opponent.id))
        if pair in self._active:
            await interaction.response.send_message(
                "⚠️ هناك تحدٍ نشط بينكما حالياً.", ephemeral=True
            )
            return

        # Pull questions
        pool = qbank.filter_questions(type_="tf", count=QUESTIONS_PER_DUEL)
        if len(pool) < QUESTIONS_PER_DUEL:
            await interaction.response.send_message(
                "❌ لا يوجد عدد كافٍ من أسئلة صح/خطأ في الوقت الحالي.",
                ephemeral=True,
            )
            return

        # Send invitation
        accept_view = _AcceptView(opponent.id)
        embed = discord.Embed(
            title="⚔️ تحدّي 1v1",
            description=(
                f"{interaction.user.mention} تحدّى {opponent.mention}!\n"
                f"**5 أسئلة صح/خطأ**, الفائز يحصل على نقاط ELO.\n"
                f"الوقت لقبول التحدي: 60 ثانية."
            ),
            color=COLORS.get("warning", 0xE67E22),
        )
        await interaction.response.send_message(
            content=opponent.mention, embed=embed, view=accept_view
        )

        await accept_view.wait()
        if not accept_view.accepted.is_set():
            return

        self._active.add(pair)
        try:
            await self._run_duel(interaction, opponent, pool)
        finally:
            self._active.discard(pair)

    async def _run_duel(
        self,
        interaction: discord.Interaction,
        opponent: discord.Member,
        questions: list[dict],
    ) -> None:
        challenger = interaction.user
        await self.bot.db.ensure_user(challenger.id, challenger.display_name)
        await self.bot.db.ensure_user(opponent.id, opponent.display_name)
        duel_id = await self.bot.db.create_duel(challenger.id, opponent.id)

        ch_score = 0
        op_score = 0
        for i, q in enumerate(questions, start=1):
            embed = discord.Embed(
                title=f"⚔️ السؤال {i}/{QUESTIONS_PER_DUEL}",
                description=f"**{q['question']}**",
                color=COLORS.get("info", 0x3498DB),
            )
            embed.set_footer(text=f"{challenger.display_name} ⚔️ {opponent.display_name}")
            view = _DuelAnswerView(challenger.id, opponent.id, bool(q["answer"]))
            msg = await interaction.followup.send(embed=embed, view=view)
            await view.wait_for_both()

            ch_ans = view.answers.get(challenger.id)
            op_ans = view.answers.get(opponent.id)
            ch_correct = ch_ans is not None and ch_ans == bool(q["answer"])
            op_correct = op_ans is not None and op_ans == bool(q["answer"])
            if ch_correct:
                ch_score += 1
            if op_correct:
                op_score += 1

            recap = discord.Embed(
                title=f"النتيجة بعد السؤال {i}",
                description=(
                    f"الإجابة الصحيحة: **{'صح' if q['answer'] else 'خطأ'}**\n"
                    f"{challenger.display_name}: {'✅' if ch_correct else '❌'} ({ch_score})\n"
                    f"{opponent.display_name}: {'✅' if op_correct else '❌'} ({op_score})"
                ),
                color=COLORS.get("success", 0x2ECC71),
            )
            await msg.edit(embed=recap, view=None)
            await asyncio.sleep(2)

        # Resolve
        ch_user = await self.bot.db.get_user(challenger.id) or {"elo_rating": 1000}
        op_user = await self.bot.db.get_user(opponent.id) or {"elo_rating": 1000}
        ch_elo = ch_user.get("elo_rating", 1000) or 1000
        op_elo = op_user.get("elo_rating", 1000) or 1000

        if ch_score > op_score:
            ch_delta = _elo_delta(ch_elo, op_elo, 1.0)
            op_delta = _elo_delta(op_elo, ch_elo, 0.0)
            winner = challenger
            ch_won: bool | None = True
            op_won: bool | None = False
        elif op_score > ch_score:
            ch_delta = _elo_delta(ch_elo, op_elo, 0.0)
            op_delta = _elo_delta(op_elo, ch_elo, 1.0)
            winner = opponent
            ch_won = False
            op_won = True
        else:
            ch_delta = _elo_delta(ch_elo, op_elo, 0.5)
            op_delta = _elo_delta(op_elo, ch_elo, 0.5)
            winner = None
            ch_won = None  # draw — don't increment either counter
            op_won = None

        await self.bot.db.update_duel_stats(
            challenger.id, won=ch_won, elo_delta=ch_delta
        )
        await self.bot.db.update_duel_stats(
            opponent.id, won=op_won, elo_delta=op_delta
        )
        await self.bot.db.finalize_duel(
            duel_id,
            challenger_score=ch_score,
            opponent_score=op_score,
            winner_id=winner.id if winner else None,
            elo_change=abs(ch_delta),
        )

        if winner:
            title = f"🏆 الفائز: {winner.display_name}"
            color = COLORS.get("gold", 0xF1C40F)
        else:
            title = "🤝 تعادل!"
            color = COLORS.get("info", 0x3498DB)

        final = discord.Embed(
            title=title,
            description=(
                f"**{challenger.display_name}**: {ch_score} نقاط — ELO {ch_elo} → "
                f"{ch_elo + ch_delta} ({'+' if ch_delta >= 0 else ''}{ch_delta})\n"
                f"**{opponent.display_name}**: {op_score} نقاط — ELO {op_elo} → "
                f"{op_elo + op_delta} ({'+' if op_delta >= 0 else ''}{op_delta})"
            ),
            color=color,
        )
        await interaction.followup.send(embed=final)

    @app_commands.command(
        name="duel_top",
        description="🏆 أفضل اللاعبين بتصنيف ELO",
    )
    async def duel_top(self, interaction: discord.Interaction):
        rows = await self.bot.db.get_top_elo(limit=10)
        if not rows:
            await interaction.response.send_message(
                "لا يوجد لاعبون صنّفوا بعد. استخدم `/duel` لبدء أول مباراة!",
                ephemeral=True,
            )
            return
        lines = []
        for i, r in enumerate(rows, start=1):
            medal = "🥇" if i == 1 else "🥈" if i == 2 else "🥉" if i == 3 else f"#{i}"
            wins = r["duel_wins"]
            losses = r["duel_losses"]
            total = wins + losses
            wr = (wins * 100 // total) if total else 0
            lines.append(
                f"{medal} <@{r['user_id']}> — **{r['elo_rating']}** "
                f"({wins}W/{losses}L • {wr}%)"
            )
        embed = discord.Embed(
            title="🏆 ترتيب ELO (أفضل 10)",
            description="\n".join(lines),
            color=COLORS.get("gold", 0xF1C40F),
        )
        await interaction.response.send_message(embed=embed)


async def setup(bot: commands.Bot):
    await bot.add_cog(DuelsCog(bot))
