from fastapi import FastAPI, Depends, HTTPException, status, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime, timedelta
from typing import List, Optional
import asyncio
import json
import uuid

from app.database import get_db, init_db
from app.db_models import (
    ServiceCategory as DBServiceCategory,
    Service as DBService,
    Incident as DBIncident,
    IncidentUpdate as DBIncidentUpdate,
    MaintenanceWindow as DBMaintenanceWindow,
    Settings as DBSettings,
    AuditLog as DBAuditLog,
    Subscription as DBSubscription,
    ServiceStatusEnum,
    IncidentStageEnum
)
from app.models import (
    LoginRequest, LoginResponse,
    ServiceCreateRequest, ServiceUpdateRequest,
    IncidentCreateRequest, IncidentUpdateRequest,
    MaintenanceCreateRequest, SettingsUpdateRequest,
    StatusSummary, ServiceCategory, Service, Incident, IncidentUpdate,
    MaintenanceWindow, Settings, AuditLog, Subscription,
    ServiceStatus, IncidentStage
)
from app.auth import verify_code, create_access_token, get_current_admin, set_session_cookie
from app.seed_data import seed_initial_data

app = FastAPI()

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://service-status-website-98n5jn67.devinapps.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

sse_clients = []


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    await init_db()
    async for db in get_db():
        await seed_initial_data(db)
        break


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}



@app.get("/api/status-summary", response_model=StatusSummary)
async def get_status_summary(db: AsyncSession = Depends(get_db)):
    """Get overall status summary"""
    
    result = await db.execute(
        select(DBServiceCategory)
        .where(DBServiceCategory.visible == True)
        .order_by(DBServiceCategory.order)
    )
    db_categories = result.scalars().all()
    
    result = await db.execute(
        select(DBService)
        .where(DBService.visible == True)
        .order_by(DBService.order)
    )
    db_services = result.scalars().all()
    
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    result = await db.execute(
        select(DBIncident)
        .where(
            DBIncident.visible == True,
            DBIncident.created_at >= thirty_days_ago
        )
        .order_by(desc(DBIncident.created_at))
    )
    db_incidents = result.scalars().all()
    
    now = datetime.utcnow()
    result = await db.execute(
        select(DBMaintenanceWindow)
        .where(
            DBMaintenanceWindow.visible == True,
            DBMaintenanceWindow.scheduled_end >= now
        )
        .order_by(DBMaintenanceWindow.scheduled_start)
    )
    db_maintenance = result.scalars().all()
    
    categories = [ServiceCategory(**cat.__dict__) for cat in db_categories]
    services = [Service(**svc.__dict__) for svc in db_services]
    
    incidents = []
    for inc in db_incidents:
        result = await db.execute(
            select(DBIncidentUpdate)
            .where(DBIncidentUpdate.incident_id == inc.id)
            .order_by(DBIncidentUpdate.created_at)
        )
        updates = result.scalars().all()
        
        incident = Incident(
            **{k: v for k, v in inc.__dict__.items() if k != '_sa_instance_state'},
            updates=[IncidentUpdate(**upd.__dict__) for upd in updates]
        )
        incidents.append(incident)
    
    maintenance = [MaintenanceWindow(**mnt.__dict__) for mnt in db_maintenance]
    
    result = await db.execute(select(DBSettings).where(DBSettings.id == "global"))
    db_settings = result.scalar_one_or_none()
    
    if not db_settings:
        raise HTTPException(status_code=500, detail="Settings not found")
    
    from app.models import PublicSettings
    public_settings = PublicSettings(
        id=db_settings.id,
        default_language=db_settings.default_language,
        maintenance_mode=db_settings.maintenance_mode,
        maintenance_message_ar=db_settings.maintenance_message_ar,
        maintenance_message_en=db_settings.maintenance_message_en,
        site_name_ar=db_settings.site_name_ar,
        site_name_en=db_settings.site_name_en,
        allow_public_rss=db_settings.allow_public_rss
    )
    
    overall_status = ServiceStatus.OPERATIONAL
    for service in services:
        if service.status == ServiceStatus.MAJOR_OUTAGE:
            overall_status = ServiceStatus.MAJOR_OUTAGE
            break
        elif service.status == ServiceStatus.PARTIAL_OUTAGE and overall_status != ServiceStatus.MAJOR_OUTAGE:
            overall_status = ServiceStatus.PARTIAL_OUTAGE
        elif service.status == ServiceStatus.DEGRADED and overall_status == ServiceStatus.OPERATIONAL:
            overall_status = ServiceStatus.DEGRADED
    
    return StatusSummary(
        overall_status=overall_status,
        categories=categories,
        services=services,
        active_incidents=incidents,
        upcoming_maintenance=maintenance,
        settings=public_settings,
        last_updated=datetime.utcnow()
    )


@app.get("/api/settings")
async def get_public_settings(db: AsyncSession = Depends(get_db)):
    """Get public settings (without sensitive data)"""
    result = await db.execute(select(DBSettings).where(DBSettings.id == "global"))
    settings = result.scalar_one_or_none()
    
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    
    return {
        "default_language": settings.default_language,
        "maintenance_mode": settings.maintenance_mode,
        "maintenance_message_ar": settings.maintenance_message_ar,
        "maintenance_message_en": settings.maintenance_message_en,
        "site_name_ar": settings.site_name_ar,
        "site_name_en": settings.site_name_en,
        "allow_public_rss": settings.allow_public_rss
    }


@app.get("/api/stream/status")
async def stream_status(request: Request):
    """SSE endpoint for real-time status updates"""
    
    async def event_generator():
        client_id = str(uuid.uuid4())
        queue = asyncio.Queue()
        sse_clients.append(queue)
        
        try:
            while True:
                if await request.is_disconnected():
                    break
                
                try:
                    message = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield f"data: {json.dumps(message)}\n\n"
                except asyncio.TimeoutError:
                    yield f": keepalive\n\n"
        finally:
            sse_clients.remove(queue)
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


async def broadcast_update(event_type: str, data: dict):
    """Broadcast update to all SSE clients"""
    message = {
        "type": event_type,
        "data": data,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    for queue in sse_clients:
        try:
            await queue.put(message)
        except:
            pass



@app.post("/api/admin/auth/login", response_model=LoginResponse)
async def admin_login(
    request: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """Admin login with access code"""
    
    result = await db.execute(select(DBSettings).where(DBSettings.id == "global"))
    settings = result.scalar_one_or_none()
    
    if not settings:
        raise HTTPException(status_code=500, detail="Settings not found")
    
    if not verify_code(request.code, settings.admin_code_hash):
        audit_log = DBAuditLog(
            id=str(uuid.uuid4()),
            action="login_failed",
            details="Failed login attempt",
            timestamp=datetime.utcnow()
        )
        db.add(audit_log)
        await db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access code"
        )
    
    token = create_access_token({"admin": True})
    set_session_cookie(response, token)
    
    audit_log = DBAuditLog(
        id=str(uuid.uuid4()),
        action="login_success",
        details="Successful admin login",
        timestamp=datetime.utcnow()
    )
    db.add(audit_log)
    await db.commit()
    
    return LoginResponse(success=True, message="Login successful")


@app.post("/api/admin/auth/logout")
async def admin_logout(response: Response):
    """Admin logout"""
    response.delete_cookie("session_token")
    return {"success": True, "message": "Logged out successfully"}


@app.get("/api/admin/auth/verify")
async def verify_admin(admin=Depends(get_current_admin)):
    """Verify admin authentication"""
    return {"authenticated": True}



@app.get("/api/admin/services", response_model=List[Service])
async def get_all_services(
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin)
):
    """Get all services (including hidden)"""
    result = await db.execute(select(DBService).order_by(DBService.order))
    services = result.scalars().all()
    return [Service(**svc.__dict__) for svc in services]


@app.post("/api/admin/services", response_model=Service)
async def create_service(
    service_data: ServiceCreateRequest,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin)
):
    """Create new service"""
    
    service = DBService(
        id=str(uuid.uuid4()),
        **service_data.dict(),
        last_updated=datetime.utcnow()
    )
    db.add(service)
    
    audit_log = DBAuditLog(
        id=str(uuid.uuid4()),
        action="service_created",
        details=f"Created service: {service_data.name_en}",
        timestamp=datetime.utcnow()
    )
    db.add(audit_log)
    
    await db.commit()
    await db.refresh(service)
    
    await broadcast_update("service_created", {"service_id": service.id})
    
    return Service(**service.__dict__)


@app.put("/api/admin/services/{service_id}", response_model=Service)
async def update_service(
    service_id: str,
    service_data: ServiceUpdateRequest,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin)
):
    """Update service"""
    
    result = await db.execute(select(DBService).where(DBService.id == service_id))
    service = result.scalar_one_or_none()
    
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    update_data = service_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(service, key, value)
    
    service.last_updated = datetime.utcnow()
    
    audit_log = DBAuditLog(
        id=str(uuid.uuid4()),
        action="service_updated",
        details=f"Updated service: {service.name_en}",
        timestamp=datetime.utcnow()
    )
    db.add(audit_log)
    
    await db.commit()
    await db.refresh(service)
    
    await broadcast_update("service_updated", {"service_id": service.id})
    
    return Service(**service.__dict__)


@app.delete("/api/admin/services/{service_id}")
async def delete_service(
    service_id: str,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin)
):
    """Delete service"""
    
    result = await db.execute(select(DBService).where(DBService.id == service_id))
    service = result.scalar_one_or_none()
    
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    service_name = service.name_en
    await db.delete(service)
    
    audit_log = DBAuditLog(
        id=str(uuid.uuid4()),
        action="service_deleted",
        details=f"Deleted service: {service_name}",
        timestamp=datetime.utcnow()
    )
    db.add(audit_log)
    
    await db.commit()
    
    await broadcast_update("service_deleted", {"service_id": service_id})
    
    return {"success": True, "message": "Service deleted"}



@app.get("/api/admin/incidents", response_model=List[Incident])
async def get_all_incidents(
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin)
):
    """Get all incidents"""
    result = await db.execute(
        select(DBIncident).order_by(desc(DBIncident.created_at))
    )
    db_incidents = result.scalars().all()
    
    incidents = []
    for inc in db_incidents:
        result = await db.execute(
            select(DBIncidentUpdate)
            .where(DBIncidentUpdate.incident_id == inc.id)
            .order_by(DBIncidentUpdate.created_at)
        )
        updates = result.scalars().all()
        
        incident = Incident(
            **{k: v for k, v in inc.__dict__.items() if k != '_sa_instance_state'},
            updates=[IncidentUpdate(**upd.__dict__) for upd in updates]
        )
        incidents.append(incident)
    
    return incidents


@app.post("/api/admin/incidents", response_model=Incident)
async def create_incident(
    incident_data: IncidentCreateRequest,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin)
):
    """Create new incident"""
    
    incident_id = str(uuid.uuid4())
    
    incident = DBIncident(
        id=incident_id,
        title_ar=incident_data.title_ar,
        title_en=incident_data.title_en,
        stage=incident_data.stage,
        affected_services=incident_data.affected_services,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        visible=True
    )
    db.add(incident)
    
    update = DBIncidentUpdate(
        id=str(uuid.uuid4()),
        incident_id=incident_id,
        stage=incident_data.stage,
        message_ar=incident_data.message_ar,
        message_en=incident_data.message_en,
        created_at=datetime.utcnow()
    )
    db.add(update)
    
    audit_log = DBAuditLog(
        id=str(uuid.uuid4()),
        action="incident_created",
        details=f"Created incident: {incident_data.title_en}",
        timestamp=datetime.utcnow()
    )
    db.add(audit_log)
    
    await db.commit()
    await db.refresh(incident)
    
    await broadcast_update("incident_created", {"incident_id": incident.id})
    
    result = await db.execute(
        select(DBIncidentUpdate)
        .where(DBIncidentUpdate.incident_id == incident_id)
        .order_by(DBIncidentUpdate.created_at)
    )
    updates = result.scalars().all()
    
    return Incident(
        **{k: v for k, v in incident.__dict__.items() if k != '_sa_instance_state'},
        updates=[IncidentUpdate(**upd.__dict__) for upd in updates]
    )


@app.post("/api/admin/incidents/{incident_id}/updates", response_model=Incident)
async def add_incident_update(
    incident_id: str,
    update_data: IncidentUpdateRequest,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin)
):
    """Add update to incident"""
    
    result = await db.execute(select(DBIncident).where(DBIncident.id == incident_id))
    incident = result.scalar_one_or_none()
    
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    update = DBIncidentUpdate(
        id=str(uuid.uuid4()),
        incident_id=incident_id,
        stage=update_data.stage,
        message_ar=update_data.message_ar,
        message_en=update_data.message_en,
        created_at=datetime.utcnow()
    )
    db.add(update)
    
    incident.stage = update_data.stage
    incident.updated_at = datetime.utcnow()
    
    if update_data.stage == IncidentStage.RESOLVED:
        incident.resolved_at = datetime.utcnow()
    
    audit_log = DBAuditLog(
        id=str(uuid.uuid4()),
        action="incident_updated",
        details=f"Updated incident: {incident.title_en}",
        timestamp=datetime.utcnow()
    )
    db.add(audit_log)
    
    await db.commit()
    await db.refresh(incident)
    
    await broadcast_update("incident_updated", {"incident_id": incident_id})
    
    result = await db.execute(
        select(DBIncidentUpdate)
        .where(DBIncidentUpdate.incident_id == incident_id)
        .order_by(DBIncidentUpdate.created_at)
    )
    updates = result.scalars().all()
    
    return Incident(
        **{k: v for k, v in incident.__dict__.items() if k != '_sa_instance_state'},
        updates=[IncidentUpdate(**upd.__dict__) for upd in updates]
    )



@app.get("/api/admin/maintenance", response_model=List[MaintenanceWindow])
async def get_all_maintenance(
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin)
):
    """Get all maintenance windows"""
    result = await db.execute(
        select(DBMaintenanceWindow).order_by(DBMaintenanceWindow.scheduled_start)
    )
    maintenance = result.scalars().all()
    return [MaintenanceWindow(**mnt.__dict__) for mnt in maintenance]


@app.post("/api/admin/maintenance", response_model=MaintenanceWindow)
async def create_maintenance(
    maintenance_data: MaintenanceCreateRequest,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin)
):
    """Create maintenance window"""
    
    maintenance = DBMaintenanceWindow(
        id=str(uuid.uuid4()),
        **maintenance_data.dict(),
        created_at=datetime.utcnow(),
        visible=True
    )
    db.add(maintenance)
    
    audit_log = DBAuditLog(
        id=str(uuid.uuid4()),
        action="maintenance_created",
        details=f"Created maintenance: {maintenance_data.title_en}",
        timestamp=datetime.utcnow()
    )
    db.add(audit_log)
    
    await db.commit()
    await db.refresh(maintenance)
    
    await broadcast_update("maintenance_created", {"maintenance_id": maintenance.id})
    
    return MaintenanceWindow(**maintenance.__dict__)


@app.delete("/api/admin/maintenance/{maintenance_id}")
async def delete_maintenance(
    maintenance_id: str,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin)
):
    """Delete maintenance window"""
    
    result = await db.execute(
        select(DBMaintenanceWindow).where(DBMaintenanceWindow.id == maintenance_id)
    )
    maintenance = result.scalar_one_or_none()
    
    if not maintenance:
        raise HTTPException(status_code=404, detail="Maintenance window not found")
    
    maintenance_title = maintenance.title_en
    await db.delete(maintenance)
    
    audit_log = DBAuditLog(
        id=str(uuid.uuid4()),
        action="maintenance_deleted",
        details=f"Deleted maintenance: {maintenance_title}",
        timestamp=datetime.utcnow()
    )
    db.add(audit_log)
    
    await db.commit()
    
    await broadcast_update("maintenance_deleted", {"maintenance_id": maintenance_id})
    
    return {"success": True, "message": "Maintenance window deleted"}



@app.get("/api/admin/settings", response_model=Settings)
async def get_admin_settings(
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin)
):
    """Get all settings (admin only)"""
    result = await db.execute(select(DBSettings).where(DBSettings.id == "global"))
    settings = result.scalar_one_or_none()
    
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    
    return Settings(**settings.__dict__)


@app.put("/api/admin/settings", response_model=Settings)
async def update_settings(
    settings_data: SettingsUpdateRequest,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin)
):
    """Update settings"""
    
    result = await db.execute(select(DBSettings).where(DBSettings.id == "global"))
    settings = result.scalar_one_or_none()
    
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    
    update_data = settings_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(settings, key, value)
    
    audit_log = DBAuditLog(
        id=str(uuid.uuid4()),
        action="settings_updated",
        details="Updated system settings",
        timestamp=datetime.utcnow()
    )
    db.add(audit_log)
    
    await db.commit()
    await db.refresh(settings)
    
    await broadcast_update("settings_updated", {})
    
    return Settings(**settings.__dict__)



@app.get("/api/admin/audit-logs", response_model=List[AuditLog])
async def get_audit_logs(
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin)
):
    """Get audit logs"""
    result = await db.execute(
        select(DBAuditLog)
        .order_by(desc(DBAuditLog.timestamp))
        .limit(limit)
    )
    logs = result.scalars().all()
    return [AuditLog(**log.__dict__) for log in logs]



@app.get("/api/admin/categories", response_model=List[ServiceCategory])
async def get_all_categories(
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin)
):
    """Get all service categories"""
    result = await db.execute(
        select(DBServiceCategory).order_by(DBServiceCategory.order)
    )
    categories = result.scalars().all()
    return [ServiceCategory(**cat.__dict__) for cat in categories]
