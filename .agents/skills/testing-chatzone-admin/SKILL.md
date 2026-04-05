# Testing ChatZone Admin Panel

## Overview
ChatZone is a Next.js 14 + Socket.IO + PostgreSQL chat platform deployed on Fly.io at https://chatzone-platform.fly.dev/.

## Admin Access
1. Navigate to the homepage
2. Enter admin access code in the code input field
3. If not logged in, you'll be redirected to login first — after login you'll return to the homepage where you can re-enter the code
4. Admin credentials: use the admin account (email + password) to log in
5. Access code grants admin panel access based on the user's role level in the database

## Devin Secrets Needed
- `ADMIN_ACCESS_CODE` — Admin panel access code
- `MODERATOR_ACCESS_CODE` — Moderator panel access code
- Admin account credentials (email/password)

## Testing Settings Toggles

### Registration Toggle
- Located in: Settings → "🔒 الأمان والتسجيل" card
- Toggle label: "تفعيل التسجيل"
- **IMPORTANT**: To verify registration page state, you must use Playwright in a fresh unauthenticated browser context (logged-in users get redirected away from /register)
- When disabled: `/register` shows 🚫 icon + "التسجيل مغلق حالياً" text + NO form inputs
- When enabled: `/register` shows form with username, email, password, confirm password fields

### Chat Toggle
- Located in: Settings → "💬 إعدادات الدردشة" card
- Toggle label: "تفعيل الدردشة"
- When disabled: `/chat` shows yellow ⚠️ banner at top: "الدردشة معطّلة حالياً من قبل الإدارة"
- When enabled: No banner, message input functional
- Can be tested directly in the admin's browser session (no need for separate context)

### Testing Workflow for Toggles
1. Toggle the setting in admin panel
2. Click "حفظ الإعدادات" (Save Settings)
3. Wait for green toast "تم حفظ الإعدادات بنجاح"
4. Verify the change on the public-facing page
5. Toggle back to prove two-way control (not just one-way break)

## Common Pitfalls

### Next.js API Caching
- Next.js caches GET API routes by default
- If admin settings changes don't take effect, check that the API route has `export const dynamic = 'force-dynamic'` and `Cache-Control: no-store` headers
- The `/api/site-status` endpoint is the public configuration endpoint — it must always return fresh data

### Playwright for Unauthenticated Testing
- Install playwright in the project: `npm install playwright` + `npx playwright install chromium`
- Run scripts from within the project directory (not /tmp) so `require('playwright')` resolves
- Use `chromium.launch({ headless: true })` with a fresh `browser.newContext()` for unauthenticated state

### Admin Panel Navigation
- Settings page defaults to showing "🌐 إعدادات الموقع" section
- Click the specific card (e.g., "💬 إعدادات الدردشة") to expand the section you need
- All settings share one save button at the bottom

### Deployment on Fly.io
- Environment variables must be set via `fly secrets set` on Fly.io
- After deploying, the app may take 30-60 seconds to restart
- Verify changes in a fresh incognito session to avoid browser cache issues
- Access codes (`ADMIN_ACCESS_CODE`, `MODERATOR_ACCESS_CODE`) must be set as Fly.io secrets in production — the app refuses login if they're missing

## Admin Panel Tabs
The admin panel has 8 main tabs:
1. 📊 لوحة القيادة (Dashboard)
2. 🏠 إدارة الغرف (Room Management)
3. 📢 الإعلانات (Announcements)
4. 👥 المستخدمين (Users)
5. ⚖️ العقوبات (Penalties)
6. 🚨 البلاغات (Reports)
7. 📋 السجل الإداري (Admin Log)
8. ⚙️ الإعدادات (Settings)

Plus a separate page: 👨‍💼 فريق العمل (Team) at `/admin/team`
