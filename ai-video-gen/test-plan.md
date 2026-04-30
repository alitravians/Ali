# Test Plan: ai-video-gen (PR #126)

**Live URL:** https://ai-video-gen-psi.vercel.app
**PR:** https://github.com/alitravians/Ali/pull/126

## What changed (user-visible)

A free public website that generates short AI videos (5/10/15 seconds) from a
text prompt. The user types a description, picks a duration and a style,
optionally **uploads a starting frame** from their device, clicks "توليد لوحة
القصة", and is taken to a **storyboard editor** where they can review,
regenerate, edit, reorder, or remove individual scenes before composing the
final MP4.

## What I will test (primary flow)

**End-to-end: open site → upload a starting frame → generate storyboard → edit
one scene → compose 5-second video → download → ffprobe to verify exact target
duration.**

This is the only flow that exercises every new piece (file input, storyboard
editor, regenerate seed, AI keyframe fetch with user image as scene 1, ffmpeg
composition mixing http URLs and `blob:` URLs, IndexedDB persistence, gallery
hydration on reload).

## Setup (already done)

- Vercel deployment verified reachable (HTTP 200) at the canonical alias.
- Backend API confirmed by build output (`/api/generate-frames` is the only
  dynamic route).
- No login/auth needed — site is fully public.
- Browser will use the Devin VM's IP, which has hit Pollinations'
  rate-limit during dev. To work around this, between tests I will wait
  ≥60s and use distinct prompts.

## Test cases

### Test 1: Splash loader appears and dismisses

**Steps:**
1. Open https://ai-video-gen-psi.vercel.app in Chrome
2. Observe splash screen

**Pass criteria:**
- Splash shows the title "AI Video Gen" and Arabic subtitle
- A progress bar fills from 0% to 100% over ~1.8s
- After ~2s, the splash fades away and the main app is visible

**Fail criteria:**
- No splash, OR splash is stuck, OR splash never dismisses, OR text is missing.

### Test 2: Starting frame upload UI

**Steps:**
1. After splash dismisses, locate the new "الإطار الافتتاحي (اختياري)" card at
   the top of the form area
2. Click the upload button → file picker opens
3. Select a real JPG/PNG image from the VM's filesystem

**Pass criteria:**
- Card transitions from "اضغط لرفع صورة" empty state to a preview state
- A 32×20 thumbnail of the uploaded image appears with a "مشهد ١" badge
- File metadata is shown (size in KB, format)
- "استبدال" and "إزالة" buttons are visible
- Clicking "إزالة" returns the card to empty state

**Fail criteria:**
- File picker rejects valid images, OR thumbnail doesn't render, OR
  size/format text is wrong, OR remove button doesn't reset the state.

> Why this catches a broken impl: validates the FileReader/Blob plumbing,
> the `URL.createObjectURL` lifecycle (`useEffect` cleanup), and the
> conditional rendering between empty/filled states.

### Test 3 (PRIMARY): Generate storyboard → edit a scene → compose 5s video

**Steps:**
1. With the starting frame still uploaded from Test 2, type prompt:
   `قطة فضائية تطفو في مجرة ملونة` (one of the example chips)
2. Confirm "5" duration pill is selected by default
3. Confirm "سينمائي" style chip is active by default
4. Click "توليد لوحة القصة"
5. Wait for the API to return frame URLs and the storyboard to appear
6. **Verify the storyboard:**
   - Heading "لوحة القصة (Storyboard)" is visible
   - Exactly **3** scene cards (because duration=5 → 3 frames)
   - Scene 1 is the **uploaded image** (badge: "صورتك"), prompt area shows
     "صورة مرفوعة من جهازك — لا تتأثر بالبرومت"
   - Scenes 2 and 3 are AI thumbnails (each shows the variation prompt text
     and has "إعادة توليد" / "تعديل الوصف" buttons)
7. Click "إعادة توليد" on scene 2
8. Verify the image URL in scene 2 changes (new seed → new image)
9. Click "تركيب الفيديو" at the bottom
10. Watch the ProgressView panel appear with phases:
    - "تحميل الإطارات"
    - "إنشاء المقاطع مع حركة الكاميرا"
    - "دمج المقاطع مع تأثير الانتقال"
    - "تجهيز الفيديو النهائي"
11. After completion, the VideoResult player appears

**Pass criteria after generation:**
- A `<video>` player auto-plays with controls
- Three buttons: "تحميل MP4", "مشاركة", "فيديو جديد"
- Click "تحميل MP4" → browser downloads `ai-video-5s-<id>.mp4`
- Run `ffprobe` on the file:
  - duration ≈ 5.0 (±0.3) seconds
  - codec = `h264`
  - resolution = 1280×720
- The first ~1.5s of the video should clearly show the uploaded image
  (Ken Burns motion on the user's photo)

**Fail criteria:**
- Storyboard doesn't appear, OR scene 1 isn't the uploaded image, OR
  regenerate doesn't change the URL, OR composition fails, OR downloaded
  MP4 has wrong duration / codec / resolution, OR the user's image
  doesn't appear at the start of the video.

### Test 4: Gallery persistence across reload (IndexedDB-backed)

**Steps:**
1. After Test 3 succeeds, scroll to "الفيديوهات السابقة"
2. Verify the just-generated video appears as a thumbnail
3. **Hard reload** the page (Ctrl+Shift+R)
4. Wait for splash to dismiss

**Pass criteria:**
- Gallery still has the video thumbnail (not just a broken video element)
- Click the thumbnail → main video player appears with the working video
  (this directly verifies bug fixes #1 & #2 from Devin Review)
- DevTools → Application → IndexedDB → `ai-video-gen` → `videos` shows the
  blob bytes
- DevTools → Application → Local Storage shows the `…:gallery:v2` meta key

**Fail criteria:**
- Gallery is empty after reload, OR thumbnails don't load, OR the player
  shows a broken/black video.

### Test 5: Different duration produces different frame count

**Steps:**
1. Click "فيديو جديد" → app resets
2. Remove the starting frame ("إزالة")
3. Type a new prompt: `مدينة دبي ليلاً مع برج خليفة`
4. Click the "10" duration pill
5. Click "توليد لوحة القصة"
6. Wait for storyboard

**Pass criteria:**
- Exactly **4** scene cards appear (10s → 4 frames; vs 3 for 5s, 5 for 15s).
- All 4 are AI scenes (no upload).

**Fail criteria:**
- Any other count appears.

### Test 6: Mobile viewport rendering (regression — light check)

**Steps:**
1. DevTools → toggle device toolbar → iPhone 12 Pro
2. Reload

**Pass criteria:**
- No horizontal scrollbar
- Starting frame card, prompt form, storyboard cards all fit the viewport
- Direction is RTL (text aligned right; brand icon on the right)

## Out of scope

- Rate limiter exact behavior (in-memory across edge regions is best-effort).
- 15s flow (Test 5 already proves duration-scaling works for 5→10).
- "مشاركة" share button (depends on `navigator.share`, unavailable in
  desktop Chrome).
- Different AI styles producing visually distinct results (subjective).

## Recording

I will record Tests 1–4 as one continuous browser session.
