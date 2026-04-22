import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { TrackerEvent, Alert, DashboardIndicator, VesselPosition, MaritimeZoneStats } from '../types';
import { BACKEND_API_URL, BACKEND_WS_URL } from '../config/api';

interface BahrainAlert {
  severity: string;
  message: string;
  messageEn: string;
  timestamp: string;
  event: TrackerEvent;
}

interface LiveDataContextType {
  events: TrackerEvent[];
  alerts: Alert[];
  indicators: DashboardIndicator[];
  vessels: VesselPosition[];
  maritimeZones: MaritimeZoneStats[];
  newEventCount: number;
  isLive: boolean;
  lastUpdate: Date;
  clearNewCount: () => void;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  sourceStatus: Record<string, { active: boolean; lastUpdate: string | null; eventCount: number; errors: number }>;
  bahrainAlert: BahrainAlert | null;
  dismissBahrainAlert: () => void;
}

const LiveDataContext = createContext<LiveDataContextType | null>(null);

export function useLiveData() {
  const ctx = useContext(LiveDataContext);
  if (!ctx) throw new Error('useLiveData must be used within LiveDataProvider');
  return ctx;
}

// Lightweight runtime validator: we don't want a single malformed server
// payload to crash the whole dashboard, so instead of a blind cast we check
// the fields the UI actually reads and drop events that would render as
// broken rows. Anything beyond these required fields is forwarded as-is.
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseEvent(raw: unknown): TrackerEvent | null {
  if (!isPlainObject(raw)) return null;
  const { id, title, timestamp } = raw;
  if (typeof id !== 'string' || id.length === 0) return null;
  if (typeof title !== 'string') return null;
  if (typeof timestamp !== 'string') return null;

  const parsedTimestamp = new Date(timestamp);
  if (Number.isNaN(parsedTimestamp.getTime())) return null;

  const rawSources = Array.isArray(raw.sources) ? raw.sources : [];
  const sources = rawSources
    .filter(isPlainObject)
    .map((s) => ({
      ...s,
      timestamp: typeof s.timestamp === 'string' ? new Date(s.timestamp) : new Date(),
    }));

  return {
    ...raw,
    timestamp: parsedTimestamp,
    sources,
  } as TrackerEvent;
}

function parseEvents(raw: unknown): TrackerEvent[] {
  if (!Array.isArray(raw)) return [];
  const out: TrackerEvent[] = [];
  for (const item of raw) {
    const parsed = parseEvent(item);
    if (parsed) out.push(parsed);
  }
  return out;
}

function parseAlert(raw: unknown): Alert | null {
  if (!isPlainObject(raw)) return null;
  const { id, timestamp } = raw;
  if (typeof id !== 'string' || id.length === 0) return null;
  if (typeof timestamp !== 'string') return null;
  const parsedTimestamp = new Date(timestamp);
  if (Number.isNaN(parsedTimestamp.getTime())) return null;
  return {
    ...raw,
    timestamp: parsedTimestamp,
  } as Alert;
}

function parseAlerts(raw: unknown): Alert[] {
  if (!Array.isArray(raw)) return [];
  const out: Alert[] = [];
  for (const item of raw) {
    const parsed = parseAlert(item);
    if (parsed) out.push(parsed);
  }
  return out;
}

export function LiveDataProvider({ children }: { children: ReactNode }) {
  // Start with empty arrays — NO mock data, only real data from backend
  const [events, setEvents] = useState<TrackerEvent[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [indicators, setIndicators] = useState<DashboardIndicator[]>([]);
  const [vessels, setVessels] = useState<VesselPosition[]>([]);
  const [maritimeZones, setMaritimeZones] = useState<MaritimeZoneStats[]>([]);
  const [newEventCount, setNewEventCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [sourceStatus, setSourceStatus] = useState<Record<string, { active: boolean; lastUpdate: string | null; eventCount: number; errors: number }>>({});
  const [bahrainAlert, setBahrainAlert] = useState<BahrainAlert | null>(null);
  const isLive = true;
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const reconnectAttemptRef = useRef(0);
  const prevEventCountRef = useRef(0);

  // WebSocket message handler
  const handleWsMessage = useCallback((msg: MessageEvent) => {
    try {
      const data = JSON.parse(msg.data);

      if (data.type === 'initial_data' || data.type === 'events_update') {
        const newEvents = parseEvents(data.events);
        // Always call setEvents — even with an empty array — so that a
        // legitimate backend clear (e.g. all events expired from the
        // rolling window) is reflected in the UI instead of leaving stale
        // events on screen indefinitely. The "new events" badge still
        // uses the totalEvents counter so it does not false-positive.
        setEvents(newEvents);
        const totalFromBackend = data.totalEvents ?? newEvents.length;
        const diff = totalFromBackend - prevEventCountRef.current;
        if (diff > 0 && data.type === 'events_update') {
          setNewEventCount(prev => prev + diff);
        }
        prevEventCountRef.current = totalFromBackend;
        setLastUpdate(new Date());

        if (data.indicators) {
          setIndicators(data.indicators);
        }
        if (data.alerts) {
          setAlerts(parseAlerts(data.alerts));
        }
        if (data.sources) {
          setSourceStatus(data.sources);
        }
        if (data.vessels) {
          setVessels(data.vessels as VesselPosition[]);
        }
        if (data.maritimeZones) {
          setMaritimeZones(data.maritimeZones as MaritimeZoneStats[]);
        }
      }

      if (data.type === 'maritime_update') {
        if (data.vessels) {
          setVessels(data.vessels as VesselPosition[]);
        }
        if (data.zones) {
          setMaritimeZones(data.zones as MaritimeZoneStats[]);
        }
      }

      if (data.type === 'aircraft_update') {
        // Handle aircraft position updates from OpenSky
      }

      if (data.type === 'bahrain_alert') {
        const alertEvent = parseEvent(data.event);
        // Drop the alert entirely if we could not parse its event payload —
        // the modal needs a well-formed event to render, and showing a
        // placeholder with blank fields would be worse than missing the
        // toast for one cycle (the backend re-broadcasts on the next
        // poll).
        if (alertEvent) {
          setBahrainAlert({
            severity: typeof data.severity === 'string' ? data.severity : 'critical',
            message: typeof data.message === 'string' ? data.message : 'تنبيه عاجل من البحرين',
            messageEn: typeof data.messageEn === 'string' ? data.messageEn : 'URGENT: Bahrain alert',
            timestamp: typeof data.timestamp === 'string' ? data.timestamp : new Date().toISOString(),
            event: alertEvent,
          });
        }
      }
    } catch (e) {
      // WS parse error silenced in production
    }
  }, []);

  // Connect to WebSocket. Guards against duplicate/leaked connections when
  // called while a previous socket is still OPEN or CONNECTING, cancels
  // any pending reconnect timer before scheduling a new one, and uses a
  // capped exponential backoff so a long backend outage does not burn the
  // browser's socket quota with a 10-second retry storm.
  const connectWs = useCallback(() => {
    const existing = wsRef.current;
    if (existing && (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = undefined;
    }

    setConnectionStatus('connecting');

    const ws = new WebSocket(BACKEND_WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('connected');
      reconnectAttemptRef.current = 0;
    };

    ws.onmessage = handleWsMessage;

    ws.onclose = () => {
      // Only clear ref if this is still the current socket — otherwise a
      // newer connection has already taken over and we must not clobber it.
      if (wsRef.current === ws) {
        wsRef.current = null;
        setConnectionStatus('disconnected');
        if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
        // Exponential backoff: 2s, 4s, 8s, … capped at 60s, with ±25% jitter
        // so many clients don't reconnect in a synchronized stampede after
        // the server comes back.
        const attempt = reconnectAttemptRef.current;
        reconnectAttemptRef.current = attempt + 1;
        const base = Math.min(2000 * Math.pow(2, attempt), 60000);
        const jitter = base * (0.75 + Math.random() * 0.5);
        reconnectTimer.current = setTimeout(connectWs, jitter);
      }
    };

    ws.onerror = () => {
      try { ws.close(); } catch { /* ignore */ }
    };
  }, [handleWsMessage]);

  // Also try REST API fetch on initial load for immediate data
  const fetchInitialData = useCallback(async () => {
    // Retry with exponential backoff for initial event load
    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const resp = await fetch(`${BACKEND_API_URL}/api/events?limit=100`, { signal: controller.signal });
        clearTimeout(timeout);
        if (resp.ok) {
          const data = await resp.json();
          const apiEvents = parseEvents(data.events);
          if (apiEvents.length > 0) {
            setEvents(apiEvents);
            prevEventCountRef.current = data.total ?? apiEvents.length;
            setLastUpdate(new Date());
            // API fetch success
          }
          break; // Success — stop retrying
        }
        // REST fetch returned non-OK status, retrying
      } catch {
        // REST fetch failed, retrying
      }
      if (attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }

    // Fetch source status
    try {
      const resp = await fetch(`${BACKEND_API_URL}/api/sources`);
      if (resp.ok) {
        const data = await resp.json();
        if (data.sources) {
          setSourceStatus(data.sources);
        }
      }
    } catch {
      // Source status fetch failed silently
    }

    // Fetch alerts
    try {
      const resp = await fetch(`${BACKEND_API_URL}/api/alerts`);
      if (resp.ok) {
        const data = await resp.json();
        if (data.alerts) {
          setAlerts(parseAlerts(data.alerts));
        }
      }
    } catch {
      // Alerts fetch failed silently
    }

    // Fetch indicators
    try {
      const resp = await fetch(`${BACKEND_API_URL}/api/indicators`);
      if (resp.ok) {
        const data = await resp.json();
        if (data.indicators) {
          setIndicators(data.indicators);
        }
      }
    } catch {
      // Indicators fetch failed silently
    }
  }, []);

  useEffect(() => {
    // Try WebSocket connection first
    connectWs();

    // Also fetch via REST for immediate data
    fetchInitialData();

    // Ping WebSocket every 30s to keep alive
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connectWs, fetchInitialData]);

  const clearNewCount = useCallback(() => {
    setNewEventCount(0);
  }, []);

  const dismissBahrainAlert = useCallback(() => {
    setBahrainAlert(null);
  }, []);

  return (
    <LiveDataContext.Provider value={{ events, alerts, indicators, vessels, maritimeZones, newEventCount, isLive, lastUpdate, clearNewCount, connectionStatus, sourceStatus, bahrainAlert, dismissBahrainAlert }}>
      {children}
    </LiveDataContext.Provider>
  );
}
