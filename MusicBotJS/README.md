# MusicBotJS — Node.js music bot for Discord (DAVE-native)

Third-generation rebuild of the A❤️M music bot. Built on top of `discord.js` v14
and `@discordjs/voice` 0.19+, which uses libdave directly for DAVE E2EE voice —
sidestepping the koe 3.0.0-pre6 MLS-handshake bug that left the previous
Lavalink-based build silent.

## Why this exists

| Build | Stack | DAVE handshake | Status |
| --- | --- | --- | --- |
| MusicBot (Python, davey 0.1.5) | `discord.py` + raw RTP | ❌ MLS pending group never completes | abandoned |
| MusicBot Lavalink (wavelink + Java koe) | Lavalink v4.2.2 + koe 3.0.0-pre6 | ❌ koe never sends MLS_KEY_PACKAGE op:26 | abandoned |
| **MusicBotJS (this)** | `discord.js` + `@discordjs/voice` | ✅ native `DAVESession` | active |

## Layout

- `src/index.js` — bot entry, slash command registration, event wiring
- `src/config.js` — env + `server_config.json` loader
- `src/commands/index.js` — slash command definitions
- `src/player.js` — per-guild `MusicPlayer` (queue, audio resource, voice
  connection)
- `src/resolver.js` — YouTube / SoundCloud / search resolver
- `src/format.js` — embed helpers
- `Dockerfile` / `fly.toml` — deploys to fly.io app `music-bot-am-js`

## Required environment

- `DISCORD_BOT_TOKEN` (required)
- `GUILD_ID` (required for instant guild-scoped command registration)
- `DEFAULT_VOLUME` (default `70`)
- `MAX_QUEUE_LENGTH` (default `100`)
- `IDLE_DISCONNECT_SECONDS` (default `300`)

## Slash commands

`/play` `/skip` `/stop` `/pause` `/resume` `/queue` `/now` `/volume` `/join`
`/leave` `/shuffle` `/clear` `/loop`

## Local run

```bash
cd MusicBotJS
npm install
DISCORD_BOT_TOKEN=... GUILD_ID=... node src/index.js
```

## Deploy

```bash
fly deploy --config MusicBotJS/fly.toml --dockerfile MusicBotJS/Dockerfile
```
