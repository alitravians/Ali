# Testing LinguaMaster Platform

## Local Development Setup

- **Dev server**: `npm run dev` (runs on port 3000)
- **Database**: SQLite at `prisma/dev.db`
- **Loading screen**: Every page shows a splash screen for ~2-3 seconds before content loads. Always wait 3-4 seconds after navigation.

## Test Accounts

- **Admin**: `admin@linguamaster.com` / stored in Devin secrets or default seed password
- **Test user**: `testuser2026@test.com` / stored in Devin secrets or default seed password
- **Real user (عادل)**: `abo.khalil.096@gmail.com` (password unknown - use test user for testing)

## Key Navigation Paths

| Page | URL | Notes |
|------|-----|-------|
| Admin login | `/admin/login` | Email + password form |
| Admin dashboard | `/admin` | Requires admin session |
| Admin badges | `/admin/badges` | Badge CRUD + assign/unassign |
| Admin inventory | `/admin/inventory` | Item management + grant/revoke |
| User login | `/login` | Email + password form |
| User inventory/bag | `/inventory` | Shows all granted items |
| User profile | `/profile` | Shows badges, stats |
| Chat | `/chat` | Real-time messaging with entry effects |

## Testing Badge-Inventory Sync

### Assign Flow
1. Login as admin at `/admin/login`
2. Navigate to `/admin/badges`
3. Click "تعيين شارة" (assign badge) tab
4. Select badge from dropdown
5. Select user from dropdown
6. Click "تعيين الشارة" (assign badge) button
7. Form resets on success (no explicit success toast)
8. Verify: Login as user → `/inventory` → badge should appear with status "مفعل" (active)

### Unassign Flow
1. On `/admin/badges`, click "الشارات" tab
2. Click the 👥 icon on the badge card to see assigned users
3. Click "إزالة" (remove) link next to the user
4. Verify: User's `/inventory` → badge shows "مسحوب" (revoked)

### Re-assign Flow
1. Re-assign same badge via assign tab
2. Verify: User's `/inventory` → badge shows "مفعل" (active) again, no duplicates

## Testing Entry Effects

1. Admin grants entry effect via `/admin/inventory` (Grant tab)
2. User activates effect in `/inventory`
3. Open chat as a different user
4. When the user with active effect sends a message, fullscreen animation plays
5. 5-minute cooldown per user (client-side only, resets on page refresh)

## Database Queries

Since `sqlite3` CLI may not be available, use Node.js with Prisma:
```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const result = await p.badge.findMany();
  console.log(JSON.stringify(result, null, 2));
  await p.\$disconnect();
})();
"
```

**Note**: `BadgeAssignment` model does NOT have a `user` relation for `include`. Query users separately if needed.

## Common Issues

- **Loading screen blocks interaction**: Always wait 3-4 seconds after page navigation
- **Session management**: Admin and user sessions are separate. Use incognito for the second session.
- **Form resets silently**: Badge assign/unassign forms reset without explicit success messages. Check server logs (`POST /api/admin/badges 200`) to confirm success.
- **Cached data**: After admin actions, refresh the user's page (F5) to see updated inventory state.
- **Pre-existing build error**: `/api/admin/inventory` shows "Cannot find module" during build - this is a known pre-existing issue, not related to new changes.

## Devin Secrets Needed

No special secrets needed for local testing. Default seed credentials are used.
