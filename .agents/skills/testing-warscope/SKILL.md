# Testing WarScope (war-tracker)

## Application Overview
WarScope is an Arabic RTL real-time war/conflict tracking platform built with React + TypeScript + Vite. It features a live event map, event cards, maritime tracking, AI analysis, alert sounds, and an admin panel.

## Deployment
- **Frontend:** Deployed on Vercel at `https://dist-mu-taupe-70.vercel.app`
- **Backend:** Deployed on Fly.io at `https://war-tracker-backend-kriplmgy.fly.dev`
- **WebSocket:** `wss://war-tracker-backend-kriplmgy.fly.dev/ws`

## Devin Secrets Needed
- `VERCEL_TOKEN` — for deploying frontend updates to Vercel (saved as org secret)
- `GROQ_API_KEY` — Groq AI API key for the backend AI fallback chain

## Known Backend Limitations
Some backend endpoints may return 404:
- `/api/admin/login` — admin auth endpoint might not be deployed
- `/api/stats` — stats endpoint might not be deployed

When these return 404, test the **frontend fallback behavior** instead:
- Footer stats should derive counts from loaded events (not show 0)
- Admin panel should be accessible via frontend-only auth bypass for testing

## Admin Panel Access (for testing)
If `/api/admin/login` returns 404, bypass auth via browser console:
```js
sessionStorage.setItem('warscope_admin_token', 'test');
```
Then refresh the page. The admin panel will render with frontend-only auth.

## Key Pages & Routes
- `/` — Home page with hero, risk indicators, map preview, recent events
- `/live` — Main tracking page with full map, event list, maritime panel, filters
- `/analysis` — AI analysis page
- `/sources` — Data sources
- `/cities` — City-specific tracking
- `/alerts` — Alert list
- `/admin` — Admin panel (6 tabs: sources, map layers, event review, alerts, AI, system)

## Testing Patterns

### Event Loading
- Events load via REST API with 3x retry + exponential backoff
- Console should show `[API] Fetched N real events via REST` on success
- Console warnings like `[API] Source status fetch failed` are expected if those endpoints aren't deployed
- WebSocket connects for real-time updates: `[WS] Connected to backend`

### Footer Stats
- Footer shows: "X متصل الآن" (connected now), "Y حدث اليوم" (events today), "WarScope v1.1"
- When `/api/stats` returns 404, the fallback calculates today's events from loaded data
- WiFi icon color reflects `connectionStatus`: green=connected, yellow=connecting, red=disconnected

### Mute Toggle
- Speaker icon in top navbar toggles between Volume2 (unmuted) and VolumeX (muted)
- State persisted in `localStorage.getItem('warscope_muted')` — values "true"/"false"
- Button title toggles between "كتم الصوت" (mute) and "تشغيل الصوت" (unmute)
- If direct click doesn't register (small target), use JS: `document.querySelector('button[title="كتم الصوت"]').click()`

### Share Button
- Hover over event cards in the `/live` events panel to reveal the share button
- Share copies URL using `window.location.origin` (dynamic, not hardcoded)
- Toast shows "تم نسخ الرابط!" on success
- Verify clipboard via console: `navigator.clipboard.readText().then(t => console.log(t))`
- Chrome may prompt for clipboard permission — click "Allow"

### Admin Panel Tabs
- **إدارة المصادر** (Sources) — source management table
- **طبقات الخريطة** (Map Layers) — layer toggles
- **مراجعة الأحداث** (Event Review) — pending events
- **التنبيهات** (Alerts) — alert management
- **التحليلات الذكية** (AI Analytics) — AI engine status, shows "Gemini / Groq Llama 3.3"
- **النظام** (System) — backend health with real latency ping, event/alert/source counts

### Admin System Tab Verification
- The system tab should show **real** latency values (e.g., "54ms") not hardcoded "45ms"
- Event counts should match actual loaded data
- Old hardcoded values to watch for (indicates bug): "99.9%", "45ms", "12", "1,247"

## Build & Lint
```bash
cd war-tracker
npm run build   # TypeScript + Vite build
npm run lint    # ESLint check
```

## Common Issues
- **Small click targets:** Mute button and share button can be hard to click precisely. Use JS click as fallback.
- **Clipboard permission:** Chrome prompts for clipboard access on first share click — must allow it.
- **Arabic RTL layout:** All UI is right-to-left. Navbar items flow right-to-left.
- **Loading screen:** Shows "WarScope" + "جاري الاتصال بالمصادر..." for up to 4 seconds on fresh load.
