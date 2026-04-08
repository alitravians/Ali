"""
Devin API Auto-Fix Service — Sends fix requests to the linked Devin session,
or creates new sessions as fallback.

Uses the Devin API v1 to send messages to an existing session or create new
sessions with context about the failing service.
"""
import httpx
from datetime import datetime, timezone
from typing import Optional
from config import DEVIN_API_KEY, DEVIN_API_URL


# Store active and past fix sessions
_fix_sessions: list[dict] = []
_MAX_CONCURRENT_SESSIONS = 3  # Prevent creating too many sessions at once
_REPO_URL = "https://github.com/alitravians/Ali"

# Linked session — fix requests go here first
_LINKED_SESSION_ID = "9e1ad247188248028901652f27903c73"

# Service context for better prompts
_SERVICE_CONTEXT = {
    "backend_api": {
        "file": "war-tracker-backend/main.py",
        "description": "FastAPI backend server for WarScope conflict tracker",
        "fix_hints": "Check main.py for endpoint errors, config.py for env vars, requirements.txt for dependencies",
    },
    "websocket": {
        "file": "war-tracker-backend/main.py",
        "description": "WebSocket real-time connection for live event updates",
        "fix_hints": "Check ws_manager in main.py, MAX_WS_CONNECTIONS limit, connection handling",
    },
    "gdelt": {
        "file": "war-tracker-backend/services/gdelt_service.py",
        "description": "GDELT API integration for fetching global conflict events",
        "fix_hints": "Check GDELT API URL, rate limits (429 errors), response parsing",
    },
    "rss_feeds": {
        "file": "war-tracker-backend/services/rss_service.py",
        "description": "RSS feed aggregator for news from Al Jazeera, BBC, Reuters, and Bahrain sources",
        "fix_hints": "Check feed URLs, feedparser, timeout settings, Bahrain-specific feeds",
    },
    "opensky": {
        "file": "war-tracker-backend/services/opensky_service.py",
        "description": "OpenSky Network API for tracking aircraft positions",
        "fix_hints": "Check OpenSky API availability, rate limits, REGION_BBOX config",
    },
    "devin_ai": {
        "file": "war-tracker-backend/services/ai_service.py",
        "description": "AI analysis engine using Groq/Llama for event analysis",
        "fix_hints": "Check GROQ_API_KEY, Groq API rate limits, model availability",
    },
    "aisstream": {
        "file": "war-tracker-backend/services/maritime_service.py",
        "description": "AISStream.io WebSocket for real-time maritime vessel tracking",
        "fix_hints": "Check AISSTREAM_API_KEY, WebSocket connection, maritime zones config",
    },
    "newsapi": {
        "file": "war-tracker-backend/services/news_service.py",
        "description": "NewsAPI.org for fetching news articles about the conflict",
        "fix_hints": "Check NEWSAPI_KEY, free tier limits (100 req/day), query parameters",
    },
    "mediastack": {
        "file": "war-tracker-backend/services/news_service.py",
        "description": "MediaStack API as backup news source",
        "fix_hints": "Check MEDIASTACK_API_KEY, API availability, response format",
    },
    "acled": {
        "file": "war-tracker-backend/services/gdelt_service.py",
        "description": "ACLED conflict data integration",
        "fix_hints": "Check ACLED API access, data format, region filters",
    },
}


def _build_fix_prompt(service_id: str, service_name: str, error_details: str,
                      incident_info: Optional[dict] = None) -> str:
    """Build a detailed prompt for Devin to investigate and fix the service issue."""
    ctx = _SERVICE_CONTEXT.get(service_id, {})
    file_path = ctx.get("file", "war-tracker-backend/")
    description = ctx.get("description", f"Service: {service_name}")
    fix_hints = ctx.get("fix_hints", "Check logs and service configuration")

    prompt = f"""## WarScope Auto-Fix: {service_name} is failing

### Context
WarScope is a real-time Middle East conflict tracker. The health monitor detected that **{service_name}** is not working properly.

### Repository
{_REPO_URL}
Branch: `devin/1775605997-devin-analysis-status-page`

### Service Details
- **Service ID:** {service_id}
- **Description:** {description}
- **Primary file:** {file_path}
- **Fix hints:** {fix_hints}

### Error Details
{error_details}
"""

    if incident_info:
        prompt += f"""
### Incident Information
- **Started:** {incident_info.get('started_at', 'Unknown')}
- **Severity:** {incident_info.get('severity', 'Unknown')}
- **Auto-heal attempts:** {incident_info.get('heal_attempts', 0)}
- **Notes:** {incident_info.get('notes', 'None')}
"""

    prompt += """
### Instructions
1. Clone the repository and check the relevant service file
2. Look at recent commits for any breaking changes
3. Check environment variables and API keys on Fly.io (app: war-tracker-backend-v2)
4. Identify the root cause of the failure
5. Implement a fix
6. Test the fix locally if possible
7. Commit the fix and deploy to Fly.io: `fly deploy --app war-tracker-backend-v2`
8. Verify the service is working after deployment

### Important
- Do NOT break other services while fixing this one
- Keep changes minimal and focused on the fix
- Deploy immediately after fixing — do not ask for permission
"""
    return prompt


async def _send_to_linked_session(prompt: str) -> Optional[dict]:
    """Try to send a fix message to the linked Devin session.
    Returns session info dict on success, None on failure."""
    if not DEVIN_API_KEY or not _LINKED_SESSION_ID:
        return None

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Send message to the existing session
            resp = await client.post(
                f"{DEVIN_API_URL}/session/{_LINKED_SESSION_ID}/message",
                headers={
                    "Authorization": f"Bearer {DEVIN_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={"message": prompt},
            )

            if resp.status_code == 200:
                return {
                    "success": True,
                    "session_id": _LINKED_SESSION_ID,
                    "session_url": f"https://app.devin.ai/sessions/{_LINKED_SESSION_ID}",
                    "linked": True,
                }
            else:
                print(f"[AUTOFIX] Linked session message failed ({resp.status_code}): {resp.text[:200]}")
                return None

    except Exception as e:
        print(f"[AUTOFIX] Linked session error: {e}")
        return None


async def create_fix_session(
    service_id: str,
    service_name: str,
    error_details: str,
    incident_info: Optional[dict] = None,
) -> dict:
    """Create a Devin session to investigate and fix a failing service.

    Returns dict with session info or error details.
    """
    if not DEVIN_API_KEY:
        return {"success": False, "error": "DEVIN_API_KEY not configured", "error_ar": "مفتاح Devin API غير مُعرّف"}

    prompt = _build_fix_prompt(service_id, service_name, error_details, incident_info)

    # Step 1: Try sending to the linked session first (skip duplicate check — just messaging)
    linked_result = await _send_to_linked_session(prompt)
    if linked_result:
        session_info = {
            **linked_result,
            "service_id": service_id,
            "service_name": service_name,
            "status": "running",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "error_details": error_details[:500],
            "linked": True,
        }
        _fix_sessions.insert(0, session_info)
        while len(_fix_sessions) > 20:
            _fix_sessions.pop()
        return session_info

    # Step 2: Fallback — create a new session (with duplicate/limit checks)
    active_count = sum(1 for s in _fix_sessions if s.get("status") in ("running", "pending") and not s.get("linked"))
    if active_count >= _MAX_CONCURRENT_SESSIONS:
        return {
            "success": False,
            "error": f"Too many active fix sessions ({active_count}/{_MAX_CONCURRENT_SESSIONS})",
            "error_ar": f"عدد جلسات الإصلاح النشطة وصل الحد الأقصى ({active_count}/{_MAX_CONCURRENT_SESSIONS})",
        }

    for s in _fix_sessions:
        if s.get("service_id") == service_id and s.get("status") in ("running", "pending") and not s.get("linked"):
            return {
                "success": False,
                "error": f"A fix session is already active for {service_name}",
                "error_ar": f"يوجد جلسة إصلاح نشطة بالفعل لـ {service_name}",
                "existing_session": s,
            }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{DEVIN_API_URL}/sessions",
                headers={
                    "Authorization": f"Bearer {DEVIN_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "prompt": prompt,
                    "idempotent": False,
                },
            )

            if resp.status_code == 200:
                data = resp.json()
                session_info = {
                    "success": True,
                    "session_id": data.get("session_id", ""),
                    "session_url": data.get("url", f"https://app.devin.ai/sessions/{data.get('session_id', '')}"),
                    "service_id": service_id,
                    "service_name": service_name,
                    "status": "running",
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "error_details": error_details[:500],
                }
                _fix_sessions.insert(0, session_info)
                # Keep only last 20 sessions
                while len(_fix_sessions) > 20:
                    _fix_sessions.pop()
                return session_info
            else:
                error_text = resp.text[:200]
                return {
                    "success": False,
                    "error": f"Devin API error ({resp.status_code}): {error_text}",
                    "error_ar": f"خطأ في Devin API ({resp.status_code})",
                }

    except httpx.TimeoutException:
        return {"success": False, "error": "Devin API timeout", "error_ar": "انتهت مهلة الاتصال بـ Devin API"}
    except Exception as e:
        return {"success": False, "error": str(e), "error_ar": "خطأ غير متوقع أثناء إنشاء جلسة الإصلاح"}


async def get_session_status(session_id: str) -> dict:
    """Check the status of a Devin fix session."""
    if not DEVIN_API_KEY:
        return {"error": "DEVIN_API_KEY not configured"}

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"{DEVIN_API_URL}/session/{session_id}",
                headers={"Authorization": f"Bearer {DEVIN_API_KEY}"},
            )
            if resp.status_code == 200:
                data = resp.json()
                # Update local session info
                for s in _fix_sessions:
                    if s.get("session_id") == session_id:
                        s["status"] = data.get("status_enum", "unknown")
                        break
                return data
            return {"error": f"API error: {resp.status_code}"}
    except Exception as e:
        return {"error": str(e)}


def get_fix_sessions() -> list[dict]:
    """Get all fix session history."""
    return _fix_sessions


def is_devin_configured() -> bool:
    """Check if Devin API key is available."""
    return bool(DEVIN_API_KEY)
