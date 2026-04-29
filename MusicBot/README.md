# 🎵 MusicBot

Stand-alone Discord music bot for the A❤️M's server. Sibling project to
`CompetitionsBot/` — separate bot user, separate fly.io app, separate
permissions. Built with discord.py 2.4 + yt-dlp + FFmpeg.

## Why a separate bot?

- **Resource isolation**: voice + ffmpeg are CPU-hungry and unstable in
  rare cases. Crashing the music bot must not crash the quiz bot.
- **Tighter scopes**: this bot only needs `Connect`, `Speak`, `Send
  Messages`, and slash command perms — no `Manage Channels` /
  `Manage Messages`.
- **Independent scaling**: deploys, restarts, and metrics are per-bot.

## Commands

Member-facing (visible to everyone):

| Command | Purpose |
|---|---|
| `/play <url-or-search>` | Resolve a YouTube URL or search and queue it |
| `/skip` | Skip the current track |
| `/queue` | Show the queue (top 10 + total count) |
| `/pause` / `/resume` | Pause / resume the current track |
| `/stop` | Stop, clear queue, leave the channel |
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
| `/admin_music_health` | Diagnostics: guild count, active players, latency |

## Local dev

```bash
cd MusicBot
cp .env.example .env   # then fill in DISCORD_BOT_TOKEN + GUILD_ID
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Requires ffmpeg + libopus on the host:
#   Debian/Ubuntu: sudo apt install ffmpeg libopus0
#   macOS:         brew install ffmpeg opus

python -m bot.main
```

## Production deploy (fly.io)

```bash
fly apps create music-bot-am --org personal
fly secrets set -a music-bot-am \
    DISCORD_BOT_TOKEN=<token> \
    GUILD_ID=1165790728551669780 \
    ENABLE_MEMBERS_INTENT=1
fly deploy -a music-bot-am
```

The included `Dockerfile` installs ffmpeg + libopus and runs
`python -m bot.main` as the only process.

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
`errors`, `admin`) all default to the existing `📥│بوتات-مستقبلية`
channel under the `🤖 ━ سجلات البوتات ━` admin-only category. Once the
bot is live, run a small script (or replace the IDs by hand) to point
each one at a dedicated `🎵-music-*` log channel.
