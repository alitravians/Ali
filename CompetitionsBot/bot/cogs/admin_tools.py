"""Wave 6 — advanced admin tools.

This cog adds three slash-command groups (all hidden behind
``manage_guild`` so they don't appear in regular members' slash menu):

- ``/admin_question add|edit|remove|list`` — live CRUD on a separate
  ``admin_questions`` table whose rows are merged into the runtime
  question pool via :data:`bot.questions.ADMIN_QUESTIONS`. Built-in
  questions (``QUESTIONS`` in ``bot/questions.py``) are read-only — only
  rows added through this UI can be edited or removed.
- ``/admin_schedule announce|list|cancel`` — schedule a plain-text
  announcement to be posted into a channel at a future time. A
  background task fires due rows once and only once.
- ``/admin_health`` — uptime, DB size, latency, cog count, total Q pool.

All write paths go through the DB module so they survive restarts.
"""
from __future__ import annotations

import datetime as _dt
import logging
import re
import time
from typing import Any

import discord
from discord import app_commands
from discord.ext import commands, tasks

from .. import questions as qbank
from ..config import COLORS, Settings


_log = logging.getLogger(__name__)

# Accept "1h30m", "45m", "2d", "10s", "in 2 hours", etc.
_DURATION_RE = re.compile(
    r"(?:(\d+)\s*d)?\s*(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?\s*(?:(\d+)\s*s)?",
    re.IGNORECASE,
)


def _parse_in(text: str) -> float | None:
    """Parse a duration like ``2h30m`` and return seconds, or ``None``."""
    s = text.strip().lower().replace("in ", "")
    m = _DURATION_RE.fullmatch(s)
    if not m:
        return None
    d, h, mi, se = (int(x) if x else 0 for x in m.groups())
    total = d * 86400 + h * 3600 + mi * 60 + se
    return float(total) if total > 0 else None


def _is_admin_or_mod(interaction: discord.Interaction) -> bool:
    if not isinstance(interaction.user, discord.Member):
        return False
    settings: Settings = interaction.client.settings  # type: ignore[attr-defined]
    if interaction.user.guild_permissions.administrator:
        return True
    role_ids = {r.id for r in interaction.user.roles}
    return bool(settings.role_mod and settings.role_mod in role_ids)


def _row_to_question(row: dict[str, Any]) -> dict[str, Any]:
    """Convert an ``admin_questions`` row to a runtime question dict."""
    qid = f"a{row['id']}"
    if row["type"] == "tf":
        return {
            "id": qid,
            "category": row["category"],
            "difficulty": row["difficulty"],
            "type": "tf",
            "question": row["question"],
            "answer": bool(row["answer_bool"]),
            "explanation": row.get("explanation") or "",
        }
    return {
        "id": qid,
        "category": row["category"],
        "difficulty": row["difficulty"],
        "type": "mcq",
        "question": row["question"],
        "choices": row.get("choices") or [],
        "answer_index": int(row["answer_index"] or 0),
        "explanation": row.get("explanation") or "",
    }


class AdminToolsCog(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.settings: Settings = bot.settings  # type: ignore[attr-defined]
        self._started_at = time.time()

    async def cog_load(self) -> None:
        await self._reload_admin_questions()
        self.scheduler.start()

    async def cog_unload(self) -> None:
        self.scheduler.cancel()

    async def _reload_admin_questions(self) -> None:
        # ``limit=0`` → unbounded. The runtime pool needs *every* admin
        # question, otherwise old ones silently drop out of the rotation.
        rows = await self.bot.db.list_admin_questions(
            include_deleted=False, limit=0
        )
        qbank.ADMIN_QUESTIONS = [_row_to_question(r) for r in rows]
        _log.info("Loaded %d admin-managed questions", len(qbank.ADMIN_QUESTIONS))

    # ------------------------------------------------------------------
    #   /admin_question
    # ------------------------------------------------------------------
    q_group = app_commands.Group(
        name="admin_question",
        description="إدارة الأسئلة المضافة من قبل الإدارة",
        default_permissions=discord.Permissions(manage_guild=True),
    )

    @q_group.command(name="add_tf", description="إضافة سؤال صح/خطأ")
    @app_commands.describe(
        question="نص السؤال",
        answer="الإجابة الصحيحة (صح/خطأ)",
        category="الفئة (مثلاً: عام، تاريخ، علوم)",
        difficulty="المستوى (سهل|متوسط|صعب)",
        explanation="شرح اختياري للإجابة",
    )
    @app_commands.choices(
        answer=[
            app_commands.Choice(name="صح", value="true"),
            app_commands.Choice(name="خطأ", value="false"),
        ],
        difficulty=[
            app_commands.Choice(name="سهل", value="سهل"),
            app_commands.Choice(name="متوسط", value="متوسط"),
            app_commands.Choice(name="صعب", value="صعب"),
        ],
    )
    async def add_tf(
        self,
        interaction: discord.Interaction,
        question: str,
        answer: app_commands.Choice[str],
        category: str,
        difficulty: app_commands.Choice[str],
        explanation: str | None = None,
    ):
        if not _is_admin_or_mod(interaction):
            await interaction.response.send_message("🚫 ليست لديك صلاحية.", ephemeral=True)
            return
        question = question.strip()
        category = category.strip()
        if not 4 <= len(question) <= 500:
            await interaction.response.send_message(
                "❌ نص السؤال يجب أن يكون بين 4 و 500 حرف.", ephemeral=True
            )
            return
        qid = await self.bot.db.add_admin_question(
            question=question,
            type_="tf",
            choices=None,
            answer_index=None,
            answer_bool=(answer.value == "true"),
            category=category,
            difficulty=difficulty.value,
            explanation=(explanation or None),
            created_by=interaction.user.id,
        )
        await self._reload_admin_questions()
        await interaction.response.send_message(
            f"✅ تمت إضافة السؤال `#{qid}` (المجموع الآن: **{qbank.total()}**).",
            ephemeral=True,
        )

    @q_group.command(name="add_mcq", description="إضافة سؤال اختيار من متعدد")
    @app_commands.describe(
        question="نص السؤال",
        choices="الخيارات مفصولة بـ |  مثل:  مكة|الرياض|جدة|الدمام",
        correct_index="رقم الإجابة الصحيحة (1 = الأول، 2 = الثاني، إلخ)",
        category="الفئة",
        difficulty="المستوى",
        explanation="شرح اختياري",
    )
    @app_commands.choices(
        difficulty=[
            app_commands.Choice(name="سهل", value="سهل"),
            app_commands.Choice(name="متوسط", value="متوسط"),
            app_commands.Choice(name="صعب", value="صعب"),
        ],
    )
    async def add_mcq(
        self,
        interaction: discord.Interaction,
        question: str,
        choices: str,
        correct_index: int,
        category: str,
        difficulty: app_commands.Choice[str],
        explanation: str | None = None,
    ):
        if not _is_admin_or_mod(interaction):
            await interaction.response.send_message("🚫 ليست لديك صلاحية.", ephemeral=True)
            return
        parts = [p.strip() for p in choices.split("|") if p.strip()]
        if not 2 <= len(parts) <= 4:
            await interaction.response.send_message(
                "❌ يجب أن يكون عدد الخيارات بين 2 و 4 (افصل بينها بـ `|`).",
                ephemeral=True,
            )
            return
        if not 1 <= correct_index <= len(parts):
            await interaction.response.send_message(
                f"❌ رقم الإجابة الصحيحة خارج النطاق (1..{len(parts)}).",
                ephemeral=True,
            )
            return
        question = question.strip()
        if not 4 <= len(question) <= 500:
            await interaction.response.send_message(
                "❌ نص السؤال يجب أن يكون بين 4 و 500 حرف.", ephemeral=True
            )
            return
        qid = await self.bot.db.add_admin_question(
            question=question,
            type_="mcq",
            choices=parts,
            answer_index=correct_index - 1,
            answer_bool=None,
            category=category.strip(),
            difficulty=difficulty.value,
            explanation=(explanation or None),
            created_by=interaction.user.id,
        )
        await self._reload_admin_questions()
        await interaction.response.send_message(
            f"✅ تمت إضافة السؤال `#{qid}` (المجموع الآن: **{qbank.total()}**).",
            ephemeral=True,
        )

    @q_group.command(name="remove", description="حذف سؤال أضافته الإدارة")
    @app_commands.describe(question_id="رقم السؤال")
    async def remove(self, interaction: discord.Interaction, question_id: int):
        if not _is_admin_or_mod(interaction):
            await interaction.response.send_message("🚫 ليست لديك صلاحية.", ephemeral=True)
            return
        ok = await self.bot.db.soft_delete_admin_question(question_id)
        if not ok:
            await interaction.response.send_message(
                f"❌ لم يتم العثور على السؤال `#{question_id}` (أو محذوف مسبقاً).",
                ephemeral=True,
            )
            return
        await self._reload_admin_questions()
        await interaction.response.send_message(
            f"🗑️ تم حذف السؤال `#{question_id}`.", ephemeral=True
        )

    @q_group.command(name="list", description="عرض الأسئلة المضافة من قبل الإدارة")
    async def list_(self, interaction: discord.Interaction):
        if not _is_admin_or_mod(interaction):
            await interaction.response.send_message("🚫 ليست لديك صلاحية.", ephemeral=True)
            return
        rows = await self.bot.db.list_admin_questions(limit=25)
        if not rows:
            await interaction.response.send_message(
                "📭 لا توجد أسئلة من الإدارة بعد. استخدم `/admin_question add_tf` أو "
                "`/admin_question add_mcq`.",
                ephemeral=True,
            )
            return
        lines = []
        for r in rows:
            tag = "TF" if r["type"] == "tf" else f"MCQ({len(r.get('choices') or [])})"
            text = (r["question"] or "")[:70]
            lines.append(f"`#{r['id']}` [{tag}] {r['category']} • {r['difficulty']}\n  └ {text}")
        embed = discord.Embed(
            title=f"🧠 الأسئلة المضافة من قبل الإدارة ({len(rows)})",
            description="\n\n".join(lines),
            color=COLORS.get("info", 0x3498DB),
        )
        await interaction.response.send_message(embed=embed, ephemeral=True)

    @q_group.command(name="edit_text", description="تعديل نص سؤال")
    @app_commands.describe(question_id="رقم السؤال", new_text="النص الجديد")
    async def edit_text(
        self, interaction: discord.Interaction, question_id: int, new_text: str
    ):
        if not _is_admin_or_mod(interaction):
            await interaction.response.send_message("🚫 ليست لديك صلاحية.", ephemeral=True)
            return
        new_text = new_text.strip()
        if not 4 <= len(new_text) <= 500:
            await interaction.response.send_message(
                "❌ النص يجب أن يكون بين 4 و 500 حرف.", ephemeral=True
            )
            return
        ok = await self.bot.db.edit_admin_question(question_id, question=new_text)
        if not ok:
            await interaction.response.send_message(
                f"❌ لم يتم العثور على السؤال `#{question_id}`.", ephemeral=True
            )
            return
        await self._reload_admin_questions()
        await interaction.response.send_message(
            f"✅ تم تعديل السؤال `#{question_id}`.", ephemeral=True
        )

    # ------------------------------------------------------------------
    #   /admin_schedule
    # ------------------------------------------------------------------
    sched_group = app_commands.Group(
        name="admin_schedule",
        description="جدولة إعلانات",
        default_permissions=discord.Permissions(manage_guild=True),
    )

    @sched_group.command(name="announce", description="جدولة إعلان مستقبلي")
    @app_commands.describe(
        when="مدة قبل النشر (مثل 30m, 2h, 1d, 1h30m)",
        message="نص الإعلان",
        channel="القناة (افتراضياً قناة الإعلانات)",
    )
    async def announce(
        self,
        interaction: discord.Interaction,
        when: str,
        message: str,
        channel: discord.TextChannel | None = None,
    ):
        if not _is_admin_or_mod(interaction):
            await interaction.response.send_message("🚫 ليست لديك صلاحية.", ephemeral=True)
            return
        seconds = _parse_in(when)
        if seconds is None or seconds < 30 or seconds > 30 * 86400:
            await interaction.response.send_message(
                "❌ مدة غير صالحة. مثال: `30m`, `2h`, `1d`, `1h30m`. الحد الأدنى 30 ثانية، "
                "الأقصى 30 يوماً.",
                ephemeral=True,
            )
            return
        ch = channel
        if ch is None:
            announcements_id = self.settings.channel_announcements
            obj = self.bot.get_channel(announcements_id) if announcements_id else None
            ch = obj if isinstance(obj, discord.TextChannel) else None
        if ch is None:
            await interaction.response.send_message(
                "❌ لم أجد قناة مناسبة. حدّد `channel:` يدوياً.", ephemeral=True
            )
            return
        if not 1 <= len(message) <= 1900:
            await interaction.response.send_message(
                "❌ نص الإعلان يجب أن يكون بين 1 و 1900 حرف.", ephemeral=True
            )
            return
        fire_at = time.time() + seconds
        sched_id = await self.bot.db.schedule_announcement(
            channel_id=ch.id,
            message=message,
            fire_at=fire_at,
            created_by=interaction.user.id,
        )
        await interaction.response.send_message(
            f"⏰ مجدول `#{sched_id}` في {ch.mention} <t:{int(fire_at)}:R>.",
            ephemeral=True,
        )

    @sched_group.command(name="list", description="عرض الإعلانات المجدولة")
    async def sched_list(self, interaction: discord.Interaction):
        if not _is_admin_or_mod(interaction):
            await interaction.response.send_message("🚫 ليست لديك صلاحية.", ephemeral=True)
            return
        rows = await self.bot.db.list_pending_announcements()
        if not rows:
            await interaction.response.send_message(
                "📭 لا توجد إعلانات مجدولة.", ephemeral=True
            )
            return
        lines = []
        for r in rows[:25]:
            text = (r["message"] or "")[:80]
            lines.append(
                f"`#{r['id']}` <#{r['channel_id']}> "
                f"<t:{int(r['fire_at'])}:R>\n  └ {text}"
            )
        embed = discord.Embed(
            title=f"⏰ الإعلانات المجدولة ({len(rows)})",
            description="\n\n".join(lines),
            color=COLORS.get("info", 0x3498DB),
        )
        await interaction.response.send_message(embed=embed, ephemeral=True)

    @sched_group.command(name="cancel", description="إلغاء إعلان مجدول")
    @app_commands.describe(schedule_id="رقم الإعلان")
    async def sched_cancel(
        self, interaction: discord.Interaction, schedule_id: int
    ):
        if not _is_admin_or_mod(interaction):
            await interaction.response.send_message("🚫 ليست لديك صلاحية.", ephemeral=True)
            return
        ok = await self.bot.db.cancel_announcement(schedule_id)
        if ok:
            await interaction.response.send_message(
                f"✅ تم إلغاء الإعلان `#{schedule_id}`.", ephemeral=True
            )
        else:
            await interaction.response.send_message(
                f"❌ لم يتم العثور على إعلان مجدول رقم `#{schedule_id}` "
                "(أو سبق إطلاقه/إلغاؤه).",
                ephemeral=True,
            )

    # Maximum send attempts before we permanently give up on a scheduled
    # announcement. Three attempts spans ~40s with the 20s loop, which is
    # enough to ride out a brief Discord 5xx blip without log-spamming
    # forever on a permanent error (e.g. the bot lost SEND_MESSAGES on
    # the target channel, or the message content is blocked by AutoMod).
    SCHEDULER_MAX_ATTEMPTS = 3

    @tasks.loop(seconds=20)
    async def scheduler(self) -> None:
        try:
            due = await self.bot.db.list_due_announcements(now_ts=time.time())
        except Exception as e:
            _log.exception("scheduler poll failed: %s", e)
            return
        for r in due:
            ch = self.bot.get_channel(r["channel_id"])
            if not isinstance(ch, discord.TextChannel):
                _log.warning(
                    "Scheduled #%s targets missing channel %s — marking fired",
                    r["id"], r["channel_id"],
                )
                # Mark fired anyway so we don't re-attempt forever.
                await self.bot.db.mark_announcement_fired(r["id"])
                continue
            try:
                await ch.send(r["message"])
            except discord.HTTPException as e:
                # Bound the retry storm. ``record_announcement_failure``
                # increments ``attempts`` and, if it reaches
                # SCHEDULER_MAX_ATTEMPTS, marks the row fired so the
                # scheduler stops picking it up. Otherwise we leave it
                # pending and try again on the next loop iteration —
                # transient 5xx errors should resolve within a few
                # tries, permanent 4xx errors are bounded.
                attempts = await self.bot.db.record_announcement_failure(
                    r["id"], error=str(e),
                    max_attempts=self.SCHEDULER_MAX_ATTEMPTS,
                )
                if attempts >= self.SCHEDULER_MAX_ATTEMPTS:
                    _log.error(
                        "scheduled send #%s permanently failed after %d "
                        "attempts: %s — marked fired",
                        r["id"], attempts, e,
                    )
                else:
                    _log.warning(
                        "scheduled send #%s failed (attempt %d/%d): %s — "
                        "will retry",
                        r["id"], attempts, self.SCHEDULER_MAX_ATTEMPTS, e,
                    )
                continue
            await self.bot.db.mark_announcement_fired(r["id"])

    @scheduler.before_loop
    async def _before_scheduler(self) -> None:
        await self.bot.wait_until_ready()

    # ------------------------------------------------------------------
    #   /admin_health
    # ------------------------------------------------------------------
    @app_commands.command(
        name="admin_health",
        description="حالة البوت (uptime, latency, DB size, الأسئلة)",
    )
    @app_commands.default_permissions(manage_guild=True)
    async def health(self, interaction: discord.Interaction):
        if not _is_admin_or_mod(interaction):
            await interaction.response.send_message("🚫 ليست لديك صلاحية.", ephemeral=True)
            return
        uptime = time.time() - self._started_at
        d, rem = divmod(int(uptime), 86400)
        h, rem = divmod(rem, 3600)
        m, s = divmod(rem, 60)
        uptime_str = (
            f"{d}d {h}h {m}m {s}s" if d else
            f"{h}h {m}m {s}s" if h else
            f"{m}m {s}s"
        )
        try:
            db_bytes = await self.bot.db.db_size_bytes()
        except Exception:
            db_bytes = 0
        latency_ms = int(self.bot.latency * 1000) if self.bot.latency >= 0 else -1
        pending_sched = len(await self.bot.db.list_pending_announcements())
        embed = discord.Embed(
            title="🩺 حالة البوت",
            color=COLORS.get("success", 0x2ECC71),
        )
        embed.add_field(name="Uptime", value=uptime_str, inline=True)
        embed.add_field(name="Latency", value=f"{latency_ms} ms", inline=True)
        embed.add_field(
            name="DB size",
            value=f"{db_bytes / (1024 * 1024):.2f} MiB",
            inline=True,
        )
        embed.add_field(
            name="الأسئلة (مجموع)",
            value=str(qbank.total()),
            inline=True,
        )
        embed.add_field(
            name="أسئلة الإدارة",
            value=str(len(qbank.ADMIN_QUESTIONS)),
            inline=True,
        )
        embed.add_field(name="إعلانات مجدولة", value=str(pending_sched), inline=True)
        embed.add_field(
            name="Cogs",
            value=str(len(self.bot.cogs)),
            inline=True,
        )
        embed.set_footer(
            text=f"بدأ التشغيل: {_dt.datetime.fromtimestamp(self._started_at).isoformat(timespec='seconds')}"
        )
        await interaction.response.send_message(embed=embed, ephemeral=True)


async def setup(bot: commands.Bot):
    await bot.add_cog(AdminToolsCog(bot))
