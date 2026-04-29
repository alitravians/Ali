"""Properly tier channel permissions: admin-only, read-only, open."""
import json
import os
import time
import urllib.request
import urllib.error
from pathlib import Path

TOKEN = os.environ["DISCORD_BOT_TOKEN"]
GUILD = "1165790728551669780"

# Resolve config path relative to this script (CompetitionsBot/server_config.json)
# or honor an explicit override via SERVER_CONFIG_PATH.
_default_config = Path(__file__).resolve().parent.parent / "server_config.json"
CONFIG_PATH = Path(os.environ.get("SERVER_CONFIG_PATH", _default_config))
with open(CONFIG_PATH) as f:
    cfg = json.load(f)

# Permission bit flags (https://discord.com/developers/docs/topics/permissions)
VIEW_CHANNEL = 1 << 10
SEND_MESSAGES = 1 << 11
READ_MESSAGE_HISTORY = 1 << 16
ADD_REACTIONS = 1 << 6
USE_APPLICATION_COMMANDS = 1 << 31
MANAGE_MESSAGES = 1 << 13
MENTION_EVERYONE = 1 << 17
EMBED_LINKS = 1 << 14
ATTACH_FILES = 1 << 15
CONNECT_VOICE = 1 << 20
SPEAK_VOICE = 1 << 21


def request(method, path, body=None):
    url = f"https://discord.com/api/v10{path}"
    data = None
    if body is not None:
        data = json.dumps(body).encode()
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bot {TOKEN}",
            "Content-Type": "application/json",
            "User-Agent": "DiscordBot",
        },
    )
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=15) as r:
                return json.loads(r.read()) if r.status != 204 else None
        except urllib.error.HTTPError as e:
            if e.code == 429:
                retry = float(e.headers.get("Retry-After", 1.0))
                time.sleep(retry + 0.2)
                continue
            raise
    raise RuntimeError(
        f"Request failed after 3 retries due to rate limiting: {method} {path}"
    )


def put_overwrite(channel_id, target_id, target_type, allow=0, deny=0):
    """target_type: 0=role, 1=member."""
    request(
        "PUT",
        f"/channels/{channel_id}/permissions/{target_id}",
        {"id": target_id, "type": target_type, "allow": str(allow), "deny": str(deny)},
    )
    time.sleep(0.3)  # rate-limit safety


def patch_channel(channel_id, body):
    request("PATCH", f"/channels/{channel_id}", body)
    time.sleep(0.3)


# IDs
EVERYONE_ID = GUILD  # @everyone role id == guild id
admin_role = None
mod_role = cfg["roles"]["mod"]
banned_role = cfg["roles"]["banned"]

# Find admin role id by name
roles = request("GET", f"/guilds/{GUILD}/roles")
for r in roles:
    if r["name"].lower() == "admin":
        admin_role = r["id"]
        break

print(f"admin_role={admin_role} mod_role={mod_role} banned_role={banned_role}")

# ---------- 1) ADMIN-ONLY: hide whole 'إدارة' category + log channel ----------
admin_cat = cfg["categories"]["admin"]
log_id = cfg.get("log_channel_id") or cfg["channels"].get("log")
admin_targets = [cid for cid in (admin_cat, log_id) if cid]
for ch_id in admin_targets:
    print(f"\n[ADMIN-ONLY] {ch_id}")
    # Deny @everyone view
    put_overwrite(ch_id, EVERYONE_ID, 0, allow=0, deny=VIEW_CHANNEL)
    # Allow admin role full
    if admin_role:
        put_overwrite(ch_id, admin_role, 0,
                      allow=VIEW_CHANNEL | SEND_MESSAGES | READ_MESSAGE_HISTORY |
                            EMBED_LINKS | ATTACH_FILES | MANAGE_MESSAGES, deny=0)
    # Allow mod role view + send
    put_overwrite(ch_id, mod_role, 0,
                  allow=VIEW_CHANNEL | SEND_MESSAGES | READ_MESSAGE_HISTORY |
                        EMBED_LINKS | ATTACH_FILES, deny=0)
# Make sure log channel inherits the category by syncing parent (set parent_id)
if log_id:
    try:
        patch_channel(log_id, {"parent_id": admin_cat})
    except Exception as e:
        print(f"warn: parent set: {e}")

# ---------- 2) READ-ONLY for members ----------
read_only_keys = ["rules", "announcements", "prizes", "leaderboard", "archive", "stats"]
read_only_ids = [cfg["channels"][k] for k in read_only_keys if k in cfg["channels"]]
allow_read = VIEW_CHANNEL | READ_MESSAGE_HISTORY | ADD_REACTIONS
deny_read = SEND_MESSAGES | USE_APPLICATION_COMMANDS

for ch_id in read_only_ids:
    print(f"\n[READ-ONLY] {ch_id}")
    put_overwrite(ch_id, EVERYONE_ID, 0, allow=allow_read, deny=deny_read)
    if admin_role:
        put_overwrite(ch_id, admin_role, 0,
                      allow=VIEW_CHANNEL | SEND_MESSAGES | READ_MESSAGE_HISTORY |
                            EMBED_LINKS | ATTACH_FILES | MANAGE_MESSAGES |
                            MENTION_EVERYONE | USE_APPLICATION_COMMANDS, deny=0)
    put_overwrite(ch_id, mod_role, 0,
                  allow=VIEW_CHANNEL | SEND_MESSAGES | READ_MESSAGE_HISTORY |
                        EMBED_LINKS | ATTACH_FILES | MANAGE_MESSAGES |
                        MENTION_EVERYONE | USE_APPLICATION_COMMANDS, deny=0)

# ---------- 3) OPEN-WRITE: members can send + use bot ----------
open_keys = ["start", "current", "discussion", "reports", "welcome"]
open_ids = [cfg["channels"][k] for k in open_keys if k in cfg["channels"]]
allow_open = VIEW_CHANNEL | SEND_MESSAGES | READ_MESSAGE_HISTORY | ADD_REACTIONS | USE_APPLICATION_COMMANDS

for ch_id in open_ids:
    print(f"\n[OPEN-WRITE] {ch_id}")
    put_overwrite(ch_id, EVERYONE_ID, 0, allow=allow_open, deny=0)
    # Ensure banned role still denied on competition channels
    if ch_id in (cfg["channels"].get("start"), cfg["channels"].get("current")):
        put_overwrite(ch_id, banned_role, 0, allow=0, deny=VIEW_CHANNEL)

# ---------- 4) Voice channels: open ----------
vc_keys = ["voice_general", "voice_competitions", "voice_tournament_1", "voice_tournament_2"]
voice_cfg = cfg.get("voice_channels", {})
voice_ids = [voice_cfg.get(k.replace("voice_", "")) for k in vc_keys if voice_cfg.get(k.replace("voice_", ""))]
# but the key shape: {"general": id, "competitions": id, "tournament_1": id, "tournament_2": id}
voice_ids = [v for v in voice_cfg.values() if v]
allow_voice = VIEW_CHANNEL | CONNECT_VOICE | SPEAK_VOICE | USE_APPLICATION_COMMANDS

for ch_id in voice_ids:
    print(f"\n[VOICE-OPEN] {ch_id}")
    put_overwrite(ch_id, EVERYONE_ID, 0, allow=allow_voice, deny=0)

print("\n✅ DONE — all permissions reapplied")
