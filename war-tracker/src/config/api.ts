/**
 * Centralized API configuration.
 * Backend URL is defined once here instead of being scattered across components.
 * Uses environment variable when available, falls back to production URL.
 */
const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL || 'https://war-tracker-backend-kriplmgy.fly.dev';

export const BACKEND_API_URL = BACKEND_BASE;
export const BACKEND_WS_URL = BACKEND_BASE.replace(/^http/, 'ws') + '/ws';
