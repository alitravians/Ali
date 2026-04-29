"""MusicBot configuration loaded from environment + server_config.json."""
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


def _from_env_or_sc(env_key: str, sc_path: list[str], default: str | None = None) -> str | None:
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

    # Bot-logs channels (under 🤖 ━ سجلات البوتات ━ on the main server).
    log_play: int       # successful playbacks ("now playing X")
    log_errors: int     # download / playback / voice errors
    log_admin: int      # admin commands (force-stop, clear queue)

    # Optional: a role ID that's allowed to use admin music commands
    # (e.g. /admin_music stop/clear). 0 = anyone with Manage Server.
    role_admin: int

    # Default voice quality / behaviour knobs
    default_volume: int        # 0..200, applied to new players
    max_queue_length: int
    idle_disconnect_seconds: int

    @classmethod
    def load(cls) -> "Settings":
        token = os.getenv("DISCORD_BOT_TOKEN")
        if not token:
            raise RuntimeError("DISCORD_BOT_TOKEN environment variable required")
        guild_id = int(_from_env_or_sc("GUILD_ID", ["guild_id"], "0") or "0")

        def log_ch(key: str) -> int:
            return int(_from_env_or_sc(
                f"LOG_{key.upper()}",
                ["bot_logs_channels", key],
                "0",
            ) or "0")

        return cls(
            bot_token=token,
            guild_id=guild_id,
            log_play=log_ch("play"),
            log_errors=log_ch("errors"),
            log_admin=log_ch("admin"),
            role_admin=int(os.getenv("ROLE_MUSIC_ADMIN", "0") or "0"),
            default_volume=int(os.getenv("DEFAULT_VOLUME", "70") or "70"),
            max_queue_length=int(os.getenv("MAX_QUEUE_LENGTH", "100") or "100"),
            idle_disconnect_seconds=int(os.getenv("IDLE_DISCONNECT_SECONDS", "300") or "300"),
        )


# Embed colours (kept consistent with the Competitions bot).
COLORS = {
    "primary": 0x5865F2,
    "success": 0x2ECC71,
    "danger":  0xE74C3C,
    "warning": 0xF39C12,
    "info":    0x3498DB,
    "music":   0x9B59B6,   # purple — distinguishes the music bot's embeds
}
