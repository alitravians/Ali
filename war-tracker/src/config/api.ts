/**
 * Centralized API configuration.
 * Backend URL is defined once here instead of being scattered across components.
 * Uses environment variable when available, falls back to production URL.
 *
 * WARNING: If you change VITE_BACKEND_URL, you must also update the CSP
 * connect-src directive in vercel.json to allow the new backend origin,
 * otherwise all API/WebSocket connections will be blocked by the browser.
 */
const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL || 'https://war-tracker-backend-v2.fly.dev';

export const BACKEND_API_URL = BACKEND_BASE;
export const BACKEND_WS_URL = BACKEND_BASE.replace(/^http/, 'ws') + '/ws';
