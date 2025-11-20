from datetime import datetime
from sqlalchemy import Column, String, Boolean, Integer, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.types import JSON
import enum

from app.database import Base


class ServiceStatusEnum(str, enum.Enum):
    OPERATIONAL = "operational"
    DEGRADED = "degraded"
    PARTIAL_OUTAGE = "partial_outage"
    MAJOR_OUTAGE = "major_outage"
    MAINTENANCE = "maintenance"
    UNKNOWN = "unknown"


class IncidentStageEnum(str, enum.Enum):
    INVESTIGATING = "investigating"
    IDENTIFIED = "identified"
    MONITORING = "monitoring"
    RESOLVED = "resolved"
    UPDATE = "update"


class ServiceCategory(Base):
    __tablename__ = "service_categories"

    id = Column(String, primary_key=True)
    name_ar = Column(String, nullable=False)
    name_en = Column(String, nullable=False)
    description_ar = Column(Text, nullable=True)
    description_en = Column(Text, nullable=True)
    order = Column(Integer, default=0)
    visible = Column(Boolean, default=True)

    services = relationship("Service", back_populates="category", cascade="all, delete-orphan")


class Service(Base):
    __tablename__ = "services"

    id = Column(String, primary_key=True)
    category_id = Column(String, ForeignKey("service_categories.id"), nullable=False)
    name_ar = Column(String, nullable=False)
    name_en = Column(String, nullable=False)
    description_ar = Column(Text, nullable=True)
    description_en = Column(Text, nullable=True)
    status = Column(SQLEnum(ServiceStatusEnum), default=ServiceStatusEnum.OPERATIONAL)
    order = Column(Integer, default=0)
    visible = Column(Boolean, default=True)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("ServiceCategory", back_populates="services")


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String, primary_key=True)
    title_ar = Column(String, nullable=False)
    title_en = Column(String, nullable=False)
    stage = Column(SQLEnum(IncidentStageEnum), nullable=False)
    affected_services = Column(JSON, nullable=False)  # List of service IDs
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    visible = Column(Boolean, default=True)

    updates = relationship("IncidentUpdate", back_populates="incident", cascade="all, delete-orphan", order_by="IncidentUpdate.created_at")


class IncidentUpdate(Base):
    __tablename__ = "incident_updates"

    id = Column(String, primary_key=True)
    incident_id = Column(String, ForeignKey("incidents.id"), nullable=False)
    stage = Column(SQLEnum(IncidentStageEnum), nullable=False)
    message_ar = Column(Text, nullable=False)
    message_en = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    incident = relationship("Incident", back_populates="updates")


class MaintenanceWindow(Base):
    __tablename__ = "maintenance_windows"

    id = Column(String, primary_key=True)
    title_ar = Column(String, nullable=False)
    title_en = Column(String, nullable=False)
    description_ar = Column(Text, nullable=False)
    description_en = Column(Text, nullable=False)
    affected_services = Column(JSON, nullable=False)  # List of service IDs
    scheduled_start = Column(DateTime, nullable=False)
    scheduled_end = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    visible = Column(Boolean, default=True)


class Settings(Base):
    __tablename__ = "settings"

    id = Column(String, primary_key=True, default="global")
    admin_code_hash = Column(String, nullable=False)
    default_language = Column(String, default="ar")
    maintenance_mode = Column(Boolean, default=False)
    maintenance_message_ar = Column(Text, default="الموقع قيد الصيانة حالياً. سنعود قريباً...")
    maintenance_message_en = Column(Text, default="Site is under maintenance. We'll be back soon...")
    allow_public_rss = Column(Boolean, default=True)
    site_name_ar = Column(String, default="حالة النظام")
    site_name_en = Column(String, default="System Status")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True)
    action = Column(String, nullable=False)
    details = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String, nullable=True)


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String, primary_key=True)
    email = Column(String, nullable=False, unique=True)
    subscribed_services = Column(JSON, nullable=False)  # List of service IDs
    created_at = Column(DateTime, default=datetime.utcnow)
    active = Column(Boolean, default=True)
