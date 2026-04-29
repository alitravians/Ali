# 🎵 MusicBot v2 — Lavalink edition

Stand-alone Discord music bot for the A❤️M's server. Sibling project to
`CompetitionsBot/` — separate bot user, separate fly.io app, separate
permissions.

## Architecture (rewritten 2026-04-29)

> **Why a rewrite?** The previous version (discord.py + ffmpeg + davey
> 0.1.5) hit a hard wall on Discord's mandatory DAVE end-to-end voice
> encryption rolled out in 2026-Q1. The Python `davey 0.1.5` MLS
> handshake stalls after `MLS_EXTERNAL_SENDER` for headless single-bot
> voice channels (`can_encrypt=False`), so listeners hear silence even
> though packets flow. There is no library-level workaround.
>
> The fix is to delegate audio to **Lavalink**, which ships its own
> battle-tested DAVE implementation (`libdave 0.1.3+`, bundled in
> Lavalink 4.2+). Lavalink opens its own voice WebSocket and UDP socket
> to Discord; the Python bot only speaks the gateway.

```
┌────────────────────────┐        ┌──────────────────────────┐
│  music-bot-am          │  ws    │  music-lavalink-am       │
│  (Python, discord.py)  │ <────> │  (Java, Lavalink 4.2.2)  │
│  - slash commands      │  HTTP  │  - voice WS + UDP        │
│  - wavelink Pool       │        │  - opus encoding         │
│  - voice state proxy   │        │  - DAVE/MLS handshake    │
└─────────┬──────────────┘        │  - youtube-source 1.18+  │
          │ gateway WS            └──────────────────────────┘
          │                                   ▲
          ▼                                   │
        Discord ────────── voice WS ──────────┘
                       (Lavalink ↔ Discord)
```

Two fly.io apps in the same private 6PN network:

* `music-bot-am` — Python, `Dockerfile` at repo root.
* `music-lavalink-am` — Java, `lavalink/Dockerfile`.

The Python bot reaches Lavalink at
`http://music-lavalink-am.flycast:2333` (private, no public ports).

## Commands

Member-facing (visible to everyone):

| Command | Purpose |
|---|---|
| `/play <url-or-search>` | Queue a YouTube/SoundCloud URL or search query |
| `/skip` | Skip the current track |
| `/queue` | Show the queue (top 10 + total count) |
| `/pause` / `/resume` | Pause / resume the current track |
| `/stop` | Stop, clear queue |
| `/loop off\|track\|queue` | Toggle loop mode |
| `/volume 0..200` | Adjust volume live |
| `/nowplaying` | Show progress bar + metadata |
| `/join` / `/leave` | Force the bot in/out of voice |
| `/remove <pos>` | Remove a queued track |
| `/shuffle` | Shuffle the pending queue |
| `/help` / `/about` | Documentation |

Admin (hidden via `default_permissions(manage_guild=True)`):

| Command | Purpose |
|---|---|
| `/admin_music_stop` | Force-stop & disconnect (logs to admin channel) |
| `/admin_music_clear` | Clear the queue |
| `/admin_music_health` | Diagnostics: guilds, players, Lavalink node status |

## Local dev

```bash
cd MusicBot
cp .env.example .env   # then fill in DISCORD_BOT_TOKEN + GUILD_ID
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# In a second terminal, run Lavalink locally:
docker run --rm -p 2333:2333 \
    -v $PWD/lavalink/application.yml:/opt/Lavalink/application.yml \
    ghcr.io/lavalink-devs/lavalink:4.2.2-alpine

# Then run the bot, pointing at the local Lavalink:
LAVALINK_URI=http://127.0.0.1:2333 \
LAVALINK_PASSWORD=youshallnotpass \
python -m bot.main
```

## Production deploy (fly.io)

Two apps. Lavalink first, bot second.

### 1. Lavalink

```bash
cd lavalink
fly apps create music-lavalink-am --org personal
fly secrets set -a music-lavalink-am LAVALINK_SERVER_PASSWORD=<strong-password>
fly deploy -a music-lavalink-am --config fly.toml
```

### 2. Bot

```bash
cd ..
fly apps create music-bot-am --org personal   # if not already
fly secrets set -a music-bot-am \
    DISCORD_BOT_TOKEN=<token> \
    GUILD_ID=1165790728551669780 \
    LAVALINK_URI=http://music-lavalink-am.flycast:2333 \
    LAVALINK_PASSWORD=<same-strong-password>
fly deploy -a music-bot-am
```

The fly.io 6PN network (`*.flycast`) is private to your org, so
Lavalink is not reachable from the public internet.

## Required Discord setup

1. Create a new application in the Developer Portal (do *not* reuse the
   Competitions bot — they need separate identities).
2. Bot tab → reset token → put it in `DISCORD_BOT_TOKEN`.
3. Privileged Gateway Intents → enable **Server Members** (Message
   Content is optional for this bot).
4. OAuth2 → URL Generator: scopes `bot` + `applications.commands`.
   Permissions: `Connect`, `Speak`, `Use Voice Activity`, `Send
   Messages`, `Embed Links`, `Use Slash Commands`. Invite to the server.

## Logging

The three IDs in `server_config.json → bot_logs_channels` (`play`,
`errors`, `admin`) point at admin-only channels under the
`🤖 ━ سجلات البوتات ━` category. Update them as needed.
