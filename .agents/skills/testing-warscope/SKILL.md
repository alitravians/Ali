# Testing WarScope Application

## Overview
WarScope is a real-time war tracking web application built with React 18 + TypeScript + Vite + Tailwind CSS v4. It features auto-generating events, interactive maps, and multi-page state synchronization.

## Deployed Environment
- **Live URL**: https://dist-mvivermt.devinapps.com
- **No authentication required** — static frontend deployment on devinapps.com
- **No CI checks configured** on the repo

## Local Development
```bash
cd war-tracker
npm install
npm run dev        # starts Vite dev server
npm run build      # production build
npm run lint       # ESLint check
```

## Key Feature: Real-Time Auto-Update
The app generates simulated events automatically without any backend:

- **How it works**: `LiveDataContext.tsx` uses recursive `setTimeout` to generate events
- **Initial delay**: 5-15 seconds after page load before first event
- **Event interval**: 15-45 seconds between subsequent events
- **All pages share state** via React Context (`LiveDataProvider` wraps the app in `App.tsx`)

### Testing Real-Time Updates
1. Navigate to `/live` page
2. Note the initial event count (displayed as "X حدث" in the events panel)
3. Wait 15-45 seconds — the count should increase automatically
4. Verify the green "+N جديد" badge appears in the navbar
5. New events appear at the TOP of the event list with recent timestamps ("منذ أقل من دقيقة")
6. Navigate to other pages (Home `/`, Alerts `/alerts`) — same events should be visible

### Key UI Elements to Verify
- **Event count**: Right side panel header shows "X حدث"
- **Navbar badge**: Green pulsing "+N" badge next to "LIVE" text
- **Live Tracking badge**: "+N جديد" button in the Live Tracking header
- **Breaking ticker**: Scrolling ticker at top of page updates with new breaking event headlines
- **Indicators**: 5 score cards (Military, Airspace, Shipping, Civilian, Uncertainty) — values change based on event category
- **Alerts page**: Total alert count increases when breaking events are auto-generated
- **Timeline**: Bottom section shows events chronologically with timestamps

### Initial Mock Data
- 12 events in `mockData.ts`
- 6 alerts in `mockData.ts`
- After page load, counts should increase as new events are generated

## Page Routes
- `/` — Home (hero + indicators + map preview + top events)
- `/live` — Live Tracking (main feature page with map, events, timeline)
- `/analysis` — AI Analysis (display components, no real AI yet)
- `/sources` — Sources listing
- `/cities` — City tracking
- `/alerts` — Alert notifications
- `/admin` — Admin dashboard (6 tabs)

## Tech Stack
- React 18 + TypeScript + Vite
- Tailwind CSS v4
- Leaflet + React-Leaflet (maps)
- Recharts (charts)
- React Router v7
- date-fns with Arabic locale
- Lucide React (icons)

## Devin Secrets Needed
None — this is a static frontend with no backend or API keys required.

## Common Issues
- **Chunk size warning during build**: Non-blocking warning (~887 kB). Code splitting would help but is not critical.
- **Event timing**: Events generate on random intervals (15-45s), so testing requires patience. Wait at least 45 seconds to be sure.
- **Context reset on navigation**: Events persist across SPA navigation but reset on full page refresh (F5) since there's no backend persistence.
