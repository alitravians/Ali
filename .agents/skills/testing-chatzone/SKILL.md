# ChatZone Platform Testing Skills

## Overview
ChatZone is a professional Arabic chat platform built with Next.js 14 + TypeScript + Socket.IO + PostgreSQL + Prisma, deployed on Fly.io.

## Deployment
- **Live URL**: https://chatzone-platform.fly.dev/
- **Fly.io App**: chatzone-platform
- **Fly.io Region**: ams (Amsterdam)
- **Fly.io Postgres**: chatzone-db
- **Docker Base Image**: node:18-slim (NOT alpine - Prisma needs OpenSSL)

## Devin Secrets Needed
- `FLY_API_TOKEN` - Fly.io API token for deployment management
- Database credentials are configured in the Fly.io app environment

## Test Credentials
- **Admin Account**: admin@chatzone.com / admin123
- **Admin Panel Code**: 3131 (enter via gear icon on homepage)
- **Moderator Panel Code**: 2121
- **Default Rooms**: الدردشة العامة, الترحيب, المساعدة, إعلانات الإدارة (frozen)

## Key Test Flows

### 1. Registration → Login → Chat
1. Navigate to homepage → click "إنشاء حساب جديد"
2. Fill 4 fields: username, email, password, confirm password
3. Submit → should redirect to `/login?registered=true`
4. Login with credentials → should redirect to `/chat`
5. Click a room (e.g. الدردشة العامة) → type message → press Enter
6. Message should appear with username + timestamp + indigo bubble

### 2. Admin Code Validation
1. On homepage, click the ⚙ gear icon (far left of nav bar in RTL layout)
   - **Note**: The gear icon is very small and hard to click. May need to use JavaScript: `document.querySelector('button[title="دخول الإدارة"]').click()`
2. Enter wrong code (e.g. 9999) → should show "رمز الدخول غير صحيح"
3. Enter 3131 → routes to `/admin` (requires admin session)
4. Enter 2121 → routes to `/moderator` (requires moderator session)

### 3. Admin Panel Access
- Must be logged in as admin@chatzone.com to access `/admin`
- Regular users entering code 3131 get redirected to `/chat` (security check on roleLevel)
- The admin panel has tabs for managing rooms, users, roles, announcements, reports, etc.

### 4. Information Pages
- `/welcome` - Welcome page with getting started steps
- `/instructions` - 7-section instructions page
- `/chat-guide` - Chat guide with UI explanation
- `/rules` - 10 rules with color-coded severity (حرج/مهم/متوسط/معلومة)

## Known Issues / Gotchas
- **Chat styling**: User reported the chat page looks too plain/minimal after login. The dark gray-950 background with small message bubbles feels sparse.
- **Admin code UX**: When a non-admin user enters the correct admin code 3131, they get silently redirected to /chat with no explanation of why admin access was denied.
- **Gear icon clickability**: The ⚙ button in the nav bar is very small and positioned at the far left edge (RTL layout). May be difficult to click with computer use tools.
- **Session persistence**: If already logged in, navigating to `/login` redirects to `/chat` automatically.
- **Frozen rooms**: The "إعلانات الإدارة" room is frozen by default - input shows "الغرفة مجمدة..." and is disabled.

## Architecture Notes
- Socket.IO runs on the same Node.js server (not serverless) - requires Fly.io, not Vercel
- NextAuth.js with JWT sessions (30-day duration)
- Prisma v5.22.0 with PostgreSQL
- 8-tier role system: Owner(100) > Admin(90) > HeadMod(80) > Mod(70) > Helper(50) > Member(10) > Muted(5) > Banned(0)
- Bold message formatting with `$` prefix requires roleLevel >= 50
- Rate limiting: 5 messages per 10 seconds

## Build & Dev Commands
```bash
cd chat-platform
npm install
npm run build
npm run dev        # Local development
npm run lint       # Linting
```

## Fly.io Commands
```bash
flyctl status -a chatzone-platform
flyctl logs -a chatzone-platform
flyctl ssh console -a chatzone-platform
flyctl machine start <machine-id>  # If machine is stopped
```
