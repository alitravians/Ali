"""
Devin API Auto-Fix Service — Creates Devin sessions to investigate and fix
failing services detected by the WarScope health monitor.

Uses the Devin API v1 to create sessions with context about the failing service,
error details, and repository information so Devin can diagnose and fix issues.
"""
import httpx
from datetime import datetime, timezone
from typing import Optional
from config import DEVIN_API_KEY, DEVIN_API_URL


# Store active and past fix sessions
_fix_sessions: list[dict] = []
_MAX_CONCURRENT_SESSIONS = 3  # Prevent creating too many sessions at once
_REPO_URL = "https://github.com/alitravians/Ali"

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

    # Check concurrent session limit
    active_count = sum(1 for s in _fix_sessions if s.get("status") in ("running", "pending"))
    if active_count >= _MAX_CONCURRENT_SESSIONS:
        return {
            "success": False,
            "error": f"Too many active fix sessions ({active_count}/{_MAX_CONCURRENT_SESSIONS})",
            "error_ar": f"عدد جلسات الإصلاح النشطة وصل الحد الأقصى ({active_count}/{_MAX_CONCURRENT_SESSIONS})",
        }

    # Check if there's already an active session for this service
    for s in _fix_sessions:
        if s.get("service_id") == service_id and s.get("status") in ("running", "pending"):
            return {
                "success": False,
                "error": f"A fix session is already active for {service_name}",
                "error_ar": f"يوجد جلسة إصلاح نشطة بالفعل لـ {service_name}",
                "existing_session": s,
            }

    prompt = _build_fix_prompt(service_id, service_name, error_details, incident_info)

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
