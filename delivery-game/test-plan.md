# Delivery Game — Stage 1 E2E Test Plan

## What changed
PR #86 adds a complete browser-based 3D delivery game. After Devin Review a second commit fixed 4 critical bugs (phase transitions on enter/exit car, partial fuel fill math, E-to-refuel precedence over E-to-exit). During testing I also discovered and fixed a blocker: the WebGL canvas was appended to `<body>` after `<div id="app">` (100vh tall) with no positioning, which pushed it off-screen. `index.html` now positions `body > canvas` as `position: fixed; inset: 0; z-index: 0`.

Target: https://delivery-game-nu.vercel.app (serves `assets/index-P3ycQVma.js`).

## Primary flow (one test case)

Stage 1 is the minimal path that exercises every subsystem: render/camera, input, car physics, mission state machine, minimap arrow & distance, fuel HUD, scoring dialog.

### Steps & assertions

1. **Loading → stage intro dialog**
   - Open https://delivery-game-nu.vercel.app
   - **Assert** the 3D viewport is visible and not uniform black: colored geometry (green ground, buildings, road) is present behind the stage-intro dialog. Exact check: read `__game.engine.renderer.getContext()` pixels at 5 points mid-frame; ≥ 3 of 5 samples must have max(R,G,B) ≥ 40.
   - **Assert** dialog headline reads "المرحلة 1".
   - **Assert** table shows: عدد الموظفين = `1`, المسافة المقدّرة = `قصيرة`, تكلفة البنزين = `10 $ / لتر`, السيارة = `سيارة صغيرة`.
   - **Assert** `#dialog-stage-intro` has class `show`.

2. **Click "بدء المهمة"**
   - **Assert** dialog is dismissed (`.show` removed), HUD objective updates to `اصطحب <name> من منزله` where `<name>` ∈ {أحمد, سالم, محمد, …}.
   - **Assert** `__game.phase === 'walking'`, `__game.driving === false`, player humanoid visible (`__game.player.root.visible === true`).
   - **Assert** minimap shows player (blue dot), one employee (yellow triangle) with non-zero distance label in meters, office (green square), two gas stations (orange dots).

3. **Walk up to the car and enter it (E)**
   - Hold `D` briefly until player is within 3.5m of car (`HUD #interact-hint` visible: "اضغط E لدخول السيارة").
   - Press `E`.
   - **Assert** `__game.driving === true`, `__game.phase === 'driving'` (this is BugFix #1 — without it the E-to-exit logic would not re-arm).
   - **Assert** player humanoid is hidden (`__game.player.root.visible === false`).
   - **Assert** toast "ركبت السيارة — انطلق!" appears.
   - **Assert** camera switched to chase view (camera y > 3, behind car).

4. **Drive toward the employee's house (using minimap arrow)**
   - Hold `W`. Occasionally steer with `A`/`D` to track minimap arrow.
   - **Assert after ~2 s of W**: `#speed` (Arabic digits) reads ≥ `15 km/h`; `#fuel-pct` reads `< 100%`; minimap arrow rotates as car heading changes.
   - **Assert** minimap target distance label decreases over time (baseline at start ≈ 195m from screenshot → expect ≤ 100m after ~10 s of driving).

5. **Arrive at employee house & pick up**
   - As minimap shows <10m to target, ease off `W` and tap `S` to slow to near-stop.
   - **Assert** within a few seconds the following happen:
     - Toast: `تم اصطحاب <name>!`
     - `👥 الموظفون` chip changes `0/1 → 1/1` (first dot becomes green).
     - Objective changes to `توجه إلى مقر العمل 🏢`.
     - `__game.mission.pickedCount === 1`.
     - NPC at house is hidden.

6. **Drive to the office (follow minimap arrow to green square)**
   - Hold `W`, steer to office.
   - **Assert** `#fuel-pct` keeps decreasing (monotonic while throttle held).
   - As minimap shows <10m to office, ease off and stop.

7. **Stage end dialog**
   - **Assert** `#dialog-stage-end` shows with class `show`.
   - **Assert** star icons: at least ⭐ × 1 filled (stars ≥ 1 per Mission.computeScore clamp).
   - **Assert** reward text contains a $ amount ≥ `63` (40 + 1·15 + 1·8 + 0 bonus = 63 min) and ≤ `103` (40 + 15 + 40 + 20 = 115 max but capped).
   - **Assert** `💰` (money chip) increments by the shown reward once the dialog is dismissed/continue clicked.

### Negative / adversarial checks bundled in the same run

- **A broken canvas CSS fix** would show a pure-black 3D viewport (step 1 fails: <3 samples with max channel ≥ 40).
- **A broken phase-transition fix (#1)** would mean pressing E near car doesn't actually enter driving mode: `#speed` stays at 0, camera stays walk, no toast.
- **A broken phase-transition fix (#2) on exit** is out-of-scope for this primary flow but easy sanity: if after step 3 we press E again away from any gas station, we should return to walking.
- **A broken E-priority fix (#4)** would mean pressing E next to a gas station would exit the car instead of opening the refuel dialog. Not exercised in the primary flow because Stage 1 doesn't force a fuel stop.

### Evidence to capture
- Screen recording (maximized window) covering steps 1–7 with `record_annotate` markers:
  - `setup` → "Loading game and verifying stage intro dialog"
  - `test_start` → "It should show the 3D city behind the intro dialog"
  - `assertion` → "3D viewport visible, city + sky rendering behind dialog"
  - `test_start` → "It should start Stage 1 on click and enter walking phase"
  - `assertion` → "Dialog dismissed, phase=walking, minimap populated"
  - `test_start` → "It should enter the car with E and switch to driving"
  - `assertion` → "phase=driving, player hidden, chase cam engaged"
  - `test_start` → "It should pick up the employee and update HUD"
  - `assertion` → "Passengers 1/1, NPC hidden, objective → office"
  - `test_start` → "It should deliver to office and open stage-end dialog"
  - `assertion` → "Stars ≥ 1, reward ≥ 63$, money incremented"
- Final screenshot of stage-end dialog with reward amount.

## Out of scope (explicitly not testing)
- Minimap heading rotation direction (Devin Review flagged; not part of the 4 critical fixes).
- Building-collider 90°-rotation issue (Devin Review flagged; affects walking collision edges).
- Full 10-stage progression, day/night cycle, traffic AI, pedestrians — not needed to prove the primary loop works.
