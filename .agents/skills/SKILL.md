# WarScope Backend — Development Guide

## Project Overview
FastAPI backend for WarScope real-time geopolitical tracking. Aggregates data from multiple sources, provides AI analysis, manages bug reports, and monitors system health.

**Production URL:** https://war-tracker-backend-v2.fly.dev
**Frontend URL:** https://dist-mu-taupe-70.vercel.app
**Tech Stack:** Python 3.12, FastAPI, uvicorn, httpx, APScheduler, Pydantic, WebSockets
**AI:** Groq Llama 3.3 (via `groq` API)

## Project Structure
```
war-tracker-backend/
├── main.py              # FastAPI app, all endpoints, WebSocket, scheduling
├── config.py            # Environment variables, API keys, CORS origins
├── models.py            # Pydantic models (TrackerEvent, Alert, etc.)
├── health_monitor.py    # Service health checks, 90-day history, incidents
├── services/
│   ├── gdelt_service.py       # GDELT event fetcher (free, no key)
│   ├── rss_service.py         # RSS feed aggregator (free, no key)
│   ├── news_service.py        # NewsAPI.org fetcher (key required)
│   ├── mediastack_service.py  # MediaStack fetcher (key required)
│   ├── acled_service.py       # ACLED conflict data (key required)
│   ├── opensky_service.py     # OpenSky aircraft tracking (free)
│   ├── maritime_service.py    # AISStream vessel tracking (key required)
│   ├── ai_service.py          # AI translation & analysis (Groq)
│   ├── gemini_service.py      # Google Gemini integration
│   ├── devin_autofix.py       # Devin API for auto-fix sessions
│   └── dedup_engine.py        # Event deduplication
├── Dockerfile           # Python 3.12-slim, uvicorn
├── fly.toml             # Fly.io config (app: war-tracker-backend-v2)
├── requirements.txt     # pip dependencies
└── pyproject.toml       # Project metadata
```

## Key API Endpoints

### Data Endpoints
- `GET /api/events` — All tracked events
- `GET /api/events/{event_id}` — Single event details
- `GET /api/aircraft` — Aircraft positions (OpenSky)
- `GET /api/alerts` — Active alerts
- `GET /api/indicators` — Dashboard risk indicators
- `GET /api/sources` — Data source status
- `GET /api/ai/summary` — AI analysis summaries
- `GET /api/health` — Basic health check

### Status & Health
- `GET /api/status` — Full system status (services, incidents, uptime, days_without_incidents)
- Health Monitor runs checks every 1-5 minutes per service

### Bug Report System
- `POST /api/bug-report` — Submit bug report
  - Smart filter (keywords + AI) rejects suggestions/feedback
  - Rate limit: 3 per IP per 24h, 2-min global cooldown
  - Returns `ticket_id` (TKT-XXXXXXXX format)
  - Triggers AI smart response generation
- `GET /api/tickets/{ticket_id}` — Get ticket status
- `WS /ws/ticket/{ticket_id}` — Live ticket updates

### Admin/Devin
- `POST /api/devin/fix-session` — Create Devin auto-fix session
- `GET /api/devin/sessions` — List fix sessions
- `GET /api/devin/sessions/{session_id}` — Session status

### WebSocket
- `WS /ws` — Main real-time data stream (events, alerts, indicators)
- `WS /ws/ticket/{ticket_id}` — Ticket-specific updates

## Data Flow
1. **APScheduler** triggers polling tasks at configured intervals
2. Each service fetcher pulls data from its API
3. Events are deduplicated via `dedup_engine.py`
4. AI translation/analysis runs periodically (Groq Llama 3.3)
5. New events broadcast to connected WebSocket clients
6. Health monitor checks services independently

## Polling Intervals
| Source | Interval | Notes |
|--------|----------|-------|
| GDELT | 120s | Avoid 429 rate limits |
| RSS | 180s | Free, no limits |
| NewsAPI | 900s | 100 req/day free tier |
| OpenSky | 60s | Basic access, no key |
| AI Analysis | 900s | Conserve Groq quota |

## In-Memory Store (`DataStore`)
All data is stored in-memory (no database). The `DataStore` class holds:
- `events` — List of `TrackerEvent`
- `aircraft` — List of `AircraftPosition`
- `alerts` — List of `Alert`
- `ai_summaries` — List of `AISummary`
- `indicators` — Dashboard risk indicators (5 categories)
- `source_status` — Per-source health metrics

**Note:** Data resets on restart. This is by design for a real-time tracker.

## Bug Report Smart Responses
When a valid bug report is received:
1. Ticket created with unique ID
2. Description sent to Groq Llama 3.3 with safe Arabic prompt
3. AI generates 8 contextual status messages in Arabic
4. Messages delivered on a timed schedule (8-15s between each)
5. Each message advances phase (0→6) and updates progress (0→100%)
6. WebSocket broadcasts each update to connected clients
7. All messages are safe — no filenames, code, or internal details
8. Uses "الدعم الفني المختص" instead of "Devin" in all messages

## Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Yes | Groq AI for analysis & smart responses |
| `DEVIN_API_KEY` | No | Devin API for auto-fix sessions |
| `DEVIN_TARGET_SESSION_ID` | No | Target session for bug report forwarding |
| `NEWSAPI_KEY` | No | NewsAPI.org (100 req/day free) |
| `MEDIASTACK_KEY` | No | MediaStack news |
| `ACLED_KEY` | No | ACLED conflict data |
| `AISSTREAM_API_KEY` | No | AISStream maritime tracking |
| `CORS_DEV` | No | Set to `1` to enable localhost CORS |

## Deployment (Fly.io)
```bash
cd war-tracker-backend
fly deploy
```
- App name: `war-tracker-backend-v2`
- Region: `iad` (US East)
- Port: 8080
- Auto-stop/start: enabled
- Min machines: 1

### Set Secrets
```bash
fly secrets set GROQ_API_KEY=xxx
fly secrets set DEVIN_API_KEY=xxx
fly secrets set DEVIN_TARGET_SESSION_ID=xxx
```

## CORS Configuration (`config.py`)
Allowed origins:
- `https://dist-mu-taupe-70.vercel.app` (production frontend)
- `https://war-tracker-backend-v2.fly.dev` (self)
- `http://localhost:5173` and `http://localhost:3000` (only with CORS_DEV=1)

## Region of Interest
Events are filtered to Middle East bounding box:
- Latitude: 24.0° to 40.0°
- Longitude: 30.0° to 65.0°
- Countries: Iran, Israel, Lebanon, Syria, Iraq, Yemen, Palestine, Bahrain, Kuwait, Qatar, UAE, Saudi Arabia, Jordan, Oman
