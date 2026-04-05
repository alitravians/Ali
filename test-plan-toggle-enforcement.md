# Test Plan: Registration & Chat Toggle Enforcement Fix

## What Changed
The `/api/site-status` endpoint was cached by Next.js, causing admin settings changes (registration toggle, chat toggle) to never take effect. Fixed by adding `export const dynamic = 'force-dynamic'` and `Cache-Control: no-store` headers.

## Code Evidence
- **Root cause fix**: `src/app/api/site-status/route.ts:5` — `export const dynamic = 'force-dynamic'`
- **Registration toggle UI**: `src/app/admin/page.tsx:1226-1229` — "تفعيل التسجيل" toggle
- **Chat toggle UI**: `src/app/admin/page.tsx:1137-1138` — "تفعيل الدردشة" toggle  
- **Register page enforcement**: `src/app/register/page.tsx:18-26` — fetches `/api/site-status`, shows closure message if `!data.registrationEnabled`
- **Register page closure UI**: `src/app/register/page.tsx:78-91` — shows 🚫 + "التسجيل مغلق حالياً"
- **Chat page enforcement**: `src/app/chat/page.tsx:89-92` — fetches `/api/site-status`, sets `chatDisabled` if `!data.chatEnabled`
- **Chat disabled banner**: `src/app/chat/page.tsx:779-783` — yellow banner ⚠️ + "الدردشة معطّلة حالياً من قبل الإدارة"

## Constraint
- Testing /register as unauthenticated requires Playwright (logged-in admin gets redirected to /chat)
- Chat test can be done directly in the browser (admin can see the banner while logged in)

---

## Test 1: Registration Toggle Enforcement (PRIMARY — this is the user's reported bug)

### Step 1.1: Verify registration is currently ENABLED
- Navigate to admin Settings → click "🔒 الأمان والتسجيل" card
- **PASS**: Toggle labeled "تفعيل التسجيل" is in the ON (colored/active) position
- Run Playwright to visit `/register` as unauthenticated user
- **PASS**: Page contains input fields (username, email, password form) and does NOT contain "التسجيل مغلق حالياً"

### Step 1.2: Disable registration and verify enforcement
- Click the "تفعيل التسجيل" toggle (should switch to OFF/gray)
- Click "حفظ الإعدادات" button
- **PASS**: Green success toast appears with "تم حفظ الإعدادات بنجاح"
- Run Playwright to visit `/register` as unauthenticated user
- **PASS**: Page shows 🚫 icon and text "التسجيل مغلق حالياً" — NO form inputs visible
- **FAIL if**: Form inputs still visible (this was the original bug)

### Step 1.3: Re-enable registration and verify restoration (proves two-way control)
- Click the "تفعيل التسجيل" toggle (should switch back to ON)
- Click "حفظ الإعدادات" button
- **PASS**: Green success toast appears
- Run Playwright to visit `/register` as unauthenticated user
- **PASS**: Form inputs are back, "التسجيل مغلق حالياً" is gone

---

## Test 2: Chat Toggle Enforcement

### Step 2.1: Disable chat
- Navigate to admin Settings → click "💬 إعدادات الدردشة" card
- Click the "تفعيل الدردشة" toggle to OFF
- Click "حفظ الإعدادات" button
- **PASS**: Green success toast appears
- Navigate to /chat and reload page (Ctrl+Shift+R)
- **PASS**: Yellow banner visible with ⚠️ + "الدردشة معطّلة حالياً من قبل الإدارة"
- **FAIL if**: No yellow banner appears

### Step 2.2: Re-enable chat (proves two-way control)
- Navigate back to admin Settings → "💬 إعدادات الدردشة"
- Click the "تفعيل الدردشة" toggle to ON
- Click "حفظ الإعدادات" button
- Navigate to /chat and reload page
- **PASS**: Yellow banner is gone, chat operates normally
- **PASS**: Can type and send a message successfully

---

## Test 3: Regression — Chat Messaging (quick sanity)
- Type "اختبار التسجيل والدردشة" in the message input
- Click send button
- **PASS**: Message appears in chat area with correct text and sender "Admin"
