"""Runtime configuration loader. Reads `server_config.json` (produced by
`scripts/setup_server.py`) and environment variables for secrets.

Never log secret values. Never serialise them into messages.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    discord_token: str
    guild_id: int
    github_repo: str
    github_token: str | None
    github_webhook_secret: str | None
    http_port: int
    log_level: str
    server_config_path: Path


def _require(name: str) -> str:
    v = os.environ.get(name, "").strip()
    if not v:
        raise RuntimeError(f"missing required env var: {name}")
    return v


def load_settings() -> Settings:
    return Settings(
        discord_token=_require("DISCORD_BOT_TOKEN"),
        guild_id=int(_require("GUILD_ID")),
        github_repo=os.environ.get("GITHUB_REPO", "alitravians/Ali"),
        github_token=os.environ.get("GITHUB_TOKEN") or None,
        github_webhook_secret=os.environ.get("GITHUB_WEBHOOK_SECRET") or None,
        http_port=int(os.environ.get("PORT", "8080")),
        log_level=os.environ.get("LOG_LEVEL", "INFO").upper(),
        server_config_path=Path(__file__).resolve().parent.parent / "server_config.json",
    )


def load_server_config(path: Path) -> dict:
    if not path.exists():
        raise FileNotFoundError(
            f"{path} not found — run `python -m scripts.setup_server` first."
        )
    with open(path) as f:
        return json.load(f)
