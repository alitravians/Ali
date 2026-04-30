# Test Plan: ai-video-gen (PR #126)

**Live URL:** https://ai-video-gen-psi.vercel.app
**PR:** https://github.com/alitravians/Ali/pull/126

## What changed (user-visible)

A new free public website that generates short AI videos (5/10/15 seconds)
from a text prompt. The user types a description, picks a duration and a
style, clicks "توليد الفيديو", and gets back a downloadable MP4.

## What I will test (primary flow)

**Generate a 5-second AI video end-to-end through the browser UI on the live
deployed Vercel URL, then verify the produced MP4 has exact target duration.**

This is the only flow that can definitively prove the feature works — it
exercises the API route, Pollinations.ai integration, ffmpeg.wasm
loading/execution, and MP4 composition all at once.

## Setup (already done)

- Vercel deployment verified reachable (HTTP 200).
- Backend API verified (`/api/generate-frames` returns 3 frame URLs for
  duration=5).
- No login/auth needed — site is fully public.
- Browser will use the Devin VM's IP, which already hit Pollinations'
  rate-limit during dev. To work around this, between tests I will wait
  ≥60s and use distinct prompts.

## Test cases

### Test 1: Splash loader appears and dismisses

**Steps:**
1. Open https://ai-video-gen-psi.vercel.app in Chrome
2. Observe splash screen

**Pass criteria:**
- Splash shows the title "AI Video Gen" and Arabic subtitle "توليد فيديوهات بالذكاء الاصطناعي"
- A progress bar fills from 0% to 100% over ~1.8s
- After ~2s, the splash fades away and the main app is visible

**Fail criteria:**
- No splash, OR splash is stuck, OR splash never dismisses, OR text is missing

> Why this would catch a broken impl: a stuck splash means the `useEffect`
> rAF loop or the `onDone` callback is broken — main app would never appear.

### Test 2 (PRIMARY): Generate a 5-second AI video end-to-end

**Steps:**
1. After splash dismisses, locate the prompt textarea
2. Type prompt: `قطة فضائية تطفو في مجرة ملونة` (one of the example chips)
3. Confirm "5" duration pill is selected by default (active state)
4. Confirm "سينمائي" (cinematic) style chip is active by default
5. Click "توليد الفيديو" button
6. Watch the ProgressView panel appear

**Pass criteria during generation:**
- Progress phase label changes through:
  - "جلب الإطارات من الذكاء الاصطناعي" (requesting)
  - "تحميل الإطارات" (downloading frames)
  - "إنشاء المقاطع مع حركة الكاميرا" (rendering clips)
  - "دمج المقاطع مع تأثير الانتقال" (joining clips)
  - "تجهيز الفيديو النهائي" (finalizing)
- 3 thumbnail images appear in the "إطارات المشهد" grid (since 5s → 3 frames)
- Each thumbnail loads a real image (not a broken icon)

**Pass criteria after generation:**
- A `<video>` player appears with controls and starts playing automatically
- Three buttons appear: "تحميل MP4", "مشاركة", "فيديو جديد"
- Click "تحميل MP4" → browser downloads `ai-video-5s-<id>.mp4`
- Run `ffprobe` on the downloaded file:
  - `format.duration` = 5.0 ± 0.3 seconds
  - `streams[0].codec_name` = `h264`
  - `streams[0].width` × `streams[0].height` = `1280 × 720`
  - `streams[0].nb_frames` ≈ 120 (5s × 24fps)

**Fail criteria:**
- Any phase hangs >180s, OR error banner appears, OR no video preview, OR
  download fails, OR downloaded file has wrong duration / codec / dimensions.

> Why this would catch a broken impl: every link in the chain must work —
> the API route, Pollinations fetch, ffmpeg.wasm load, zoompan filter,
> xfade chain, and final mp4 muxing. Wrong duration would catch the
> `perClip = (durationSec + xfade*(n-1))/n` math being wrong. Wrong codec
> would catch the libx264 invocation failing. Missing video would catch
> the Blob → object URL flow failing.

### Test 3: Different duration produces different number of frames

**Steps:**
1. Click "فيديو جديد" to reset
2. Type a new prompt: `مدينة دبي ليلاً مع برج خليفة` (also an example)
3. Click the "10" duration pill (it should highlight blue)
4. Click "توليد الفيديو"
5. Wait until ProgressView shows the frame thumbnails

**Pass criteria:**
- Exactly **4** thumbnails appear (not 3 like for 5s, not 5 like for 15s).

**Fail criteria:**
- Any other count appears.

> Why this would catch a broken impl: the `framesForDuration()` mapping
> would be wrong, or the duration pill click handler would be wired to
> the wrong state. If 5s and 10s both produce 3 frames, the duration
> selector is decorative.

### Test 4: Gallery persistence across reload

**Steps:**
1. After Test 2 succeeds, the generated 5s video should appear in
   "الفيديوهات السابقة" gallery section
2. Reload the page (F5)
3. Wait for splash to dismiss

**Pass criteria:**
- The 5s video thumbnail is still visible in the gallery
- Clicking the thumbnail loads it back into the main video player

**Fail criteria:**
- Gallery is empty after reload (localStorage write failed)

> Why this would catch a broken impl: a missing `persistGallery()` call
> or a JSON serialization bug in the localStorage code would manifest here.

### Test 5: Mobile responsive rendering (regression — light check)

**Steps:**
1. Open Chrome DevTools → toggle device toolbar → iPhone 12 Pro
2. Reload the page

**Pass criteria:**
- Splash loader fits the viewport (no horizontal scroll)
- After splash, the prompt form, duration pills, and style chips fit the
  screen with no overflow
- "توليد الفيديو" button spans the full width of the card
- Direction is RTL (text aligned right, the brand icon on the right)

**Fail criteria:**
- Horizontal scrollbar appears, OR elements overflow, OR layout is LTR.

## Out of scope

- Rate limiter exact behavior (in-memory across edge regions is best-effort
  and not deterministic).
- 15s flow (Test 3 already proves duration-scaling works for 5→10; covering
  15 too would be redundant for an adversarial plan).
- "مشاركة" share button (depends on browser's `navigator.share` which is
  not available in desktop Chrome; will note as untested).
- Different AI styles producing visually distinct results (subjective).

## Recording

I will record the primary flow (Tests 1–4) as one continuous browser session.
Annotations will mark the test boundaries.
