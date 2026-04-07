# Testing WarScope Application

## Deployment URLs
- **Frontend (Vercel):** https://dist-mu-taupe-70.vercel.app
- **Backend (Fly.io):** https://war-tracker-backend-kriplmgy.fly.dev
- **Status Page:** /status (public, no auth required)
- **Admin Panel:** /admin (requires password)

## Devin Secrets Needed
- `WARSCOPE_ADMIN_PASSWORD` — Password for admin panel login

## Admin Panel Access
1. Navigate to /admin
2. Enter admin password in the password field
3. Click "دخول" (Enter) button
4. Token is stored in `sessionStorage.warscope_admin_token`

## Admin Panel Tab Navigation
- The admin panel has 7 tabs in a horizontally scrollable tab bar
- Tabs (right-to-left): إدارة المصادر, طبقات الخريطة, مراجعة الأحداث, التنبيهات, التحليلات الذكية, النظام, حالة الخدمات
- **"حالة الخدمات" is the LAST (7th) tab** — you may need to scroll the tab bar left to see it
- On smaller viewports, some tabs may be offscreen; scroll horizontally within the tab bar container

## Status Page Testing Patterns

### Public Status Page (/status)
- Verify page title "حالة النظام" is visible
- Check overall system status banner (operational/degraded/partial_outage/major_outage)
- Count service cards — should match backend service count
- Verify status indicators: green "يعمل", yellow "بطيء", red "متوقف"
- Check incident history section for active/resolved incidents
- **SVG gradient verification:** Use browser console to query `document.querySelectorAll('linearGradient')` and verify each has a unique ID (format: `chartGrad-{service_id}`)

### Admin Status Tab
- Table should have columns: الخدمة, النوع, الحالة, الفحص كل, مفعّل, إصلاح تلقائي, إجراءات
- **Toggle knob verification:** Enabled services should have GREEN background with knob on RIGHT; disabled should have GREY background with knob on LEFT
- **Trigger check button (⟳):** Click it and watch for spinning animation (Loader2), then it should revert to ⟳. Service statuses may update after the check completes.
- The "إجراءات" column might be offscreen on narrow viewports — scroll the table horizontally to reveal it
- Footer contains link to public status page: "صفحة الحالة العامة متاحة للجميع على /status"

### Navigation Links
- **Sidebar:** "حالة النظام" with Activity icon → /status (open via hamburger menu)
- **Navbar:** "الحالة" → /status (may be hidden on small viewports, visible on wider screens)

## API Endpoints
- `GET /api/status` — Public status data (no auth)
- `GET /api/status/admin` — Admin status data (requires Bearer token)
- `POST /api/status/check/{service_id}` — Trigger immediate health check (requires Bearer token)
- `PUT /api/status/services/{service_id}` — Update service config (requires Bearer token)

## Common Testing Gotchas
1. **Arabic RTL layout:** Text flows right-to-left; tab bars scroll in the opposite direction from LTR
2. **Tab bar scrolling:** The admin tab bar is scrollable — the last tabs (النظام, حالة الخدمات) may be hidden off the left edge
3. **Table horizontal scroll:** The service management table may hide the rightmost columns (إجراءات) — scroll right within the table
4. **Health check timing:** After triggering a health check, service statuses may change (e.g., "بطيء" → "يعمل") as the backend re-evaluates each service
5. **Toggle knob position:** The CSS class `left-[18px]` means knob on right (enabled), `left-0.5` means knob on left (disabled)
6. **Backend rate limiting:** Login attempts are rate-limited to 5 failed attempts per 5 minutes per IP
7. **Token expiry:** Admin tokens expire after 1 hour
