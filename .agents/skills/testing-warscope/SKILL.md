# Testing WarScope War Tracker Application

## Overview
WarScope is a real-time war tracking platform built with React (frontend) + FastAPI (backend). It fetches live news from GDELT and NewsAPI, deduplicates events across sources, assigns trust scores, and delivers updates via WebSocket.

## Deployed Environment
- **Frontend:** Deployed to devinapps.com (static site)
- **Backend:** Deployed to Fly.io (FastAPI + uvicorn)
- **Backend WebSocket:** `wss://<backend-host>/ws`
- **Backend REST API:** `https://<backend-host>/api/events?limit=100`
- **Admin password:** Hardcoded in `src/pages/Admin.tsx` (search for `ADMIN_PASSWORD`)

## Devin Secrets Needed
- `NEWSAPI_KEY` — For NewsAPI integration (get from https://newsapi.org/register)
- `GEMINI_API_KEY` — For Google Gemini AI analysis (get from https://aistudio.google.com/apikey)

## Key Architecture for Testing

### Real vs Mock Data Detection
The frontend has a fallback system in `src/context/LiveDataContext.tsx`:
- **Real data:** Comes via WebSocket (`initial_data`/`events_update` messages) or REST API (`/api/events`)
- **Mock data:** Generated locally by `liveEventGenerator.ts` when WebSocket fails
- **How to distinguish:** Mock data starts with exactly 12 events from `mockData.ts`. Real data typically has 20-60+ events.
- **Console indicators:**
  - Real: `[WS] Connected to backend` and `[API] Fetched N events via REST`
  - Fallback: `[Fallback] No backend connection, starting mock event generator`

### Event Deduplication
- Events from multiple sources about the same topic are merged into one card
- Multi-source events show "N مصادر" (N sources) on the card
- Clicking "تفاصيل" (Details) expands to show the "المصادر:" section listing all source domains
- Trust levels based on source count:
  - 1 source → "قيد التحقق" (Checking)
  - 2-4 sources → "مرجّح" (Likely)
  - 5+ sources → "مؤكد" (Confirmed)

### Admin Authentication
- Password stored client-side in `Admin.tsx` (`ADMIN_PASSWORD` constant)
- Session persisted via `sessionStorage` key `warscope_admin_auth`
- Wrong password shows red border + "كلمة المرور غير صحيحة" error
- Correct password reveals admin dashboard with 6 tabs

## Testing Procedures

### Test 1: Verify Real Backend Data
1. Navigate to the live tracking page (`/live`)
2. Use `browser_console` tool to check for `[WS] Connected to backend` message
3. Verify event count in sidebar shows number > 12 (mock = exactly 12)
4. Look for events with "N مصادر" where N >= 2 (mock events always have 1 source)

### Test 2: Verify Event Deduplication
1. On `/live` page, find an event card showing "N مصادر" where N >= 3
2. Click "تفاصيل" (Details) button to expand
3. Verify "المصادر:" section lists N distinct source domains
4. Verify trust badge matches source count (5+ = "مؤكد")

### Test 3: Verify Admin Authentication
1. Navigate to `/admin`
2. Verify password form with lock icon is shown (NOT dashboard)
3. Enter wrong password → verify red border + error message
4. Enter correct password → verify dashboard with tabs appears

## Tips
- The breaking news ticker at the top scrolls real headlines — useful visual indicator of real data
- The map uses Esri World Imagery (satellite) tiles with pulsing markers for events
- Backend polls GDELT every 5 minutes and NewsAPI every 5 minutes
- Events are stored in-memory on the backend (max 500, newest first)
- If backend is down, frontend falls back to mock data automatically — check console to confirm which mode
- The site is fully in Arabic with RTL layout
- Admin `sessionStorage` persists across page navigation within the same tab but clears on tab close
