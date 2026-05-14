"""Canonical declarative structure of the BOON community Discord server.

This module defines *what* the server should look like (categories, channels,
roles, permission tiers). Both `setup_server.py` (creates everything from
scratch) and `fix_permissions.py` (idempotent enforcer) consume it, so there
is exactly one source of truth.

Conventions:
  * `Tier.ADMIN_ONLY` → @everyone denied VIEW; admin/mod/bot allowed full
  * `Tier.READ_ONLY`  → @everyone may view + react, denied SEND + slash
  * `Tier.OPEN_WRITE` → @everyone may view + send + use slash commands
  * `Tier.VOICE_OPEN` → voice channel everyone can connect + speak

A bot must NEVER be given the `ADMINISTRATOR` flag — every permission it
needs is granted explicitly per channel via the tier model. See
`fix_permissions.py` for the resolution logic.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


class Tier(str, Enum):  # noqa: UP042 — keep tuple parents for py<3.11 compat
    ADMIN_ONLY = "admin_only"
    READ_ONLY = "read_only"
    OPEN_WRITE = "open_write"
    VOICE_OPEN = "voice_open"
    VOICE_ADMIN = "voice_admin"


class ChannelType(int, Enum):
    """Discord API channel-type integers."""

    TEXT = 0
    VOICE = 2
    CATEGORY = 4
    ANNOUNCEMENT = 5
    FORUM = 15


@dataclass(frozen=True)
class ChannelSpec:
    key: str
    name: str
    type: ChannelType
    tier: Tier
    topic: str = ""
    slowmode: int = 0  # seconds; 0 = off


@dataclass(frozen=True)
class CategorySpec:
    key: str
    name: str
    tier: Tier  # default tier propagated to children unless they override
    channels: list[ChannelSpec] = field(default_factory=list)


@dataclass(frozen=True)
class RoleSpec:
    key: str
    name: str
    color: int  # 24-bit RGB int (e.g. 0x00FF88)
    hoist: bool = False
    mentionable: bool = False
    # NOTE: we deliberately do NOT set `permissions` here. All authority is
    # granted via channel-level overwrites in `fix_permissions.py`. The only
    # role that gets server-level perms is the optional `admin` role created
    # by the server owner manually.


BOON_GREEN = 0x00FF88
BOON_DIM = 0x0A1F10
BOON_GRAY = 0x99AAB5


ROLES: list[RoleSpec] = [
    # ── Authority tier (top of the hierarchy; hoisted, visible by default) ──
    RoleSpec(key="admin", name="admin", color=BOON_GREEN, hoist=True, mentionable=False),
    RoleSpec(key="maintainer", name="maintainer", color=BOON_GREEN, hoist=True),
    RoleSpec(key="plugin_dev", name="plugin-dev", color=0x55FFAA, hoist=True),
    RoleSpec(key="moderator", name="moderator", color=0x00C46A, hoist=True),
    RoleSpec(key="helper", name="helper", color=0x33D18A, hoist=False),
    RoleSpec(key="vip", name="VIP", color=0xFFD700, hoist=True),
    # ── Contribution tier (recognition for contribution; hoisted) ──────────
    # Granted manually by staff. Cosmetic + mention-only — no permissions.
    RoleSpec(key="tester", name="tester", color=0x9B59B6, hoist=True, mentionable=True),
    RoleSpec(key="contributor", name="contributor", color=0xE91E63, hoist=True, mentionable=True),
    RoleSpec(key="translator", name="translator", color=0x1ABC9C, hoist=False, mentionable=True),
    RoleSpec(key="designer", name="designer", color=0xF1C40F, hoist=False, mentionable=True),
    # ── Verified base tier ─────────────────────────────────────────────────
    RoleSpec(key="member", name="member", color=BOON_GRAY, hoist=False),
    # ── Interest tier (self-assign via buttons; mentionable; not hoisted) ──
    # These exist only as @mention targets so the right people get pinged for
    # the right topics. They confer NO channel permissions.
    RoleSpec(key="interest_releases",     name="🔔 إشعارات-الإصدارات",  color=0x3498DB, hoist=False, mentionable=True),
    RoleSpec(key="interest_tech",         name="💬 نقاشات-تقنية",       color=0x3498DB, hoist=False, mentionable=True),
    RoleSpec(key="interest_install_help", name="🆘 مساعدة-في-التثبيت",  color=0x3498DB, hoist=False, mentionable=True),
    RoleSpec(key="interest_bug_reports",  name="🐛 تقارير-الأخطاء",     color=0x3498DB, hoist=False, mentionable=True),
    RoleSpec(key="interest_features",     name="💡 طلبات-الميزات",      color=0x3498DB, hoist=False, mentionable=True),
    RoleSpec(key="interest_translate",    name="🌐 الترجمة-والتوطين",   color=0x3498DB, hoist=False, mentionable=True),
    # ── Restricted tier ────────────────────────────────────────────────────
    RoleSpec(key="unverified", name="unverified", color=0x555555, hoist=False),
    RoleSpec(key="banned", name="banned", color=0xED4245, hoist=False),
    RoleSpec(key="bot", name="bots", color=0x5865F2, hoist=False),
]


CATEGORIES: list[CategorySpec] = [
    CategorySpec(
        key="get_started",
        name="🌟 ابدأ من هنا",
        tier=Tier.READ_ONLY,
        channels=[
            ChannelSpec("welcome", "الترحيب", ChannelType.TEXT, Tier.READ_ONLY,
                        topic="مرحباً بك في BOON — اقرأ القواعد ثم تحقق لتفتح بقية القنوات.",
                        slowmode=10),
            ChannelSpec("announcements", "الإعلانات", ChannelType.ANNOUNCEMENT, Tier.READ_ONLY,
                        topic="تحديثات BOON الرسمية والإصدارات الجديدة."),
            ChannelSpec("rules", "القواعد", ChannelType.TEXT, Tier.READ_ONLY,
                        topic="القواعد الكاملة. مخالفتها تؤدي للحظر."),
            ChannelSpec("faq", "الأسئلة-الشائعة", ChannelType.TEXT, Tier.READ_ONLY,
                        topic="إجابات الأسئلة المتكررة. راجعها قبل أن تسأل في الدعم."),
            ChannelSpec("install_boon", "تثبيت-BOON", ChannelType.TEXT, Tier.READ_ONLY,
                        topic="شرح تثبيت BOON لكل المنصات (Userscript / Extension / Desktop)."),
            ChannelSpec("choose_roles", "اختر-اهتماماتك", ChannelType.TEXT, Tier.READ_ONLY,
                        topic="اضغط الأزرار في الرسالة المثبّتة لإعطاء/إزالة أدوار الاهتمامات."),
        ],
    ),
    CategorySpec(
        key="boon_core",
        name="📦 BOON Core",
        tier=Tier.OPEN_WRITE,
        channels=[
            ChannelSpec("plugin_requests", "اقتراحات-إضافات", ChannelType.TEXT, Tier.OPEN_WRITE,
                        topic="اقترح plugin جديد. اقرأ pinned messages قبل الاقتراح.",
                        slowmode=30),
            ChannelSpec("plugin_news", "أخبار-الإضافات", ChannelType.ANNOUNCEMENT, Tier.READ_ONLY,
                        topic="تحديثات الإضافات."),
            ChannelSpec("bug_reports", "تقارير-الأخطاء", ChannelType.TEXT, Tier.OPEN_WRITE,
                        topic="استخدم /report لفتح تقرير. أو وصف المشكلة هنا.",
                        slowmode=30),
            ChannelSpec("known_issues", "المعروفة", ChannelType.TEXT, Tier.READ_ONLY,
                        topic="المشاكل المعروفة. ثبتنا حالتها في pinned messages."),
        ],
    ),
    CategorySpec(
        key="support",
        name="🛟 الدعم",
        tier=Tier.OPEN_WRITE,
        channels=[
            ChannelSpec("support_boon", "دعم-BOON", ChannelType.TEXT, Tier.OPEN_WRITE,
                        topic="مساعدة عامة. اكتب رسالة وسيُنشئ thread خاص بك.",
                        slowmode=15),
            ChannelSpec("support_desktop", "دعم-Desktop", ChannelType.TEXT, Tier.OPEN_WRITE,
                        topic="مشاكل المثبّت أو تطبيق Discord Desktop.",
                        slowmode=15),
            ChannelSpec("support_themes", "دعم-الثيمات", ChannelType.TEXT, Tier.OPEN_WRITE,
                        topic="مشاكل AliThemes / تخصيص CSS.",
                        slowmode=15),
        ],
    ),
    CategorySpec(
        key="community",
        name="🎨 محتوى المجتمع",
        tier=Tier.OPEN_WRITE,
        channels=[
            ChannelSpec("themes_css", "ثيمات-CSS", ChannelType.TEXT, Tier.OPEN_WRITE,
                        topic="شارك ثيم CSS صنعته. أرفق screenshot.", slowmode=30),
            ChannelSpec("snippets_js", "snippets-JS", ChannelType.TEXT, Tier.OPEN_WRITE,
                        topic="snippets / مايكرو plugins. ضع الكود داخل code block.",
                        slowmode=30),
            ChannelSpec("showcase", "showcase", ChannelType.TEXT, Tier.OPEN_WRITE,
                        topic="معرض screenshots. ممنوع الكلام هنا — فقط لقطات.",
                        slowmode=120),
        ],
    ),
    CategorySpec(
        key="development",
        name="💻 التطوير",
        tier=Tier.OPEN_WRITE,
        channels=[
            ChannelSpec("core_dev", "تطوير-القلب", ChannelType.TEXT, Tier.OPEN_WRITE,
                        topic="نقاش تطوير BOON core. مفتوح للجميع."),
            ChannelSpec("plugin_dev", "تطوير-الإضافات", ChannelType.TEXT, Tier.OPEN_WRITE,
                        topic="نقاش تطوير الـ plugins."),
            ChannelSpec("github_prs", "PRs", ChannelType.TEXT, Tier.READ_ONLY,
                        topic="auto-feed لكل PR على alitravians/Ali."),
            ChannelSpec("github_commits", "commits", ChannelType.TEXT, Tier.READ_ONLY,
                        topic="auto-feed لكل commit جديد."),
        ],
    ),
    CategorySpec(
        key="chat",
        name="💬 دردشة",
        tier=Tier.OPEN_WRITE,
        channels=[
            ChannelSpec("general", "عام", ChannelType.TEXT, Tier.OPEN_WRITE,
                        topic="دردشة عامة."),
            ChannelSpec("off_topic", "off-topic", ChannelType.TEXT, Tier.OPEN_WRITE,
                        topic="أي شيء خارج موضوع BOON."),
            ChannelSpec("memes", "ميمز", ChannelType.TEXT, Tier.OPEN_WRITE,
                        topic="ميمز. حافظ على نظافة المحتوى.",
                        slowmode=30),
            ChannelSpec("friends", "اصدقاء-BOON", ChannelType.TEXT, Tier.OPEN_WRITE,
                        topic="ابحث عن أصدقاء للعب أو الدراسة.",
                        slowmode=60),
        ],
    ),
    CategorySpec(
        key="voice",
        name="🔊 صوتي",
        tier=Tier.VOICE_OPEN,
        channels=[
            ChannelSpec("vc_general", "🔊 لاونج عام", ChannelType.VOICE, Tier.VOICE_OPEN),
            ChannelSpec("vc_dev", "🔊 لاونج تطوير", ChannelType.VOICE, Tier.VOICE_OPEN),
            ChannelSpec("vc_music", "🔊 ميوزك", ChannelType.VOICE, Tier.VOICE_OPEN),
        ],
    ),
    # ──────────────────────────────────────────────────────────────────────
    # Admin-only categories. The bot writes here but @everyone is denied VIEW.
    CategorySpec(
        key="bot_logs",
        name="🤖 سجلات البوت",
        tier=Tier.ADMIN_ONLY,
        channels=[
            ChannelSpec("log_activity", "activity", ChannelType.TEXT, Tier.ADMIN_ONLY,
                        topic="انضمام/مغادرة الأعضاء، تغييرات الـ roles."),
            ChannelSpec("log_admin_actions", "admin-actions", ChannelType.TEXT, Tier.ADMIN_ONLY,
                        topic="verifications + إجراءات الإدارة."),
            ChannelSpec("log_errors", "errors", ChannelType.TEXT, Tier.ADMIN_ONLY,
                        topic="استثناءات البوت + أخطاء webhook."),
            ChannelSpec("log_message_audit", "message-audit", ChannelType.TEXT, Tier.ADMIN_ONLY,
                        topic="رسائل محذوفة + معدّلة."),
            ChannelSpec("log_server_changes", "server-changes", ChannelType.TEXT, Tier.ADMIN_ONLY,
                        topic="تغييرات الـ channels و الـ roles."),
            ChannelSpec("log_future_bots", "future-bots-placeholder", ChannelType.TEXT, Tier.ADMIN_ONLY,
                        topic="مكان احتياطي لبوتات مستقبلية تكتب سجلاتها هنا."),
        ],
    ),
    CategorySpec(
        key="admin",
        name="🔒 الإدارة",
        tier=Tier.ADMIN_ONLY,
        channels=[
            ChannelSpec("admin_general", "admin-general", ChannelType.TEXT, Tier.ADMIN_ONLY,
                        topic="نقاش الإدارة العام."),
            ChannelSpec("admin_modmail", "modmail", ChannelType.TEXT, Tier.ADMIN_ONLY,
                        topic="رسائل خاصة من الأعضاء."),
            ChannelSpec("vc_admin", "🔊 لاونج إدارة", ChannelType.VOICE, Tier.VOICE_ADMIN),
        ],
    ),
]


def all_channel_specs() -> list[tuple[CategorySpec, ChannelSpec]]:
    """Flatten (category, channel) pairs in declared order."""
    out: list[tuple[CategorySpec, ChannelSpec]] = []
    for cat in CATEGORIES:
        for ch in cat.channels:
            out.append((cat, ch))
    return out
