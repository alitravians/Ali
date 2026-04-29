"""Bot configuration loaded from environment + server_config.json."""
from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

load_dotenv()

ROOT = Path(__file__).resolve().parent.parent
SERVER_CONFIG_PATH = ROOT / "server_config.json"


def _load_server_config() -> dict[str, Any]:
    if SERVER_CONFIG_PATH.exists():
        with SERVER_CONFIG_PATH.open(encoding="utf-8") as f:
            return json.load(f)
    return {}


_sc = _load_server_config()


def _env_or_sc(env_key: str, sc_path: list[str], default: str | None = None) -> str | None:
    val = os.getenv(env_key)
    if val:
        return val
    cur: Any = _sc
    for k in sc_path:
        if isinstance(cur, dict) and k in cur:
            cur = cur[k]
        else:
            return default
    return str(cur) if cur is not None else default


@dataclass(frozen=True)
class Settings:
    bot_token: str
    guild_id: int
    db_path: str

    # Channel IDs
    channel_rules: int
    channel_announcements: int
    channel_start: int
    channel_current: int
    channel_leaderboard: int
    channel_archive: int
    channel_welcome: int
    channel_discussion: int
    channel_prizes: int
    channel_reports: int
    channel_stats: int
    channel_log: int

    # Role IDs
    role_champion: int
    role_active: int
    role_expert: int
    role_newbie: int
    role_mod: int
    role_vip: int
    role_weekly_winner: int
    role_banned: int

    # Bot-logs channel IDs (admin-only category)
    log_activity: int
    log_admin: int
    log_errors: int
    log_joins: int
    log_deletes: int
    log_edits: int
    log_server: int

    # Member-facing bot updates channel
    channel_bot_updates: int

    @classmethod
    def load(cls) -> "Settings":
        token = os.getenv("DISCORD_BOT_TOKEN")
        if not token:
            raise RuntimeError("DISCORD_BOT_TOKEN environment variable required")

        guild_id = int(_env_or_sc("GUILD_ID", ["guild_id"], "0") or "0")
        db_path = os.getenv("DB_PATH", str(ROOT / "data" / "competitions.db"))

        def ch(key: str) -> int:
            return int(_env_or_sc(f"CHANNEL_{key.upper()}", ["channels", key], "0") or "0")

        def role(key: str) -> int:
            return int(_env_or_sc(f"ROLE_{key.upper()}", ["roles", key], "0") or "0")

        return cls(
            bot_token=token,
            guild_id=guild_id,
            db_path=db_path,
            channel_rules=ch("rules"),
            channel_announcements=ch("announcements"),
            channel_start=ch("start"),
            channel_current=ch("current"),
            channel_leaderboard=ch("leaderboard"),
            channel_archive=ch("archive"),
            channel_welcome=ch("welcome"),
            channel_discussion=ch("discussion"),
            channel_prizes=ch("prizes"),
            channel_reports=ch("reports"),
            channel_stats=ch("stats"),
            channel_log=int(_env_or_sc("CHANNEL_LOG", ["log_channel_id"], "0") or "0"),
            role_champion=role("champion"),
            role_active=role("active"),
            role_expert=role("expert"),
            role_newbie=role("newbie"),
            role_mod=role("mod"),
            role_vip=role("vip"),
            role_weekly_winner=role("weekly_winner"),
            role_banned=role("banned"),
            log_activity=int(_env_or_sc("LOG_ACTIVITY", ["bot_logs_channels", "activity"], "0") or "0"),
            log_admin=int(_env_or_sc("LOG_ADMIN", ["bot_logs_channels", "admin_log"], "0") or "0"),
            log_errors=int(_env_or_sc("LOG_ERRORS", ["bot_logs_channels", "errors"], "0") or "0"),
            log_joins=int(_env_or_sc("LOG_JOINS", ["bot_logs_channels", "joins"], "0") or "0"),
            log_deletes=int(_env_or_sc("LOG_DELETES", ["bot_logs_channels", "deletes"], "0") or "0"),
            log_edits=int(_env_or_sc("LOG_EDITS", ["bot_logs_channels", "edits"], "0") or "0"),
            log_server=int(_env_or_sc("LOG_SERVER", ["bot_logs_channels", "server"], "0") or "0"),
            channel_bot_updates=ch("bot_updates"),
        )


# ----- Constants used across cogs -----
COLORS = {
    "primary": 0x5865F2,    # Discord blurple
    "success": 0x2ECC71,    # green
    "danger": 0xE74C3C,     # red
    "warning": 0xF39C12,    # orange
    "info": 0x3498DB,       # blue
    "gold": 0xFFD700,       # gold
    "silver": 0xC0C0C0,
    "bronze": 0xCD7F32,
    "purple": 0x9B59B6,
    "pink": 0xE91E63,
    "teal": 0x1ABC9C,
    "dark": 0x2C2F33,
}

CATEGORY_EMOJIS = {
    "عام": "🌐",
    "عربي": "🇸🇦",
    "تاريخ": "📜",
    "جغرافيا": "🗺️",
    "رياضة": "⚽",
    "تقنية": "💻",
    "إسلامي": "🕌",
    "علوم": "🔬",
    "أفلام": "🎬",
}

DIFFICULTY = {
    "سهل": {"points": 10, "time": 30, "emoji": "🟢"},
    "متوسط": {"points": 20, "time": 30, "emoji": "🟡"},
    "صعب": {"points": 35, "time": 30, "emoji": "🔴"},
}

# XP / level thresholds
LEVEL_THRESHOLDS = [0, 50, 150, 350, 700, 1200, 2000, 3000, 4500, 6500, 9000, 12000]

# Season tiers — assigned at season-close based on monthly_points
# Each entry: (tier_id, label, min_points, color)
SEASON_TIERS: list[tuple[str, str, int, int]] = [
    ("diamond", "💎 ماسي", 3501, 0x5DADE2),
    ("gold",    "🥇 ذهبي", 1501, 0xFFD700),
    ("silver",  "🥈 فضّي",  501, 0xC0C0C0),
    ("bronze",  "🥉 برونزي",  0, 0xCD7F32),
]


def season_tier_for(points: int) -> tuple[str, str, int]:
    """Returns (tier_id, label, color) for a given point total."""
    for tier_id, label, min_pts, color in SEASON_TIERS:
        if points >= min_pts:
            return tier_id, label, color
    return SEASON_TIERS[-1][0], SEASON_TIERS[-1][1], SEASON_TIERS[-1][3]

# Achievements: id -> (name, description, requirement)
ACHIEVEMENTS = {
    "first_win": ("🏆 أول فوز", "اربح أول مسابقة", "wins>=1"),
    "streak_5": ("🔥 سلسلة 5", "5 إجابات صحيحة متتالية", "streak>=5"),
    "streak_10": ("⚡ سلسلة 10", "10 إجابات صحيحة متتالية", "streak>=10"),
    "veteran": ("🎖️ مخضرم", "شارك في 25 مسابقة", "competitions>=25"),
    "scholar": ("📚 عالم", "احصل على 1000 نقطة", "points>=1000"),
    "champion": ("👑 بطل", "احصل على 5000 نقطة", "points>=5000"),
    "perfect": ("💎 مثالي", "أكمل مسابقة بدون أخطاء", "perfect>=1"),
    "speedster": ("⚡ سريع", "أجب في أقل من 3 ثواني", "fast_answer>=1"),
}

WELCOME_MESSAGES = [
    "🎉 **بسم الله نبدأ مسابقة جديدة!** استعدوا، أحضروا قلمًا وذهنًا صافيًا!",
    "⚡ **انتباه يا أبطال!** مسابقة قوية على وشك البدء — من سيتربع على العرش؟",
    "🏆 **أهلاً بكم في عالم المعرفة!** أسئلة مشوّقة قادمة، جاهزون؟",
    "🔥 **حان وقت التحدي!** أظهروا ما عندكم من علم وسرعة بديهة.",
    "🌟 **مرحباً بأبطال المعرفة!** المسابقة على وصول، استعدوا للانطلاق.",
    "🎯 **التركيز مفتاح الفوز!** أسئلة جديدة بانتظاركم — صفّوا أذهانكم.",
    "👑 **من سيتوّج بطلاً اليوم؟** استعدوا لمعركة المعلومات الكبرى!",
    "💡 **أبهروني بإجاباتكم!** مسابقة احترافية على وشك الانطلاق.",
]

COUNTDOWN_LINES = [
    "⏳ **3...** استعدوا لأول سؤال!",
    "⏳ **2...** ركّزوا!",
    "⏳ **1...** انطلقوا! 🚀",
]
