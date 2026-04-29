"""/suggest_question + /admin questions — community-sourced trivia pipeline.

Members submit candidate questions through a modal; admins review them and
either approve (added live to the question pool) or reject. Approved
questions are loaded into ``questions.EXTRA_QUESTIONS`` at startup and after
each new approval, so they appear in the regular `/quiz`, `/race`, `/daily`
pools without any redeploy.
"""
from __future__ import annotations

import json

import discord
from discord import app_commands
from discord.ext import commands

from .. import questions as qbank
from ..config import COLORS, Settings


CATEGORY_CHOICES = [
    app_commands.Choice(name="عام", value="عام"),
    app_commands.Choice(name="عربي", value="عربي"),
    app_commands.Choice(name="تاريخ", value="تاريخ"),
    app_commands.Choice(name="جغرافيا", value="جغرافيا"),
    app_commands.Choice(name="رياضة", value="رياضة"),
    app_commands.Choice(name="تقنية", value="تقنية"),
    app_commands.Choice(name="إسلامي", value="إسلامي"),
    app_commands.Choice(name="علوم", value="علوم"),
    app_commands.Choice(name="أفلام", value="أفلام"),
]
DIFFICULTY_CHOICES = [
    app_commands.Choice(name="سهل", value="سهل"),
    app_commands.Choice(name="متوسط", value="متوسط"),
    app_commands.Choice(name="صعب", value="صعب"),
]


def _is_admin_or_mod(interaction: discord.Interaction) -> bool:
    if not isinstance(interaction.user, discord.Member):
        return False
    settings: Settings = interaction.client.settings  # type: ignore[attr-defined]
    if interaction.user.guild_permissions.administrator:
        return True
    role_ids = {r.id for r in interaction.user.roles}
    return bool(settings.role_mod and settings.role_mod in role_ids)


def _row_to_question_dict(row: dict) -> dict:
    """Convert a `user_questions` row to the in-memory question shape used by
    `bot.questions.filter_questions`."""
    base = {
        "id": f"u{row['id']}",
        "category": row["category"],
        "difficulty": row["difficulty"],
        "question": row["question"],
    }
    if row["type"] == "tf":
        base["type"] = "tf"
        base["answer"] = bool(row["answer_bool"])
    else:
        base["type"] = "mcq"
        choices = json.loads(row["choices_json"]) if row["choices_json"] else []
        base["choices"] = choices
        base["answer_index"] = int(row["answer_index"] or 0)
    return base


async def _reload_extra_questions(bot: commands.Bot) -> None:
    rows = await bot.db.get_approved_questions()
    qbank.EXTRA_QUESTIONS[:] = [_row_to_question_dict(r) for r in rows]


# ---------------------------------------------------------------------------
# Submission modals
# ---------------------------------------------------------------------------

class TFSubmissionModal(discord.ui.Modal, title="اقتراح سؤال صح/خطأ"):
    def __init__(self, category: str, difficulty: str):
        super().__init__()
        self.category = category
        self.difficulty = difficulty

    question = discord.ui.TextInput(
        label="نص السؤال",
        style=discord.TextStyle.paragraph,
        placeholder="مثال: عاصمة فرنسا هي باريس.",
        max_length=400,
        required=True,
    )
    answer = discord.ui.TextInput(
        label="الإجابة (صح / خطأ)",
        placeholder="صح  أو  خطأ",
        max_length=8,
        required=True,
    )
    explanation = discord.ui.TextInput(
        label="شرح اختياري للإجابة",
        style=discord.TextStyle.paragraph,
        required=False,
        max_length=300,
    )

    async def on_submit(self, interaction: discord.Interaction):
        ans_raw = (self.answer.value or "").strip()
        truthy = {"صح", "نعم", "true", "صحيح", "1"}
        falsy = {"خطأ", "خاطئ", "لا", "false", "0"}
        if ans_raw in truthy:
            answer_bool = True
        elif ans_raw in falsy:
            answer_bool = False
        else:
            await interaction.response.send_message(
                "❌ قيمة الإجابة غير مفهومة. اكتب `صح` أو `خطأ`.",
                ephemeral=True,
            )
            return
        q_id = await interaction.client.db.submit_user_question(  # type: ignore[attr-defined]
            submitted_by=interaction.user.id,
            question=self.question.value.strip(),
            type_="tf",
            choices_json=None,
            answer_index=None,
            answer_bool=answer_bool,
            category=self.category,
            difficulty=self.difficulty,
            explanation=(self.explanation.value or "").strip() or None,
        )
        await interaction.response.send_message(
            f"✅ تم استلام اقتراحك (#{q_id}). راح تتم مراجعته من الإدارة قريباً.",
            ephemeral=True,
        )


class MCQSubmissionModal(discord.ui.Modal, title="اقتراح سؤال اختيار من متعدد"):
    def __init__(self, category: str, difficulty: str):
        super().__init__()
        self.category = category
        self.difficulty = difficulty

    question = discord.ui.TextInput(
        label="نص السؤال",
        style=discord.TextStyle.paragraph,
        max_length=400,
        required=True,
    )
    choices = discord.ui.TextInput(
        label="الخيارات (سطر لكل خيار، 2 إلى 4)",
        style=discord.TextStyle.paragraph,
        placeholder="باريس\nلندن\nروما\nبرلين",
        max_length=400,
        required=True,
    )
    answer_letter = discord.ui.TextInput(
        label="رقم الإجابة الصحيحة (1 = أول سطر)",
        placeholder="1",
        max_length=1,
        required=True,
    )
    explanation = discord.ui.TextInput(
        label="شرح اختياري للإجابة",
        style=discord.TextStyle.paragraph,
        required=False,
        max_length=300,
    )

    async def on_submit(self, interaction: discord.Interaction):
        lines = [ln.strip() for ln in (self.choices.value or "").splitlines() if ln.strip()]
        if not 2 <= len(lines) <= 4:
            await interaction.response.send_message(
                "❌ يجب أن تتكون الخيارات من 2 إلى 4 أسطر.", ephemeral=True
            )
            return
        try:
            n = int((self.answer_letter.value or "").strip())
        except ValueError:
            await interaction.response.send_message(
                "❌ رقم الإجابة غير صالح.", ephemeral=True
            )
            return
        if not 1 <= n <= len(lines):
            await interaction.response.send_message(
                f"❌ رقم الإجابة يجب أن يكون بين 1 و {len(lines)}.",
                ephemeral=True,
            )
            return
        q_id = await interaction.client.db.submit_user_question(  # type: ignore[attr-defined]
            submitted_by=interaction.user.id,
            question=self.question.value.strip(),
            type_="mcq",
            choices_json=json.dumps(lines, ensure_ascii=False),
            answer_index=n - 1,
            answer_bool=None,
            category=self.category,
            difficulty=self.difficulty,
            explanation=(self.explanation.value or "").strip() or None,
        )
        await interaction.response.send_message(
            f"✅ تم استلام اقتراحك (#{q_id}). راح تتم مراجعته قريباً.",
            ephemeral=True,
        )


# ---------------------------------------------------------------------------
# Admin review view (approve / reject buttons)
# ---------------------------------------------------------------------------

class _ReviewView(discord.ui.View):
    def __init__(self, cog: "SubmissionsCog", q_id: int):
        super().__init__(timeout=600.0)
        self.cog = cog
        self.q_id = q_id

    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        if not _is_admin_or_mod(interaction):
            await interaction.response.send_message(
                "🚫 ليست لديك صلاحية.", ephemeral=True
            )
            return False
        return True

    @discord.ui.button(label="موافقة", style=discord.ButtonStyle.success, emoji="✅")
    async def approve(self, interaction: discord.Interaction, _btn: discord.ui.Button):
        ok = await interaction.client.db.review_user_question(  # type: ignore[attr-defined]
            self.q_id, interaction.user.id, approve=True
        )
        if not ok:
            await interaction.response.send_message(
                "⚠️ السؤال تمت مراجعته مسبقاً.", ephemeral=True
            )
            return
        await _reload_extra_questions(interaction.client)  # type: ignore[arg-type]
        for child in self.children:
            child.disabled = True  # type: ignore[attr-defined]
        await interaction.response.edit_message(
            content=f"✅ تمت الموافقة على السؤال #{self.q_id} (أضيف للأسئلة فوراً).",
            view=self,
        )

    @discord.ui.button(label="رفض", style=discord.ButtonStyle.danger, emoji="❌")
    async def reject(self, interaction: discord.Interaction, _btn: discord.ui.Button):
        ok = await interaction.client.db.review_user_question(  # type: ignore[attr-defined]
            self.q_id, interaction.user.id, approve=False
        )
        if not ok:
            await interaction.response.send_message(
                "⚠️ السؤال تمت مراجعته مسبقاً.", ephemeral=True
            )
            return
        for child in self.children:
            child.disabled = True  # type: ignore[attr-defined]
        await interaction.response.edit_message(
            content=f"❌ تم رفض السؤال #{self.q_id}.",
            view=self,
        )


# ---------------------------------------------------------------------------
# Cog
# ---------------------------------------------------------------------------

class SubmissionsCog(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    async def cog_load(self) -> None:
        await _reload_extra_questions(self.bot)

    @app_commands.command(
        name="suggest_question",
        description="✏️ اقترح سؤالاً جديداً ليُضاف إلى البوت بعد مراجعة الإدارة",
    )
    @app_commands.describe(
        type="نوع السؤال",
        category="الفئة",
        difficulty="مستوى الصعوبة",
    )
    @app_commands.choices(
        type=[
            app_commands.Choice(name="صح / خطأ", value="tf"),
            app_commands.Choice(name="اختيار من متعدد", value="mcq"),
        ],
        category=CATEGORY_CHOICES,
        difficulty=DIFFICULTY_CHOICES,
    )
    async def suggest_question(
        self,
        interaction: discord.Interaction,
        type: app_commands.Choice[str],
        category: app_commands.Choice[str],
        difficulty: app_commands.Choice[str],
    ):
        modal: discord.ui.Modal
        if type.value == "tf":
            modal = TFSubmissionModal(category=category.value, difficulty=difficulty.value)
        else:
            modal = MCQSubmissionModal(category=category.value, difficulty=difficulty.value)
        await interaction.response.send_modal(modal)

    # --- admin review group ---
    admin_q = app_commands.Group(
        name="admin_questions",
        description="مراجعة اقتراحات الأسئلة",
        default_permissions=discord.Permissions(manage_guild=True),
    )

    @admin_q.command(name="pending", description="عرض الاقتراحات المعلّقة")
    async def pending(self, interaction: discord.Interaction):
        if not _is_admin_or_mod(interaction):
            await interaction.response.send_message(
                "🚫 ليست لديك صلاحية.", ephemeral=True
            )
            return
        rows = await self.bot.db.list_user_questions(status="pending", limit=10)
        if not rows:
            await interaction.response.send_message(
                "✨ لا توجد اقتراحات معلّقة.", ephemeral=True
            )
            return
        await interaction.response.send_message(
            f"📋 يوجد **{len(rows)}** اقتراح معلّق. سأعرضها واحداً تلو الآخر:",
            ephemeral=True,
        )
        for row in rows:
            embed = self._render_question_embed(row)
            view = _ReviewView(self, row["id"])
            await interaction.followup.send(embed=embed, view=view, ephemeral=True)

    @admin_q.command(name="stats", description="إحصائيات اقتراحات الأسئلة")
    async def stats(self, interaction: discord.Interaction):
        if not _is_admin_or_mod(interaction):
            await interaction.response.send_message(
                "🚫 ليست لديك صلاحية.", ephemeral=True
            )
            return
        pending = await self.bot.db.list_user_questions(status="pending", limit=10000)
        approved = await self.bot.db.list_user_questions(status="approved", limit=10000)
        rejected = await self.bot.db.list_user_questions(status="rejected", limit=10000)
        embed = discord.Embed(
            title="📊 إحصائيات اقتراحات الأسئلة",
            color=COLORS.get("info", 0x3498DB),
        )
        embed.add_field(name="⏳ معلّقة", value=str(len(pending)), inline=True)
        embed.add_field(name="✅ موافَق عليها", value=str(len(approved)), inline=True)
        embed.add_field(name="❌ مرفوضة", value=str(len(rejected)), inline=True)
        embed.set_footer(text=f"الأسئلة في البوت الآن: {qbank.total()}")
        await interaction.response.send_message(embed=embed, ephemeral=True)

    def _render_question_embed(self, row: dict) -> discord.Embed:
        embed = discord.Embed(
            title=f"اقتراح #{row['id']} • {row['category']} • {row['difficulty']}",
            description=row["question"],
            color=COLORS.get("warning", 0xE67E22),
        )
        if row["type"] == "tf":
            embed.add_field(
                name="الإجابة",
                value="✅ صح" if row["answer_bool"] else "❌ خطأ",
                inline=False,
            )
        else:
            try:
                choices = json.loads(row["choices_json"] or "[]")
            except Exception:
                choices = []
            ans_idx = int(row["answer_index"] or 0)
            lines = []
            for i, c in enumerate(choices):
                marker = "✅" if i == ans_idx else "▫️"
                lines.append(f"{marker} {i + 1}. {c}")
            embed.add_field(name="الخيارات", value="\n".join(lines) or "—", inline=False)
        if row.get("explanation"):
            embed.add_field(name="شرح", value=row["explanation"], inline=False)
        embed.set_footer(text=f"اقترحه: <@{row['submitted_by']}>")
        return embed


async def setup(bot: commands.Bot):
    await bot.add_cog(SubmissionsCog(bot))
