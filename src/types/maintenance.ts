export interface CountdownSettings {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  reason: string;
  endMessage: string;
}

export interface MaintenanceState {
  isEnabled: boolean;
  countdown: CountdownSettings | null;
}

export const MAINTENANCE_KEY = 'maintenance-state';
