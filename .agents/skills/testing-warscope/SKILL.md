# Testing WarScope Application

## Environment

- **Frontend:** Deployed on Vercel (check PR or repo for current URL)
- **Backend:** FastAPI on Fly.io at `https://war-tracker-backend-kriplmgy.fly.dev`
- **Repo:** `/home/ubuntu/repos/Ali/war-tracker`
- **Stack:** React 19 + TypeScript + Vite + Tailwind CSS + Leaflet maps

## Known Backend Limitations

- `/api/admin/login` may return 404 if not deployed — admin auth can only be tested at frontend level
- `/api/stats` may return 404 — footer stats will show 0 values but component renders correctly
- These are deployment gaps, not code bugs

## Testing Approach

### General
- Always test against the **deployed Vercel URL**, not localhost
- Use screen recording with `annotate_recording` for visual proof
- The app is fully RTL Arabic — text reads right-to-left

### UI Features to Test
1. **Live Timer** (`Navbar.tsx`) — Look for "منذ X ث" text in navbar, verify it increments over ~5 seconds
2. **Mute Toggle** (`Navbar.tsx`, `useAlertSound.ts`) — Click speaker icon, verify icon toggles between Volume2/VolumeX. Check localStorage key for mute state
3. **Event Search** (`EventSearch.tsx`) — Type 2+ Arabic characters in search box (e.g., "إيران"), verify dropdown appears with results
4. **Fullscreen Map** (`LiveTracking.tsx`) — Click "ملء الشاشة" button on map, verify sidebar hides. Click "خروج ملء الشاشة" to exit
5. **Share Button** (`LiveTracking.tsx`) — Has `opacity-0 group-hover:opacity-100` CSS. **Workaround:** Use browser console to set `document.querySelectorAll('[title="مشاركة الحدث"]')[0].style.opacity = '1'` to make visible, then click. Verify green toast "تم نسخ الرابط!"
6. **Footer Stats** (`FooterStats.tsx`) — May be offscreen. Use JS `document.querySelector('footer').scrollIntoView()` to bring into view. Verify text contains "متصل الآن", "حدث اليوم", "WarScope v1.1"

### Security Tests
1. **Admin Wrong Password** — Navigate to `/admin`, enter wrong password, click "دخول". Verify error "كلمة المرور غير صحيحة" appears and page stays on login form
2. **Fake Token Bypass (Critical)** — In console run `sessionStorage.setItem('warscope_admin_token', 'fake-token')`, refresh page. Verify login form still shows and token is cleared from sessionStorage

### Common Testing Workarounds
- **Hover-dependent elements:** CSS hover effects (opacity-0 → opacity-100) may not trigger reliably with computer tool. Use browser console to directly set element styles
- **Offscreen elements:** Footer and some elements may render offscreen. Use `element.scrollIntoView()` via console
- **Arabic text verification:** Use `element.textContent` via console when visual verification is difficult due to font rendering

## Devin Secrets Needed
- **GROQ_API_KEY** — For AI analysis features (Groq/Llama 3.3 70B)
- No other secrets needed for testing

## Audio Testing Note
- Alert sound uses Web Audio API (`useAlertSound.ts`)
- AudioContext should be closed after playback (`osc2.onended = () => ctx.close()`)
- Cannot verify audio playback visually — verify at code level
