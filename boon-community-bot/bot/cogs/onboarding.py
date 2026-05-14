"""Guided onboarding interview for new members.

Flow (per-member private channel; arabic only):
  1. Member joins → bot creates a private text channel under the
     `🚪 onboarding` category, named `welcome-{username}`. Only the new
     member, admins, moderators, helpers and the bot can see it.
  2. Bot posts an Arabic welcome message with a `[ابدأ]` button.
  3. Member is walked through 4 short steps:
       (a) anti-bot: randomised single-digit arithmetic, 4 buttons
       (b) nickname: a modal text input (skippable)
       (c) experience tier: a single-select dropdown
       (d) interests: a multi-select dropdown (skippable)
  4. On completion the bot:
       • removes @unverified, adds @member
       • adds any chosen interest roles
       • applies the chosen nickname (sanitised)
       • generates a welcome card and posts it in #general
       • DMs the member a personalised quickstart guide
       • deletes the private onboarding channel
       • logs the result to #admin-actions
       • appends an analytics record to `onboarding_state.json`

Persistence:
  Per-member state lives in `onboarding_state.json` next to the bot's
  working directory. We persist enough state to:
    • resume an in-progress onboarding across bot restarts
    • run the 24h inactivity reminder + 7d kick task
    • answer `/onboarding-stats` from history

Anti-raid:
  A rolling deque of join timestamps is kept in memory. If 5+ joins land
  inside a 60s window, the cog enters `raid` mode: new joiners do NOT
  get a per-member channel; instead the bot pings the admin team in
  #admin-actions and leaves the member at @unverified until manually
  cleared via `/verify-member` or until the burst subsides.

Admin commands:
  /verify-member @user   — owner/admin: skip onboarding, grant @member
  /onboarding-stats      — owner/admin: summary of last 7/30 days

Retroactive:
  The persistent button `onboarding:start` posted in #welcome lets
  already-joined `@unverified` members spawn an onboarding channel on
  demand. This is what `welcome.py` now uses by default.
"""

from __future__ import annotations

import asyncio
import io
import json
import logging
import random
import re
import time
from collections import deque
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import aiohttp
import discord
from discord import app_commands
from discord.ext import commands, tasks

from bot.welcome_card import render as render_welcome_card

log = logging.getLogger("boon-bot.onboarding")

STATE_FILENAME = "onboarding_state.json"
CATEGORY_KEY = "onboarding"
CATEGORY_NAME = "🚪 onboarding"

# Step keys used inside per-member state["step"].
STEP_AWAITING_START = "awaiting_start"
STEP_CAPTCHA = "captcha"
STEP_NICKNAME = "nickname"
STEP_EXPERIENCE = "experience"
STEP_INTERESTS = "interests"
STEP_DONE = "done"
# Member exhausted the captcha retry budget. They stay parked here
# (still @unverified) until an admin clears them via /verify-member or
# the 7-day inactivity-kick removes them.
STEP_LOCKED = "locked"

# Anti-raid parameters.
RAID_WINDOW_S = 60
RAID_THRESHOLD = 5

# Inactivity thresholds.
REMIND_AFTER_H = 24
KICK_AFTER_DAYS = 7

# Maximum nickname length Discord accepts.
MAX_NICK = 32

# Custom-id prefix used by every onboarding button / select. Persistent
# views are routed by Discord back to the cog based on this prefix.
CID = "onboarding:"

EXPERIENCE_LEVELS: list[tuple[str, str, str]] = [
    # (key, label, tagline shown on the welcome card)
    ("newcomer",   "🟢 جديد بالكامل (لم أجرّب alitravians)", "مستعدّون لمساعدتك في خطواتك الأولى"),
    ("user",       "🟡 مستخدم عادي (أستخدم alitravians)",      "أهلاً بك في عائلة المستخدمين"),
    ("developer",  "🔵 مطوّر (أصنع plugins / themes)",         "شريك جديد لمجتمع التطوير"),
    ("contributor","🟣 مساهم سابق / مختبِر",                  "نشكرك على دعمك المتواصل"),
]

INTERESTS: list[tuple[str, str, str]] = [
    # (role_key in server_config["roles"], label, emoji)
    ("interest_releases",     "إشعارات الإصدارات",      "🔔"),
    ("interest_tech",         "نقاشات تقنية",          "💬"),
    ("interest_install_help", "مساعدة في التثبيت",      "🆘"),
    ("interest_bug_reports",  "تقارير الأخطاء",         "🐛"),
    ("interest_features",     "طلبات الميزات",          "💡"),
    ("interest_translate",    "ترجمة وتوطين",          "🌐"),
]


# ───────────────────────── state ─────────────────────────────────────────


@dataclass
class MemberState:
    user_id: int
    channel_id: int | None = None
    started_at: float = field(default_factory=time.time)
    completed_at: float | None = None
    step: str = STEP_AWAITING_START
    captcha_answer: int | None = None
    captcha_a: int = 0
    captcha_b: int = 0
    nickname: str | None = None
    experience: str | None = None
    interests: list[str] = field(default_factory=list)
    reminded_at: float | None = None
    failed_captcha: int = 0

    def to_json(self) -> dict[str, Any]:
        return self.__dict__.copy()

    @classmethod
    def from_json(cls, d: dict[str, Any]) -> "MemberState":
        return cls(
            user_id=int(d["user_id"]),
            channel_id=int(d["channel_id"]) if d.get("channel_id") else None,
            started_at=float(d.get("started_at") or time.time()),
            completed_at=float(d["completed_at"]) if d.get("completed_at") else None,
            step=str(d.get("step", STEP_AWAITING_START)),
            captcha_answer=int(d["captcha_answer"]) if d.get("captcha_answer") is not None else None,
            captcha_a=int(d.get("captcha_a", 0)),
            captcha_b=int(d.get("captcha_b", 0)),
            nickname=d.get("nickname"),
            experience=d.get("experience"),
            interests=list(d.get("interests") or []),
            reminded_at=float(d["reminded_at"]) if d.get("reminded_at") else None,
            failed_captcha=int(d.get("failed_captcha", 0)),
        )


class _Store:
    """Disk-backed dict[user_id, MemberState] + an in-memory append-only log."""

    def __init__(self, path: Path) -> None:
        self.path = path
        self.active: dict[int, MemberState] = {}
        self.completions: list[dict[str, Any]] = []
        self._lock = asyncio.Lock()
        self._load()

    def _load(self) -> None:
        if not self.path.exists():
            return
        try:
            blob = json.loads(self.path.read_text(encoding="utf-8"))
        except Exception as exc:  # noqa: BLE001
            log.warning("could not parse %s, starting empty: %s", self.path, exc)
            return
        for uid, raw in (blob.get("active") or {}).items():
            try:
                self.active[int(uid)] = MemberState.from_json(raw)
            except Exception as exc:  # noqa: BLE001
                log.warning("bad state for user %s: %s", uid, exc)
        self.completions = list(blob.get("completions") or [])

    async def save(self) -> None:
        async with self._lock:
            payload = {
                "active": {str(uid): s.to_json() for uid, s in self.active.items()},
                "completions": self.completions[-2000:],  # keep last 2000
            }
            self.path.write_text(
                json.dumps(payload, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )

    def get(self, uid: int) -> MemberState | None:
        return self.active.get(uid)

    def put(self, state: MemberState) -> None:
        self.active[state.user_id] = state

    def drop(self, uid: int) -> None:
        self.active.pop(uid, None)

    def record_completion(self, state: MemberState) -> None:
        self.completions.append({
            "user_id": state.user_id,
            "completed_at": state.completed_at or time.time(),
            "experience": state.experience,
            "interests": list(state.interests),
            "duration_s": (state.completed_at or time.time()) - state.started_at,
        })


# ─────────────────────────── helpers ─────────────────────────────────────


def _sanitise_nickname(raw: str) -> str | None:
    raw = raw.strip()
    if not raw:
        return None
    # Strip control chars; collapse whitespace.
    raw = re.sub(r"\s+", " ", raw)
    raw = re.sub(r"[^\w \u0600-\u06FF\u0750-\u077F\u200c\u200d-]", "", raw)
    raw = raw[:MAX_NICK].strip()
    return raw or None


def _safe_channel_name(member: discord.Member) -> str:
    # Discord lowercases server-side and bans many chars. Keep it simple.
    base = re.sub(r"[^a-z0-9-]+", "-", member.name.lower())
    base = base.strip("-") or str(member.id)
    return f"welcome-{base[:80]}"


# ─────────────────────────── view layer ──────────────────────────────────


class _StartButton(discord.ui.Button["_StartView"]):
    def __init__(self) -> None:
        super().__init__(
            style=discord.ButtonStyle.success,
            label="ابدأ",
            emoji="🚀",
            custom_id=f"{CID}start",
        )

    async def callback(self, interaction: discord.Interaction) -> None:
        cog: Onboarding | None = interaction.client.get_cog("Onboarding")  # type: ignore[assignment]
        if cog is None:
            await interaction.response.send_message("النظام مؤقتاً غير متاح.", ephemeral=True)
            return
        await cog.handle_start(interaction)


class _StartView(discord.ui.View):
    def __init__(self) -> None:
        super().__init__(timeout=None)
        self.add_item(_StartButton())


class _RetroactiveButton(discord.ui.Button["_RetroactiveView"]):
    """Posted in #welcome; lets pre-existing unverified members opt in."""

    def __init__(self) -> None:
        super().__init__(
            style=discord.ButtonStyle.primary,
            label="ابدأ التحقّق الجديد",
            emoji="📝",
            custom_id=f"{CID}retro",
        )

    async def callback(self, interaction: discord.Interaction) -> None:
        cog: Onboarding | None = interaction.client.get_cog("Onboarding")  # type: ignore[assignment]
        if cog is None:
            await interaction.response.send_message("النظام مؤقتاً غير متاح.", ephemeral=True)
            return
        await cog.handle_retroactive_start(interaction)


class _RetroactiveView(discord.ui.View):
    def __init__(self) -> None:
        super().__init__(timeout=None)
        self.add_item(_RetroactiveButton())


class _CaptchaButton(discord.ui.Button["_CaptchaView"]):
    """Captcha answer button.

    Routing notes — read before changing:
      • The custom_id is `onboarding:captcha:{position}:{value}` where
        ``position`` and ``value`` are both randomised per question.
      • We DO NOT override ``callback`` here. Click handling lives in
        ``Onboarding.on_interaction`` (the cog-level dispatcher), which
        decodes the value out of the custom_id and advances state.
      • The captcha view is per-question, never registered via
        ``bot.add_view`` — so after a bot restart no view-store lookup
        ever happens and only ``on_interaction`` fires (clean path).
      • In the same session, discord.py's view store may also dispatch
        to the base-class no-op callback; that's harmless because the
        no-op doesn't consume the interaction response slot, leaving
        ``on_interaction`` free to respond.
    """

    def __init__(self, value: int, position: int) -> None:
        super().__init__(
            style=discord.ButtonStyle.secondary,
            label=str(value),
            custom_id=f"{CID}captcha:{position}:{value}",
        )
        self.value = value


class _CaptchaView(discord.ui.View):
    def __init__(self, correct: int, decoys: list[int]) -> None:
        super().__init__(timeout=None)
        opts = decoys + [correct]
        random.shuffle(opts)
        for i, v in enumerate(opts):
            self.add_item(_CaptchaButton(v, i))


class _NicknameModal(discord.ui.Modal):
    nickname_input: discord.ui.TextInput

    def __init__(self) -> None:
        super().__init__(title="اختر اسمك في السيرفر", custom_id=f"{CID}nickmodal")
        self.nickname_input = discord.ui.TextInput(
            label="ما اللقب الذي تريد أن نناديك به؟",
            placeholder="مثل: علي، Sayed, أبو محمد …",
            min_length=0,
            max_length=MAX_NICK,
            required=False,
            style=discord.TextStyle.short,
        )
        self.add_item(self.nickname_input)

    async def on_submit(self, interaction: discord.Interaction) -> None:
        cog: Onboarding | None = interaction.client.get_cog("Onboarding")  # type: ignore[assignment]
        if cog is None:
            await interaction.response.send_message("النظام مؤقتاً غير متاح.", ephemeral=True)
            return
        await cog.handle_nickname(interaction, str(self.nickname_input.value))


class _NicknameTriggerView(discord.ui.View):
    def __init__(self) -> None:
        super().__init__(timeout=None)
        self.add_item(_NicknameOpenButton())
        self.add_item(_NicknameSkipButton())


class _NicknameOpenButton(discord.ui.Button["_NicknameTriggerView"]):
    def __init__(self) -> None:
        super().__init__(
            style=discord.ButtonStyle.primary,
            label="اكتب اسمك",
            emoji="✍️",
            custom_id=f"{CID}nickopen",
        )

    async def callback(self, interaction: discord.Interaction) -> None:
        await interaction.response.send_modal(_NicknameModal())


class _NicknameSkipButton(discord.ui.Button["_NicknameTriggerView"]):
    def __init__(self) -> None:
        super().__init__(
            style=discord.ButtonStyle.secondary,
            label="تخطّى",
            custom_id=f"{CID}nickskip",
        )

    async def callback(self, interaction: discord.Interaction) -> None:
        cog: Onboarding | None = interaction.client.get_cog("Onboarding")  # type: ignore[assignment]
        if cog is None:
            await interaction.response.send_message("النظام مؤقتاً غير متاح.", ephemeral=True)
            return
        await cog.handle_nickname(interaction, "")


class _ExperienceSelect(discord.ui.Select["_ExperienceView"]):
    def __init__(self) -> None:
        options = [
            discord.SelectOption(label=label, value=key)
            for key, label, _tag in EXPERIENCE_LEVELS
        ]
        super().__init__(
            placeholder="اختر مستواك",
            min_values=1,
            max_values=1,
            options=options,
            custom_id=f"{CID}experience",
        )

    async def callback(self, interaction: discord.Interaction) -> None:
        cog: Onboarding | None = interaction.client.get_cog("Onboarding")  # type: ignore[assignment]
        if cog is None:
            await interaction.response.send_message("النظام مؤقتاً غير متاح.", ephemeral=True)
            return
        await cog.handle_experience(interaction, self.values[0])


class _ExperienceView(discord.ui.View):
    def __init__(self) -> None:
        super().__init__(timeout=None)
        self.add_item(_ExperienceSelect())


class _InterestsSelect(discord.ui.Select["_InterestsView"]):
    def __init__(self) -> None:
        options = [
            discord.SelectOption(
                label=label,
                value=key,
                emoji=emoji,
            )
            for key, label, emoji in INTERESTS
        ]
        super().__init__(
            placeholder="اختر اهتماماتك (يمكن أكثر من واحد، أو لا شيء)",
            min_values=0,
            max_values=len(options),
            options=options,
            custom_id=f"{CID}interests",
        )

    async def callback(self, interaction: discord.Interaction) -> None:
        cog: Onboarding | None = interaction.client.get_cog("Onboarding")  # type: ignore[assignment]
        if cog is None:
            await interaction.response.send_message("النظام مؤقتاً غير متاح.", ephemeral=True)
            return
        await cog.handle_interests(interaction, list(self.values))


class _InterestsFinishButton(discord.ui.Button["_InterestsView"]):
    def __init__(self) -> None:
        super().__init__(
            style=discord.ButtonStyle.success,
            label="إنهاء",
            emoji="✅",
            custom_id=f"{CID}interests_finish",
        )

    async def callback(self, interaction: discord.Interaction) -> None:
        cog: Onboarding | None = interaction.client.get_cog("Onboarding")  # type: ignore[assignment]
        if cog is None:
            await interaction.response.send_message("النظام مؤقتاً غير متاح.", ephemeral=True)
            return
        await cog.handle_interests_finish(interaction)


class _InterestsView(discord.ui.View):
    def __init__(self) -> None:
        super().__init__(timeout=None)
        self.add_item(_InterestsSelect())
        self.add_item(_InterestsFinishButton())


# ─────────────────────────── the cog ─────────────────────────────────────


class Onboarding(commands.Cog):
    def __init__(self, bot: commands.Bot) -> None:
        self.bot = bot
        # The bot has no persistent volume on Fly.io (yet), so this file is
        # only durable within a container's lifetime. We additionally rebuild
        # active state from Discord itself in `_recover_from_channels` so a
        # restart never strands a member mid-flow.
        cfg_path = Path(bot.settings.server_config_path)  # type: ignore[attr-defined]
        state_path = cfg_path.parent / STATE_FILENAME
        self.store = _Store(state_path)
        self.join_window: deque[float] = deque()
        self.raid_active: bool = False
        self.session: aiohttp.ClientSession | None = None

    # ── lifecycle ────────────────────────────────────────────────────────

    def cog_unload(self) -> None:
        self.inactivity_sweep.cancel()
        if self.session is not None and not self.session.closed:
            asyncio.create_task(self.session.close())

    @commands.Cog.listener()
    async def on_ready(self) -> None:
        if getattr(self.bot, "_onboarding_views_registered", False):
            return
        self.bot.add_view(_StartView())
        self.bot.add_view(_RetroactiveView())
        self.bot.add_view(_NicknameTriggerView())
        self.bot.add_view(_ExperienceView())
        self.bot.add_view(_InterestsView())
        # Captcha view is per-question and randomised; we register a no-op
        # listener via `on_interaction` instead (see `_dispatch_captcha`).
        self.bot._onboarding_views_registered = True  # type: ignore[attr-defined]
        log.info("registered persistent onboarding views")
        self.session = aiohttp.ClientSession()
        # Rebuild active state from existing onboarding channels so a deploy
        # doesn't strand mid-flow members. Each surviving channel becomes a
        # fresh STEP_AWAITING_START state — the user just clicks ابدأ again.
        await self._recover_from_channels()
        if not self.inactivity_sweep.is_running():
            self.inactivity_sweep.start()
        # Startup permission audit: surface guild-side misconfiguration
        # (missing perms, role-hierarchy too low, missing roles/channels)
        # to #admin-actions on every boot so the owner sees it without
        # having to dig through Fly logs. Best-effort — never crashes
        # the cog if the audit itself fails.
        try:
            await self._audit_permissions_at_startup()
        except Exception:  # noqa: BLE001
            log.exception("startup permission audit failed")

    async def _audit_permissions_at_startup(self) -> None:
        """Log + post-to-admin-actions any guild-side misconfiguration.

        Checks (per guild the bot is in):
          1. `bot.guild_permissions` contains every perm the cog needs.
          2. Bot's top role outranks @member, @unverified, all interest
             roles, and the staff roles it might need to overwrite.
          3. All referenced roles/channels in `server_config.json` exist.

        Each issue is logged at WARNING and consolidated into a single
        admin-channel message so the staff can fix them.
        """
        cfg = self._cfg() or {}
        for guild in self.bot.guilds:
            issues: list[str] = []
            me = guild.me
            if me is None:
                continue
            required_perms = {
                "manage_channels": "إنشاء قنوات الـ onboarding الخاصة",
                "manage_roles": "تبديل @unverified → @member و توزيع الأدوار",
                "manage_nicknames": "ضبط nickname العضو بعد التحقّق",
                "view_channel": "رؤية القنوات",
                "send_messages": "إرسال الرسائل في القنوات",
                "embed_links": "إرسال embeds (بطاقات الترحيب، captcha)",
                "attach_files": "رفع صورة بطاقة الترحيب",
                "read_message_history": "قراءة الرسائل القديمة (recovery)",
            }
            perms = me.guild_permissions
            for perm, why in required_perms.items():
                if not getattr(perms, perm, False):
                    issues.append(f"❌ صلاحية ناقصة: **{perm}** ({why})")
            # Role hierarchy: bot.top_role must be above every role the
            # bot needs to assign / overwrite. `top_role` may equal
            # @everyone in a misconfigured guild (no managed role
            # uploaded yet) — in that case every comparison fails, which
            # is correct (we want to flag it).
            top = me.top_role
            checked_role_keys = [
                "member",
                "unverified",
                "interest_releases",
                "interest_tech",
                "interest_install_help",
                "interest_bug_reports",
                "interest_features",
                "interest_translate",
                "tester",
                "contributor",
                "translator",
                "designer",
            ]
            for key in checked_role_keys:
                rid_raw = cfg.get("roles", {}).get(key)
                if not rid_raw:
                    continue  # missing-role check below handles it
                role = guild.get_role(int(rid_raw))
                if role is None:
                    issues.append(f"❌ دور غير موجود: `{key}` (id={rid_raw})")
                    continue
                if role.position >= top.position:
                    issues.append(
                        f"❌ ترتيب الأدوار: دور البوت ({top.name} @ {top.position}) ≤ "
                        f"@{role.name} (@ {role.position}) — ارفع دور البوت فوق @{role.name}"
                    )
            checked_channel_keys = [
                "welcome",
                "general",
                "log_admin_actions",
                "rules",
                "announcements",
            ]
            for key in checked_channel_keys:
                cid_raw = cfg.get("channels", {}).get(key)
                if not cid_raw:
                    issues.append(f"⚠️ قناة غير مهيّأة في server_config.json: `{key}`")
                    continue
                if guild.get_channel(int(cid_raw)) is None:
                    issues.append(f"❌ قناة غير موجودة: `{key}` (id={cid_raw})")
            if issues:
                log.warning(
                    "permission audit found %d issue(s) in guild %s",
                    len(issues), guild.name,
                )
                body = "**تدقيق صلاحيات البوت عند الإقلاع — توجد مشاكل:**\n\n" + "\n".join(issues)
                body += (
                    "\n\nأصلح هذه المشاكل من Server Settings → Roles / Channels، "
                    "ثم أعد تشغيل البوت."
                )
                await self._log_admin(guild, body[:1990])
            else:
                log.info("permission audit clean for guild %s", guild.name)

    # ── join event ───────────────────────────────────────────────────────

    def _decay_join_window(self, now: float | None = None) -> None:
        """Drop join timestamps that have aged out of the raid window.

        Called both from ``on_member_join`` (most paths) and from the
        periodic ``inactivity_sweep`` so the deque is pruned even on a
        completely quiet server — otherwise a raid that triggers and is
        followed by zero joins would leave ``raid_active=True`` forever.
        """
        if now is None:
            now = time.time()
        while self.join_window and now - self.join_window[0] > RAID_WINDOW_S:
            self.join_window.popleft()

    async def _maybe_clear_raid(self, guild: discord.Guild | None) -> None:
        """If the join window has drained below the threshold, exit raid mode."""
        if not self.raid_active:
            return
        if len(self.join_window) >= RAID_THRESHOLD:
            return
        self.raid_active = False
        if guild is not None:
            await self._log_admin(
                guild,
                "🟢 موجة الانضمام هدأت — الـ onboarding يعمل بشكل طبيعي.",
            )

    async def _assign_unverified(self, member: discord.Member) -> None:
        """Defensive @unverified assignment.

        Runs on every join (including during a raid burst, where we skip
        the per-member channel spawn). Without this, members landing
        during a raid would keep the default @everyone perms and could
        see/post in every open channel until an admin intervened.
        Idempotent: silently returns if the role is missing or already on
        the member.
        """
        rid = self._role_id("unverified")
        if not rid:
            return
        role = member.guild.get_role(rid)
        if role is None or role in member.roles:
            return
        try:
            await member.add_roles(role, reason="new joiner -> onboarding")
        except (discord.Forbidden, discord.HTTPException) as exc:
            log.info("cannot assign @unverified to %s: %s", member, exc)

    @commands.Cog.listener()
    async def on_member_join(self, member: discord.Member) -> None:
        if member.bot:
            return
        # Lock the member down FIRST — even if a raid burst is happening
        # we still want the @unverified role on them so they can't see
        # the rest of the server until an admin processes the burst.
        await self._assign_unverified(member)

        now = time.time()
        self.join_window.append(now)
        self._decay_join_window(now)
        if len(self.join_window) >= RAID_THRESHOLD:
            if not self.raid_active:
                self.raid_active = True
                await self._raid_alert(member.guild, len(self.join_window))
            return  # Do not spawn an onboarding channel during a raid burst.
        # Out of raid mode: cool-down once the burst has drained.
        await self._maybe_clear_raid(member.guild)

        await self._spawn_channel_for(member)

    # ── public entry points used by views/modals ─────────────────────────

    async def handle_start(self, interaction: discord.Interaction) -> None:
        state = self.store.get(interaction.user.id)
        if state is None or state.step != STEP_AWAITING_START:
            await interaction.response.send_message(
                "هذا الزر لا يخصّك أو انتهت صلاحيته.",
                ephemeral=True,
            )
            return
        state.step = STEP_CAPTCHA
        await self.store.save()
        await self._post_captcha(interaction, state)

    async def handle_retroactive_start(self, interaction: discord.Interaction) -> None:
        guild = interaction.guild
        if guild is None or not isinstance(interaction.user, discord.Member):
            await interaction.response.send_message("هذا الزر داخل السيرفر فقط.", ephemeral=True)
            return
        member = interaction.user
        # Already verified? Nothing to do.
        member_role_id = self._role_id("member")
        if member_role_id and guild.get_role(member_role_id) in member.roles:
            await interaction.response.send_message(
                "أنت متحقّق بالفعل — لا حاجة لإعادة الـ onboarding.",
                ephemeral=True,
            )
            return
        existing = self.store.get(member.id)
        if existing and existing.channel_id and guild.get_channel(existing.channel_id):
            await interaction.response.send_message(
                f"الـ onboarding الخاص بك جاهز هنا: <#{existing.channel_id}>",
                ephemeral=True,
            )
            return
        await interaction.response.defer(ephemeral=True, thinking=True)
        ch = await self._spawn_channel_for(member)
        if ch is None:
            await interaction.followup.send(
                "تعذّر إنشاء قناة الـ onboarding. أبلغ admin.",
                ephemeral=True,
            )
            return
        await interaction.followup.send(
            f"تفضّل، الـ onboarding الخاص بك هنا: {ch.mention}",
            ephemeral=True,
        )

    async def handle_nickname(self, interaction: discord.Interaction, raw: str) -> None:
        state = self.store.get(interaction.user.id)
        if state is None or state.step != STEP_NICKNAME:
            await interaction.response.send_message("ليس وقت هذه الخطوة.", ephemeral=True)
            return
        state.nickname = _sanitise_nickname(raw)
        state.step = STEP_EXPERIENCE
        await self.store.save()
        await self._post_experience(interaction, state)

    async def handle_experience(self, interaction: discord.Interaction, value: str) -> None:
        state = self.store.get(interaction.user.id)
        if state is None or state.step != STEP_EXPERIENCE:
            await interaction.response.send_message("ليس وقت هذه الخطوة.", ephemeral=True)
            return
        state.experience = value
        state.step = STEP_INTERESTS
        await self.store.save()
        await self._post_interests(interaction, state)

    async def handle_interests(self, interaction: discord.Interaction, values: list[str]) -> None:
        state = self.store.get(interaction.user.id)
        if state is None or state.step != STEP_INTERESTS:
            await interaction.response.send_message("ليس وقت هذه الخطوة.", ephemeral=True)
            return
        state.interests = values
        await self.store.save()
        # Acknowledge the selection without advancing — the user still must
        # press "إنهاء". Ephemerally confirm what's selected.
        if values:
            labels = [lbl for k, lbl, _e in INTERESTS if k in values]
            await interaction.response.send_message(
                "تم اختيار: " + "، ".join(labels) + "\nاضغط **إنهاء** لإتمام التحقّق.",
                ephemeral=True,
            )
        else:
            await interaction.response.send_message(
                "بدون اهتمامات. اضغط **إنهاء** للمتابعة.",
                ephemeral=True,
            )

    async def handle_interests_finish(self, interaction: discord.Interaction) -> None:
        state = self.store.get(interaction.user.id)
        if state is None or state.step != STEP_INTERESTS:
            await interaction.response.send_message("ليس وقت هذه الخطوة.", ephemeral=True)
            return
        await interaction.response.defer(ephemeral=True, thinking=True)
        ok = await self._complete(interaction.guild, interaction.user, state)
        if ok:
            await interaction.followup.send(
                "🎉 اكتمل تحقّقك! ستفتح لك القنوات بعد لحظات. سأبعث لك رسالة خاصة فيها كل ما تحتاجه.",
                ephemeral=True,
            )
        else:
            await interaction.followup.send(
                "حدث خطأ أثناء إنهاء التحقّق. أبلغ admin.",
                ephemeral=True,
            )

    # ── captcha dispatcher (custom_id is per-question) ────────────────────

    @commands.Cog.listener()
    async def on_interaction(self, interaction: discord.Interaction) -> None:
        if interaction.type != discord.InteractionType.component:
            return
        cid = (interaction.data or {}).get("custom_id") or ""
        if not cid.startswith(f"{CID}captcha:"):
            return
        # custom_id format: "onboarding:captcha:{position}:{value}" — 4
        # colon-separated segments. The previous version used
        # cid.split(":", 2) which capped output at 3 elements, joining
        # position+value into "{pos}:{val}" and breaking int() parsing
        # for every captcha click. rsplit from the right peels the value
        # and position correctly regardless of how many colons are in
        # the prefix.
        try:
            _prefix, _pos, value_raw = cid.rsplit(":", 2)
            chosen = int(value_raw)
        except Exception:
            return
        state = self.store.get(interaction.user.id)
        if state is None or state.captcha_answer is None:
            await interaction.response.send_message("هذا الزر لا يخصّك.", ephemeral=True)
            return
        if state.step == STEP_LOCKED:
            # Quietly absorb post-lockout clicks — no admin log, no state
            # mutation. The user already got the lockout message once.
            await interaction.response.send_message(
                "تم تعليق تحقّقك — راسل أحد الـ admins.",
                ephemeral=True,
            )
            return
        if state.step != STEP_CAPTCHA:
            await interaction.response.send_message("هذا الزر لا يخصّك.", ephemeral=True)
            return
        if chosen != state.captcha_answer:
            state.failed_captcha += 1
            if state.failed_captcha >= 3:
                # Hard gate: park state in LOCKED so subsequent button
                # clicks short-circuit before reaching this branch (avoids
                # admin-log spam if the user keeps mashing buttons after
                # they're out of attempts).
                state.step = STEP_LOCKED
                await self.store.save()
                await interaction.response.send_message(
                    "⚠️ بلغت الحد الأقصى للمحاولات (٣). "
                    "تم تعليق تحقّقك — راسل أحد الـ admins ليفتحوه لك.",
                    ephemeral=True,
                )
                if interaction.guild:
                    await self._log_admin(
                        interaction.guild,
                        f"⚠️ <@{interaction.user.id}> فشل ٣ مرات في anti-bot captcha — تم تعليق تحقّقه (`/verify-member` للتجاوز).",
                    )
                return
            await self.store.save()
            await interaction.response.send_message(
                f"إجابة خاطئة. حاول مرّة أخرى ({3 - state.failed_captcha} محاولة متبقية).",
                ephemeral=True,
            )
            return
        state.step = STEP_NICKNAME
        await self.store.save()
        await self._post_nickname(interaction, state)

    # ── step posters ─────────────────────────────────────────────────────

    async def _post_captcha(self, interaction: discord.Interaction, state: MemberState) -> None:
        a = random.randint(2, 9)
        b = random.randint(2, 9)
        ans = a + b
        decoys = list({ans + d for d in (-2, -1, 1, 2)} - {ans})
        decoys = random.sample(decoys, 3)
        state.captcha_a = a
        state.captcha_b = b
        state.captcha_answer = ans
        await self.store.save()
        embed = discord.Embed(
            title="🛡️ تأكيد بشري",
            description=f"للتأكّد أنك لست bot، اختر الإجابة الصحيحة:\n\n**{a} + {b} = ؟**",
            color=0x00FF88,
        )
        await interaction.response.edit_message(embed=embed, view=_CaptchaView(ans, decoys))

    async def _post_nickname(self, interaction: discord.Interaction, state: MemberState) -> None:
        embed = discord.Embed(
            title="✍️ ما اللقب الذي تريد أن نناديك به؟",
            description=(
                "اضغط **اكتب اسمك** لاختيار لقب يظهر بدلاً من اسم Discord الخاص بك "
                "داخل هذا السيرفر، أو **تخطّى** للإبقاء على اسمك الحالي."
            ),
            color=0x00FF88,
        )
        await interaction.response.edit_message(embed=embed, view=_NicknameTriggerView())

    async def _post_experience(self, interaction: discord.Interaction, state: MemberState) -> None:
        embed = discord.Embed(
            title="🎯 ما مستوى خبرتك مع alitravians؟",
            description="هذا يساعدنا في توجيهك للقنوات المناسبة لك.",
            color=0x00FF88,
        )
        await interaction.response.edit_message(embed=embed, view=_ExperienceView())

    async def _post_interests(self, interaction: discord.Interaction, state: MemberState) -> None:
        embed = discord.Embed(
            title="🔔 ما يهمّك في السيرفر؟",
            description=(
                "اختر مواضيع تحبّ أن يتم mentionك فيها (يمكن أكثر من واحد). "
                "**هذه الأدوار للإشعارات فقط — لا تغيّر صلاحياتك.** ثم اضغط **إنهاء**."
            ),
            color=0x00FF88,
        )
        await interaction.response.edit_message(embed=embed, view=_InterestsView())

    # ── completion / channel teardown ────────────────────────────────────

    async def _complete(
        self,
        guild: discord.Guild | None,
        user: discord.User | discord.Member,
        state: MemberState,
    ) -> bool:
        if guild is None or not isinstance(user, discord.Member):
            log.warning("complete called without guild/member context")
            return False
        member = user

        unverified_id = self._role_id("unverified")
        member_role_id = self._role_id("member")
        unverified = guild.get_role(unverified_id) if unverified_id else None
        member_role = guild.get_role(member_role_id) if member_role_id else None
        if not (unverified and member_role):
            log.warning("@unverified / @member roles missing; aborting completion")
            return False

        roles_to_add: list[discord.Role] = [member_role]
        for key in state.interests:
            rid = self._role_id(key)
            r = guild.get_role(rid) if rid else None
            if r:
                roles_to_add.append(r)

        try:
            await member.remove_roles(unverified, reason="onboarding complete")
            await member.add_roles(*roles_to_add, reason="onboarding complete")
        except discord.Forbidden:
            log.warning("forbidden when promoting %s", member)
            return False
        except discord.HTTPException as exc:
            log.warning("HTTP error promoting %s: %s", member, exc)
            return False

        if state.nickname:
            try:
                await member.edit(nick=state.nickname, reason="onboarding nickname")
            except (discord.Forbidden, discord.HTTPException) as exc:
                log.info("cannot set nickname for %s: %s", member, exc)

        state.completed_at = time.time()
        state.step = STEP_DONE
        self.store.record_completion(state)
        await self.store.save()

        await self._post_welcome_card(guild, member, state)
        await self._send_dm_quickstart(guild, member, state)
        await self._log_admin(
            guild,
            f"🎉 <@{member.id}> ({member}) أتمّ الـ onboarding — "
            f"experience={state.experience}, interests={state.interests}",
        )
        # Drop active state BEFORE the deferred channel deletion. Otherwise
        # a bot restart during the 20s grace window would leave the user
        # with @member but their state still parked in ``store.active``
        # (would later be picked up by inactivity_sweep and possibly
        # reminded/kicked despite being fully onboarded).
        self.store.drop(member.id)
        await self.store.save()
        # Fire-and-forget the channel deletion so we don't keep the
        # interaction handler alive for 20 seconds.
        asyncio.create_task(
            self._delete_onboarding_channel(guild, state, delay_s=20)
        )
        return True

    async def _post_welcome_card(
        self,
        guild: discord.Guild,
        member: discord.Member,
        state: MemberState,
    ) -> None:
        # The welcome card announces a member who just finished the guided
        # onboarding (captcha + nickname + experience + interests). It
        # belongs in #welcome — the canonical "new joiners" channel — not
        # in #general (the open-chat room). Posting the celebration to
        # #general was leaking new-member announcements into the active
        # chat and made the bot feel disorganised. Falls back to #general
        # only if #welcome isn't configured, so existing deployments don't
        # silently drop the card.
        welcome_id = self._channel_id("welcome")
        ch = guild.get_channel(welcome_id) if welcome_id else None
        if not isinstance(ch, discord.TextChannel):
            fallback_id = self._channel_id("general")
            ch = guild.get_channel(fallback_id) if fallback_id else None
        if not isinstance(ch, discord.TextChannel):
            log.info("no #welcome or #general channel configured; skipping welcome card")
            return
        avatar_bytes: bytes
        try:
            assert self.session is not None
            asset = member.display_avatar.replace(size=256, static_format="png")
            async with self.session.get(asset.url) as resp:
                resp.raise_for_status()
                avatar_bytes = await resp.read()
        except Exception as exc:  # noqa: BLE001
            log.warning("could not fetch avatar for %s: %s", member, exc)
            avatar_bytes = b""

        nickname = state.nickname or member.display_name
        tagline = next(
            (tag for k, _l, tag in EXPERIENCE_LEVELS if k == state.experience),
            "أهلاً بك في عائلتنا",
        )
        member_number = guild.member_count or 0
        try:
            png = render_welcome_card(
                avatar_bytes=avatar_bytes,
                nickname=nickname,
                member_number=member_number,
                tagline=tagline,
            )
        except Exception as exc:  # noqa: BLE001
            log.warning("welcome card render failed: %s", exc)
            return
        try:
            await ch.send(
                content=f"🎉 أهلاً <@{member.id}>! وصلت إلى مجتمع alitravians 🚀",
                file=discord.File(io.BytesIO(png), filename="welcome.png"),
                allowed_mentions=discord.AllowedMentions(users=True),
            )
        except discord.Forbidden:
            log.info("cannot post welcome card in %s", ch.name)

    async def _send_dm_quickstart(
        self,
        guild: discord.Guild,
        member: discord.Member,
        state: MemberState,
    ) -> None:
        cfg = self._cfg() or {}
        channels = cfg.get("channels", {})
        lines: list[str] = [
            f"أهلاً {state.nickname or member.display_name} 👋",
            "",
            "أنت الآن عضو متحقّق في **alitravians community**. هذي قنوات تهمّك:",
            "",
        ]
        suggested: list[tuple[str, str]] = [
            ("rules", "📜 القواعد — اقرأها أوّل شي"),
            ("install_boon", "🛠️ تثبيت alitravians — لكل المنصات"),
            ("faq", "❓ الأسئلة الشائعة"),
            ("choose_roles", "🎯 اختر اهتماماتك (يمكنك إضافة/إزالة الاهتمامات لاحقاً)"),
            ("general", "💬 الدردشة العامة"),
        ]
        if state.experience in ("developer", "contributor"):
            suggested.extend([
                ("plugin_dev", "💻 تطوير الإضافات"),
                ("core_dev", "⚙️ تطوير القلب"),
                ("github_prs", "📝 الـ Pull Requests"),
            ])
        if "interest_install_help" in state.interests:
            suggested.append(("support_boon", "🆘 الدعم العام"))
        if "interest_bug_reports" in state.interests:
            suggested.append(("bug_reports", "🐛 تقارير الأخطاء"))
        if "interest_translate" in state.interests:
            suggested.append(("snippets_js", "🌐 مشاركة الـ snippets والترجمات"))

        seen: set[str] = set()
        for key, label in suggested:
            if key in seen:
                continue
            seen.add(key)
            ch_id = channels.get(key)
            if ch_id:
                lines.append(f"• <#{ch_id}> — {label}")
        lines.extend([
            "",
            "أي وقت تبي مساعدة، استخدم `/report` أو راسل admin.",
            "أهلاً بك في الفريق. ✨",
        ])
        body = "\n".join(lines)
        try:
            await member.send(body)
        except discord.Forbidden:
            log.info("DM closed for %s; quickstart not sent", member)

    async def _delete_onboarding_channel(
        self,
        guild: discord.Guild,
        state: MemberState,
        delay_s: int,
    ) -> None:
        if not state.channel_id:
            return
        ch = guild.get_channel(state.channel_id)
        if not isinstance(ch, discord.TextChannel):
            return
        try:
            await ch.send(
                f"تم بنجاح. سأحذف هذه القناة بعد {delay_s} ثانية. أهلاً بك مجدداً 🎉"
            )
        except discord.HTTPException:
            pass
        await asyncio.sleep(delay_s)
        try:
            await ch.delete(reason="onboarding complete")
        except (discord.Forbidden, discord.HTTPException) as exc:
            log.info("could not delete onboarding channel: %s", exc)

    # ── infrastructure: per-member channel + category ────────────────────

    async def _ensure_category(self, guild: discord.Guild) -> discord.CategoryChannel | None:
        # Look up cached id first; fall back to looking up by name so we don't
        # accidentally re-create the category if a previous run made it but
        # the cached id was lost (e.g. ephemeral filesystem on Fly).
        cfg = self._cfg()
        if cfg is not None:
            cat_id = cfg.get("categories", {}).get(CATEGORY_KEY)
            if cat_id:
                existing = guild.get_channel(int(cat_id))
                if isinstance(existing, discord.CategoryChannel):
                    return existing
        for c in guild.categories:
            if c.name == CATEGORY_NAME:
                self._remember_category(c.id)
                return c
        # Need to create.
        log.info("creating onboarding category in guild %s", guild)
        admin_role = self._role("admin", guild)
        moderator_role = self._role("moderator", guild)
        helper_role = self._role("helper", guild)
        bot_role = guild.me.top_role if guild.me else None

        overwrites: dict[Any, discord.PermissionOverwrite] = {
            guild.default_role: discord.PermissionOverwrite(view_channel=False),
        }
        for r in (admin_role, moderator_role, helper_role, bot_role):
            if r is None:
                continue
            overwrites[r] = discord.PermissionOverwrite(
                view_channel=True,
                send_messages=True,
                read_message_history=True,
                manage_channels=(r == bot_role),
                manage_messages=(r == bot_role),
            )
        try:
            cat = await guild.create_category(
                CATEGORY_NAME,
                overwrites=overwrites,
                reason="auto: onboarding system",
            )
        except discord.Forbidden:
            log.warning("missing perms to create onboarding category")
            return None
        self._remember_category(cat.id)
        return cat

    def _remember_category(self, cat_id: int) -> None:
        """Cache the category id back into the live server_config.

        Mutates ``bot.server_config["categories"][onboarding]`` in place so
        we don't accidentally replace the whole dict (which would wipe
        ``roles`` / ``channels`` keys if the config had been ``None``).
        Disk persistence happens on the next ``scripts/setup_server.py``
        run.
        """
        cfg = self._cfg()
        if cfg is None:
            # server_config.json was missing at startup; we deliberately do
            # NOT replace it with a fresh dict because that would shadow a
            # later legitimate load. The lookup falls back to scanning
            # ``guild.categories`` by name on the next call.
            return
        cfg.setdefault("categories", {})[CATEGORY_KEY] = str(cat_id)

    async def _spawn_channel_for(self, member: discord.Member) -> discord.TextChannel | None:
        guild = member.guild
        # Defence in depth: also assign @unverified here for callers that
        # don't go through ``on_member_join`` (e.g. retroactive opt-in via
        # the #welcome button). ``_assign_unverified`` is idempotent so
        # running it twice in the join path is harmless.
        await self._assign_unverified(member)

        # Re-use an existing channel if state already has one.
        existing_state = self.store.get(member.id)
        if existing_state and existing_state.channel_id:
            ch = guild.get_channel(existing_state.channel_id)
            if isinstance(ch, discord.TextChannel):
                return ch

        cat = await self._ensure_category(guild)
        if cat is None:
            log.warning("no onboarding category; cannot spawn channel for %s", member)
            return None

        # Per-member ALLOW overwrite layered onto the category's @everyone DENY.
        overwrites = dict(cat.overwrites)
        overwrites[member] = discord.PermissionOverwrite(
            view_channel=True,
            send_messages=True,
            read_message_history=True,
            attach_files=True,
            embed_links=True,
        )
        try:
            ch = await guild.create_text_channel(
                name=_safe_channel_name(member),
                category=cat,
                overwrites=overwrites,
                topic=f"onboarding personal channel for {member}",
                reason="auto: onboarding",
            )
        except discord.Forbidden:
            log.warning("forbidden creating channel for %s", member)
            return None
        except discord.HTTPException as exc:
            log.warning("HTTP error creating channel for %s: %s", member, exc)
            return None

        state = MemberState(user_id=member.id, channel_id=ch.id)
        self.store.put(state)
        await self.store.save()

        await self._post_welcome_dialogue(ch, member)
        await self._log_admin(guild, f"🆕 onboarding started for <@{member.id}> in {ch.mention}")
        return ch

    async def _post_welcome_dialogue(
        self,
        ch: discord.TextChannel,
        member: discord.Member,
    ) -> None:
        embed = discord.Embed(
            title="🌟 أهلاً بك في alitravians community",
            description=(
                f"أهلاً <@{member.id}>! أنا **BOON Community Bot**.\n\n"
                "سأطرح عليك ٤ أسئلة قصيرة جدّاً لأفتح لك السيرفر بشكل مخصّص "
                "لاهتماماتك. لن يستغرق الأمر أكثر من **دقيقة واحدة**.\n\n"
                "اضغط 🚀 **ابدأ** لنبدأ."
            ),
            color=0x00FF88,
        )
        embed.set_footer(text="هذي القناة سرّية بينك وبيني وبين الإدارة فقط.")
        try:
            await ch.send(
                content=f"<@{member.id}>",
                embed=embed,
                view=_StartView(),
                allowed_mentions=discord.AllowedMentions(users=True),
            )
        except discord.Forbidden:
            log.warning("cannot post welcome dialogue in %s", ch)

    # ── raid alert ────────────────────────────────────────────────────────

    async def _raid_alert(self, guild: discord.Guild, count: int) -> None:
        log.warning("raid burst detected: %d joins in %ds", count, RAID_WINDOW_S)
        await self._log_admin(
            guild,
            f"🚨 **ضدّ-Raid**: {count} انضمام خلال {RAID_WINDOW_S}s — "
            f"إنشاء قنوات الـ onboarding متوقّف مؤقّتاً. الأعضاء الجدد محتفظون "
            f"بـ @unverified حتى تنحلّ الموجة أو يتم التحقّق منهم يدوياً.",
        )

    # ── inactivity sweep (24h reminder, 7d kick) ─────────────────────────

    @tasks.loop(minutes=30)
    async def inactivity_sweep(self) -> None:
        guild = self._guild()
        if guild is None:
            return
        now = time.time()
        # Clear out stale join timestamps and exit raid mode if the burst
        # has drained. Without this, a raid that triggers and is followed
        # by zero joins would leave the bot in raid mode forever.
        self._decay_join_window(now)
        await self._maybe_clear_raid(guild)
        kick_after = KICK_AFTER_DAYS * 86400
        remind_after = REMIND_AFTER_H * 3600
        for uid in list(self.store.active):
            state = self.store.get(uid)
            if state is None or state.step == STEP_DONE:
                continue
            age = now - state.started_at
            member = guild.get_member(uid)
            if member is None:
                continue
            # Kick eligible.
            if age >= kick_after:
                try:
                    await member.kick(reason=f"no onboarding within {KICK_AFTER_DAYS}d")
                except (discord.Forbidden, discord.HTTPException) as exc:
                    log.info("could not kick stale %s: %s", member, exc)
                await self._delete_onboarding_channel(guild, state, delay_s=2)
                self.store.drop(uid)
                await self._log_admin(
                    guild,
                    f"👢 طرد تلقائي بسبب عدم إكمال onboarding بعد {KICK_AFTER_DAYS} أيام: {member}",
                )
                continue
            # Remind eligible.
            if age >= remind_after and state.reminded_at is None and state.channel_id:
                ch = guild.get_channel(state.channel_id)
                if isinstance(ch, discord.TextChannel):
                    try:
                        await ch.send(
                            f"<@{uid}> ⏰ مرّ يوم على انضمامك. اضغط على زر **ابدأ** "
                            "أعلاه لإكمال التحقّق وفتح بقية السيرفر."
                        )
                    except discord.HTTPException:
                        pass
                state.reminded_at = now
                await self.store.save()

    @inactivity_sweep.before_loop
    async def _wait_until_ready(self) -> None:
        await self.bot.wait_until_ready()

    # ── /verify-member admin override ────────────────────────────────────

    @app_commands.command(
        name="verify-member",
        description="(Admin) تجاوز الـ onboarding ومنح @member مباشرة",
    )
    @app_commands.default_permissions(manage_guild=True)
    async def verify_member(
        self,
        interaction: discord.Interaction,
        user: discord.Member,
    ) -> None:
        await interaction.response.defer(ephemeral=True, thinking=True)
        guild = interaction.guild
        if guild is None:
            await interaction.followup.send("استخدم داخل السيرفر.", ephemeral=True)
            return
        unverified_id = self._role_id("unverified")
        member_role_id = self._role_id("member")
        unverified = guild.get_role(unverified_id) if unverified_id else None
        member_role = guild.get_role(member_role_id) if member_role_id else None
        if not (unverified and member_role):
            await interaction.followup.send("الرتب غير مهيّأة.", ephemeral=True)
            return
        try:
            if unverified in user.roles:
                await user.remove_roles(unverified, reason="admin override verify")
            await user.add_roles(member_role, reason="admin override verify")
        except discord.Forbidden:
            await interaction.followup.send("ليس لدي صلاحية تعديل الأدوار.", ephemeral=True)
            return
        except discord.HTTPException as exc:
            await interaction.followup.send(f"خطأ HTTP: {exc}", ephemeral=True)
            return
        state = self.store.get(user.id)
        if state and state.channel_id:
            await self._delete_onboarding_channel(guild, state, delay_s=0)
            self.store.drop(user.id)
            await self.store.save()
        await self._log_admin(
            guild,
            f"🛂 <@{interaction.user.id}> تجاوز onboarding لـ <@{user.id}>",
        )
        await interaction.followup.send(
            f"تم منح @member لـ <@{user.id}>.",
            ephemeral=True,
        )

    # ── /onboarding-stats ────────────────────────────────────────────────

    @app_commands.command(
        name="onboarding-stats",
        description="(Admin) إحصائيات الـ onboarding خلال آخر ٧ أيام",
    )
    @app_commands.default_permissions(manage_guild=True)
    async def onboarding_stats(self, interaction: discord.Interaction) -> None:
        await interaction.response.defer(ephemeral=True, thinking=True)
        now = time.time()
        week_ago = now - 7 * 86400
        month_ago = now - 30 * 86400
        active_count = len([
            s for s in self.store.active.values() if s.step != STEP_DONE
        ])
        completions_7d = [c for c in self.store.completions if c["completed_at"] >= week_ago]
        completions_30d = [c for c in self.store.completions if c["completed_at"] >= month_ago]

        exp_counter: dict[str, int] = {}
        int_counter: dict[str, int] = {}
        for c in completions_7d:
            exp_counter[c.get("experience") or "?"] = exp_counter.get(c.get("experience") or "?", 0) + 1
            for k in c.get("interests") or []:
                int_counter[k] = int_counter.get(k, 0) + 1

        exp_lines = [
            f"  · {label}: **{exp_counter.get(key, 0)}**"
            for key, label, _t in EXPERIENCE_LEVELS
        ]
        int_lines = [
            f"  · {label}: **{int_counter.get(key, 0)}**"
            for key, label, _e in INTERESTS
        ]
        avg_seconds = (
            sum(c.get("duration_s") or 0 for c in completions_7d) / len(completions_7d)
            if completions_7d
            else 0
        )

        embed = discord.Embed(
            title="📊 إحصائيات الـ Onboarding",
            color=0x00FF88,
            description=(
                f"**جاري الآن**: {active_count}\n"
                f"**اكتمل خلال ٧ أيام**: {len(completions_7d)}\n"
                f"**اكتمل خلال ٣٠ يوم**: {len(completions_30d)}\n"
                f"**متوسّط مدّة الإكمال**: {avg_seconds/60:.1f} دقيقة\n"
                f"\n**مستويات الخبرة (٧ أيام):**\n" + "\n".join(exp_lines) +
                f"\n\n**الاهتمامات (٧ أيام):**\n" + "\n".join(int_lines)
            ),
        )
        await interaction.followup.send(embed=embed, ephemeral=True)

    # ── /post-retroactive-button ─────────────────────────────────────────

    @app_commands.command(
        name="post-retroactive-onboarding",
        description="(Owner) ينشر زر 'ابدأ التحقّق' في #welcome للأعضاء القدامى",
    )
    @app_commands.default_permissions(manage_guild=True)
    async def post_retroactive(self, interaction: discord.Interaction) -> None:
        await interaction.response.defer(ephemeral=True, thinking=True)
        guild = interaction.guild
        if guild is None or interaction.user.id != guild.owner_id:
            await interaction.followup.send("للمالك فقط.", ephemeral=True)
            return
        welcome_ch_id = self._channel_id("welcome")
        ch = guild.get_channel(welcome_ch_id) if welcome_ch_id else None
        if not isinstance(ch, discord.TextChannel):
            await interaction.followup.send("قناة #welcome غير مهيّأة.", ephemeral=True)
            return
        embed = discord.Embed(
            title="📝 نظام التحقّق الجديد",
            description=(
                "حدّثنا نظام الانضمام للمجتمع. اضغط الزر أدناه ليُنشئ لك البوت "
                "قناة خاصة سرّية يطرح فيها أسئلة قصيرة، وبعدها تفتح لك "
                "بقية القنوات.\n\n"
                "إذا سبق وأكملت التحقّق فلا تحتاج هذا — تجاهل."
            ),
            color=0x00FF88,
        )
        try:
            msg = await ch.send(embed=embed, view=_RetroactiveView())
        except discord.Forbidden:
            await interaction.followup.send("لا صلاحية إرسال في #welcome.", ephemeral=True)
            return
        try:
            await msg.pin(reason="retroactive onboarding")
        except (discord.Forbidden, discord.HTTPException):
            pass
        await interaction.followup.send("تم النشر.", ephemeral=True)

    # ── small helpers ────────────────────────────────────────────────────

    def _cfg(self) -> dict[str, Any] | None:
        return getattr(self.bot, "server_config", None)

    def _role_id(self, key: str) -> int | None:
        cfg = self._cfg() or {}
        v = cfg.get("roles", {}).get(key)
        return int(v) if v else None

    def _role(self, key: str, guild: discord.Guild) -> discord.Role | None:
        rid = self._role_id(key)
        return guild.get_role(rid) if rid else None

    def _channel_id(self, key: str) -> int | None:
        cfg = self._cfg() or {}
        v = cfg.get("channels", {}).get(key)
        return int(v) if v else None

    def _guild(self) -> discord.Guild | None:
        gid = getattr(self.bot.settings, "guild_id", 0)  # type: ignore[attr-defined]
        return self.bot.get_guild(gid) if gid else None

    async def _recover_from_channels(self) -> None:
        """Walk the onboarding category and seed state for any orphan channel.

        Called once per bot restart. A surviving onboarding channel is
        identified by living under the configured `categories.onboarding`
        category. The "owner" is the single non-bot member who has a
        per-member ALLOW overwrite on the channel.
        """
        guild = self._guild()
        if guild is None:
            return
        cfg = self._cfg() or {}
        cat_id = cfg.get("categories", {}).get(CATEGORY_KEY)
        if not cat_id:
            return
        cat = guild.get_channel(int(cat_id))
        if not isinstance(cat, discord.CategoryChannel):
            return
        for ch in cat.channels:
            if not isinstance(ch, discord.TextChannel):
                continue
            owner = next(
                (
                    o
                    for o in ch.overwrites
                    if isinstance(o, discord.Member) and not o.bot
                ),
                None,
            )
            if owner is None:
                continue
            if owner.id in self.store.active:
                continue
            # Treat as a fresh awaiting-start state. If they were mid-flow
            # we lose the partial answers but the user clicks "ابدأ" again.
            self.store.put(MemberState(user_id=owner.id, channel_id=ch.id))
        await self.store.save()

    async def _log_admin(self, guild: discord.Guild, body: str) -> None:
        cfg = self._cfg() or {}
        ch_id = cfg.get("channels", {}).get("log_admin_actions")
        if not ch_id:
            return
        ch = guild.get_channel(int(ch_id))
        if isinstance(ch, discord.TextChannel):
            try:
                await ch.send(body)
            except discord.HTTPException:
                pass


async def setup(bot: commands.Bot) -> None:
    cog = Onboarding(bot)
    await bot.add_cog(cog)
    guild_id = bot.settings.guild_id  # type: ignore[attr-defined]
    g = discord.Object(id=guild_id)
    bot.tree.add_command(cog.verify_member, guild=g)
    bot.tree.add_command(cog.onboarding_stats, guild=g)
    bot.tree.add_command(cog.post_retroactive, guild=g)
