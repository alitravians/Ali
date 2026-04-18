export type TrustLevel = 'confirmed' | 'high' | 'medium' | 'low';
export type EventCategory = 'military' | 'alert' | 'official' | 'airspace' | 'maritime' | 'fire' | 'humanitarian';
export type SourceType = 'official' | 'media' | 'humanitarian' | 'technical' | 'social';
export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';
export type RiskLevel = 'critical' | 'high' | 'elevated' | 'moderate' | 'low';

export interface GeoLocation {
  lat: number;
  lng: number;
  name: string;
  nameAr: string;
}

export interface Source {
  id: string;
  name: string;
  nameAr: string;
  type: SourceType;
  trustLevel: TrustLevel;
  url?: string;
  lastUpdate: Date;
  isActive: boolean;
  eventCount: number;
}

export interface EventSource {
  sourceId: string;
  sourceName: string;
  sourceNameAr: string;
  originalText?: string;
  url?: string;
  timestamp: Date;
}

export interface TrackerEvent {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  category: EventCategory;
  trustLevel: TrustLevel;
  trustReason: string;
  trustReasonAr: string;
  location: GeoLocation;
  timestamp: Date;
  sources: EventSource[];
  isBreaking: boolean;
  isDuplicate: boolean;
  mergedEventIds?: string[];
  whyItMatters?: string;
  whyItMattersAr?: string;
  relatedCities: string[];
}

export interface CityData {
  id: string;
  name: string;
  nameAr: string;
  country: string;
  countryAr: string;
  location: GeoLocation;
  riskLevel: RiskLevel;
  lastUpdate: Date;
  recentEvents: TrackerEvent[];
  indicators: {
    military: number;
    airspace: number;
    civilian: number;
  };
}

export interface Alert {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  severity: AlertSeverity;
  type: 'urgent' | 'escalation' | 'change' | 'info';
  timestamp: Date;
  relatedEventIds: string[];
  isRead: boolean;
  city?: string;
  cityAr?: string;
}

export interface DashboardIndicator {
  id: string;
  name: string;
  nameAr: string;
  score: number;
  previousScore: number;
  trend: 'up' | 'down' | 'stable';
  description: string;
  descriptionAr: string;
}

export interface AISummary {
  id: string;
  timestamp: Date;
  whatHappened: string;
  whatHappenedAr: string;
  whatsNew: string;
  whatsNewAr: string;
  isEscalation: boolean;
  escalationDetails?: string;
  escalationDetailsAr?: string;
  hotspots: string[];
  hotspotsAr: string[];
  confirmedOnly: string[];
  confirmedOnlyAr: string[];
  conflictsDetected: ConflictReport[];
}

export interface ConflictReport {
  id: string;
  description: string;
  descriptionAr: string;
  sources: string[];
  sourcesAr: string[];
  resolution?: string;
  resolutionAr?: string;
}

export interface MapLayer {
  id: EventCategory;
  name: string;
  nameAr: string;
  color: string;
  icon: string;
  isActive: boolean;
}

export interface VesselPosition {
  mmsi: string;
  name?: string;
  shipType: string;
  shipTypeAr: string;
  flag?: string;
  lat: number;
  lng: number;
  speed?: number;
  course?: number;
  heading?: number;
  destination?: string;
  length?: number;
  width?: number;
  draught?: number;
  zone: string;
  zoneAr: string;
  status: string;
  statusAr: string;
  timestamp: Date;
}

export interface MaritimeZoneStats {
  id: string;
  name: string;
  nameAr: string;
  vesselCount: number;
  tankerCount: number;
  cargoCount: number;
  militaryCount: number;
  avgSpeed: number;
  lastUpdate?: Date;
}

export interface HormuzBlockadeStatus {
  isActive: boolean;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  threatLevelAr: string;
  militaryVesselCount: number;
  usNavyCount: number;
  iranNavyCount: number;
  totalVesselsInZone: number;
  tankerCount: number;
  blockedTankers: number;
  avgTransitSpeed: number;
  militaryVessels: Array<{
    mmsi: string;
    name: string;
    flag: string;
    isUS: boolean;
    isIran: boolean;
    isAllied: boolean;
    lat: number;
    lng: number;
    speed: number | null;
    status: string;
    statusAr: string;
    heading: number | null;
    lastSeen: string;
  }>;
  relatedNews: Array<{
    id: string;
    title: string;
    titleEn: string;
    timestamp: string;
    category: string;
    trustLevel: string;
  }>;
  lastUpdate?: string;
  statusMessage: string;
  statusMessageEn: string;
  // "live" when computed from real AIS positions; "estimated" when the
  // backend is running on synthetic fallback vessel templates and users
  // must NOT interpret the assessment as real-time intelligence.
  dataSource?: 'live' | 'estimated';
  dataSourceAr?: string;
}
