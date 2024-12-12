import { eventBus } from './eventBus';
import { MaintenanceState } from '../types/maintenance';

// Content management keys
export const KEYS = {
  WELCOME_CONTENT: 'welcome-content',
  RULES_CONTENT: 'rules-content',
  MODERATOR_JOINING_CONTENT: 'moderator-joining-content',
  TREND_REQUEST_CONTENT: 'trend-request-content',
  UPDATES_CONTENT: 'updates-content',
  MAINTENANCE_STATE: 'maintenance-state',
  TEAM_MEMBERS: 'team-members',
  ADMIN_AUTH: 'adminAuthenticated',
  ADMIN_PASSWORD_HASH: 'adminPasswordHash'
} as const;

// Generic get content function
export const getContent = <T>(key: string): T | null => {
  const content = localStorage.getItem(key);
  if (!content) return null;
  try {
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
};

// Generic set content function
export const setContent = <T>(key: string, content: T): void => {
  localStorage.setItem(key, JSON.stringify(content));
};

// Specific functions for each content type
export const getWelcomeContent = () => getContent<string>(KEYS.WELCOME_CONTENT);
export const setWelcomeContent = (content: string) => {
  setContent(KEYS.WELCOME_CONTENT, content);
  eventBus.emit(KEYS.WELCOME_CONTENT, content);
};

export const getRulesContent = () => getContent<string>(KEYS.RULES_CONTENT);
export const setRulesContent = (content: string) => {
  setContent(KEYS.RULES_CONTENT, content);
  eventBus.emit(KEYS.RULES_CONTENT, content);
};

export const getModeratorJoiningContent = () => getContent<string>(KEYS.MODERATOR_JOINING_CONTENT);
export const setModeratorJoiningContent = (content: string) => {
  setContent(KEYS.MODERATOR_JOINING_CONTENT, content);
  eventBus.emit(KEYS.MODERATOR_JOINING_CONTENT, content);
};

export const getTrendRequestContent = () => getContent<string>(KEYS.TREND_REQUEST_CONTENT);
export const setTrendRequestContent = (content: string) => {
  setContent(KEYS.TREND_REQUEST_CONTENT, content);
  eventBus.emit(KEYS.TREND_REQUEST_CONTENT, content);
};

export const getUpdatesContent = () => getContent<string>(KEYS.UPDATES_CONTENT);
export const setUpdatesContent = (content: string) => {
  setContent(KEYS.UPDATES_CONTENT, content);
  eventBus.emit(KEYS.UPDATES_CONTENT, content);
};

// Maintenance state management
export const getMaintenanceState = (): MaintenanceState => {
  const defaultState: MaintenanceState = {
    isEnabled: false,
    countdown: null
  };
  return getContent<MaintenanceState>(KEYS.MAINTENANCE_STATE) ?? defaultState;
};

export const setMaintenanceState = (state: MaintenanceState) => {
  setContent(KEYS.MAINTENANCE_STATE, state);
  eventBus.emit('maintenanceStateChanged', state);
};

// Simple hash function for password
const hashPassword = (password: string): string => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
};

// Admin authentication
export const isAdminAuthenticated = (): boolean => {
  const storedHash = localStorage.getItem(KEYS.ADMIN_PASSWORD_HASH);
  const correctHash = hashPassword('3131');
  return storedHash === correctHash;
};

export const setAdminAuthenticated = (password: string): void => {
  if (password === '3131') {
    localStorage.setItem(KEYS.ADMIN_PASSWORD_HASH, hashPassword(password));
    localStorage.setItem(KEYS.ADMIN_AUTH, 'true');
  } else {
    clearAdminAuth();
  }
};

export const clearAdminAuth = (): void => {
  localStorage.removeItem(KEYS.ADMIN_PASSWORD_HASH);
  localStorage.removeItem(KEYS.ADMIN_AUTH);
};
