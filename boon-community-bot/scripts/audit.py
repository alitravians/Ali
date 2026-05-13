"""Verification audit — print every channel's tier and @everyone flags.

Run after `setup_server.py` and `fix_permissions.py` to confirm the live
server matches the declared structure. Exit code is non-zero if any channel
deviates from its declared tier (mostly: @everyone has the wrong
allow/deny flags for VIEW or SEND).
"""

from __future__ import annotations

import json
import os
import sys
import urllib.request
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

from bot.structure import CATEGORIES, Tier  # noqa: E402

TOKEN = os.environ["DISCORD_BOT_TOKEN"]
GUILD = os.environ["GUILD_ID"]

VIEW_CHANNEL = 1 << 10
SEND_MESSAGES = 1 << 11


def request(method: str, path: str) -> Any:
    req = urllib.request.Request(
        f"https://discord.com/api/v10{path}",
        method=method,
        headers={"Authorization": f"Bot {TOKEN}",
                 "User-Agent": "DiscordBot (BOON Audit, 0.1.0)"},
    )
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())


def has_flag(value: int, flag: int) -> bool:
    return (value & flag) == flag


def main() -> int:
    everyone = GUILD
    channels = request("GET", f"/guilds/{GUILD}/channels")
    by_id = {c["id"]: c for c in channels}

    cfg_path = REPO_ROOT / "server_config.json"
    cfg = json.loads(cfg_path.read_text())
    declared = {}
    for cat in CATEGORIES:
        for ch in cat.channels:
            bucket = "voice_channels" if ch.type.name == "VOICE" else "channels"
            ch_id = cfg.get(bucket, {}).get(ch.key)
            if ch_id:
                declared[ch_id] = ch

    failures: list[str] = []
    print(f"{'channel':40s}  {'tier':12s}  view  send")
    print("-" * 70)
    for ch_id, spec in declared.items():
        live = by_id.get(ch_id)
        if not live:
            failures.append(f"MISSING {spec.name} ({ch_id})")
            continue
        ow = next((o for o in live.get("permission_overwrites", [])
                   if o["id"] == everyone), None)
        allow = int(ow["allow"]) if ow else 0
        deny = int(ow["deny"]) if ow else 0
        view = "allow" if has_flag(allow, VIEW_CHANNEL) else (
            "deny" if has_flag(deny, VIEW_CHANNEL) else "—")
        send = "allow" if has_flag(allow, SEND_MESSAGES) else (
            "deny" if has_flag(deny, SEND_MESSAGES) else "—")
        print(f"{spec.name:40s}  {spec.tier.value:12s}  {view:5s} {send}")

        if spec.tier == Tier.ADMIN_ONLY and view != "deny":
            failures.append(f"{spec.name}: expected @everyone VIEW deny, got {view}")
        if spec.tier == Tier.READ_ONLY and (view == "deny" or send != "deny"):
            failures.append(f"{spec.name}: expected view=allow,send=deny, got view={view} send={send}")
        if spec.tier == Tier.OPEN_WRITE and (view != "allow" or send != "allow"):
            failures.append(f"{spec.name}: expected view=allow,send=allow, got view={view} send={send}")

    if failures:
        print(f"\n✗ {len(failures)} deviations:")
        for f in failures:
            print(f"  - {f}")
        return 1
    print("\n✓ all channels match declared tiers")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
