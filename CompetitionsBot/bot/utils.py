"""Helper utilities for embeds, varied question presentation, formatting."""
from __future__ import annotations

import asyncio
import random
from typing import Any

import discord

from .config import COLORS, LEVEL_THRESHOLDS

# ---- Visual themes ----
QUESTION_THEMES = [
    {"color": 0x5865F2, "icon": "🎯", "border": "═══════════════════════"},
    {"color": 0xFFD700, "icon": "⭐", "border": "✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦"},
    {"color": 0xE91E63, "icon": "💖", "border": "♥─♥─♥─♥─♥─♥─♥─♥─♥"},
    {"color": 0x2ECC71, "icon": "🌿", "border": "❀ ❀ ❀ ❀ ❀ ❀ ❀ ❀ ❀"},
    {"color": 0xE67E22, "icon": "🔥", "border": "▰▰▰▰▰▰▰▰▰▰▰▰▰▰"},
    {"color": 0x9B59B6, "icon": "🔮", "border": "◆ ◇ ◆ ◇ ◆ ◇ ◆ ◇ ◆ ◇"},
    {"color": 0x1ABC9C, "icon": "💎", "border": "▢ ▣ ▢ ▣ ▢ ▣ ▢ ▣ ▢ ▣"},
    {"color": 0xF1C40F, "icon": "✨", "border": "～～～～～～～～～～"},
]

CHOICE_EMOJIS = ["🇦", "🇧", "🇨", "🇩", "🇪", "🇫"]
CHOICE_LETTERS = ["A", "B", "C", "D", "E", "F"]


def random_theme() -> dict[str, Any]:
    return random.choice(QUESTION_THEMES)


def progress_bar(current: int, total: int, length: int = 12) -> str:
    if total <= 0:
        return ""
    ratio = max(0.0, min(1.0, current / total))
    filled = int(length * ratio)
    return "█" * filled + "░" * (length - filled)


def points_to_level(points: int) -> tuple[int, int, int]:
    """Returns (level, points_into_level, points_for_next_level)."""
    level = 0
    for i, threshold in enumerate(LEVEL_THRESHOLDS):
        if points >= threshold:
            level = i + 1
        else:
            break
    if level >= len(LEVEL_THRESHOLDS):
        return level, points - LEVEL_THRESHOLDS[-1], LEVEL_THRESHOLDS[-1]
    if level == 0:
        return 1, points, LEVEL_THRESHOLDS[1]
    base = LEVEL_THRESHOLDS[level - 1]
    nxt = LEVEL_THRESHOLDS[level] if level < len(LEVEL_THRESHOLDS) else base + 5000
    return level, points - base, nxt - base


# -------- Embed builders --------

def build_question_embed_card(
    question_num: int,
    total: int,
    question_text: str,
    category: str,
    difficulty: str,
    time_limit: int,
    theme: dict[str, Any] | None = None,
    choices: list[str] | None = None,
    style: str = "card",
) -> discord.Embed:
    """Build a question embed in 'card' style with full visual.

    Style values:
        card     – classic card with thick borders
        compact  – minimal, single-line presentation
        story    – descriptive narrative style
        list     – numbered list of choices on the side
    """
    theme = theme or random_theme()
    if style == "compact":
        embed = discord.Embed(
            title=f"{theme['icon']} السؤال {question_num}/{total}",
            description=f"**{question_text}**",
            color=theme["color"],
        )
    elif style == "story":
        embed = discord.Embed(
            title=f"📖 الجولة {question_num} من {total}",
            description=(
                f"```fix\n{theme['border']}\n```\n"
                f"### {theme['icon']} {question_text}\n\n"
                f"_تصنيف: **{category}** • صعوبة: **{difficulty}** • الوقت: **{time_limit}s**_"
            ),
            color=theme["color"],
        )
    elif style == "list":
        body = f"### {theme['icon']} {question_text}\n\n"
        if choices:
            for i, c in enumerate(choices):
                body += f"{CHOICE_EMOJIS[i]}  **{c}**\n"
        embed = discord.Embed(
            title=f"❓ سؤال {question_num} من {total}",
            description=body,
            color=theme["color"],
        )
    else:  # card
        embed = discord.Embed(
            title=f"{theme['icon']} السؤال {question_num}/{total}",
            color=theme["color"],
        )
        embed.description = (
            f"```yml\n{theme['border']}\n```\n"
            f"## {question_text}\n"
            f"```yml\n{theme['border']}\n```"
        )
        embed.add_field(name="📂 التصنيف", value=f"`{category}`", inline=True)
        embed.add_field(name="⚡ الصعوبة", value=f"`{difficulty}`", inline=True)
        embed.add_field(name="⏱️ الوقت", value=f"`{time_limit} ثانية`", inline=True)
    embed.set_footer(text="اختر الإجابة الصحيحة بالأسفل ⬇")
    return embed


def build_welcome_embed(competition_name: str, host: discord.Member | None = None) -> discord.Embed:
    """Festive welcome embed displayed before the competition starts."""
    from .config import WELCOME_MESSAGES

    embed = discord.Embed(
        title=f"🎊 مسابقة {competition_name} • على وشك البدء!",
        description=random.choice(WELCOME_MESSAGES),
        color=COLORS["gold"],
    )
    if host:
        embed.add_field(name="🎤 المنظم", value=host.mention, inline=True)
    embed.add_field(name="🏆 الجائزة", value="نقاط ورتب وشهرة!", inline=True)
    embed.add_field(name="🎯 جاهزون؟", value="ركّزوا واستعدّوا!", inline=True)
    embed.set_image(
        url="https://media.tenor.com/RrlrWYYqKDgAAAAi/loading-buffering.gif"
    )
    return embed


def build_countdown_embed(seconds_left: int) -> discord.Embed:
    color = COLORS["warning"] if seconds_left > 1 else COLORS["danger"]
    return discord.Embed(
        title=f"⏳  {seconds_left}",
        description=f"## استعداد… {'🔴' * seconds_left}{'⚪' * (3 - seconds_left)}",
        color=color,
    )


def build_result_embed(
    correct_answer: str, leaderboard_lines: list[str] | None = None
) -> discord.Embed:
    embed = discord.Embed(
        title="✅ انتهى الوقت — النتيجة",
        description=f"**الإجابة الصحيحة:** ` {correct_answer} `",
        color=COLORS["success"],
    )
    if leaderboard_lines:
        embed.add_field(
            name="📊 الترتيب الحالي",
            value="\n".join(leaderboard_lines[:5]) or "—",
            inline=False,
        )
    return embed


def build_final_results_embed(
    competition_name: str,
    duration_s: float,
    sorted_scores: list[tuple[discord.Member | discord.User, int, int]],
) -> discord.Embed:
    """sorted_scores: list of (user, correct_count, points)."""
    medals = ["🥇", "🥈", "🥉"]
    embed = discord.Embed(
        title=f"🏆 نتائج {competition_name}",
        description=f"⏱️ المدة: **{duration_s:.1f} ثانية** • 👥 المشاركون: **{len(sorted_scores)}**",
        color=COLORS["gold"],
    )
    if not sorted_scores:
        embed.description += "\n\n_لم يجاوب أحد على الأسئلة._"
        return embed

    lines = []
    for i, (user, correct, pts) in enumerate(sorted_scores[:10]):
        prefix = medals[i] if i < 3 else f"`#{i + 1}`"
        lines.append(f"{prefix} **{user.display_name}** — {pts} نقطة • {correct} ✅")
    embed.add_field(name="🏅 المتصدرون", value="\n".join(lines), inline=False)

    winner = sorted_scores[0][0]
    embed.set_thumbnail(url=winner.display_avatar.url if hasattr(winner, "display_avatar") else None)
    embed.set_footer(text=f"🌟 البطل: {winner.display_name}")
    return embed


# ---- Buttons / Views ----
class MultipleChoiceView(discord.ui.View):
    """Generic multiple-choice view with N buttons."""

    def __init__(
        self,
        choices: list[str],
        correct_index: int,
        timeout: float = 20.0,
        on_answer: Any = None,
    ):
        super().__init__(timeout=timeout)
        self.choices = choices
        self.correct_index = correct_index
        self.answers: dict[int, tuple[int, float]] = {}
        self.on_answer = on_answer
        styles = [
            discord.ButtonStyle.primary,
            discord.ButtonStyle.secondary,
            discord.ButtonStyle.success,
            discord.ButtonStyle.danger,
            discord.ButtonStyle.primary,
            discord.ButtonStyle.secondary,
        ]
        for i, choice in enumerate(choices):
            btn = discord.ui.Button(
                label=f"{CHOICE_LETTERS[i]}. {choice[:75]}",
                emoji=CHOICE_EMOJIS[i],
                style=styles[i % len(styles)],
                custom_id=f"choice_{i}",
                row=i // 2,
            )
            btn.callback = self._make_cb(i)
            self.add_item(btn)

    def _make_cb(self, idx: int):
        async def _cb(interaction: discord.Interaction):
            import time as _t
            uid = interaction.user.id
            if uid in self.answers:
                await interaction.response.send_message(
                    "⚠️ سجلت إجابتك بالفعل، لا يمكن تغييرها.", ephemeral=True
                )
                return
            self.answers[uid] = (idx, _t.time())
            correct = idx == self.correct_index
            if self.on_answer:
                await self.on_answer(interaction, idx, correct)
            else:
                await interaction.response.send_message(
                    f"{'✅ سُجلت إجابتك!' if correct else '☑️ سُجلت إجابتك.'}",
                    ephemeral=True,
                )
        return _cb


class SelectMenuView(discord.ui.View):
    """Question presented as a dropdown select menu."""

    def __init__(
        self,
        choices: list[str],
        correct_index: int,
        timeout: float = 20.0,
        on_answer: Any = None,
    ):
        super().__init__(timeout=timeout)
        self.choices = choices
        self.correct_index = correct_index
        self.answers: dict[int, tuple[int, float]] = {}
        self.on_answer = on_answer
        options = [
            discord.SelectOption(
                label=f"{CHOICE_LETTERS[i]}. {choice[:90]}",
                value=str(i),
                emoji=CHOICE_EMOJIS[i],
            )
            for i, choice in enumerate(choices)
        ]
        select = discord.ui.Select(
            placeholder="اختر الإجابة من القائمة... 📜",
            options=options,
            custom_id="select_answer",
        )
        select.callback = self._select_cb
        self.add_item(select)

    async def _select_cb(self, interaction: discord.Interaction):
        import time as _t
        uid = interaction.user.id
        if uid in self.answers:
            await interaction.response.send_message(
                "⚠️ سجلت إجابتك بالفعل.", ephemeral=True
            )
            return
        idx = int(interaction.data["values"][0])
        self.answers[uid] = (idx, _t.time())
        correct = idx == self.correct_index
        if self.on_answer:
            await self.on_answer(interaction, idx, correct)
        else:
            await interaction.response.send_message(
                f"{'✅ سُجلت!' if correct else '☑️ سُجلت!'}", ephemeral=True
            )


class TrueFalseView(discord.ui.View):
    """Two-button true/false view."""

    def __init__(
        self,
        correct_value: bool,
        timeout: float = 15.0,
        on_answer: Any = None,
    ):
        super().__init__(timeout=timeout)
        self.correct_value = correct_value
        self.answers: dict[int, tuple[bool, float]] = {}
        self.on_answer = on_answer
        for label, value, style, emoji in [
            ("صحيح", True, discord.ButtonStyle.success, "✅"),
            ("خطأ", False, discord.ButtonStyle.danger, "❌"),
        ]:
            btn = discord.ui.Button(
                label=label,
                emoji=emoji,
                style=style,
                custom_id=f"tf_{value}",
            )
            btn.callback = self._make_cb(value)
            self.add_item(btn)

    def _make_cb(self, value: bool):
        async def _cb(interaction: discord.Interaction):
            import time as _t
            uid = interaction.user.id
            if uid in self.answers:
                await interaction.response.send_message(
                    "⚠️ سجلت إجابتك.", ephemeral=True
                )
                return
            self.answers[uid] = (value, _t.time())
            correct = value == self.correct_value
            if self.on_answer:
                await self.on_answer(interaction, value, correct)
            else:
                await interaction.response.send_message(
                    f"{'✅ سُجلت!' if correct else '☑️ سُجلت.'}", ephemeral=True
                )
        return _cb


class RaceButtonView(discord.ui.View):
    """First-to-click button race."""

    def __init__(
        self,
        timeout: float = 15.0,
        on_first: Any = None,
    ):
        super().__init__(timeout=timeout)
        self.on_first = on_first
        self.first_user: discord.User | None = None
        btn = discord.ui.Button(
            label="🚀 اضغط الآن!",
            style=discord.ButtonStyle.success,
            custom_id="race_button",
        )
        btn.callback = self._cb
        self.add_item(btn)

    async def _cb(self, interaction: discord.Interaction):
        if self.first_user is not None:
            await interaction.response.send_message(
                f"🐢 أبطأ! فاز {self.first_user.mention} قبلك.", ephemeral=True
            )
            return
        self.first_user = interaction.user
        if self.on_first:
            await self.on_first(interaction)
        else:
            await interaction.response.send_message(
                f"🏆 فزت! {interaction.user.mention} أسرع من الجميع!"
            )


def format_leaderboard(rows: list[dict[str, Any]], scope: str = "all") -> str:
    if not rows:
        return "_لا توجد نقاط بعد. كن أول من يصعد للقمة!_"
    medals = ["🥇", "🥈", "🥉"]
    column = {"weekly": "weekly_points", "monthly": "monthly_points"}.get(scope, "points")
    lines = []
    for i, r in enumerate(rows[:10]):
        prefix = medals[i] if i < 3 else f"`#{i + 1:>2}`"
        lvl, _, _ = points_to_level(r["points"])
        lines.append(
            f"{prefix} <@{r['user_id']}> — **{r[column]}** نقطة • Lvl {lvl}"
        )
    return "\n".join(lines)


def question_countdown_footer(seconds_left: int, total: int) -> str:
    """Build a visual countdown bar for a question's footer."""
    if seconds_left <= 0:
        return "⏰ انتهى الوقت!"
    # Visual progress bar
    ratio = seconds_left / total
    cells = 20
    filled = int(ratio * cells)
    if seconds_left <= 5:
        bar = "🟥" * filled + "⬛" * (cells - filled)
        warn = "🚨"
    elif seconds_left <= 10:
        bar = "🟧" * filled + "⬛" * (cells - filled)
        warn = "⚠️"
    else:
        bar = "🟩" * filled + "⬛" * (cells - filled)
        warn = "⏱️"
    return f"{warn} متبقي **{seconds_left}** ثانية\n{bar}"


async def run_question_countdown(
    message: discord.Message,
    embed: discord.Embed,
    total_seconds: int,
    view: discord.ui.View | None = None,
) -> None:
    """Live-edit `message` to show a countdown in the embed description.

    Uses a small number of edits (every 5 seconds + final 5s every 1s) to stay
    well under Discord rate limits while giving a smooth visual countdown.
    """
    import asyncio as _aio

    # Schedule of seconds-remaining values at which to refresh
    schedule: list[int] = []
    s = total_seconds
    while s > 10:
        schedule.append(s)
        s -= 5
    while s > 0:
        schedule.append(s)
        s -= 1
    schedule.append(0)

    start = _aio.get_event_loop().time()
    base_description = embed.description or ""
    # Strip any prior countdown block we appended
    marker = "\n\n━━ ⏳ ━━"
    if marker in base_description:
        base_description = base_description.split(marker)[0]

    for idx, target_seconds_left in enumerate(schedule):
        elapsed = _aio.get_event_loop().time() - start
        target_elapsed = total_seconds - target_seconds_left
        wait = target_elapsed - elapsed
        if wait > 0:
            await _aio.sleep(wait)
        # Build refreshed embed
        new_embed = embed.copy()
        countdown_block = question_countdown_footer(target_seconds_left, total_seconds)
        new_embed.description = f"{base_description}\n\n━━ ⏳ ━━\n{countdown_block}"
        # Color shifts as time runs out
        if target_seconds_left <= 5:
            new_embed.colour = discord.Colour(0xE74C3C)  # red
        elif target_seconds_left <= 10:
            new_embed.colour = discord.Colour(0xF39C12)  # orange
        try:
            if view is not None:
                await message.edit(embed=new_embed, view=view)
            else:
                await message.edit(embed=new_embed)
        except (discord.HTTPException, discord.NotFound):
            return


async def countdown_message(channel: discord.abc.Messageable, seconds: int = 3) -> None:
    """Send a countdown by editing one message."""
    msg = await channel.send(embed=build_countdown_embed(seconds))
    while seconds > 0:
        await asyncio.sleep(1)
        seconds -= 1
        if seconds > 0:
            try:
                await msg.edit(embed=build_countdown_embed(seconds))
            except discord.HTTPException:
                pass
    try:
        await msg.edit(embed=discord.Embed(
            title="🚀 ابدأوا الآن!",
            color=COLORS["success"],
        ))
    except discord.HTTPException:
        pass
