from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel


class ServiceStatus(str, Enum):
    OPERATIONAL = "operational"
    DEGRADED = "degraded"
    PARTIAL_OUTAGE = "partial_outage"
    MAJOR_OUTAGE = "major_outage"
    MAINTENANCE = "maintenance"
    UNKNOWN = "unknown"


class IncidentStage(str, Enum):
    INVESTIGATING = "investigating"
    IDENTIFIED = "identified"
    MONITORING = "monitoring"
    RESOLVED = "resolved"
    UPDATE = "update"


class ServiceCategory(BaseModel):
    id: str
    name_ar: str
    name_en: str
    description_ar: Optional[str] = None
    description_en: Optional[str] = None
    order: int = 0
    visible: bool = True


class Service(BaseModel):
    id: str
    category_id: str
    name_ar: str
    name_en: str
    description_ar: Optional[str] = None
    description_en: Optional[str] = None
    status: ServiceStatus = ServiceStatus.OPERATIONAL
    order: int = 0
    visible: bool = True
    last_updated: datetime


class IncidentUpdate(BaseModel):
    id: str
    incident_id: str
    stage: IncidentStage
    message_ar: str
    message_en: str
    created_at: datetime


class Incident(BaseModel):
    id: str
    title_ar: str
    title_en: str
    stage: IncidentStage
    affected_services: List[str]
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    updates: List[IncidentUpdate] = []
    visible: bool = True


class MaintenanceWindow(BaseModel):
    id: str
    title_ar: str
    title_en: str
    description_ar: str
    description_en: str
    affected_services: List[str]
    scheduled_start: datetime
    scheduled_end: datetime
    created_at: datetime
    visible: bool = True


class Settings(BaseModel):
    id: str = "global"
    admin_code_hash: str
    default_language: str = "ar"
    maintenance_mode: bool = False
    maintenance_message_ar: str = "الموقع قيد الصيانة حالياً. سنعود قريباً..."
    maintenance_message_en: str = "Site is under maintenance. We'll be back soon..."
    allow_public_rss: bool = True
    site_name_ar: str = "حالة النظام"
    site_name_en: str = "System Status"


class AuditLog(BaseModel):
    id: str
    action: str
    details: str
    timestamp: datetime
    ip_address: Optional[str] = None


class Subscription(BaseModel):
    id: str
    email: str
    subscribed_services: List[str]
    created_at: datetime
    active: bool = True


class LoginRequest(BaseModel):
    code: str


class LoginResponse(BaseModel):
    success: bool
    message: str


class ServiceCreateRequest(BaseModel):
    category_id: str
    name_ar: str
    name_en: str
    description_ar: Optional[str] = None
    description_en: Optional[str] = None
    status: ServiceStatus = ServiceStatus.OPERATIONAL
    order: int = 0
    visible: bool = True


class ServiceUpdateRequest(BaseModel):
    category_id: Optional[str] = None
    name_ar: Optional[str] = None
    name_en: Optional[str] = None
    description_ar: Optional[str] = None
    description_en: Optional[str] = None
    status: Optional[ServiceStatus] = None
    order: Optional[int] = None
    visible: Optional[bool] = None


class IncidentCreateRequest(BaseModel):
    title_ar: str
    title_en: str
    stage: IncidentStage
    affected_services: List[str]
    message_ar: str
    message_en: str


class IncidentUpdateRequest(BaseModel):
    stage: IncidentStage
    message_ar: str
    message_en: str


class MaintenanceCreateRequest(BaseModel):
    title_ar: str
    title_en: str
    description_ar: str
    description_en: str
    affected_services: List[str]
    scheduled_start: datetime
    scheduled_end: datetime


class SettingsUpdateRequest(BaseModel):
    default_language: Optional[str] = None
    maintenance_mode: Optional[bool] = None
    maintenance_message_ar: Optional[str] = None
    maintenance_message_en: Optional[str] = None
    allow_public_rss: Optional[bool] = None
    site_name_ar: Optional[str] = None
    site_name_en: Optional[str] = None


class PublicSettings(BaseModel):
    id: str = "global"
    default_language: str = "ar"
    maintenance_mode: bool = False
    maintenance_message_ar: str = ""
    maintenance_message_en: str = ""
    site_name_ar: str = "حالة النظام"
    site_name_en: str = "System Status"
    allow_public_rss: bool = True


class StatusSummary(BaseModel):
    overall_status: ServiceStatus
    categories: List[ServiceCategory]
    services: List[Service]
    active_incidents: List[Incident]
    upcoming_maintenance: List[MaintenanceWindow]
    settings: PublicSettings
    last_updated: datetime
