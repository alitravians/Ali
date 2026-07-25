# Testing LinguaMaster Platform

## Environment Setup

1. Start the dev server:
   ```bash
   cd /home/ubuntu/repos/Ali/language-learning
   npx next dev -p 3000
   ```
2. If database was reset, run the seed/setup script to recreate admin user and test data
3. Admin credentials are seeded in the database (check prisma/seed.ts for defaults)
4. Admin login page: http://localhost:3000/admin/login (separate from user login)
5. User login page: http://localhost:3000/login

## Devin Secrets Needed

- No external secrets required. Admin and test user credentials are seeded in the database via prisma/seed.ts.

## Key Testing Pages

| Feature | User Page | Admin Page |
|---------|-----------|------------|
| Inventory/Bag | /inventory | /admin/inventory |
| Chat | /chat | /admin/chat |
| Badges | (profile) | /admin/badges |
| Moderators | /moderator | /admin/moderators |
| Notifications | (bell icon) | /admin (broadcasts) |
| Team | /team | /admin/team |
| Profile | /profile | - |

## Chrome/Browser Tips

- If Chrome is killed and restarted from command line, the CDP (Chrome DevTools Protocol) connection used by `browser_console` may break. Workaround: use F12 to open DevTools directly in Chrome and type JavaScript in the Console tab.
- When typing into React-controlled inputs via DevTools console, use the native value setter pattern:
  ```javascript
  const inp = document.querySelector('input[type="text"]');
  const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  nativeSetter.call(inp, 'your text');
  inp.dispatchEvent(new Event('input', {bubbles: true}));
  ```
- To submit a form programmatically: `document.querySelector('form').requestSubmit();`
- The loading/splash screen takes ~2-3 seconds on first page load. Wait for it to finish before interacting.

## Inventory System Testing

### Admin Flow
1. Navigate to /admin/inventory
2. Three tabs: "العناصر" (Items), "منح عنصر" (Grant), "إدارة حقائب المستخدمين" (Manage)
3. Create items using presets (bubble presets, effect presets) or manually
4. Grant items with permanent or temporary duration
5. Manage tab shows user items with status and duration info

### User Flow
1. Navigate to /inventory (or click "حقيبتي" in navbar)
2. Stats bar shows total, active, permanent, temporary counts
3. Item cards show name, rarity, status, and duration remaining
4. Activate/deactivate items with buttons on each card
5. Preview modal (eye icon) shows detailed item info

### Chat Integration
- Bubble styling only applies to OTHER users' messages (not the sender's own)
- Entry effects show "X دخل الدردشة" animation when user enters chat
- The chat input is an `<input type="text">` element (not textarea)
- Necklaces display as small badges near the username

## Badge System Testing

### Duration Controls
- Assignment tab has "دائمة" (permanent) and "مؤقتة" (temporary) toggle
- Temporary mode shows preset buttons: 1, 3, 7, 14, 30, 90 days
- Number input allows custom day count
- Expired badges are automatically filtered out in chat messages API

## Database Notes

- SQLite database at prisma/dev.db
- After schema changes, run `npx prisma generate` then `npx prisma db push`
- If db push fails, may need `--force-reset` flag (warning: deletes all data)
- After reset, re-run seed script to recreate admin user and test data
