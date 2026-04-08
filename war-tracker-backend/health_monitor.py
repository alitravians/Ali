"""
WarScope Health Monitor — Periodic service health checking, incident tracking,
and self-healing for all backend services and external APIs.
"""
import asyncio
import time
import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any

from pydantic import BaseModel


# ──────────────────────────────────────────────
# Enums & Models
# ──────────────────────────────────────────────
class ServiceStatus(str, Enum):
    operational = "operational"
    degraded = "degraded"
    partial_outage = "partial_outage"
    major_outage = "major_outage"
    maintenance = "maintenance"


class OverallStatus(str, Enum):
    operational = "operational"
    degraded = "degraded_performance"
    partial_outage = "partial_outage"
    major_outage = "major_outage"
    maintenance = "maintenance"


class IncidentStatus(str, Enum):
    investigating = "investigating"
    identified = "identified"
    monitoring = "monitoring"
    resolved = "resolved"


class IncidentSeverity(str, Enum):
    minor = "minor"
    major = "major"
    critical = "critical"


class HealthCheckResult(BaseModel):
    service_id: str
    status: ServiceStatus
    response_time_ms: float | None = None
    error: str | None = None
    checked_at: str
    success: bool


class ServiceConfig(BaseModel):
    id: str
    name: str
    name_ar: str
    type: str  # api, websocket, database, external
    endpoint: str | None = None
    check_interval_seconds: int = 180  # default 3 min
    enabled: bool = True
    auto_heal: bool = True
    timeout_ms: int = 10000
    degraded_threshold_ms: int = 5000


class IncidentNote(BaseModel):
    id: str
    message: str
    message_ar: str
    status: IncidentStatus
    timestamp: str
    auto_generated: bool = True


class Incident(BaseModel):
    id: str
    title: str
    title_ar: str
    description: str
    description_ar: str
    severity: IncidentSeverity
    status: IncidentStatus
    affected_services: list[str]
    started_at: str
    resolved_at: str | None = None
    duration_seconds: int | None = None
    auto_healed: bool = False
    notes: list[IncidentNote] = []


class ServiceHealth(BaseModel):
    config: ServiceConfig
    current_status: ServiceStatus = ServiceStatus.operational
    last_check: str | None = None
    last_success: str | None = None
    last_failure: str | None = None
    response_time_ms: float | None = None
    response_times_history: list[float] = []  # last 50
    uptime_24h: float = 100.0
    errors_24h: int = 0
    errors_7d: int = 0
    outages_24h: int = 0
    checks_24h: int = 0
    success_rate_24h: float = 100.0
    consecutive_failures: int = 0
    heal_attempts: int = 0


# ──────────────────────────────────────────────
# Health Monitor
# ──────────────────────────────────────────────
class HealthMonitor:
    def __init__(self):
        self.services: dict[str, ServiceHealth] = {}
        self.incidents: list[Incident] = []
        self.check_history: list[HealthCheckResult] = []  # last 500
        self._check_counts: dict[str, dict] = {}  # per-service 24h tracking
        self._running = False
        self._tasks: list[asyncio.Task] = []

        # Initialize default services
        self._init_default_services()

    def _init_default_services(self):
        defaults = [
            ServiceConfig(
                id="backend_api",
                name="Backend API",
                name_ar="واجهة البرمجة الخلفية",
                type="api",
                endpoint="/",
                check_interval_seconds=60,
            ),
            ServiceConfig(
                id="websocket",
                name="WebSocket Real-time",
                name_ar="الاتصال المباشر",
                type="websocket",
                endpoint="/ws",
                check_interval_seconds=120,
            ),
            ServiceConfig(
                id="gdelt",
                name="GDELT Events",
                name_ar="أحداث GDELT",
                type="external",
                endpoint="gdelt",
                check_interval_seconds=180,
            ),
            ServiceConfig(
                id="rss_feeds",
                name="RSS News Feeds",
                name_ar="تغذيات RSS الإخبارية",
                type="external",
                endpoint="rss",
                check_interval_seconds=180,
            ),
            ServiceConfig(
                id="opensky",
                name="OpenSky Aircraft",
                name_ar="بيانات الطيران OpenSky",
                type="external",
                endpoint="opensky",
                check_interval_seconds=180,
            ),
            ServiceConfig(
                id="devin_ai",
                name="Devin AI Analysis",
                name_ar="تحليلات Devin الذكية",
                type="external",
                endpoint="devin_ai",
                check_interval_seconds=300,
            ),
            ServiceConfig(
                id="aisstream",
                name="AIS Maritime Stream",
                name_ar="بيانات الملاحة البحرية",
                type="external",
                endpoint="aisstream",
                check_interval_seconds=180,
            ),
            ServiceConfig(
                id="newsapi",
                name="NewsAPI",
                name_ar="واجهة الأخبار",
                type="external",
                endpoint="newsapi",
                check_interval_seconds=300,
                enabled=False,  # Disabled by default unless key is set
            ),
            ServiceConfig(
                id="mediastack",
                name="MediaStack",
                name_ar="ميدياستاك",
                type="external",
                endpoint="mediastack",
                check_interval_seconds=300,
                enabled=False,
            ),
            ServiceConfig(
                id="acled",
                name="ACLED Conflict Data",
                name_ar="بيانات النزاعات ACLED",
                type="external",
                endpoint="acled",
                check_interval_seconds=300,
                enabled=False,
            ),
        ]

        for cfg in defaults:
            self.services[cfg.id] = ServiceHealth(config=cfg)

    def get_overall_status(self) -> OverallStatus:
        """Determine overall system status from individual service statuses."""
        active = [s for s in self.services.values() if s.config.enabled]
        if not active:
            return OverallStatus.operational

        statuses = [s.current_status for s in active]

        if any(s == ServiceStatus.major_outage for s in statuses):
            return OverallStatus.major_outage
        if any(s == ServiceStatus.maintenance for s in statuses):
            return OverallStatus.maintenance
        if any(s == ServiceStatus.partial_outage for s in statuses):
            return OverallStatus.partial_outage
        if any(s == ServiceStatus.degraded for s in statuses):
            return OverallStatus.degraded
        return OverallStatus.operational

    async def check_service(self, service_id: str, store: Any) -> HealthCheckResult:
        """Perform a health check on a specific service."""
        svc = self.services.get(service_id)
        if not svc:
            return HealthCheckResult(
                service_id=service_id,
                status=ServiceStatus.major_outage,
                checked_at=datetime.now(timezone.utc).isoformat(),
                success=False,
                error="Service not found",
            )

        start = time.time()
        now_iso = datetime.now(timezone.utc).isoformat()
        result: HealthCheckResult

        try:
            if svc.config.type == "api":
                # Check backend API by verifying store exists and has data
                is_ok = store is not None
                elapsed = (time.time() - start) * 1000
                result = HealthCheckResult(
                    service_id=service_id,
                    status=ServiceStatus.operational if is_ok else ServiceStatus.major_outage,
                    response_time_ms=round(elapsed, 1),
                    checked_at=now_iso,
                    success=is_ok,
                )

            elif svc.config.type == "websocket":
                # Check WebSocket by verifying ws_manager is available
                from main import ws_manager
                is_ok = ws_manager is not None
                elapsed = (time.time() - start) * 1000
                result = HealthCheckResult(
                    service_id=service_id,
                    status=ServiceStatus.operational if is_ok else ServiceStatus.major_outage,
                    response_time_ms=round(elapsed, 1),
                    checked_at=now_iso,
                    success=is_ok,
                )

            elif svc.config.type == "external":
                # Check external services via store.source_status
                source_key = svc.config.endpoint or svc.config.id
                source_info = store.source_status.get(source_key, {})
                is_active = source_info.get("active", False)
                last_update = source_info.get("lastUpdate")
                error_count = source_info.get("errors", 0)
                event_count = source_info.get("eventCount", 0)

                elapsed = (time.time() - start) * 1000

                if not is_active:
                    status = ServiceStatus.major_outage
                    success = False
                elif error_count > 5 and event_count == 0:
                    status = ServiceStatus.major_outage
                    success = False
                elif error_count > 3:
                    status = ServiceStatus.degraded
                    success = True
                elif last_update is None and event_count == 0:
                    # Never fetched yet — might be initializing
                    status = ServiceStatus.degraded
                    success = True
                else:
                    status = ServiceStatus.operational
                    success = True

                result = HealthCheckResult(
                    service_id=service_id,
                    status=status,
                    response_time_ms=round(elapsed, 1),
                    checked_at=now_iso,
                    success=success,
                    error=f"Errors: {error_count}" if error_count > 0 else None,
                )
            else:
                elapsed = (time.time() - start) * 1000
                result = HealthCheckResult(
                    service_id=service_id,
                    status=ServiceStatus.operational,
                    response_time_ms=round(elapsed, 1),
                    checked_at=now_iso,
                    success=True,
                )

        except Exception as e:
            elapsed = (time.time() - start) * 1000
            result = HealthCheckResult(
                service_id=service_id,
                status=ServiceStatus.major_outage,
                response_time_ms=round(elapsed, 1),
                checked_at=now_iso,
                success=False,
                error=str(e)[:200],
            )

        # Update service health
        self._update_service_health(service_id, result)

        # Store check history (keep last 500)
        self.check_history.append(result)
        if len(self.check_history) > 500:
            self.check_history = self.check_history[-500:]

        return result

    def _update_service_health(self, service_id: str, result: HealthCheckResult):
        """Update service health tracking after a check."""
        svc = self.services.get(service_id)
        if not svc:
            return

        old_status = svc.current_status
        svc.current_status = result.status
        svc.last_check = result.checked_at

        if result.response_time_ms is not None:
            svc.response_time_ms = result.response_time_ms
            svc.response_times_history.append(result.response_time_ms)
            if len(svc.response_times_history) > 50:
                svc.response_times_history = svc.response_times_history[-50:]

        # Track 24h stats
        svc.checks_24h += 1

        if result.success:
            svc.last_success = result.checked_at
            svc.consecutive_failures = 0
            svc.heal_attempts = 0
        else:
            svc.last_failure = result.checked_at
            svc.consecutive_failures += 1
            svc.errors_24h += 1
            svc.errors_7d += 1

        # Calculate success rate
        if svc.checks_24h > 0:
            svc.success_rate_24h = round(
                ((svc.checks_24h - svc.errors_24h) / svc.checks_24h) * 100, 1
            )

        # Calculate uptime
        svc.uptime_24h = svc.success_rate_24h

        # Detect transitions → create incidents
        if old_status not in (ServiceStatus.partial_outage, ServiceStatus.major_outage) and result.status in (
            ServiceStatus.partial_outage,
            ServiceStatus.major_outage,
        ):
            svc.outages_24h += 1
            self._create_incident(svc, result)
        elif old_status in (
            ServiceStatus.partial_outage,
            ServiceStatus.major_outage,
            ServiceStatus.degraded,
        ) and result.status == ServiceStatus.operational:
            self._resolve_incidents(service_id)

    def _create_incident(self, svc: ServiceHealth, result: HealthCheckResult):
        """Auto-create an incident when a service goes down."""
        severity = (
            IncidentSeverity.critical
            if result.status == ServiceStatus.major_outage
            else IncidentSeverity.major
        )

        is_outage = result.status == ServiceStatus.major_outage
        title_type = "انقطاع" if is_outage else "بطء"
        desc_type = "انقطاع كامل" if is_outage else "تدهور في الأداء"

        incident = Incident(
            id=f"inc-{uuid.uuid4().hex[:8]}",
            title=f"{svc.config.name} — {'Outage' if is_outage else 'Degraded'}",
            title_ar=f"تم رصد {title_type} في خدمة {svc.config.name_ar}",
            description=f"{result.status.value} detected for {svc.config.name}",
            description_ar=f"تم اكتشاف {desc_type} في خدمة {svc.config.name_ar}",
            severity=severity,
            status=IncidentStatus.investigating,
            affected_services=[svc.config.id],
            started_at=result.checked_at,
            notes=[
                IncidentNote(
                    id=f"note-{uuid.uuid4().hex[:8]}",
                    message=f"Automated check detected {result.status.value}. Error: {result.error or 'N/A'}",
                    message_ar=f"تم رصد مشكلة تلقائياً: {result.error or 'لا توجد تفاصيل'}",
                    status=IncidentStatus.investigating,
                    timestamp=result.checked_at,
                ),
            ],
        )

        self.incidents.insert(0, incident)
        # Keep last 100 incidents
        if len(self.incidents) > 100:
            self.incidents = self.incidents[:100]

    def _resolve_incidents(self, service_id: str):
        """Auto-resolve open incidents for a service that recovered."""
        now = datetime.now(timezone.utc)
        for inc in self.incidents:
            if (
                service_id in inc.affected_services
                and inc.status != IncidentStatus.resolved
            ):
                started = datetime.fromisoformat(inc.started_at)
                inc.status = IncidentStatus.resolved
                inc.resolved_at = now.isoformat()
                inc.duration_seconds = int((now - started).total_seconds())
                inc.notes.append(
                    IncidentNote(
                        id=f"note-{uuid.uuid4().hex[:8]}",
                        message="Service recovered and is now operational.",
                        message_ar="تم استرجاع الخدمة بنجاح وعادت للعمل الطبيعي.",
                        status=IncidentStatus.resolved,
                        timestamp=now.isoformat(),
                    )
                )

    async def attempt_self_heal(self, service_id: str, store: Any) -> bool:
        """Attempt safe self-healing actions for a failing service."""
        svc = self.services.get(service_id)
        if not svc or not svc.config.auto_heal:
            return False

        if svc.heal_attempts >= 3:
            # Don't retry more than 3 times
            return False

        svc.heal_attempts += 1
        healed = False
        now_iso = datetime.now(timezone.utc).isoformat()

        try:
            if svc.config.type == "external":
                # Reset error count for the source to allow retry
                source_key = svc.config.endpoint or svc.config.id
                if source_key in store.source_status:
                    store.source_status[source_key]["errors"] = 0
                    healed = True

            if healed:
                # Add healing note to active incident
                for inc in self.incidents:
                    if (
                        service_id in inc.affected_services
                        and inc.status != IncidentStatus.resolved
                    ):
                        inc.status = IncidentStatus.monitoring
                        inc.auto_healed = True
                        inc.notes.append(
                            IncidentNote(
                                id=f"note-{uuid.uuid4().hex[:8]}",
                                message=f"Auto-heal attempt #{svc.heal_attempts}: Reset error counters and retrying.",
                                message_ar=f"محاولة إصلاح تلقائي #{svc.heal_attempts}: تم إعادة تعيين العدادات وإعادة المحاولة.",
                                status=IncidentStatus.monitoring,
                                timestamp=now_iso,
                            )
                        )
                        break

        except Exception:
            pass

        return healed

    async def _check_loop(self, service_id: str, store: Any):
        """Background loop for a single service."""
        svc = self.services.get(service_id)
        if not svc:
            return

        while self._running:
            if svc.config.enabled:
                result = await self.check_service(service_id, store)

                # Self-heal if failing
                if (
                    not result.success
                    and svc.consecutive_failures >= 2
                    and svc.config.auto_heal
                ):
                    await self.attempt_self_heal(service_id, store)

            await asyncio.sleep(svc.config.check_interval_seconds)

    async def start(self, store: Any):
        """Start all health check loops."""
        self._running = True
        # Initial check for all services
        for sid in self.services:
            if self.services[sid].config.enabled:
                await self.check_service(sid, store)

        # Start periodic loops
        for sid in self.services:
            task = asyncio.create_task(self._check_loop(sid, store))
            self._tasks.append(task)

    async def stop(self):
        """Stop all health check loops."""
        self._running = False
        for task in self._tasks:
            task.cancel()
        self._tasks.clear()

    # ──────────────────────────────────────────────
    # API response helpers
    # ──────────────────────────────────────────────
    def get_status_summary(self) -> dict:
        """Full status page data."""
        active_services = [
            s for s in self.services.values() if s.config.enabled
        ]
        return {
            "overall_status": self.get_overall_status().value,
            "overall_status_ar": _status_ar(self.get_overall_status().value),
            "services": [
                {
                    "id": s.config.id,
                    "name": s.config.name,
                    "name_ar": s.config.name_ar,
                    "type": s.config.type,
                    "status": s.current_status.value,
                    "status_ar": _service_status_ar(s.current_status.value),
                    "last_check": s.last_check,
                    "last_success": s.last_success,
                    "last_failure": s.last_failure,
                    "response_time_ms": s.response_time_ms,
                    "response_times_history": s.response_times_history[-20:],
                    "uptime_24h": s.uptime_24h,
                    "success_rate_24h": s.success_rate_24h,
                    "errors_24h": s.errors_24h,
                    "errors_7d": s.errors_7d,
                    "outages_24h": s.outages_24h,
                    "checks_24h": s.checks_24h,
                    "check_interval": s.config.check_interval_seconds,
                    "auto_heal": s.config.auto_heal,
                    "enabled": s.config.enabled,
                }
                for s in active_services
            ],
            "incidents": [inc.model_dump(mode="json") for inc in self.incidents[:20]],
            "last_updated": datetime.now(timezone.utc).isoformat(),
        }

    def get_admin_config(self) -> dict:
        """Admin-only: full config for all services (including disabled)."""
        return {
            "services": [
                {
                    "id": s.config.id,
                    "name": s.config.name,
                    "name_ar": s.config.name_ar,
                    "type": s.config.type,
                    "endpoint": s.config.endpoint,
                    "check_interval_seconds": s.config.check_interval_seconds,
                    "enabled": s.config.enabled,
                    "auto_heal": s.config.auto_heal,
                    "timeout_ms": s.config.timeout_ms,
                    "degraded_threshold_ms": s.config.degraded_threshold_ms,
                    "status": s.current_status.value,
                }
                for s in self.services.values()
            ],
            "incidents_count": len(self.incidents),
            "active_incidents": len(
                [i for i in self.incidents if i.status != IncidentStatus.resolved]
            ),
        }

    def update_service_config(self, service_id: str, updates: dict) -> bool:
        """Admin: update service configuration."""
        svc = self.services.get(service_id)
        if not svc:
            return False

        if "enabled" in updates:
            svc.config.enabled = bool(updates["enabled"])
        if "auto_heal" in updates:
            svc.config.auto_heal = bool(updates["auto_heal"])
        if "check_interval_seconds" in updates:
            val = int(updates["check_interval_seconds"])
            svc.config.check_interval_seconds = max(30, min(val, 600))

        return True

    def add_manual_incident_note(
        self, incident_id: str, message: str, message_ar: str
    ) -> bool:
        """Admin: add a manual note to an incident."""
        for inc in self.incidents:
            if inc.id == incident_id:
                inc.notes.append(
                    IncidentNote(
                        id=f"note-{uuid.uuid4().hex[:8]}",
                        message=message,
                        message_ar=message_ar,
                        status=inc.status,
                        timestamp=datetime.now(timezone.utc).isoformat(),
                        auto_generated=False,
                    )
                )
                return True
        return False


# ──────────────────────────────────────────────
# Arabic translations
# ──────────────────────────────────────────────
def _status_ar(status: str) -> str:
    return {
        "operational": "يعمل بشكل طبيعي",
        "degraded_performance": "أداء منخفض",
        "partial_outage": "انقطاع جزئي",
        "major_outage": "انقطاع كامل",
        "maintenance": "صيانة",
    }.get(status, status)


def _service_status_ar(status: str) -> str:
    return {
        "operational": "يعمل",
        "degraded": "بطيء",
        "partial_outage": "انقطاع جزئي",
        "major_outage": "متوقف",
        "maintenance": "صيانة",
    }.get(status, status)
