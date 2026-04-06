from pydantic import BaseModel
from datetime import datetime
from enum import Enum
from typing import Optional


class TrustLevel(str, Enum):
    confirmed = "confirmed"
    high = "high"
    medium = "medium"
    low = "low"


class EventCategory(str, Enum):
    military = "military"
    alert = "alert"
    official = "official"
    airspace = "airspace"
    maritime = "maritime"
    fire = "fire"
    humanitarian = "humanitarian"


class AlertSeverity(str, Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"


class GeoLocation(BaseModel):
    lat: float
    lng: float
    name: str
    nameAr: str


class EventSource(BaseModel):
    sourceId: str
    sourceName: str
    sourceNameAr: str
    originalText: Optional[str] = None
    url: Optional[str] = None
    timestamp: datetime


class TrackerEvent(BaseModel):
    id: str
    title: str
    titleAr: str
    description: str
    descriptionAr: str
    category: EventCategory
    trustLevel: TrustLevel
    trustReason: str
    trustReasonAr: str
    location: GeoLocation
    timestamp: datetime
    sources: list[EventSource]
    isBreaking: bool = False
    isDuplicate: bool = False
    mergedEventIds: list[str] = []
    whyItMatters: Optional[str] = None
    whyItMattersAr: Optional[str] = None
    relatedCities: list[str] = []


class Alert(BaseModel):
    id: str
    title: str
    titleAr: str
    description: str
    descriptionAr: str
    severity: AlertSeverity
    type: str  # 'urgent' | 'escalation' | 'change' | 'info'
    timestamp: datetime
    relatedEventIds: list[str] = []
    isRead: bool = False
    city: Optional[str] = None
    cityAr: Optional[str] = None


class DashboardIndicator(BaseModel):
    id: str
    name: str
    nameAr: str
    score: int
    previousScore: int
    trend: str  # 'up' | 'down' | 'stable'
    description: str
    descriptionAr: str


class AISummary(BaseModel):
    id: str
    timestamp: datetime
    whatHappened: str
    whatHappenedAr: str
    whatsNew: str
    whatsNewAr: str
    isEscalation: bool
    escalationDetails: Optional[str] = None
    escalationDetailsAr: Optional[str] = None
    hotspots: list[str] = []
    hotspotsAr: list[str] = []
    confirmedOnly: list[str] = []
    confirmedOnlyAr: list[str] = []


class AircraftPosition(BaseModel):
    icao24: str
    callsign: Optional[str] = None
    lat: float
    lng: float
    altitude: Optional[float] = None
    velocity: Optional[float] = None
    heading: Optional[float] = None
    on_ground: bool = False
    timestamp: datetime
