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


class VesselPosition(BaseModel):
    mmsi: str
    name: Optional[str] = None
    shipType: str = "cargo"  # cargo, tanker, passenger, military, fishing, other
    shipTypeAr: str = "شحن"
    flag: Optional[str] = None
    lat: float
    lng: float
    speed: Optional[float] = None  # knots
    course: Optional[float] = None  # degrees
    heading: Optional[float] = None  # degrees
    destination: Optional[str] = None
    length: Optional[float] = None  # meters
    width: Optional[float] = None  # meters
    draught: Optional[float] = None  # meters
    zone: str = "unknown"  # hormuz, red_sea, suez
    zoneAr: str = "غير محدد"
    status: str = "underway"  # underway, anchored, moored
    statusAr: str = "مبحر"
    timestamp: datetime


class MaritimeZoneStats(BaseModel):
    id: str  # hormuz, red_sea, suez
    name: str
    nameAr: str
    vesselCount: int = 0
    tankerCount: int = 0
    cargoCount: int = 0
    militaryCount: int = 0
    avgSpeed: float = 0.0
    lastUpdate: Optional[datetime] = None


class HormuzBlockadeStatus(BaseModel):
    """Real-time Hormuz blockade monitoring status."""
    isActive: bool = False  # Is blockade detected?
    threatLevel: str = "low"  # low, medium, high, critical
    threatLevelAr: str = "منخفض"
    militaryVesselCount: int = 0
    usNavyCount: int = 0
    iranNavyCount: int = 0
    totalVesselsInZone: int = 0
    tankerCount: int = 0
    blockedTankers: int = 0  # Anchored/moored tankers (possibly blocked)
    avgTransitSpeed: float = 0.0
    militaryVessels: list[dict] = []  # List of military vessel summaries
    relatedNews: list[dict] = []  # Related news events
    lastUpdate: Optional[datetime] = None
    statusMessage: str = "الوضع طبيعي"
    statusMessageEn: str = "Normal conditions"
    # Indicates whether the assessment is based on real AIS data ("live") or
    # synthetic fallback templates ("estimated"). Frontend MUST show a
    # disclaimer badge when dataSource != "live" because the fallback
    # vessels are not real-time intelligence.
    dataSource: str = "live"  # "live" | "estimated"
    dataSourceAr: str = "بيانات حية"


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
