"""/quiz — main trivia engine with varied question presentation."""
from __future__ import annotations

import asyncio
import random
import time
from typing import Any

import discord
from discord import app_commands
from discord.ext import commands

from .. import questions as qbank
from .. import utils
from ..config import CATEGORY_EMOJIS, COLORS, DIFFICULTY, Settings


class QuizCog(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.settings: Settings = bot.settings  # type: ignore[attr-defined]

    @app_commands.command(name="quiz", description="بدء مسابقة ترفيا 🎯")
    @app_commands.describe(
        category="الفئة (اتركها كل لتشمل الكل)",
        difficulty="مستوى الصعوبة",
        questions="عدد الأسئلة (1-10)",
    )
    @app_commands.choices(
        category=[
            app_commands.Choice(name="🌐 كل الفئات", value="كل"),
            app_commands.Choice(name="🌐 عام", value="عام"),
            app_commands.Choice(name="🇸🇦 عربي", value="عربي"),
            app_commands.Choice(name="📜 تاريخ", value="تاريخ"),
            app_commands.Choice(name="🗺️ جغرافيا", value="جغرافيا"),
            app_commands.Choice(name="⚽ رياضة", value="رياضة"),
            app_commands.Choice(name="💻 تقنية", value="تقنية"),
            app_commands.Choice(name="🕌 إسلامي", value="إسلامي"),
            app_commands.Choice(name="🔬 علوم", value="علوم"),
            app_commands.Choice(name="🎬 أفلام", value="أفلام"),
        ],
        difficulty=[
            app_commands.Choice(name="🟢 سهل", value="سهل"),
            app_commands.Choice(name="🟡 متوسط", value="متوسط"),
            app_commands.Choice(name="🔴 صعب", value="صعب"),
            app_commands.Choice(name="🎲 متنوع", value="كل"),
        ],
    )
    async def quiz(
        self,
        interaction: discord.Interaction,
        category: app_commands.Choice[str] = None,
        difficulty: app_commands.Choice[str] = None,
        questions: app_commands.Range[int, 1, 10] = 5,
    ):
        cat = category.value if category else "كل"
        diff = difficulty.value if difficulty else "كل"

        # Run in current channel if it's the start channel; otherwise redirect to current
        target_channel = self.bot.get_channel(self.settings.channel_current) or interaction.channel
        if not isinstance(target_channel, discord.TextChannel):
            await interaction.response.send_message("❌ لم أجد قناة مناسبة لتشغيل المسابقة.", ephemeral=True)
            return

        # Check banned role
        if self.settings.role_banned and isinstance(interaction.user, discord.Member):
            if any(r.id == self.settings.role_banned for r in interaction.user.roles):
                await interaction.response.send_message(
                    "🔇 أنت محظور من المسابقات.", ephemeral=True
                )
                return

        # Check if competition already running in target channel
        if target_channel.id in self.bot.active_competitions:
            await interaction.response.send_message(
                "⚠️ يوجد مسابقة جارية في <#{}> الآن. انتظر حتى تنتهي.".format(target_channel.id),
                ephemeral=True,
            )
            return

        await interaction.response.send_message(
            f"🚀 بدأنا المسابقة في {target_channel.mention}!", ephemeral=True
        )

        await self._run_quiz(interaction.user, target_channel, cat, diff, questions)

    async def _run_quiz(
        self,
        host: discord.User | discord.Member,
        channel: discord.TextChannel,
        category: str,
        difficulty: str,
        question_count: int,
    ) -> None:
        # Pick questions
        diff_filter = None if difficulty == "كل" else difficulty
        cat_filter = None if category == "كل" else category
        picked = qbank.filter_questions(
            category=cat_filter, difficulty=diff_filter, count=question_count
        )
        if not picked:
            await channel.send("❌ لم أجد أسئلة بهذه المعايير.")
            return

        comp_label = (
            f"{CATEGORY_EMOJIS.get(category, '🎯')} {category}"
            if category != "كل"
            else "🌈 متنوع"
        )

        self.bot.active_competitions[channel.id] = {"type": "quiz", "host": host.id}
        try:
            # Welcome + countdown
            welcome = utils.build_welcome_embed(comp_label, host if isinstance(host, discord.Member) else None)
            await channel.send(embed=welcome)
            await asyncio.sleep(2)
            await utils.countdown_message(channel, seconds=3)
            await asyncio.sleep(0.5)

            # Track scores
            scores: dict[int, dict[str, Any]] = {}
            start_time = time.time()
            perfect_users: set[int] = set()

            for i, q in enumerate(picked, start=1):
                # Pick a random presentation style
                style = random.choice(["card", "compact", "story", "list"])
                theme = utils.random_theme()
                difficulty_ = q["difficulty"]
                time_limit = DIFFICULTY[difficulty_]["time"]
                points = DIFFICULTY[difficulty_]["points"]

                if q["type"] == "tf":
                    embed = utils.build_question_embed_card(
                        i, len(picked), q["question"], q["category"], difficulty_,
                        time_limit, theme=theme, style=style,
                    )
                    view = utils.TrueFalseView(q["answer"], timeout=float(time_limit))
                    msg = await channel.send(embed=embed, view=view)
                    correct_answer_text = "✅ صحيح" if q["answer"] else "❌ خطأ"
                    await asyncio.sleep(time_limit)
                    view.stop()
                    # Score answers
                    for uid, (val, t) in view.answers.items():
                        elapsed = t - msg.created_at.timestamp()
                        is_correct = val == q["answer"]
                        await self._score_user(uid, points, is_correct, elapsed, scores)
                else:
                    choices = list(q["choices"])
                    correct_index_orig = q["answer_index"]
                    # Shuffle choices for fairness
                    indexed = list(enumerate(choices))
                    random.shuffle(indexed)
                    new_correct = next(j for j, (orig, _) in enumerate(indexed) if orig == correct_index_orig)
                    shuffled_choices = [c for _, c in indexed]

                    if style == "list":
                        embed = utils.build_question_embed_card(
                            i, len(picked), q["question"], q["category"], difficulty_,
                            time_limit, theme=theme, style="list", choices=shuffled_choices,
                        )
                        view = utils.MultipleChoiceView(shuffled_choices, new_correct, timeout=float(time_limit))
                    elif style == "story" and len(shuffled_choices) <= 4:
                        embed = utils.build_question_embed_card(
                            i, len(picked), q["question"], q["category"], difficulty_,
                            time_limit, theme=theme, style="story",
                        )
                        view = utils.SelectMenuView(shuffled_choices, new_correct, timeout=float(time_limit))
                    else:
                        embed = utils.build_question_embed_card(
                            i, len(picked), q["question"], q["category"], difficulty_,
                            time_limit, theme=theme, style=style,
                        )
                        embed.add_field(
                            name="الخيارات",
                            value="\n".join(
                                f"{utils.CHOICE_EMOJIS[j]} **{utils.CHOICE_LETTERS[j]}.** {c}"
                                for j, c in enumerate(shuffled_choices)
                            ),
                            inline=False,
                        )
                        view = utils.MultipleChoiceView(shuffled_choices, new_correct, timeout=float(time_limit))

                    msg = await channel.send(embed=embed, view=view)
                    correct_answer_text = f"{utils.CHOICE_LETTERS[new_correct]}. {shuffled_choices[new_correct]}"
                    await asyncio.sleep(time_limit)
                    view.stop()
                    for uid, (val, t) in view.answers.items():
                        elapsed = t - msg.created_at.timestamp()
                        is_correct = val == new_correct
                        await self._score_user(uid, points, is_correct, elapsed, scores)

                # Disable view buttons
                try:
                    for child in view.children:
                        child.disabled = True  # type: ignore[attr-defined]
                    await msg.edit(view=view)
                except (discord.HTTPException, AttributeError):
                    pass

                # Per-question result
                lb_lines = self._mini_leaderboard(scores)
                await channel.send(embed=utils.build_result_embed(correct_answer_text, lb_lines))
                if i < len(picked):
                    await asyncio.sleep(2)

            duration = time.time() - start_time

            # Build sorted scores
            sorted_users = sorted(
                scores.items(), key=lambda x: (-x[1]["points"], -x[1]["correct"], x[1]["last_time"])
            )
            sorted_for_embed = []
            for uid, s in sorted_users:
                user = channel.guild.get_member(uid) or self.bot.get_user(uid)
                if user:
                    sorted_for_embed.append((user, s["correct"], s["points"]))
                if s["correct"] == len(picked):
                    perfect_users.add(uid)

            await channel.send(embed=utils.build_final_results_embed(comp_label, duration, sorted_for_embed))

            # Persist DB
            if sorted_users:
                winner_id = sorted_users[0][0]
                participants = [uid for uid, _ in sorted_users]
                for uid, s in sorted_users:
                    member = channel.guild.get_member(uid)
                    name = member.display_name if member else f"User {uid}"
                    await self.bot.db.ensure_user(uid, name)
                    perfect = uid in perfect_users
                    await self.bot.db.increment_competition(uid, won=(uid == winner_id), perfect=perfect)
                    # Already accumulated points per question via add_points
                await self.bot.db.record_competition(
                    type_="quiz",
                    category=cat_filter,
                    difficulty=diff_filter,
                    started_by=host.id,
                    channel_id=channel.id,
                    questions_count=len(picked),
                    participants=participants,
                    results={str(u): s for u, s in scores.items()},
                    winner_id=winner_id,
                )
                # Achievement awards
                await self._award_achievements(channel, sorted_users, perfect_users)

                # Post archived summary
                archive_ch = self.bot.get_channel(self.settings.channel_archive)
                if isinstance(archive_ch, discord.TextChannel):
                    try:
                        await archive_ch.send(embed=utils.build_final_results_embed(comp_label, duration, sorted_for_embed))
                    except discord.Forbidden:
                        pass

                # Update leaderboard channel
                await self._refresh_leaderboard()
        finally:
            self.bot.active_competitions.pop(channel.id, None)

    async def _score_user(
        self,
        user_id: int,
        points: int,
        is_correct: bool,
        elapsed: float,
        scores: dict[int, dict[str, Any]],
    ) -> None:
        s = scores.setdefault(user_id, {"points": 0, "correct": 0, "answers": 0, "last_time": 0.0})
        s["answers"] += 1
        s["last_time"] = elapsed
        if is_correct:
            # Speed bonus: extra 50% if answered within first 3 seconds
            bonus = points // 2 if elapsed < 3.0 else 0
            s["points"] += points + bonus
            s["correct"] += 1
            # Record in DB
            user = self.bot.get_user(user_id)
            name = user.display_name if user else f"User {user_id}"
            await self.bot.db.ensure_user(user_id, name)
            await self.bot.db.add_points(user_id, points + bonus, correct=True, fast=(elapsed < 3.0))
        else:
            user = self.bot.get_user(user_id)
            name = user.display_name if user else f"User {user_id}"
            await self.bot.db.ensure_user(user_id, name)
            await self.bot.db.add_points(user_id, 0, correct=False)

    def _mini_leaderboard(self, scores: dict[int, dict[str, Any]]) -> list[str]:
        items = sorted(scores.items(), key=lambda x: -x[1]["points"])[:5]
        out = []
        for i, (uid, s) in enumerate(items, start=1):
            medal = ["🥇", "🥈", "🥉"][i - 1] if i <= 3 else f"`#{i}`"
            out.append(f"{medal} <@{uid}> — **{s['points']}** نقطة ({s['correct']}✅)")
        return out

    async def _award_achievements(
        self,
        channel: discord.TextChannel,
        sorted_users: list[tuple[int, dict[str, Any]]],
        perfect_users: set[int],
    ) -> None:
        from ..config import ACHIEVEMENTS
        notes: list[str] = []
        for i, (uid, _) in enumerate(sorted_users):
            user_data = await self.bot.db.get_user(uid)
            if not user_data:
                continue
            checks = [
                ("first_win", user_data["wins"] >= 1 and i == 0),
                ("streak_5", user_data["best_streak"] >= 5),
                ("streak_10", user_data["best_streak"] >= 10),
                ("veteran", user_data["competitions"] >= 25),
                ("scholar", user_data["points"] >= 1000),
                ("champion", user_data["points"] >= 5000),
                ("perfect", uid in perfect_users),
                ("speedster", user_data["fast_answers"] >= 1),
            ]
            for ach_id, condition in checks:
                if condition:
                    if await self.bot.db.add_achievement(uid, ach_id):
                        ach_name = ACHIEVEMENTS[ach_id][0]
                        notes.append(f"🎖️ <@{uid}> فتح إنجاز: **{ach_name}**")
            # Auto-assign roles
            if user_data["competitions"] >= 5 and self.settings.role_active:
                await self._assign_role(channel.guild, uid, self.settings.role_active)
            if (
                user_data["competitions"] >= 25
                and user_data["total_answers"] > 0
                and (user_data["correct_answers"] / user_data["total_answers"]) >= 0.7
                and self.settings.role_expert
            ):
                await self._assign_role(channel.guild, uid, self.settings.role_expert)

        if notes:
            embed = discord.Embed(
                title="🏆 إنجازات جديدة!",
                description="\n".join(notes),
                color=COLORS["gold"],
            )
            try:
                await channel.send(embed=embed)
            except discord.Forbidden:
                pass

    async def _assign_role(self, guild: discord.Guild, user_id: int, role_id: int) -> None:
        member = guild.get_member(user_id)
        if not member:
            return
        role = guild.get_role(role_id)
        if not role or role in member.roles:
            return
        try:
            await member.add_roles(role, reason="إنجاز تلقائي")
        except discord.Forbidden:
            pass

    async def _refresh_leaderboard(self) -> None:
        ch = self.bot.get_channel(self.settings.channel_leaderboard)
        if not isinstance(ch, discord.TextChannel):
            return
        try:
            rows_all = await self.bot.db.leaderboard("all", 10)
            rows_week = await self.bot.db.leaderboard("weekly", 10)
            rows_month = await self.bot.db.leaderboard("monthly", 10)
        except Exception:
            return
        embed = discord.Embed(title="🏅 لوحة المتصدرين", color=COLORS["gold"])
        embed.add_field(name="📅 الأسبوع", value=utils.format_leaderboard(rows_week, "weekly"), inline=False)
        embed.add_field(name="📆 الشهر", value=utils.format_leaderboard(rows_month, "monthly"), inline=False)
        embed.add_field(name="🏆 كل الوقت", value=utils.format_leaderboard(rows_all, "all"), inline=False)
        embed.set_footer(text="يتحدّث تلقائيًا بعد كل مسابقة")
        # Try to find existing leaderboard message and edit, else send new
        try:
            async for msg in ch.history(limit=20):
                if msg.author.id == self.bot.user.id and msg.embeds and msg.embeds[0].title == "🏅 لوحة المتصدرين":
                    await msg.edit(embed=embed)
                    return
            await ch.send(embed=embed)
        except discord.Forbidden:
            pass


async def setup(bot: commands.Bot):
    await bot.add_cog(QuizCog(bot))
