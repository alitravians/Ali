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

// Parse event timestamps from JSON
function parseEvent(raw: Record<string, unknown>): TrackerEvent {
  return {
    ...raw,
    timestamp: new Date(raw.timestamp as string),
    sources: ((raw.sources as Record<string, unknown>[]) || []).map((s) => ({
      ...s,
      timestamp: new Date(s.timestamp as string),
    })),
  } as TrackerEvent;
}

function parseAlert(raw: Record<string, unknown>): Alert {
  return {
    ...raw,
    timestamp: new Date(raw.timestamp as string),
  } as Alert;
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
  const prevEventCountRef = useRef(0);

  // WebSocket message handler
  const handleWsMessage = useCallback((msg: MessageEvent) => {
    try {
      const data = JSON.parse(msg.data);

      if (data.type === 'initial_data' || data.type === 'events_update') {
        const newEvents = (data.events || []).map(parseEvent);
        if (newEvents.length > 0) {
          setEvents(newEvents);
          // Use totalEvents from backend (not array length) to detect new events
          // because the backend caps the broadcast at 50 events
          const totalFromBackend = data.totalEvents ?? newEvents.length;
          const diff = totalFromBackend - prevEventCountRef.current;
          if (diff > 0 && data.type === 'events_update') {
            setNewEventCount(prev => prev + diff);
          }
          prevEventCountRef.current = totalFromBackend;
          setLastUpdate(new Date());
        }

        if (data.indicators) {
          setIndicators(data.indicators);
        }
        if (data.alerts) {
          setAlerts((data.alerts || []).map(parseAlert));
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
        const alertEvent = data.event ? parseEvent(data.event) : null;
        setBahrainAlert({
          severity: data.severity || 'critical',
          message: data.message || 'تنبيه عاجل من البحرين',
          messageEn: data.messageEn || 'URGENT: Bahrain alert',
          timestamp: data.timestamp || new Date().toISOString(),
          event: alertEvent as TrackerEvent,
        });
      }
    } catch (e) {
      // WS parse error silenced in production
    }
  }, []);

  // Connect to WebSocket. Guards against duplicate/leaked connections when
  // called while a previous socket is still OPEN or CONNECTING, and cancels
  // any pending reconnect timer before scheduling a new one.
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
    };

    ws.onmessage = handleWsMessage;

    ws.onclose = () => {
      // Only clear ref if this is still the current socket — otherwise a
      // newer connection has already taken over and we must not clobber it.
      if (wsRef.current === ws) {
        wsRef.current = null;
        setConnectionStatus('disconnected');
        if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
        reconnectTimer.current = setTimeout(connectWs, 10000);
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
          const apiEvents = (data.events || []).map(parseEvent);
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
          setAlerts(data.alerts.map(parseAlert));
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
