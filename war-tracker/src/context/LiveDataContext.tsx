import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { TrackerEvent, Alert, DashboardIndicator } from '../types';
import { events as initialEvents, alerts as initialAlerts, indicators as initialIndicators } from '../data/mockData';
import { generateLiveEvent } from '../data/liveEventGenerator';

const BACKEND_WS_URL = 'wss://war-tracker-backend-hosfftpp.fly.dev/ws';
const BACKEND_API_URL = 'https://war-tracker-backend-hosfftpp.fly.dev';

interface LiveDataContextType {
  events: TrackerEvent[];
  alerts: Alert[];
  indicators: DashboardIndicator[];
  newEventCount: number;
  isLive: boolean;
  lastUpdate: Date;
  clearNewCount: () => void;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'fallback';
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

// Generate a new alert from a live event (fallback mode)
function createAlertFromEvent(event: TrackerEvent): Alert | null {
  if (!event.isBreaking) return null;
  return {
    id: `alert-${event.id}`,
    title: event.title,
    titleAr: event.titleAr,
    description: event.description,
    descriptionAr: event.descriptionAr,
    severity: event.trustLevel === 'confirmed' ? 'critical' : event.trustLevel === 'high' ? 'high' : 'medium',
    type: event.category === 'military' ? 'urgent' : event.category === 'alert' ? 'escalation' : 'change',
    timestamp: event.timestamp,
    relatedEventIds: [event.id],
    isRead: false,
    city: event.location.name,
    cityAr: event.location.nameAr,
  };
}

// Slightly randomize indicator scores for live feel (fallback mode)
function updateIndicators(indicators: DashboardIndicator[], newEvent: TrackerEvent): DashboardIndicator[] {
  return indicators.map(ind => {
    let delta = 0;
    if (ind.id === 'military' && (newEvent.category === 'military' || newEvent.category === 'fire')) {
      delta = Math.floor(Math.random() * 5) + 1;
    } else if (ind.id === 'airspace' && (newEvent.category === 'airspace' || newEvent.category === 'alert')) {
      delta = Math.floor(Math.random() * 4) + 1;
    } else if (ind.id === 'shipping' && newEvent.category === 'maritime') {
      delta = Math.floor(Math.random() * 6) + 1;
    } else if (ind.id === 'civilian' && (newEvent.category === 'alert' || newEvent.category === 'humanitarian')) {
      delta = Math.floor(Math.random() * 3) + 1;
    } else if (ind.id === 'uncertainty' && (newEvent.trustLevel === 'low' || newEvent.trustLevel === 'medium')) {
      delta = Math.floor(Math.random() * 4) + 1;
    } else {
      delta = Math.random() > 0.5 ? 1 : -1;
    }
    const newScore = Math.max(0, Math.min(100, ind.score + delta));
    return {
      ...ind,
      previousScore: ind.score,
      score: newScore,
      trend: newScore > ind.score ? 'up' as const : newScore < ind.score ? 'down' as const : 'stable' as const,
    };
  });
}

const EVENT_INTERVAL_MIN = 15000;
const EVENT_INTERVAL_MAX = 45000;

export function LiveDataProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<TrackerEvent[]>(initialEvents);
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [indicators, setIndicators] = useState<DashboardIndicator[]>(initialIndicators);
  const [newEventCount, setNewEventCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'fallback'>('connecting');
  const connectionStatusRef = useRef<'connected' | 'connecting' | 'disconnected' | 'fallback'>('connecting');
  const isLive = true;
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const prevEventCountRef = useRef(initialEvents.length);

  // WebSocket message handler
  const handleWsMessage = useCallback((msg: MessageEvent) => {
    try {
      const data = JSON.parse(msg.data);

      if (data.type === 'initial_data' || data.type === 'events_update') {
        const newEvents = (data.events || []).map(parseEvent);
        if (newEvents.length > 0) {
          setEvents(newEvents);
          const diff = newEvents.length - prevEventCountRef.current;
          if (diff > 0 && data.type === 'events_update') {
            setNewEventCount(prev => prev + diff);
          }
          prevEventCountRef.current = newEvents.length;
          setLastUpdate(new Date());
        }

        if (data.indicators) {
          setIndicators(data.indicators);
        }
        if (data.alerts) {
          setAlerts((data.alerts || []).map(parseAlert));
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
      console.log('[WS] Connected to backend');
      connectionStatusRef.current = 'connected';
      setConnectionStatus('connected');
    };

    ws.onmessage = handleWsMessage;

    ws.onclose = () => {
      console.log('[WS] Disconnected, will reconnect in 10s...');
      connectionStatusRef.current = 'disconnected';
      setConnectionStatus('disconnected');
      reconnectTimer.current = setTimeout(connectWs, 10000);
    };

    ws.onerror = (err) => {
      console.error('[WS] Error:', err);
      ws.close();
    };
  }, [handleWsMessage]);

  // Fallback: also try REST API fetch on initial load
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
          console.log(`[API] Fetched ${apiEvents.length} events via REST`);
        }
      }
    } catch {
      console.log('[API] REST fetch failed, using mock data as fallback');
    }
  }, []);

  // Fallback mock event generator (runs when no backend data)
  const addFallbackEvent = useCallback(() => {
    const newEvent = generateLiveEvent();
    setEvents(prev => [newEvent, ...prev].slice(0, 500));
    setNewEventCount(prev => prev + 1);
    setLastUpdate(new Date());
    setIndicators(prev => updateIndicators(prev, newEvent));

    const newAlert = createAlertFromEvent(newEvent);
    if (newAlert) {
      setAlerts(prev => [newAlert, ...prev]);
    }

    const nextInterval = EVENT_INTERVAL_MIN + Math.random() * (EVENT_INTERVAL_MAX - EVENT_INTERVAL_MIN);
    fallbackTimer.current = setTimeout(addFallbackEvent, nextInterval);
  }, []);

  useEffect(() => {
    // Try WebSocket connection first
    connectWs();

    // Also fetch via REST for immediate data
    fetchInitialData();

    // Start fallback mock generator after 30s if no backend data arrives
    const fallbackStart = setTimeout(() => {
      if (connectionStatusRef.current !== 'connected') {
        console.log('[Fallback] No backend connection, starting mock event generator');
        connectionStatusRef.current = 'fallback';
        setConnectionStatus('fallback');
        const initialDelay = 5000 + Math.random() * 10000;
        fallbackTimer.current = setTimeout(addFallbackEvent, initialDelay);
      }
    }, 30000);

    // Ping WebSocket every 30s to keep alive
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    return () => {
      clearTimeout(fallbackStart);
      clearInterval(pingInterval);
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
      if (wsRef.current) wsRef.current.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectWs, fetchInitialData, addFallbackEvent]);

  const clearNewCount = useCallback(() => {
    setNewEventCount(0);
  }, []);

  return (
    <LiveDataContext.Provider value={{ events, alerts, indicators, newEventCount, isLive, lastUpdate, clearNewCount, connectionStatus }}>
      {children}
    </LiveDataContext.Provider>
  );
}
