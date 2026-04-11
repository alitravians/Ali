# Bug Report System — Technical Reference

## Architecture Overview
The bug report system spans both frontend and backend:
- **Frontend:** `BugReportButton.tsx` (report form) + `RepairTracker3D.tsx` (animation page)
- **Backend:** `/api/bug-report` endpoint in `main.py`

## Frontend Flow
1. User clicks floating bug report button (all pages)
2. Modal opens with description textarea + auto-collected diagnostics
3. On submit → POST to `/api/bug-report`
4. If accepted → modal closes, RepairTracker3D opens with ticket ID
5. RepairTracker3D connects via WebSocket for live updates
6. 7-phase animation plays with AI-generated status messages
7. Completion card shown when `is_complete=true`

## Auto-Collected Data
- Console errors (last 15)
- User click/navigation actions (last 15)
- Browser info (UA, screen, viewport, DPR, language, timezone, memory)
- Page snapshot (visible errors, broken images, empty map tiles)
- Current page path
- Screenshot (base64, auto-captured)

## Backend Processing (`main.py`)

### Smart Filter (3-tier)
1. **Problem keywords** → accept immediately:
   `مشكلة، خطأ، خلل، عطل، لا يعمل، ما يشتغل، توقف، تعلق، بطيء، error، bug، crash، freeze، slow`
2. **Suggestion keywords** → reject immediately:
   `اقتراح، اقترح، فكرة، ياليت، نبي، ابي، تسوون، تضيفون، نبغى، ابغى، suggest، idea، feature`
3. **AI classification** (Groq Llama 3.3) → for ambiguous cases

### Rejection Response
`{"detail": "هذا الزر مخصص للإبلاغ عن مشاكل تقنية فقط. إذا كان لديك اقتراح أو فكرة، يرجى التواصل عبر القنوات المخصصة."}`

### Rate Limiting
- **Per-user (IP):** Max 3 reports per 24 hours
- **Global cooldown:** Min 2 minutes between any reports
- Returns remaining reports count and reset time

### AI Smart Responses
When a report is accepted, the backend:
1. Creates a ticket (TKT-XXXXXXXX format)
2. Sends description to Groq Llama 3.3 with a safe prompt
3. AI generates 8 contextual Arabic status messages
4. Messages are delivered on a timed schedule (8-15s intervals)
5. Each message advances the phase and updates progress
6. All 7 phases complete automatically

### WebSocket Updates
- Endpoint: `ws://backend/ws/ticket/{ticket_id}`
- Message types: `ticket_status` (initial), `ticket_update` (incremental)
- Includes: phase, progress (0-100), status_message, is_complete, status_history

### Devin Integration
When `DEVIN_TARGET_SESSION_ID` is set, real bug reports are forwarded to an existing Devin session via the Devin API as a chat message. This allows automated investigation.

## Animation Improvements (Latest)
- **Cinematic entrance:** Staggered fade+slide for all sections
- **Typewriter effect:** Latest status message types character-by-character
- **Phase transitions:** Glow effects, border indicators, bounce animations, pop-in checkmarks
- **Ambient particles:** 20 floating particles with phase-aware colors
- **Neon progress bar:** Multi-color shimmer (blue→purple→pink) with glint overlay
- **Celebration card:** Radiating rings, success pulse, staggered content reveal
- **Reduced motion support:** Falls back to simple progress view on weak devices
- **Sound effects:** Web Audio API tones for phase advances and completion
