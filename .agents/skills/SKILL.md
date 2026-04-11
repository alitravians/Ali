# WarScope Frontend — Development Guide

## Project Overview
WarScope is a real-time geopolitical event tracking dashboard focused on Middle East conflicts. Arabic-first UI with RTL layout.

**Production URL:** https://dist-mu-taupe-70.vercel.app
**Backend URL:** https://war-tracker-backend-v2.fly.dev
**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, React Router v7, Leaflet, Recharts

## Project Structure
```
src/
├── pages/              # Route-level page components
│   ├── Home.tsx        # Landing page with overview stats
│   ├── LiveTracking.tsx # Real-time map with events (/live)
│   ├── Analysis.tsx    # AI-powered event analysis (/analysis)
│   ├── Cities.tsx      # City-specific event pages (/cities, /cities/:slug)
│   ├── Alerts.tsx      # Alert notifications (/alerts)
│   ├── Sources.tsx     # Data source status (/sources)
│   ├── StatusPage.tsx  # System health dashboard (/status)
│   └── Admin.tsx       # Admin control panel (/admin)
├── components/
│   ├── shared/         # Reusable components
│   │   ├── BugReportButton.tsx    # Global bug report floating button
│   │   ├── RepairTracker3D.tsx    # Bug report animation page (7-phase)
│   │   ├── LoadingScreen.tsx      # App loading screen
│   │   ├── EventCard.tsx          # Event display card
│   │   ├── EventDetailModal.tsx   # Event detail modal
│   │   ├── AlertToast.tsx         # Toast notifications
│   │   ├── BahrainAlertBanner.tsx # Bahrain-specific alert
│   │   ├── TrustBadge.tsx         # Event trust level indicator
│   │   └── PhoneModeToggle.tsx    # Mobile viewport toggle
│   ├── ai/             # AI summary components
│   │   ├── AISummary.tsx
│   │   └── AISummaryModal.tsx
│   ├── map/            # Map components
│   │   └── LiveMap.tsx  # Leaflet-based live map
│   ├── layout/         # Layout components
│   │   ├── Layout.tsx   # Main layout wrapper
│   │   ├── Navbar.tsx   # Top navigation
│   │   ├── Sidebar.tsx  # Side navigation
│   │   ├── BreakingTicker.tsx  # Breaking news ticker
│   │   └── FooterStats.tsx     # Footer statistics
│   ├── maritime/       # Maritime tracking
│   └── timeline/       # Event timeline
├── config/
│   └── api.ts          # Backend URL config (IMPORTANT: single source of truth)
├── context/
│   ├── LiveDataContext.tsx   # Real-time data via WebSocket
│   └── PhoneModeContext.tsx  # Phone mode state
├── hooks/
│   └── useAlertSound.ts     # Alert sound effects
├── types/
│   └── index.ts             # TypeScript type definitions
├── utils/
│   └── helpers.ts           # Utility functions
└── data/
    └── staticConfig.ts      # Static configuration data
```

## Key Features

### Bug Report System (`BugReportButton.tsx` + `RepairTracker3D.tsx`)
- Floating red button on all pages (bottom-left for RTL)
- Collects: description, page path, browser info, console errors, user actions, page snapshot
- **Smart Filter:** AI-based detection rejects suggestions/feedback, only accepts technical problems
- **Rate Limiting:** Max 3 reports per user (IP) per 24 hours
- **Min description:** 5 characters
- **7-Phase Animation Page:** Shows repair progress with isometric 3D office scene
  - Phase 0: Report received
  - Phase 1: Analysis
  - Phase 2: Root cause identified
  - Phase 3: Fixing
  - Phase 4: Verification
  - Phase 5: Deployment
  - Phase 6: Resolved
- **Smart AI Responses:** Each report gets customized status messages via Groq/Llama AI
- **Real-time updates:** WebSocket primary, HTTP polling fallback (10s interval)
- **Typewriter effect:** Latest status message types character by character
- **Entrance animations:** Staggered cinematic entrance for all UI elements
- **Neon progress bar:** Multi-color shimmer with glow effects
- **Connection states:** LIVE (WebSocket), POLLING (HTTP), SYNCING (reconnecting), CONNECTING
- Uses "الدعم الفني المختص" instead of "Devin" in all user-facing text

### Status Page (`StatusPage.tsx`)
- Monitors 10 services grouped by category:
  - **Infrastructure (3):** Backend API, WebSocket Server, Frontend
  - **Data Sources (4):** GDELT, RSS Feeds, NewsAPI*, MediaStack*
  - **External APIs (3):** OpenSky, AISStream*, ACLED*
  (* = disabled, with explanation)
- 90-day uptime history bar per service (green/red/gray)
- "X days without incidents" counter
- Response time charts (hidden when all values are 0ms)
- Auto-refresh every 30 seconds
- Disabled services show explanation ("لا يتوفر مفتاح API حالياً")
- Incident history log

### Cities Page (`Cities.tsx`)
- Lists cities with event counts
- City detail: map auto-centers on city coordinates (zoom=11)
- Shows "لا توجد أحداث حالياً" with positive message when no events

## Build & Development
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (Vite, port 5173)
npm run build        # Build: tsc -b && vite build
npm run lint         # ESLint
npm run preview      # Preview production build
```

## Deployment (Vercel)
**CRITICAL:** Always deploy to the same production URL. Never create new URLs.

```bash
# Ensure .vercel/project.json has:
# {"projectId":"warscope","orgId":"team_Ejgun9t4NxnuP6rWpOEZFCZl"}
mkdir -p .vercel
echo '{"projectId":"warscope","orgId":"team_Ejgun9t4NxnuP6rWpOEZFCZl"}' > .vercel/project.json

# Deploy to production
npx vercel deploy --prod --yes
```

**Important Notes:**
- Vercel builds from source (runs `tsc -b && vite build`)
- Must commit and push source code changes before deploying
- Production URL: `https://dist-mu-taupe-70.vercel.app`
- SPA routing handled by `vercel.json` rewrites
- CSP headers in `vercel.json` — update `connect-src` if backend URL changes

## Backend API Configuration
All API calls go through `src/config/api.ts`:
```typescript
const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL || 'https://war-tracker-backend-v2.fly.dev';
export const BACKEND_API_URL = BACKEND_BASE;
export const BACKEND_WS_URL = BACKEND_BASE.replace(/^http/, 'ws') + '/ws';
```

## UI Conventions
- **Language:** All UI text in Arabic
- **Direction:** RTL layout throughout
- **Dark theme:** Dark backgrounds (#0a0e1a, #12121a)
- **Color scheme:** Blue (#3b82f6) primary, Green (#22c55e) success, Red (#ef4444) error
- **Font sizes:** 9-11px for secondary text, 13-14px for primary
- **No emojis in code** unless user explicitly requests
- **No ticket/ID system** in bug reports — reports are fire-and-forget with animation
