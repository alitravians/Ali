# Competitions Bot — Public Web Panel

Read-only Next.js 14 panel that displays the bot's leaderboard and aggregate
stats to the public. Designed to be deployed on Vercel.

## How it works

The bot exposes a minimal HTTP API (see `bot/cogs/webapi.py`) on
`WEBAPI_PORT` (default `8080`). This panel fetches that API at server-side
render time with Next's revalidation hints, so pages are fast for readers
but never more than ~30 seconds stale.

```
[ Discord users ] ──► [ CompetitionsBot on fly.io ] ──┐
                                  ▲                   │ aiohttp on :8080
                                  │                   ▼
                          [ Vercel webpanel ] ── fetch /api/leaderboard
                                  ▲                       /api/stats
                                  │                       /api/profile/{id}
                          [ Public users ]
```

## Local development

```bash
cd CompetitionsBot/webpanel
npm install
cp .env.example .env.local   # then edit NEXT_PUBLIC_API_BASE
npm run dev
```

For local dev against a local bot:
```
NEXT_PUBLIC_API_BASE=http://localhost:8080
```

## Deploy to Vercel

1. Import this `CompetitionsBot/webpanel` folder as a new Vercel project
   (Project Settings → Root Directory = `CompetitionsBot/webpanel`).
2. Set the environment variable:
   - `NEXT_PUBLIC_API_BASE` = the public URL where the bot's HTTP API is
     reachable (e.g. `https://competitions-bot.fly.dev`).
3. Set `WEBAPI_CORS_ORIGIN` on the bot side (fly secrets) to the Vercel URL
   so the API only allows requests from the panel:
   ```
   flyctl secrets set WEBAPI_CORS_ORIGIN=https://your-panel.vercel.app
   ```
4. Deploy.

## Pages

| Path                   | Notes                                      |
|------------------------|--------------------------------------------|
| `/`                    | Landing — totals + bot status              |
| `/leaderboard?scope=…` | Top 50 by all/weekly/monthly points        |
| `/stats`               | Detailed totals + bot health               |

## Adding new pages

Each page is a server component that calls `api.*` from `lib/api.ts`. Set
the page's `revalidate` constant to control caching (`30` for leaderboards,
`60` for stats, `300+` for things that rarely change).
