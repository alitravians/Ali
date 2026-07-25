# Testing ChatZone Platform

## Overview
ChatZone is an Arabic RTL chat platform built with Next.js 14 + TypeScript, Socket.IO for real-time messaging, PostgreSQL + Prisma ORM, and deployed on Fly.io.

## Devin Secrets Needed
- No special secrets required for testing. Admin credentials are seeded in the database.

## Environment
- **Live URL**: https://chatzone-platform.fly.dev/
- **Repo Path**: `chat-platform/` subdirectory within the Ali repo
- **Tech Stack**: Next.js 14, TypeScript, Socket.IO, PostgreSQL (Neon), Prisma, NextAuth.js
- **Deployment**: Fly.io (Amsterdam region), app name `chatzone-platform`

## Test Credentials
- **Admin Account**: admin@chatzone.com / admin123 (Owner role, level 100)
- **Admin Access Code**: 3131 (entered via gear icon on homepage)
- **Moderator Access Code**: 2121
- Default test rooms: الدردشة العامة, الترحيب, المساعدة, إعلانات الإدارة

## Key Pages & Navigation
- `/` — Homepage with login/register buttons and gear icon for admin access
- `/login` — Email + password login
- `/register` — New account registration
- `/chat` — Main chat interface (requires login)
- `/admin` — Admin panel (requires Owner/Admin role, level >= 90)
- `/moderator` — Moderator panel (requires role level >= 50)
- `/welcome`, `/instructions`, `/chat-guide`, `/rules` — Info pages

## Common Testing Scenarios

### Chat Page Testing
1. Login → auto-redirects to `/chat`
2. Sidebar shows rooms with emoji icons and member counts
3. Click a room to enter it
4. Type in the message input (placeholder: "اكتب رسالتك...") and press Enter
5. Messages appear in gradient indigo bubbles for own messages
6. Consecutive messages from same user are grouped (avatar only on first)
7. Hover over a message to see reply/delete/report icon buttons

### Admin Panel Testing
1. Navigate to homepage `/`
2. The gear icon (⚙) is very small in the top nav bar — may need to use browser console `document.querySelector('button[title="دخول الإدارة"]').click()` to click it reliably
3. Enter code in the modal and click "دخول"
4. Wrong code shows red error "رمز الدخول غير صحيح"
5. Correct code redirects based on user role — non-admin users may be redirected to `/chat` instead of `/admin` due to role-based access control on the admin page
6. To test admin panel features, must be logged in as admin@chatzone.com

### Settings Toggle Testing
1. Login as admin → navigate to `/admin`
2. Click "الإعدادات" in sidebar
3. Toggle "تفعيل الدردشة" or "تفعيل التسجيل"
4. Click "حفظ الإعدادات" — look for green toast "تم حفظ الإعدادات"
5. Reload page (F5) → click "الإعدادات" again to verify persistence
6. **Important**: Always restore toggles to ON after testing to avoid breaking the app

## Gotchas & Tips

### UI Interaction
- The gear icon (⚙) on the homepage is very small and hard to click precisely with computer tool — use browser console as fallback
- After page reload, admin panel defaults to "لوحة القيادة" (Dashboard) tab — must click "الإعدادات" again to see settings
- The site is RTL (right-to-left) — sidebar is on the right, content flows right-to-left
- Logout is available via clicking the user avatar in the sidebar bottom, then "تسجيل الخروج"

### Security Verification
- To verify admin codes are not in client JS, use curl to download all JS bundles and grep for the codes
- The API endpoint `POST /api/admin/verify-code` can be tested directly with curl
- Example: `curl -s -X POST https://chatzone-platform.fly.dev/api/admin/verify-code -H 'Content-Type: application/json' -d '{"code":"9999"}'`

### Window Management
- `wmctrl` may not work reliably for maximizing browser — use F11 fullscreen toggle as alternative
- Always maximize browser before recording tests

### Socket.IO Connection
- Chat requires active Socket.IO connection — look for "متصل" (connected) with green dot in sidebar
- If connection fails, page may show "غير متصل" (disconnected) with red dot
