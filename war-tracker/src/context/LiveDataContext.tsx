import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { TrackerEvent, Alert, DashboardIndicator, VesselPosition, MaritimeZoneStats } from '../types';

const BACKEND_WS_URL = 'wss://war-tracker-backend-kriplmgy.fly.dev/ws';
const BACKEND_API_URL = 'https://war-tracker-backend-kriplmgy.fly.dev';

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
    } catch (e) {
      console.error('[WS] Error parsing message:', e);
    }
  }, []);

  // Connect to WebSocket
  const connectWs = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionStatus('connecting');
    console.log('[WS] Connecting to backend...');

    const ws = new WebSocket(BACKEND_WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] Connected to backend — real data only, no mock data');
      setConnectionStatus('connected');
    };

    ws.onmessage = handleWsMessage;

    ws.onclose = () => {
      console.log('[WS] Disconnected, will reconnect in 10s...');
      setConnectionStatus('disconnected');
      reconnectTimer.current = setTimeout(connectWs, 10000);
    };

    ws.onerror = (err) => {
      console.error('[WS] Error:', err);
      ws.close();
    };
  }, [handleWsMessage]);

  // Also try REST API fetch on initial load for immediate data
  const fetchInitialData = useCallback(async () => {
    try {
      const resp = await fetch(`${BACKEND_API_URL}/api/events?limit=100`);
      if (resp.ok) {
        const data = await resp.json();
        const apiEvents = (data.events || []).map(parseEvent);
        if (apiEvents.length > 0) {
          setEvents(apiEvents);
          prevEventCountRef.current = apiEvents.length;
          setLastUpdate(new Date());
          console.log(`[API] Fetched ${apiEvents.length} real events via REST`);
        }
      }
    } catch {
      console.log('[API] REST fetch failed — waiting for WebSocket connection');
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
      // silently ignore
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
      // silently ignore
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
      // silently ignore
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectWs, fetchInitialData]);

  const clearNewCount = useCallback(() => {
    setNewEventCount(0);
  }, []);

  return (
    <LiveDataContext.Provider value={{ events, alerts, indicators, vessels, maritimeZones, newEventCount, isLive, lastUpdate, clearNewCount, connectionStatus, sourceStatus }}>
      {children}
    </LiveDataContext.Provider>
  );
}
