"""
WarScope Health Monitor — Periodic service health checking, incident tracking,
and self-healing for all backend services and external APIs.
"""
import asyncio
import os
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


class ServiceCategory(str, Enum):
    infrastructure = "infrastructure"
    data_sources = "data_sources"
    external_apis = "external_apis"


class ServiceConfig(BaseModel):
    id: str
    name: str
    name_ar: str
    type: str  # api, websocket, database, external
    category: ServiceCategory = ServiceCategory.external_apis
    endpoint: str | None = None
    check_interval_seconds: int = 180  # default 3 min
    enabled: bool = True
    auto_heal: bool = True
    timeout_ms: int = 10000
    degraded_threshold_ms: int = 5000
    disabled_reason_ar: str | None = None  # Why disabled (user-facing)


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


class DailyUptimeRecord(BaseModel):
    date: str  # YYYY-MM-DD
    uptime_percent: float = 100.0
    had_incident: bool = False
    status: str = "operational"  # worst status that day


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
    uptime_history_90d: list[DailyUptimeRecord] = []  # last 90 days
    # Daily counters (reset at UTC midnight by `_update_daily_uptime`) used to
    # compute today's entry in `uptime_history_90d`. Unlike `checks_24h` /
    # `errors_24h` — which are monotonic lifetime counters that drift toward
    # the all-time success rate — these are scoped to the current UTC day so
    # the 90-day bars reflect actual daily uptime.
    daily_checks: int = 0
    daily_errors: int = 0


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
                category=ServiceCategory.infrastructure,
                endpoint="/",
                check_interval_seconds=60,
            ),
            ServiceConfig(
                id="websocket",
                name="WebSocket Real-time",
                name_ar="الاتصال المباشر",
                type="websocket",
                category=ServiceCategory.infrastructure,
                endpoint="/ws",
                check_interval_seconds=120,
            ),
            ServiceConfig(
                id="gdelt",
                name="GDELT Events",
                name_ar="أحداث GDELT",
                type="external",
                category=ServiceCategory.data_sources,
                endpoint="gdelt",
                check_interval_seconds=180,
            ),
            ServiceConfig(
                id="rss_feeds",
                name="RSS News Feeds",
                name_ar="تغذيات RSS الإخبارية",
                type="external",
                category=ServiceCategory.data_sources,
                endpoint="rss",
                check_interval_seconds=180,
            ),
            ServiceConfig(
                id="opensky",
                name="OpenSky Aircraft",
                name_ar="بيانات الطيران OpenSky",
                type="external",
                category=ServiceCategory.data_sources,
                endpoint="opensky",
                check_interval_seconds=180,
            ),
            ServiceConfig(
                id="devin_ai",
                name="Automated System Analysis",
                name_ar="تحليلات الأنظمة التلقائية",
                type="external",
                category=ServiceCategory.infrastructure,
                endpoint="devin_ai",
                check_interval_seconds=300,
            ),
            ServiceConfig(
                id="aisstream",
                name="AIS Maritime Stream",
                name_ar="بيانات الملاحة البحرية",
                type="external",
                category=ServiceCategory.data_sources,
                endpoint="aisstream",
                check_interval_seconds=180,
            ),
            ServiceConfig(
                id="newsapi",
                name="NewsAPI",
                name_ar="واجهة الأخبار",
                type="external",
                category=ServiceCategory.external_apis,
                endpoint="newsapi",
                check_interval_seconds=300,
                enabled=bool(os.getenv("NEWSAPI_KEY")),
                disabled_reason_ar="لا يتوفر مفتاح API حالياً" if not os.getenv("NEWSAPI_KEY") else None,
            ),

        ]

        for cfg in defaults:
            svc = ServiceHealth(config=cfg)
            # Start with empty uptime history — real data loaded from DB on startup
            svc.uptime_history_90d = self._init_today_only(cfg.enabled)
            self.services[cfg.id] = svc

    def _init_today_only(self, enabled: bool) -> list[DailyUptimeRecord]:
        """Initialize with only today's record. Historical data is loaded from DB."""
        today = datetime.now(timezone.utc).date()
        return [DailyUptimeRecord(
            date=today.isoformat(),
            uptime_percent=100.0 if enabled else 0.0,
            had_incident=False,
            status="operational" if enabled else "disabled",
        )]

    async def load_uptime_from_db(self):
        """Load persisted uptime history from database for all services.

        Fills gaps in the loaded date sequence with placeholder ``no_data``
        records so the downstream compact encoding (`_compact_uptime_history`
        → frontend `expandUptimeHistory`) can continue to reconstruct dates
        via `start_date + idx`. Without gap-filling, a server outage lasting
        a full UTC day leaves a hole in the stored records, which shifts
        every subsequent bar's tooltip date to the left by the number of
        missing days.
        """
        try:
            import database as _db
            from datetime import timedelta as _td
            for sid, svc in self.services.items():
                records = await _db.load_uptime_history(sid, days=90)
                if records:
                    by_date: dict[str, DailyUptimeRecord] = {
                        r["date"]: DailyUptimeRecord(
                            date=r["date"],
                            uptime_percent=r["uptime_percent"],
                            had_incident=r["had_incident"],
                            status=r["status"],
                        )
                        for r in records
                    }
                    today = datetime.now(timezone.utc).date()
                    # Derive the inclusive range from the earliest persisted
                    # record to today, then densify with placeholders for any
                    # missing days so the sequence is truly contiguous.
                    earliest_str = min(by_date.keys())
                    try:
                        earliest = datetime.fromisoformat(earliest_str).date()
                    except ValueError:
                        earliest = today
                    loaded: list[DailyUptimeRecord] = []
                    cursor = earliest
                    while cursor <= today:
                        key = cursor.isoformat()
                        if key in by_date:
                            loaded.append(by_date[key])
                        elif key == today.isoformat():
                            # Today itself — seed with a fresh operational/disabled entry
                            loaded.append(DailyUptimeRecord(
                                date=key,
                                uptime_percent=100.0 if svc.config.enabled else 0.0,
                                had_incident=False,
                                status="operational" if svc.config.enabled else "disabled",
                            ))
                        else:
                            # Gap day — server was down and no checks ran.
                            # Use `no_data` with 0% uptime so the bar is visually
                            # distinct and dates remain aligned downstream.
                            loaded.append(DailyUptimeRecord(
                                date=key,
                                uptime_percent=0.0,
                                had_incident=False,
                                status="no_data",
                            ))
                        cursor = cursor + _td(days=1)
                    svc.uptime_history_90d = loaded[-90:]  # Keep max 90

                    # Restore today's in-memory counters from the loaded
                    # record so a mid-day restart does not reset today's bar
                    # to 100%. Without this step the first post-restart check
                    # would compute `daily_uptime = 100%` (1 check / 0 errors)
                    # and overwrite the persisted record, silently discarding
                    # any pre-restart failures for the current UTC day.
                    #
                    # `daily_checks` isn't persisted (only the percentage is),
                    # so we estimate it from time-of-day and the service's
                    # check interval, then derive `daily_errors` to preserve
                    # the loaded percentage. Real post-restart checks blend
                    # with this baseline as the day continues.
                    today_rec = next(
                        (r for r in svc.uptime_history_90d if r.date == today.isoformat()),
                        None,
                    )
                    if today_rec is not None and today_rec.status != "no_data":
                        now_utc = datetime.now(timezone.utc)
                        seconds_since_midnight = (
                            now_utc - now_utc.replace(hour=0, minute=0, second=0, microsecond=0)
                        ).total_seconds()
                        interval = max(1, svc.config.check_interval_seconds)
                        estimated_checks = max(1, int(seconds_since_midnight // interval))
                        svc.daily_checks = estimated_checks
                        svc.daily_errors = max(
                            0,
                            min(
                                estimated_checks,
                                round(estimated_checks * (1 - today_rec.uptime_percent / 100.0)),
                            ),
                        )
                    print(f"[DB] Loaded {len(records)} uptime records for {sid} ({len(loaded) - len(records)} gap-filled)")
        except Exception as e:
            print(f"[DB] Error loading uptime history: {e}")

    async def load_incidents_from_db(self):
        """Load persisted incidents from database, filtering out removed services."""
        try:
            import database as _db
            from health_monitor import Incident as _Inc
            incident_dicts = await _db.load_incidents(limit=100)
            valid_service_ids = set(self.services.keys())
            if incident_dicts:
                for d in incident_dicts:
                    try:
                        inc = Incident(**d)
                        # Only drop an incident if *every* affected service was
                        # removed. If some affected services still exist, keep
                        # the incident but strip the stale service IDs —
                        # otherwise a multi-service outage would be lost just
                        # because one of its services was retired.
                        affected = inc.affected_services or []
                        valid_affected = [sid for sid in affected if sid in valid_service_ids]
                        if affected and not valid_affected:
                            try:
                                await _db.delete_incident(inc.id)
                                print(f"[DB] Removed orphaned incident for removed service: {affected}")
                            except Exception:
                                pass
                            continue
                        if valid_affected != affected:
                            inc.affected_services = valid_affected
                        self.incidents.append(inc)
                    except Exception:
                        pass
                print(f"[DB] Loaded {len(self.incidents)} incidents from database")
        except Exception as e:
            print(f"[DB] Error loading incidents: {e}")

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
        svc.daily_checks += 1

        if result.success:
            svc.last_success = result.checked_at
            svc.consecutive_failures = 0
            svc.heal_attempts = 0
        else:
            svc.last_failure = result.checked_at
            svc.consecutive_failures += 1
            svc.errors_24h += 1
            svc.errors_7d += 1
            svc.daily_errors += 1

        # Calculate success rate
        if svc.checks_24h > 0:
            svc.success_rate_24h = round(
                ((svc.checks_24h - svc.errors_24h) / svc.checks_24h) * 100, 1
            )

        # Calculate uptime
        svc.uptime_24h = svc.success_rate_24h

        # Update today's 90-day uptime record
        self._update_daily_uptime(svc, result)

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

    def _update_daily_uptime(self, svc: ServiceHealth, result: HealthCheckResult):
        """Update today's entry in the 90-day uptime history.

        Uses the scoped `daily_checks` / `daily_errors` counters rather than
        `svc.uptime_24h`, which is derived from monotonic lifetime counters
        (`checks_24h` / `errors_24h` are never reset) and therefore drifts
        toward the all-time success rate, making the 90-day bars increasingly
        stale over days/weeks of uptime. The daily counters are reset below
        when the UTC day rolls over.
        """
        today_str = datetime.now(timezone.utc).date().isoformat()
        if svc.daily_checks > 0:
            daily_uptime = round(
                ((svc.daily_checks - svc.daily_errors) / svc.daily_checks) * 100, 1
            )
        else:
            daily_uptime = 100.0
        if not svc.uptime_history_90d:
            return
        last_rec = svc.uptime_history_90d[-1]
        if last_rec.date == today_str:
            # Update today's record with today's actual uptime
            last_rec.uptime_percent = daily_uptime
            if not result.success:
                last_rec.had_incident = True
                # Track worst status
                severity_order = ["operational", "degraded", "partial_outage", "major_outage"]
                cur_idx = severity_order.index(last_rec.status) if last_rec.status in severity_order else 0
                new_idx = severity_order.index(result.status.value) if result.status.value in severity_order else 0
                if new_idx > cur_idx:
                    last_rec.status = result.status.value
        else:
            # New UTC day — reset the daily counters so today's bar reflects
            # only checks performed on this date. `daily_checks` starts at 1
            # because we count the current check here.
            svc.daily_checks = 1
            svc.daily_errors = 0 if result.success else 1
            svc.uptime_history_90d.append(DailyUptimeRecord(
                date=today_str,
                uptime_percent=100.0 if result.success else 0.0,
                had_incident=not result.success,
                status=result.status.value,
            ))
            if len(svc.uptime_history_90d) > 90:
                svc.uptime_history_90d = svc.uptime_history_90d[-90:]

    def _create_incident(self, svc: ServiceHealth, result: HealthCheckResult):
        """Auto-create an incident when a service goes down."""
        # Also mark today's uptime record as having an incident
        if svc.uptime_history_90d:
            today_str = datetime.now(timezone.utc).date().isoformat()
            for rec in reversed(svc.uptime_history_90d):
                if rec.date == today_str:
                    rec.had_incident = True
                    rec.status = result.status.value
                    break
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
        all_services = list(self.services.values())

        # Calculate days without incidents
        days_without_incidents = self._calc_days_without_incidents()

        return {
            "overall_status": self.get_overall_status().value,
            "overall_status_ar": _status_ar(self.get_overall_status().value),
            "days_without_incidents": days_without_incidents,
            "services": [
                {
                    "id": s.config.id,
                    "name": s.config.name,
                    "name_ar": s.config.name_ar,
                    "type": s.config.type,
                    "category": s.config.category.value,
                    "status": s.current_status.value if s.config.enabled else "disabled",
                    "status_ar": _service_status_ar(s.current_status.value) if s.config.enabled else "معطّل",
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
                    "disabled_reason_ar": s.config.disabled_reason_ar,
                    "uptime_history_90d": self._compact_uptime_history(s.uptime_history_90d[-90:]),
                }
                for s in all_services
            ],
            "incidents": [inc.model_dump(mode="json") for inc in self.incidents[:20]],
            "last_updated": datetime.now(timezone.utc).isoformat(),
        }

    @staticmethod
    def _compact_uptime_history(records: list[DailyUptimeRecord]) -> dict:
        """Compress 90-day uptime history to reduce payload size.

        Instead of sending 90 full objects (~7KB per service), send compact arrays (~300B).
        Format: { s: start_date, u: [uptimes], i: [incident_indices], d: {idx: status} }
        Frontend decompresses this back into full UptimeDay objects.

        Only the most common status ("operational") is omitted from `d` and
        reconstructed on the frontend as the default. Every other status
        (including "disabled") is preserved explicitly so historical days
        aren't misclassified when a service's current enabled state differs
        from its state on a given historical day.
        """
        if not records:
            return {"s": "", "u": [], "i": [], "d": {}}
        return {
            "s": records[0].date,
            "u": [round(r.uptime_percent) for r in records],
            "i": [idx for idx, r in enumerate(records) if r.had_incident],
            "d": {str(idx): r.status for idx, r in enumerate(records) if r.status != "operational"},
        }

    def _calc_days_without_incidents(self) -> int:
        """Calculate consecutive days without any active/recent incident.

        Incidents are stored newest-first *by creation time* (see `insert(0, …)`).
        That ordering is NOT the same as ordering by `resolved_at`: a newer
        incident can be resolved before an older one that is still active, or
        an older incident can be resolved after a newer one. Both cases require
        scanning every stored incident — we cannot rely on `incidents[0]`.
        """
        if not self.incidents:
            # No incidents ever recorded — show 0 (real data, no fake assumption)
            return 0

        # If ANY incident is still unresolved, we are in an active-incident window.
        if any(inc.status != IncidentStatus.resolved for inc in self.incidents):
            return 0

        # All incidents are resolved — measure from the most recent resolution,
        # which may belong to any incident, not just incidents[0].
        resolved_times: list[datetime] = []
        for inc in self.incidents:
            if inc.resolved_at:
                try:
                    resolved_times.append(datetime.fromisoformat(inc.resolved_at))
                except ValueError:
                    continue

        if not resolved_times:
            return 0

        last_resolution = max(resolved_times)
        now = datetime.now(timezone.utc)
        return max(0, (now - last_resolution).days)

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
