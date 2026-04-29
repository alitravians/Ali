"""/daily — daily question with bonus points."""
from __future__ import annotations

import asyncio
import datetime as dt
import random

import discord
from discord import app_commands
from discord.ext import commands

from .. import questions as qbank
from .. import utils
from ..config import COLORS, Settings


class DailyCog(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.settings: Settings = bot.settings  # type: ignore[attr-defined]

    @app_commands.command(name="daily", description="🌟 السؤال اليومي بنقاط مضاعفة!")
    async def daily(self, interaction: discord.Interaction):
        today = dt.date.today().isoformat()
        state = await self.bot.db.get_daily_state(interaction.user.id)
        if state and state["last_claim_date"] == today:
            await interaction.response.send_message(
                "⏰ لقد أجبت على سؤال اليوم بالفعل! ارجع غدًا للحصول على المزيد من النقاط.\n"
                f"🔥 سلسلتك الحالية: **{state['streak_days']}** يوم",
                ephemeral=True,
            )
            return

        # Pick a random hard or medium question
        q_pool = qbank.filter_questions(difficulty="صعب", count=1) or qbank.filter_questions(count=1)
        if not q_pool:
            await interaction.response.send_message("❌ لا توجد أسئلة متاحة.", ephemeral=True)
            return
        q = q_pool[0]

        await interaction.response.defer(thinking=False)
        theme = utils.random_theme()
        embed = discord.Embed(
            title=f"🌟 سؤال اليوم • {dt.date.today().strftime('%Y-%m-%d')}",
            description=(
                f"```fix\n{theme['border']}\n```\n"
                f"### {theme['icon']} {q['question']}\n"
            ),
            color=COLORS["gold"],
        )
        embed.set_footer(text="نقاط مضاعفة! • لديك 30 ثانية")

        if q["type"] == "tf":
            view = utils.TrueFalseView(q["answer"], timeout=30.0)
            answered = asyncio.Event()
            user_correct = {"value": False, "elapsed": 999.0}

            async def on_ans(inter: discord.Interaction, val: bool, ok: bool):
                if inter.user.id != interaction.user.id:
                    await inter.response.send_message(
                        "هذا سؤالك يا منافس! استخدم `/daily` لسؤالك.", ephemeral=True
                    )
                    return
                user_correct["value"] = ok
                await inter.response.send_message(
                    "📝 سُجلت!", ephemeral=True
                )
                answered.set()

            view.on_answer = on_ans
            msg = await interaction.followup.send(embed=embed, view=view)
            try:
                await asyncio.wait_for(answered.wait(), timeout=30.0)
            except asyncio.TimeoutError:
                pass
            await self._finalize(interaction, q, user_correct, today, state, msg, val_text=("✅ صحيح" if q["answer"] else "❌ خطأ"))
        else:
            choices = list(q["choices"])
            indexed = list(enumerate(choices))
            random.shuffle(indexed)
            new_correct = next(i for i, (orig, _) in enumerate(indexed) if orig == q["answer_index"])
            shuffled = [c for _, c in indexed]

            view = utils.MultipleChoiceView(shuffled, new_correct, timeout=30.0)
            answered = asyncio.Event()
            user_correct = {"value": False, "elapsed": 999.0}

            async def on_ans(inter: discord.Interaction, idx: int, ok: bool):
                if inter.user.id != interaction.user.id:
                    await inter.response.send_message(
                        "هذا سؤالك! استخدم `/daily` لسؤالك الخاص.", ephemeral=True
                    )
                    return
                user_correct["value"] = ok
                await inter.response.send_message("📝 سُجلت!", ephemeral=True)
                answered.set()

            view.on_answer = on_ans
            msg = await interaction.followup.send(embed=embed, view=view)
            try:
                await asyncio.wait_for(answered.wait(), timeout=30.0)
            except asyncio.TimeoutError:
                pass
            await self._finalize(
                interaction, q, user_correct, today, state, msg,
                val_text=f"{utils.CHOICE_LETTERS[new_correct]}. {shuffled[new_correct]}",
            )

    async def _finalize(self, interaction, q, user_correct, today, state, msg, val_text):
        streak = (state["streak_days"] + 1) if state else 1
        # If they missed yesterday, reset
        if state:
            yesterday = (dt.date.today() - dt.timedelta(days=1)).isoformat()
            if state["last_claim_date"] != yesterday:
                streak = 1
        await self.bot.db.upsert_daily(interaction.user.id, today, streak)
        # Points: base 50 if correct + tiered streak bonus + milestone jackpot
        if user_correct["value"]:
            base = 50
            # Linear bonus capped at 100 (1-10 days), then plateaus
            linear_bonus = min(streak * 10, 100)
            # Milestone jackpots — paid only on the exact milestone day
            milestone_bonus = 0
            milestone_label = ""
            if streak == 7:
                milestone_bonus, milestone_label = 100, "🎉 أسبوع متواصل!"
            elif streak == 14:
                milestone_bonus, milestone_label = 250, "💎 أسبوعان متواصلان!"
            elif streak == 30:
                milestone_bonus, milestone_label = 500, "👑 شهر كامل!"
            elif streak == 60:
                milestone_bonus, milestone_label = 1000, "🔥 شهران متواصلان!"
            elif streak == 100:
                milestone_bonus, milestone_label = 2500, "🌌 مئة يوم — أسطورة!"
            total = base + linear_bonus + milestone_bonus
            await self.bot.db.ensure_user(interaction.user.id, interaction.user.display_name)
            await self.bot.db.add_points(interaction.user.id, total, correct=True)
            color = COLORS["success"]
            extra_line = f"\n🎁 **مكافأة إنجاز** ({milestone_label}): +{milestone_bonus}" if milestone_bonus else ""
            text = (
                f"🎉 **إجابة صحيحة!**\n"
                f"الإجابة: ` {val_text} `\n\n"
                f"💰 **+{total} نقطة** (أساس {base} + سلسلة {linear_bonus}"
                f"{f' + إنجاز {milestone_bonus}' if milestone_bonus else ''})"
                f"{extra_line}\n"
                f"🔥 سلسلتك: **{streak}** يوم"
            )
        else:
            await self.bot.db.ensure_user(interaction.user.id, interaction.user.display_name)
            await self.bot.db.add_points(interaction.user.id, 0, correct=False)
            color = COLORS["danger"]
            text = (
                f"❌ **إجابة خاطئة.**\n"
                f"الإجابة الصحيحة: ` {val_text} `\n\n"
                f"حاول غدًا! 🔄"
            )
        embed = discord.Embed(title="🌟 نتيجة السؤال اليومي", description=text, color=color)
        try:
            await interaction.followup.send(embed=embed, ephemeral=True)
        except Exception:
            pass


async def setup(bot: commands.Bot):
    await bot.add_cog(DailyCog(bot))
