# Testing ChatZone Admin Panel

## Devin Secrets Needed

No external secrets required — admin credentials are hardcoded for development.

## Live Site

- **URL**: https://chatzone-platform.fly.dev/
- **Deployment**: Fly.io (use `fly deploy --no-cache` from repo root to force full rebuild)

## Login Credentials

- **Admin account**: admin@chatzone.com / admin123
- **Admin access code**: 3131 (entered on homepage to reach `/admin`)
- **Moderator access code**: 2121

## Admin Access Flow

1. Go to https://chatzone-platform.fly.dev/
2. If not logged in, click login and use admin@chatzone.com / admin123
3. Enter code 3131 in the access code field on the homepage
4. You'll be redirected to `/admin`

**Important**: If not logged in when entering the code, you'll be redirected to `/login?callbackUrl=/admin` first, then to `/admin` after login.

## Admin Panel Structure

The sidebar has 4 grouped sections with 9 tabs total:

| Group | Tabs |
|-------|------|
| نظرة عامة | لوحة القيادة (Dashboard) |
| إدارة المحتوى | إدارة الغرف (Rooms), الإعلانات (Announcements) |
| إدارة المستخدمين | المستخدمين (Users), العقوبات (Punishments), البلاغات (Reports) |
| النظام | فريق العمل (Team - separate page /admin/team), السجل الإداري (Audit Log), الإعدادات (Settings) |

**Note**: "فريق العمل" navigates to `/admin/team` (separate page). Use browser back button to return to admin panel.

## Key Test Paths

### Self-Punishment Prevention
1. Navigate to العقوبات tab
2. Select the admin's own username in the target user dropdown
3. Enter a reason and click "تطبيق العقوبة"
4. Expected: RED error toast with "لا يمكنك تطبيق عقوبة على نفسك"
5. The toast auto-clears after 3 seconds — capture screenshot immediately

### Chat Messaging
1. Go to https://chatzone-platform.fly.dev/chat
2. Click on a room (e.g., "الدردشة العامة")
3. Type a message in the input field at the bottom
4. Press Enter or click send button
5. Expected: Message appears in chat area under your username

### Presence System
- Check the header area for "{N} متواجد" text in cyan
- Should show ≥1 when you're connected
- If showing 0, there may be a WebSocket issue

### Settings Page
- Settings tab shows 4 clickable sub-section cards:
  - إعدادات الموقع (Site)
  - إعدادات الدردشة (Chat)
  - إعدادات المتواجدين (Presence)
  - الأمان والتسجيل (Security)

## Common Issues

- **WebSocket not connecting**: Check that `SocketProvider.tsx` has `withCredentials: true` and `transports: ['websocket']`. NextAuth uses chunked cookies (`__Secure-next-auth.session-token.0`, `.1`, etc.) that need concatenation in server.ts middleware.
- **Toast disappears too fast**: The `showMsg` function clears after 3 seconds. Take screenshots immediately after triggering actions.
- **Fly.io cached deploys**: Use `fly deploy --no-cache` to ensure code changes are actually deployed.
- **Admin panel redirects to chat**: Verify the verify-code API handles unauthenticated users correctly (should redirect to login with callbackUrl).

## Testing Tips

- Many security fixes are server-side only (e.g., message:edit validation, rate limiting) and cannot be tested via browser UI. Note this in test reports.
- The audit log (السجل الإداري) shows all admin actions with filter buttons — useful for verifying actions were recorded.
- Arabic text renders RTL — UI elements are right-aligned.
