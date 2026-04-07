# Testing WarScope War-Tracker Frontend

## Overview
WarScope is a React + TypeScript SPA for real-time conflict tracking, deployed on Vercel. The frontend is in `war-tracker/` and uses Vite, Tailwind CSS, React Router, and Leaflet maps.

## Deployed Site
- **Production URL**: `https://dist-mu-taupe-70.vercel.app`
- **Backend API**: `https://war-tracker-backend-kriplmgy.fly.dev`
- The site is in Arabic (RTL layout)

## Devin Secrets Needed
- `VERCEL_TOKEN` — for deploying updates via Vercel CLI (token name: "WarScope-Deploy", scoped to alitravians' projects)

## Build & Deploy
```bash
cd /home/ubuntu/repos/Ali/war-tracker
npm install
npm run build
# Deploy to Vercel:
cd dist && vercel deploy --prod --yes --token "$VERCEL_TOKEN" ./
```

## Browser Setup for Testing
The Chrome wrapper at `~/.local/bin/google-chrome` sends URLs to an existing Chrome instance via CDP on port 29229. If Chrome is not running:
```bash
# Find actual Chrome binary:
/opt/.devin/chrome/chrome/linux-133.0.6943.126/chrome-linux64/chrome --remote-debugging-port=29229 --no-first-run --disable-session-crashed-bubble "https://dist-mu-taupe-70.vercel.app/" &
```
If Chrome fails to start, clean up lock files first:
```bash
rm -f ~/.config/google-chrome/SingletonLock ~/.config/google-chrome/SingletonSocket ~/.config/google-chrome/SingletonCookie
```

## Known Issues
- **SPA Routing on Vercel**: Refreshing sub-routes like `/live`, `/analysis`, etc. returns 404. The `vercel.json` may need rewrites for SPA routing. Test persistence and navigation from the root URL `/` to work around this.
- **Google Translate popup**: Chrome may show an Arabic-to-English translation bar. Dismiss it by clicking the X button before starting tests.
- **Admin panel**: Backend endpoints `/api/admin/login` and `/api/stats` may return 404. Admin features can only be tested at the frontend level.

## Testing Patterns

### Phone Mode Feature
- **Toggle button**: Fixed at bottom-right corner (`z-[9998]`), text toggles between "وضع الهاتف" (activate) and "وضع الكمبيوتر" (deactivate)
- **CSS override pattern**: `.phone-mode` class on `<html>` + utility classes (`pm-show-mobile`, `pm-show-mobile-block`, `pm-hide`) override Tailwind responsive classes
- **localStorage key**: `warscope-phone-mode` stores `'true'` or `'false'`
- **Test flow**: Verify hamburger menu visible → sidebar opens with nav links → navigation works → deactivate restores desktop layout → F5 preserves state

### General UI Testing
- Always maximize browser before recording: `wmctrl -r :ACTIVE: -b add,maximized_vert,maximized_horz`
- The site loads events via WebSocket + REST fallback with retry logic
- Stat cards show 5 items in desktop, 2-column grid in phone mode
- Desktop navbar shows all nav links; phone mode shows hamburger menu instead
- Footer shows live connection count and today's event count

### Admin Panel Testing
- Navigate to `/admin` or click "لوحة الإدارة" in nav
- Admin password is handled by backend (no hardcoded password in frontend)
- Test wrong password → error message shown, stays on login form
- Test fake sessionStorage token → should be rejected
