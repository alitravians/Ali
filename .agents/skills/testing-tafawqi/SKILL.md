---
name: testing-tafawqi
description: End-to-end test the تفوّقي (tafawqi) Arabic 10th-grade math quiz platform — security, registration toggle, quiz golden-path, CSRF probes. Use when auditing or verifying changes to anything under `tafawqi/`.
---

# Testing tafawqi (Arabic Math Quiz Platform)

Live production URL: <https://tafawqi-delta.vercel.app>
Repo path: `tafawqi/` inside `alitravians/Ali`, branch `arabic-localization`.
Stack: Next.js 14 App Router, Prisma + Turso, Tailwind RTL, deployed to Vercel.

## Demo accounts on production

- **Student**: `demo@tafawqi.app` / `demo1234` (display name: ليلى)
- **Admin**: `admin@tafawqi.app` / `admin123` (display name: المشرفة)

Do NOT delete the demo account between sessions — it's used in the leaderboard preview and as a test login.

## Standard golden-path test (recordable, ~3 min)

1. **Phase-0 setup** — confirm starting state of `registration_open`:
   ```bash
   curl -s https://tafawqi-delta.vercel.app/api/me
   # → {"user":null,"registrationOpen":true}  or  false
   ```
2. **Test 1 — No hydration flash on closed-state homepage** (if registrationOpen is false):
   Hard-refresh `/`. The header must show only `دخول`. If you see a flash of `سجّلي الآن` then the layout SSR fix regressed.
3. **Test 2 — Closed-state `/register`**: visit `/register`. Should render `🚪 التسجيل مغلق حاليّاً` with **no form fields**. If form renders, the page is no longer reading `siteSetting.registration_open` server-side.
4. **Test 3 — `X-Powered-By` must be absent**:
   ```bash
   curl -sI https://tafawqi-delta.vercel.app/ | grep -i x-powered-by
   # Expected: no output. `server: Vercel` is fine (infra-level).
   ```
5. **Test 4 — Cross-origin POST blocked**:
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" \
     -X POST -H "Origin: https://evil.example" -H "Content-Type: application/json" \
     -d '{"quizSlug":"x","durationSec":1,"answers":[]}' \
     https://tafawqi-delta.vercel.app/api/attempts
   # Expected: 403 with body {"error":"طلب من مصدر غير موثوق"}
   # Repeat for /api/notifications and /api/auth/logout — same 403 expected.
   ```
6. **Test 5 — Same-origin quiz golden path**: log in as `demo@tafawqi.app`, visit `/chapters/algebra`, click the quiz `quiz-real-numbers-5`, click `🚀 ابدئي الآن`, answer the 5 questions (correct answers: 24, 10, صحيح, صحيح, √2) — score should be 100% and the page should land at `/results/<id>` with the questions+explanations rendered.
7. **Test 6 — Avatar logout**: click avatar button (top-right after login) → `🚪 تسجيل الخروج`. Should redirect to `/`; revisiting `/dashboard` should redirect to `/login?redirect=/dashboard`.
8. **Test 7 — Admin toggle reflects on reload**: log in as admin, go to `/admin → 🛠️ الإعدادات`, flip `السماح بالتسجيل` between `مفعّل` and `معطّل`, click حفظ (a `تم الحفظ ✅` banner confirms). Reload `/` — the header CTA and the `/register` page must match the new state within one reload, no second click needed. After testing, restore the toggle to whatever the user had it as before. Verify via `curl -s .../api/me`.

## Admin settings tab — radio click positions (Linux Chrome 1024x768)

The radios in `السماح بالتسجيل` are RTL-laid-out: `مفعّل` is on the right (`devinid=16`), `معطّل` is on the left (`devinid=17`). Clicking the label text is more reliable than the radio dot:
- To set مفعّل: click around x=831, y=441.
- To set معطّل: click around x=775, y=441 (on the label "معطّل" itself, NOT the dot).
- Always click حفظ (around x=834, y=466) after toggling, then verify via `/api/me`.

## Adversarial inputs that have been used

- XSS sanitization probe: `<<script>script>alert(1)<</script>>` — should be stored with zero `<` or `>` characters. If any survive, `lib/sanitize.ts` regressed.
- Replay attempt: submit the same `/api/attempts` POST twice — second should be idempotent or no-op, not a double-credit.
- Lockout: 8 wrong-password POSTs to `/api/auth/login` on the same email → should return 423 with lockout message for 15 minutes.

## Important behaviors to know

- `app/layout.tsx` is `async` and calls Prisma per-request. If you see SSR errors after a Prisma migration, that's the first suspect — `force-dynamic` is required.
- `requireSameOrigin()` lives in `lib/csrf.ts` and is applied on every state-changing POST. If you add a new POST endpoint, this guard is **mandatory** before any auth/DB work, including admin endpoints.
- The header is a client component but seeded from server props via `<SiteHeader registrationOpen={...} />`. Both must be updated together if you add a new SSR-dependent setting.
- Probe accounts: if you create test accounts during fuzzing, delete them from prod DB before closing the session. We had 7 leftover from earlier audits and cleaned them up.

## Devin secrets needed

- None for verification — production is public and the demo/admin credentials above are sufficient.
- For DB cleanup, the Turso connection string is in the Vercel project env. Use the Vercel CLI in the repo to pull env vars when needed.

## When something looks broken

- If `/api/me` returns `"registrationOpen":null` instead of `true`/`false`, the layout's DB read threw — check Vercel logs.
- If `X-Powered-By` reappears, check `next.config.mjs` for `poweredByHeader: false`.
- If quiz submission returns 403 even from the browser, the `requireSameOrigin` guard is rejecting legitimate same-origin requests — check the `Origin` header parsing in `lib/csrf.ts`.
- If the header CTA flashes between `سجّلي الآن` and `دخول`, the layout is not server-fetching `registration_open` anymore — check that `app/layout.tsx` is still `async` and `export const dynamic = "force-dynamic"`.
