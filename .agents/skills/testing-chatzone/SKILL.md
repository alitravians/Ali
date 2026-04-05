# Testing ChatZone Platform (وكالة العاصي)

## Devin Secrets Needed
- No additional secrets required — admin credentials are hardcoded in the app (see below)

## Environment
- **Production URL**: https://chatzone-platform.fly.dev/
- **Deployment**: Fly.io (use `fly deploy` from repo root)
- **Stack**: Next.js 14+ (App Router), Prisma ORM, PostgreSQL, Socket.IO, NextAuth.js
- **Admin Login**: admin@chatzone.com / admin123
- **Admin Panel Code**: 3131
- **No CI configured** — skip CI checks

## Key Test Flows

### 1. Ticket System (Primary E2E)
1. Navigate to `/support` → click "+ تذكرة جديدة"
2. Fill form: title, department (9 options), complaint type (7 options), priority (4 buttons), description
3. Submit → expect green banner "تم إنشاء التذكرة بنجاح"
4. Click ticket row → opens `/support/<id>` with thread UI
5. Verify: metadata grid (4 cards), "صاحب التذكرة" badge on original message
6. Type reply and submit → expect "فريق الدعم" badge (violet) on staff replies
7. Click status buttons (staff only) → expect green banner "تم تغيير الحالة إلى ..."

### 2. Notification System
1. Navigate to `/notifications`
2. Verify category filter buttons (9 categories: إدارية, التذاكر, الدردشة, العقوبات, العناصر, الشارات, المستوى, الملف الشخصي, عامة)
3. Verify read status filters (الكل, غير مقروء, مقروء)
4. Ticket actions (create, reply, status change) should auto-generate notifications with 🎫 icon
5. Admin-sent notifications show 👑 icon

### 3. Admin Notification Sending
1. Go to admin panel → "🔔 إرسال إشعارات" sidebar tab
2. Fill: title, content, category dropdown (8 options), importance (4 levels), target (all users / specific user)
3. Submit → expect toast "✓ تم إرسال الإشعار بنجاح"
4. Verify in history section below the form
5. Navigate to `/notifications` to confirm it appeared

### 4. Admin Ticket Management
1. Admin panel → "🎫 التذاكر" sidebar tab
2. Verify stats grid (مفتوحة, قيد المراجعة, مصعدة, الإجمالي)
3. Search by title or username
4. Filter by 7 statuses

### 5. Profile Page (6 Tabs)
1. Navigate to `/profile`
2. Verify 6 tabs: المعلومات العامة, الشارات والعناصر, المستوى والنقاط, التذاكر, الإشعارات, الإعدادات
3. Tickets tab shows user's tickets with status badges
4. Notifications tab shows recent notifications with unread badge count
5. Settings tab has: photo upload, display name, bio, password change

## Common Issues & Workarounds

### Database Migrations
- If login/register/tickets fail with DB errors, check if Prisma migrations are applied on production
- Run: `npx prisma migrate deploy` (connects to production DATABASE_URL)
- Missing columns (like `level`, `xp`) or tables (like `tickets`) will break ALL auth and API routes

### Audio Autoplay on Mobile
- Mobile browsers (especially Android Chrome) block audio autoplay
- Audio must be triggered from `click` or `touchend` events (NOT `touchstart`)
- Use `playsinline` attribute for iOS compatibility
- External CDN audio URLs (e.g., Pixabay) may return 403 errors — use local `/sounds/` files instead

### Admin Panel Access
- The gear icon ⚙️ in the navbar opens a code prompt (enter 3131)
- If the icon is invisible, check SVG dimensions — Tailwind classes like `w-4.5` are invalid (use `w-5 h-5`)
- Direct navigation to `/admin` may work if already authenticated as admin in the session

### Browser Fullscreen
- When browser is in fullscreen (F11), the address bar is hidden — exit fullscreen before navigating via URL bar
- `wmctrl` may not be available; use F11 toggle or xdotool as alternatives for window management

### Dynamic Site Name
- Site name is fetched from `/api/site-status` via `useSiteName()` hook
- If some pages show "ChatZone" instead of the configured name, check if that page uses the hook

## Test Data Cleanup
- Test tickets and notifications persist in the database
- No automated cleanup — manual deletion through admin panel or direct DB access if needed
