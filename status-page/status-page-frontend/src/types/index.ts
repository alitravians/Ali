export enum ServiceStatus {
  OPERATIONAL = 'operational',
  DEGRADED = 'degraded',
  PARTIAL_OUTAGE = 'partial_outage',
  MAJOR_OUTAGE = 'major_outage',
  MAINTENANCE = 'maintenance'
}

export enum IncidentStage {
  INVESTIGATING = 'investigating',
  IDENTIFIED = 'identified',
  MONITORING = 'monitoring',
  RESOLVED = 'resolved'
}

export interface ServiceCategory {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  order: number;
  visible: boolean;
}

export interface Service {
  id: string;
  category_id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  status: ServiceStatus;
  order: number;
  visible: boolean;
  last_updated: string;
}

export interface IncidentUpdate {
  id: string;
  incident_id: string;
  stage: IncidentStage;
  message_ar: string;
  message_en: string;
  created_at: string;
}

export interface Incident {
  id: string;
  title_ar: string;
  title_en: string;
  stage: IncidentStage;
  affected_services: string[];
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  updates: IncidentUpdate[];
}

export interface MaintenanceWindow {
  id: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  affected_services: string[];
  scheduled_start: string;
  scheduled_end: string;
  created_at: string;
}

export interface Settings {
  id: string;
  site_name_ar: string;
  site_name_en: string;
  default_language: string;
  maintenance_mode: boolean;
  maintenance_message_ar: string;
  maintenance_message_en: string;
  allow_public_rss: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface StatusSummary {
  overall_status: ServiceStatus;
  categories: ServiceCategory[];
  services: Service[];
  active_incidents: Incident[];
  upcoming_maintenance: MaintenanceWindow[];
  settings: Settings;
}
