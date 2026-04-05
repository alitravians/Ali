# Testing ChatZone Platform

## Environment

- **Production URL**: https://chatzone-platform.fly.dev/
- **Deployment**: Fly.io (deploy via `fly deploy` from `chat-platform/` directory)
- **Framework**: Next.js 14 (App Router) + Prisma + Socket.IO
- **Language**: Arabic (RTL interface)

## Devin Secrets Needed

- `CHATZONE_ADMIN_EMAIL` — Admin login email
- `CHATZONE_ADMIN_PASSWORD` — Admin login password

## Test Accounts

- **Admin**: admin@chatzone.com / admin123 (roleLevel 100)
- Admin users are redirected to `/admin` when visiting `/` while logged in

## Key Pages & Navigation

| Page | URL | Notes |
|------|-----|-------|
| Homepage | `/` | Shows landing page (logged out) or redirects to admin (admin user) |
| Login | `/login` | Email + password form |
| Register | `/register` | New account creation |
| Chat | `/chat` | Real-time chat rooms (requires auth) |
| Admin Panel | `/admin` | Full admin dashboard (roleLevel >= 90 required) |
| Rules | `/rules` | Public rules page |
| Welcome | `/welcome` | Public welcome page |
| Team | `/team` | Public team roster |
| Ambiance | `/ambiance` | Rain/glass effect page |
| Support | `/support` | Ticket submission (requires auth) |

## Admin Panel Tabs

The admin panel sidebar has these sections:
- 📊 لوحة القيادة (Dashboard)
- 🏠 إدارة الغرف (Room Management)
- 📢 الإعلانات (Announcements)
- 👥 المستخدمين (Users)
- ⚖️ العقوبات (Punishments)
- 🚨 البلاغات (Reports)
- 🎫 التذاكر (Tickets)
- 👨‍💼 فريق العمل (Team)
- 📋 السجل الإداري (Admin Log)
- ⚙️ الإعدادات (Settings)

## Settings Sub-sections

Click ⚙️ الإعدادات to see:
- 🌐 إعدادات الموقع — Site name, welcome message, maintenance mode
- 💬 إعدادات الدردشة — Chat enable/disable, banned words
- 👁 إعدادات المتواجدين — Online presence settings
- 🔒 الأمان والتسجيل — Registration enable/disable
- 📄 صفحات المحتوى — Content pages (rules, welcome, about)

## Common Test Flows

### Testing Maintenance Mode
1. Login as admin → navigate to `/admin`
2. Click ⚙️ الإعدادات → scroll to "وضع الصيانة" section
3. Toggle "تفعيل وضع الصيانة" ON
4. Type maintenance message in textarea
5. Click "حفظ الإعدادات" → verify green toast
6. Open incognito window → navigate to homepage
7. Verify: 🔧 icon + "الموقع تحت الصيانة" + custom message + "⚙️ لوحة التحكم" button
8. Click admin button → should go to `/login` (NOT blocked by maintenance)
9. **IMPORTANT**: `/login` and `/register` are excluded from maintenance blocking
10. Return to admin → toggle OFF → save → verify homepage restored in incognito

### Testing Registration/Chat Toggles
1. Admin → Settings → 🔒 الأمان والتسجيل
2. Toggle "تفعيل التسجيل" OFF → save
3. Visit `/register` in incognito → should show 🚫 "التسجيل مغلق حالياً" (no form)
4. Re-enable → verify form returns
5. Same for chat: Settings → 💬 إعدادات الدردشة → toggle OFF
6. Visit `/chat` → should show yellow banner ⚠️ "الدردشة معطّلة حالياً من قبل الإدارة"

### Testing Site-Wide Rain Background
1. The 🌧️ button should appear on ALL pages (rendered from `layout.tsx`)
2. Check on at least 3 pages: `/`, `/chat`, `/rules`
3. Click 🌧️ → popup with "تشغيل صوت المطر"
4. Click sound button → text changes to "صوت المطر مفعّل"
5. Sound preference saved in localStorage — persists across navigation

### Testing Chat Messages
1. Navigate to `/chat` → select "الدردشة العامة" room
2. Type message → press Enter (or click send button)
3. Verify message appears with 💎 level badge
4. Note: "إعلانات الإدارة" room may be frozen ("مجمدة") — use الدردشة العامة for testing

## Important Notes

- **API caching**: The `/api/site-status` endpoint uses `force-dynamic` + `Cache-Control: no-store` to prevent Next.js caching. If toggles don't take effect, this might be a regression.
- **Database migrations**: If auth/features break after schema changes, check if Prisma migrations were applied to production (`npx prisma migrate deploy`).
- **Incognito testing**: Always test maintenance mode, registration toggle, and chat toggle in incognito to avoid session/cookie interference.
- **Arabic UI**: All UI text is in Arabic. Key button text:
  - حفظ الإعدادات = Save Settings
  - تسجيل الدخول = Login
  - إنشاء حساب جديد = Create New Account
  - الدردشة العامة = General Chat
- **Admin redirect**: When logged in as admin and visiting `/`, you may be redirected to `/admin`. This is expected behavior.
