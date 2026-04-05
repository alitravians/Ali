# Testing ChatZone Admin Panel

## Environment

- **Production URL**: `https://chatzone-platform.fly.dev/`
- **Tech Stack**: Next.js 14 + Socket.IO + PostgreSQL (Turso) + Prisma
- **Deployment**: Fly.io (`flyctl deploy --remote-only` from `chat-platform/` directory)

## Devin Secrets Needed

- `FLY_API_TOKEN` — for deploying to Fly.io (set via `flyctl auth token`)
- Admin credentials: `admin@chatzone.com` / `admin123` (access code: `3131`)

## Build & Deploy

```bash
cd chat-platform
npm run build      # Build Next.js app
flyctl deploy --remote-only  # Deploy to Fly.io
```

## Testing Maintenance Mode

### Setup
1. Log in to admin panel at `/admin` with admin credentials
2. Navigate to Settings (⚙️ الإعدادات) → click "🌐 إعدادات الموقع" card
3. Toggle "تفعيل وضع الصيانة" ON
4. Click "حفظ الإعدادات" — wait for green toast confirmation

### Key Behaviors
- **Admins bypass maintenance**: Logged-in admins (roleLevel >= 90) see the normal site, NOT the maintenance page
- **ADMIN_BYPASS_PATHS**: `/admin`, `/api`, `/login`, `/register` — these paths are never blocked by maintenance mode
- **Non-admin users** see the maintenance page with the "لوحة التحكم" button

### Testing as Unauthenticated User
Since the admin session in Chrome bypasses maintenance, use **Playwright headless** to test as an unauthenticated user:

```javascript
const { chromium } = require('playwright');
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto('https://chatzone-platform.fly.dev/', { waitUntil: 'networkidle' });
// Now you see the maintenance page as a non-admin user
```

### Common Gotcha
The `/login` page must be in `ADMIN_BYPASS_PATHS` — otherwise the admin button on the maintenance page redirects to `/admin` → `/login`, which gets blocked by maintenance mode, creating a loop.

## Testing Admin Settings Toggles

Settings like registration toggle and chat toggle use the `/api/site-status` API. This API has `force-dynamic` and `Cache-Control: no-store` to prevent Next.js caching. If toggles seem unresponsive, check:
1. The API route has `export const dynamic = 'force-dynamic'`
2. Response headers include `Cache-Control: no-store`

## Admin Panel Tabs

The admin panel has 8 main tabs accessible from the sidebar:
1. 📊 لوحة القيادة (Dashboard)
2. 🏠 إدارة الغرف (Room Management)
3. 📢 الإعلانات (Announcements)
4. 👥 المستخدمين (Users)
5. ⚖️ العقوبات (Punishments)
6. 🚨 البلاغات (Reports)
7. 📋 السجل الإداري (Admin Log)
8. ⚙️ الإعدادات (Settings)

Plus a separate page: 👨‍💼 فريق العمل (Team) at `/admin/team`

## Cleanup
Always disable maintenance mode after testing by toggling it OFF in admin Settings and saving.
