"""Build the BOON community Discord server from `bot/structure.py`.

Idempotent: re-running this script reconciles the live server against the
declared structure — it creates missing categories/channels/roles and updates
the canonical `server_config.json` with their IDs. It never deletes existing
objects (deletion is a destructive operation that always requires manual
confirmation).

Usage:
    DISCORD_BOT_TOKEN=... GUILD_ID=... python -m scripts.setup_server

Pre-conditions:
    1. A Discord application + bot has been created.
    2. The bot has been invited to the empty guild with `applications.commands`
       and these scopes: `bot` with permissions: Manage Channels, Manage Roles,
       View Channels, Send Messages, Read Message History, Manage Messages,
       Embed Links, Attach Files, Add Reactions, Use Slash Commands.
       (No Administrator — every authority is granted explicitly.)
    3. The bot's role has been manually moved ABOVE the `member`/`unverified`
       roles so it can assign them. See `SETUP.md` step 4.
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

from bot.structure import CATEGORIES, ROLES, ChannelType  # noqa: E402

TOKEN = os.environ["DISCORD_BOT_TOKEN"]
GUILD = os.environ["GUILD_ID"]
CONFIG_PATH = REPO_ROOT / "server_config.json"

API = "https://discord.com/api/v10"


def request(method: str, path: str, body: Any | None = None) -> Any:
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(
        f"{API}{path}",
        data=data,
        method=method,
        headers={
            "Authorization": f"Bot {TOKEN}",
            "Content-Type": "application/json",
            "User-Agent": "DiscordBot (BOON Community Bot, 0.1.0)",
        },
    )
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                if r.status == 204:
                    return None
                return json.loads(r.read())
        except urllib.error.HTTPError as e:
            if e.code in (502, 503, 504):
                time.sleep(2.0 + attempt * 1.5)
                continue
            if e.code == 429:
                try:
                    payload = json.loads(e.read())
                    retry = float(payload.get("retry_after", 1.0))
                except Exception:
                    retry = float(e.headers.get("Retry-After", 1.0))
                time.sleep(retry + 0.25)
                continue
            print(f"HTTP {e.code} on {method} {path}: {e.read()[:300]!r}", file=sys.stderr)
            raise
    raise RuntimeError(f"giving up after retries: {method} {path}")


def load_config() -> dict[str, Any]:
    if CONFIG_PATH.exists():
        with open(CONFIG_PATH) as f:
            return json.load(f)
    return {
        "guild_id": GUILD,
        "roles": {},
        "categories": {},
        "channels": {},
        "voice_channels": {},
    }


def save_config(cfg: dict[str, Any]) -> None:
    CONFIG_PATH.write_text(json.dumps(cfg, indent=2, ensure_ascii=False))


# ── Roles ─────────────────────────────────────────────────────────────────
def sync_roles(cfg: dict[str, Any]) -> None:
    print("\n[roles] reconciling …")
    existing = request("GET", f"/guilds/{GUILD}/roles")
    by_name = {r["name"].lower(): r for r in existing}

    for spec in ROLES:
        match = by_name.get(spec.name.lower())
        if match:
            cfg["roles"][spec.key] = match["id"]
            print(f"  - {spec.name:14s} kept   ({match['id']})")
            continue
        body = {
            "name": spec.name,
            "color": spec.color,
            "hoist": spec.hoist,
            "mentionable": spec.mentionable,
        }
        created = request("POST", f"/guilds/{GUILD}/roles", body)
        cfg["roles"][spec.key] = created["id"]
        print(f"  + {spec.name:14s} created ({created['id']})")
        time.sleep(0.4)


# ── Categories + channels ─────────────────────────────────────────────────
def _api_type(t: ChannelType) -> int:
    return int(t)


def sync_categories_and_channels(cfg: dict[str, Any]) -> None:
    print("\n[channels] reconciling …")
    existing = request("GET", f"/guilds/{GUILD}/channels")
    # Discord normalises channel names to lowercase server-side. Match case-
    # insensitively to avoid creating duplicates of e.g. "تثبيت-BOON" vs the
    # lowercased "تثبيت-boon" Discord returns from the API.
    cats_by_name = {c["name"].lower(): c for c in existing if c["type"] == 4}
    children_by_parent: dict[str, list[dict[str, Any]]] = {}
    for c in existing:
        if c["type"] != 4 and c.get("parent_id"):
            children_by_parent.setdefault(c["parent_id"], []).append(c)

    for cat_spec in CATEGORIES:
        cat = cats_by_name.get(cat_spec.name.lower())
        if cat:
            cat_id = cat["id"]
            print(f"  ── {cat_spec.name} (kept {cat_id})")
        else:
            created = request("POST", f"/guilds/{GUILD}/channels",
                              {"name": cat_spec.name, "type": 4})
            cat_id = created["id"]
            print(f"  ── {cat_spec.name} (created {cat_id})")
            time.sleep(0.4)
        cfg["categories"][cat_spec.key] = cat_id

        # Same case-insensitive match for channels under each category.
        names_under = {c["name"].lower(): c for c in children_by_parent.get(cat_id, [])}
        for ch_spec in cat_spec.channels:
            existing_ch = names_under.get(ch_spec.name.lower())
            if existing_ch:
                ch_id = existing_ch["id"]
                action = "kept"
            else:
                # Announcement channels (type 5) require the COMMUNITY feature
                # to be enabled on the guild. Fall back to TEXT (0) until then
                # — fix_permissions.py / a later step can convert these once
                # the guild is upgraded to a Community server.
                api_type = _api_type(ch_spec.type)
                if api_type == 5:
                    api_type = 0
                body: dict[str, Any] = {
                    "name": ch_spec.name,
                    "type": api_type,
                    "parent_id": cat_id,
                }
                if ch_spec.topic and ch_spec.type in (ChannelType.TEXT,
                                                     ChannelType.ANNOUNCEMENT):
                    body["topic"] = ch_spec.topic
                if ch_spec.slowmode and ch_spec.type == ChannelType.TEXT:
                    body["rate_limit_per_user"] = ch_spec.slowmode
                created_ch = request("POST", f"/guilds/{GUILD}/channels", body)
                ch_id = created_ch["id"]
                action = "created"
                time.sleep(0.4)

            bucket = "voice_channels" if ch_spec.type == ChannelType.VOICE else "channels"
            cfg[bucket][ch_spec.key] = ch_id
            print(f"     • {ch_spec.name:30s} {action} ({ch_id})")


def main() -> int:
    cfg = load_config()
    sync_roles(cfg)
    save_config(cfg)
    sync_categories_and_channels(cfg)
    save_config(cfg)
    print(f"\n✓ server_config.json updated → {CONFIG_PATH}")
    print("Next: run `python -m scripts.fix_permissions` to apply tier-based ACLs.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
