# Deployment Guide — WarScope

## Frontend (Vercel)

### Production URL
`https://dist-mu-taupe-70.vercel.app`

### Vercel Project Setup
There are TWO Vercel projects — use the correct one:
- `warscope` project → aliased to `dist-mu-taupe-70.vercel.app` (PRODUCTION)
- `dist-mu-taupe-70` project → different URL (NOT production)

### Deploy Commands
```bash
cd /path/to/war-tracker

# Set correct project
mkdir -p .vercel
echo '{"projectId":"warscope","orgId":"team_Ejgun9t4NxnuP6rWpOEZFCZl"}' > .vercel/project.json

# Deploy
npx vercel deploy --prod --yes
```

### Important Notes
- Vercel builds from source (`tsc -b && vite build`), so push source changes first
- `vercel.json` contains SPA rewrites AND security headers (CSP, HSTS, etc.)
- If backend URL changes, update CSP `connect-src` in `vercel.json`
- Never create new deployment URLs — always update the existing one
- After deploy, verify with Ctrl+Shift+R (hard refresh)

## Backend (Fly.io)

### Production URL
`https://war-tracker-backend-v2.fly.dev`

### App Name
`war-tracker-backend-v2`

### Deploy Commands
```bash
cd /path/to/war-tracker-backend
fly deploy
```

### Configuration (`fly.toml`)
- Region: `iad` (US East)
- Internal port: 8080
- Auto-stop: enabled (stops when idle)
- Auto-start: enabled
- Min machines: 1
- Force HTTPS: true

### Environment Variables (Fly.io Secrets)
- `GROQ_API_KEY` — For AI analysis and smart bug report responses
- `DEVIN_API_KEY` — For Devin auto-fix integration
- `DEVIN_TARGET_SESSION_ID` — Target session for forwarding bug reports
- `NEWSAPI_KEY` — (optional) NewsAPI.org key
- `MEDIASTACK_KEY` — (optional) MediaStack key
- `ACLED_KEY` — (optional) ACLED API key
- `AISSTREAM_API_KEY` — (optional) AISStream for maritime tracking

### Dockerfile
- Base: `python:3.12-slim`
- Installs from `requirements.txt`
- Runs: `uvicorn main:app --host 0.0.0.0 --port 8080`

## Verification Checklist
After deploying either frontend or backend:
1. Hard refresh the production URL (Ctrl+Shift+R)
2. Check the status page: `/status`
3. Test the bug report button
4. Verify WebSocket connection (check browser console)
5. Test on mobile viewport
