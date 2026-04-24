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

// Defence-in-depth: strip URL fields that are not http/https before the
// event ever reaches a component. Even if a render site forgets to pipe
// the value through ``safeExternalUrl``, a ``javascript:`` / ``data:`` /
// ``vbscript:`` URL injected upstream will not survive this parser.
const _PARSER_SAFE_URL_SCHEMES = new Set(['http:', 'https:']);
function _isSafeIngestUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    // Same base logic as ``safeExternalUrl`` but without relative URL
    // support: upstream feeds always produce absolute URLs, and a bare
    // path in a source link is far more likely to be malformed data
    // than an intentional same-origin reference.
    const parsed = new URL(trimmed);
    return _PARSER_SAFE_URL_SCHEMES.has(parsed.protocol);
  } catch {
    return false;
  }
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
    .map((s) => {
      const { url: _url, ...rest } = s;
      return {
        ...rest,
        ...(_isSafeIngestUrl(_url) ? { url: _url } : {}),
        timestamp: typeof s.timestamp === 'string' ? new Date(s.timestamp) : new Date(),
      };
    });

  return {
    ...raw,
    timestamp: parsedTimestamp,
    sources,
  } as TrackerEvent;
}

function parseEvents(raw: unknown): TrackerEvent[] {
  if (!Array.isArray(raw)) return [];
  const out: TrackerEvent[] = [];
  let dropped = 0;
  for (const item of raw) {
    const parsed = parseEvent(item);
    if (parsed) {
      out.push(parsed);
    } else {
      dropped++;
    }
  }
  if (dropped > 0 && import.meta.env.DEV) {
    // Surface malformed payloads in development so backend schema drift
    // is caught early. In production we stay silent — dropping a bad row
    // is preferable to a console flood the user cannot do anything about.
    console.warn(`[LiveData] dropped ${dropped} malformed event(s)`);
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
  let dropped = 0;
  for (const item of raw) {
    const parsed = parseAlert(item);
    if (parsed) {
      out.push(parsed);
    } else {
      dropped++;
    }
  }
  if (dropped > 0 && import.meta.env.DEV) {
    console.warn(`[LiveData] dropped ${dropped} malformed alert(s)`);
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
  // Flipped to ``true`` in the effect cleanup below so that a close event
  // that arrives AFTER the provider has unmounted (``ws.close()`` resolves
  // asynchronously) cannot schedule another ``connectWs`` call. Without
  // this guard each unmount+remount cycle leaks a reconnecting socket that
  // the runtime keeps alive forever.
  const unmountedRef = useRef(false);
  // Flipped to ``true`` on the first WS ``initial_data`` frame. The REST
  // fallback in ``fetchInitialData`` runs in parallel with the WS handshake
  // — if the socket wins the race (which it usually does on a warm backend)
  // the REST response arriving seconds later must not clobber the fresher
  // WS payload with older snapshots. REST is only allowed to populate
  // fields whose WS equivalents have not been seen yet.
  const wsInitialReceivedRef = useRef(false);

  // WebSocket message handler
  const handleWsMessage = useCallback((msg: MessageEvent) => {
    try {
      const data = JSON.parse(msg.data);

      if (data.type === 'initial_data' || data.type === 'events_update') {
        if (data.type === 'initial_data') {
          wsInitialReceivedRef.current = true;
        }
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
        // Don't schedule a reconnect if the provider has already unmounted
        // — the onclose callback fires asynchronously after the effect
        // cleanup calls ``ws.close()``, and without this guard every
        // unmount (route change, HMR swap, React StrictMode replay) would
        // leak a reconnecting socket whose timers and handlers stay alive
        // for the lifetime of the page.
        if (unmountedRef.current) {
          return;
        }
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

  // Also try REST API fetch on initial load for immediate data.
  //
  // The REST path is a FALLBACK for when the WebSocket handshake is slow or
  // fails — the socket is the primary data source. Every setter here is
  // therefore gated on ``!wsInitialReceivedRef.current`` and on
  // ``!unmountedRef.current``:
  //   * If the WS has already delivered ``initial_data``, the REST
  //     snapshot may be older (it may not include events that arrived on
  //     the socket between login and the ``/api/events`` response). We
  //     must not overwrite the fresher WS state with a stale snapshot.
  //   * If the provider has unmounted mid-flight, calling a state setter
  //     on an unmounted component is benign in React 18 but pollutes dev
  //     tooling and risks scheduling extra work during teardown.
  const fetchInitialData = useCallback(async () => {
    // Retry with exponential backoff for initial event load
    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      if (unmountedRef.current) return;
      if (wsInitialReceivedRef.current) {
        // WS already won the race; no point hitting REST for events.
        break;
      }
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const resp = await fetch(`${BACKEND_API_URL}/api/events?limit=100`, { signal: controller.signal });
        clearTimeout(timeout);
        if (resp.ok) {
          const data = await resp.json();
          const apiEvents = parseEvents(data.events);
          // Re-check after await: WS may have delivered initial_data while
          // the REST fetch was in-flight.
          if (apiEvents.length > 0 && !wsInitialReceivedRef.current && !unmountedRef.current) {
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
    if (!unmountedRef.current && !wsInitialReceivedRef.current) {
      try {
        const resp = await fetch(`${BACKEND_API_URL}/api/sources`);
        if (resp.ok) {
          const data = await resp.json();
          if (data.sources && !wsInitialReceivedRef.current && !unmountedRef.current) {
            setSourceStatus(data.sources);
          }
        }
      } catch {
        // Source status fetch failed silently
      }
    }

    // Fetch alerts
    if (!unmountedRef.current && !wsInitialReceivedRef.current) {
      try {
        const resp = await fetch(`${BACKEND_API_URL}/api/alerts`);
        if (resp.ok) {
          const data = await resp.json();
          if (data.alerts && !wsInitialReceivedRef.current && !unmountedRef.current) {
            setAlerts(parseAlerts(data.alerts));
          }
        }
      } catch {
        // Alerts fetch failed silently
      }
    }

    // Fetch indicators
    if (!unmountedRef.current && !wsInitialReceivedRef.current) {
      try {
        const resp = await fetch(`${BACKEND_API_URL}/api/indicators`);
        if (resp.ok) {
          const data = await resp.json();
          if (data.indicators && !wsInitialReceivedRef.current && !unmountedRef.current) {
            setIndicators(data.indicators);
          }
        }
      } catch {
        // Indicators fetch failed silently
      }
    }
  }, []);

  useEffect(() => {
    // Reset the unmount flag on every (re)mount so StrictMode's double-
    // invocation in development doesn't permanently block the socket.
    unmountedRef.current = false;

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
      // Mark unmounted FIRST so the async ``onclose`` handler triggered by
      // ``ws.close()`` below sees the flag and refuses to reschedule a
      // reconnect timer.
      unmountedRef.current = true;
      clearInterval(pingInterval);
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = undefined;
      }
      if (wsRef.current) {
        try { wsRef.current.close(); } catch { /* ignore */ }
      }
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
