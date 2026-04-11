# Status Page — Technical Reference

## Architecture
- **Frontend:** `StatusPage.tsx` — single large component (~55KB)
- **Backend:** `health_monitor.py` — `HealthMonitor` class with scheduled health checks

## Backend Health Monitor (`health_monitor.py`)

### Service Categories (enum: `ServiceCategory`)
- `infrastructure` — Backend API, WebSocket, Frontend
- `data_sources` — GDELT, RSS, NewsAPI, MediaStack
- `external_apis` — OpenSky, AISStream, ACLED

### Health Check Methods
- **Backend API:** Self HTTP request to `/api/health`
- **WebSocket:** Test WS connection to own endpoint
- **Frontend:** HTTP GET to Vercel URL
- **GDELT:** HTTP GET to GDELT API
- **RSS:** Fetch sample RSS feed
- **Others:** Check if API key is configured

### Data Models
- `ServiceHealth` — status, response_time, uptime_24h, uptime_history_90d, disabled_reason
- `DailyUptimeRecord` — date, uptime_percentage, had_incident, status
- `IncidentRecord` — service, severity, message, timestamp, resolved_at, resolution_message

### Key Endpoints
- `GET /api/status` — Full status summary with all services, incidents, days_without_incidents
- Auto-refresh: Frontend polls every 30 seconds

### 90-Day History
- Each service maintains a `DailyUptimeRecord` list for 90 days
- Displayed as color-coded bars: green (operational), red (incident), gray (disabled)

### Days Without Incidents
- Calculated by `_calc_days_without_incidents()` — counts consecutive days with no active incidents
- Displayed as prominent green banner in frontend

## Frontend Features
- Service cards grouped by category with category-specific icons
- Response time charts per service (hidden when all values are 0ms)
- 90-day uptime history bar with tooltip details
- Incident history section with timestamps
- Disabled services show Arabic explanation
- Auto-refresh indicator with countdown
- Negative timestamp bug fixed ("منذ -1 ث" no longer appears)
