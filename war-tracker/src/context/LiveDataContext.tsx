import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { TrackerEvent, Alert, DashboardIndicator, VesselPosition, MaritimeZoneStats, HormuzBlockadeStatus } from '../types';
import { BACKEND_API_URL, BACKEND_WS_URL } from '../config/api';
import { decodeHtmlEntities } from '../utils/helpers';
import { sendBreakingNotification } from '../components/shared/NotificationPrompt';

// Throttle push notifications: max 1 every 2 minutes
let lastPushTime = 0;
const PUSH_THROTTLE_MS = 120000; // 2 minutes
function throttledPush(title: string, body: string) {
  const now = Date.now();
  if (now - lastPushTime < PUSH_THROTTLE_MS) return;
  lastPushTime = now;
  sendBreakingNotification(title, body);
}

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
  hormuzBlockade: HormuzBlockadeStatus | null;
  aisConnected: boolean;
  newEventCount: number;
  isLive: boolean;
  isLoading: boolean;
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

/** Decode HTML entities in common text fields of a raw object (mutates nothing). */
function decodeTextFields<T extends Record<string, unknown>>(obj: T, keys: string[]): T {
  const copy = { ...obj };
  for (const k of keys) {
    if (typeof copy[k] === 'string') {
      (copy as Record<string, unknown>)[k] = decodeHtmlEntities(copy[k] as string);
    }
  }
  return copy;
}

const TEXT_FIELDS = ['title', 'titleAr', 'description', 'descriptionAr', 'summary', 'summaryAr'];

// Parse event timestamps from JSON
function parseEvent(raw: Record<string, unknown>): TrackerEvent {
  const decoded = decodeTextFields(raw, TEXT_FIELDS);
  return {
    ...decoded,
    timestamp: new Date(decoded.timestamp as string),
    sources: ((decoded.sources as Record<string, unknown>[]) || []).map((s) => ({
      ...s,
      timestamp: new Date(s.timestamp as string),
    })),
  } as TrackerEvent;
}

function parseAlert(raw: Record<string, unknown>): Alert {
  const decoded = decodeTextFields(raw, TEXT_FIELDS);
  return {
    ...decoded,
    timestamp: new Date(decoded.timestamp as string),
  } as Alert;
}

export function LiveDataProvider({ children }: { children: ReactNode }) {
  // Start with empty arrays — NO mock data, only real data from backend
  const [events, setEvents] = useState<TrackerEvent[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [indicators, setIndicators] = useState<DashboardIndicator[]>([]);
  const [vessels, setVessels] = useState<VesselPosition[]>([]);
  const [maritimeZones, setMaritimeZones] = useState<MaritimeZoneStats[]>([]);
  const [hormuzBlockade, setHormuzBlockade] = useState<HormuzBlockadeStatus | null>(null);
  const [aisConnected, setAisConnected] = useState(false);
  const [newEventCount, setNewEventCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [sourceStatus, setSourceStatus] = useState<Record<string, { active: boolean; lastUpdate: string | null; eventCount: number; errors: number }>>({});
  const [bahrainAlert, setBahrainAlert] = useState<BahrainAlert | null>(null);
  const isLive = true;
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const prevEventCountRef = useRef(0);
  const backendHasBlockade = useRef(true); // assume yes, disable on 404

  // WebSocket message handler
  const handleWsMessage = useCallback((msg: MessageEvent) => {
    try {
      const data = JSON.parse(msg.data);

      if (data.type === 'initial_data' || data.type === 'events_update') {
        const newEvents = (data.events || []).map(parseEvent);
        if (newEvents.length > 0) {
          setEvents(newEvents);
          setIsLoading(false);
          // Use totalEvents from backend (not array length) to detect new events
          // because the backend caps the broadcast at 50 events
          const totalFromBackend = data.totalEvents ?? newEvents.length;
          const diff = totalFromBackend - prevEventCountRef.current;
          if (diff > 0 && data.type === 'events_update') {
            setNewEventCount(prev => prev + diff);
            // Push notification for new breaking events (throttled: max 1 per 2 min)
            const breaking = newEvents.filter((e: TrackerEvent) => e.isBreaking);
            if (breaking.length > 0) {
              throttledPush('WarScope — خبر عاجل', breaking[0].titleAr);
            }
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
        // Send push notification for Bahrain alerts (throttled)
        throttledPush('WarScope — تنبيه عاجل', data.message || 'تنبيه عاجل من البحرين');
      }
    } catch (e) {
      console.warn('[WS] Failed to parse message:', e instanceof Error ? e.message : e);
    }
  }, []);

  // Connect to WebSocket — only attempt if backend is reachable
  const connectWs = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    // Verify backend is reachable before opening WebSocket
    // This prevents ERR_NAME_NOT_RESOLVED console errors
    try {
      const probe = await fetch(`${BACKEND_API_URL}/api/health`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!probe.ok) {
        setConnectionStatus('disconnected');
        reconnectTimer.current = setTimeout(connectWs, 30000);
        return;
      }
    } catch {
      // Backend unreachable — skip WebSocket, retry later
      setConnectionStatus('disconnected');
      reconnectTimer.current = setTimeout(connectWs, 30000);
      return;
    }

    setConnectionStatus('connecting');

    const ws = new WebSocket(BACKEND_WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('connected');
    };

    ws.onmessage = handleWsMessage;

    ws.onclose = () => {
      setConnectionStatus('disconnected');
      reconnectTimer.current = setTimeout(connectWs, 10000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [handleWsMessage]);

  // Also try REST API fetch on initial load for immediate data
  const fetchInitialData = useCallback(async () => {
    // Retry with exponential backoff for initial event load
    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        const resp = await fetch(`${BACKEND_API_URL}/api/events?limit=100`, { signal: controller.signal });
        clearTimeout(timeout);
        if (resp.ok) {
          const data = await resp.json();
          const apiEvents = (data.events || []).map(parseEvent);
          if (apiEvents.length > 0) {
            setEvents(apiEvents);
            prevEventCountRef.current = data.total ?? apiEvents.length;
            setLastUpdate(new Date());
            setIsLoading(false);
          }
          break; // Success — stop retrying
        }
        // REST fetch returned non-OK status, retrying
      } catch (err) {
        console.warn(`[REST] Fetch attempt ${attempt + 1}/${maxRetries} failed:`, err instanceof Error ? err.message : err);
      }
      if (attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 2000 * Math.pow(2, attempt)));
      }
    }
    // Even if REST failed, mark loading as done (WebSocket may deliver data)
    setIsLoading(false);

    // Fetch source status
    try {
      const srcController = new AbortController();
      const srcTimeout = setTimeout(() => srcController.abort(), 10000);
      const resp = await fetch(`${BACKEND_API_URL}/api/sources`, { signal: srcController.signal });
      clearTimeout(srcTimeout);
      if (resp.ok) {
        const data = await resp.json();
        if (data.sources) {
          setSourceStatus(data.sources);
        }
      }
    } catch (err) {
      console.warn('[REST] Source status fetch failed:', err instanceof Error ? err.message : err);
    }

    // Fetch alerts
    try {
      const alertController = new AbortController();
      const alertTimeout = setTimeout(() => alertController.abort(), 10000);
      const resp = await fetch(`${BACKEND_API_URL}/api/alerts`, { signal: alertController.signal });
      clearTimeout(alertTimeout);
      if (resp.ok) {
        const data = await resp.json();
        if (data.alerts) {
          setAlerts(data.alerts.map(parseAlert));
        }
      }
    } catch (err) {
      console.warn('[REST] Alerts fetch failed:', err instanceof Error ? err.message : err);
    }

    // Fetch indicators
    try {
      const indController = new AbortController();
      const indTimeout = setTimeout(() => indController.abort(), 10000);
      const resp = await fetch(`${BACKEND_API_URL}/api/indicators`, { signal: indController.signal });
      clearTimeout(indTimeout);
      if (resp.ok) {
        const data = await resp.json();
        if (data.indicators) {
          setIndicators(data.indicators);
        }
      }
    } catch (err) {
      console.warn('[REST] Indicators fetch failed:', err instanceof Error ? err.message : err);
    }

    // Fetch vessels (REST fallback — critical for maritime panel)
    try {
      const vesselController = new AbortController();
      const vesselTimeout = setTimeout(() => vesselController.abort(), 15000);
      const resp = await fetch(`${BACKEND_API_URL}/api/vessels`, { signal: vesselController.signal });
      clearTimeout(vesselTimeout);
      if (resp.ok) {
        const data = await resp.json();
        if (data.vessels && Array.isArray(data.vessels)) {
          setVessels(data.vessels as VesselPosition[]);
        }
        if (data.zones && Array.isArray(data.zones)) {
          setMaritimeZones(data.zones as MaritimeZoneStats[]);
        }
        if (typeof data.aisConnected === 'boolean') {
          setAisConnected(data.aisConnected);
        }
      }
    } catch (err) {
      console.warn('[REST] Vessels fetch failed:', err instanceof Error ? err.message : err);
    }

    // Fetch Hormuz blockade status — only if backend has the endpoint
    // (avoids 404 console errors that hurt PageSpeed score)
    if (backendHasBlockade.current) {
      try {
        const blockadeController = new AbortController();
        const blockadeTimeout = setTimeout(() => blockadeController.abort(), 10000);
        const resp = await fetch(`${BACKEND_API_URL}/api/hormuz-blockade`, { signal: blockadeController.signal });
        clearTimeout(blockadeTimeout);
        if (resp.ok) {
          const data = await resp.json();
          setHormuzBlockade(data as HormuzBlockadeStatus);
        } else if (resp.status === 404) {
          backendHasBlockade.current = false;
        }
      } catch {
        // silent
      }
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

    // Refresh vessels via REST every 30s as fallback (in case WS is unstable)
    const vesselRefresh = setInterval(async () => {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 10000);
        const resp = await fetch(`${BACKEND_API_URL}/api/vessels`, { signal: ctrl.signal });
        clearTimeout(t);
        if (resp.ok) {
          const data = await resp.json();
          if (data.vessels && Array.isArray(data.vessels)) {
            setVessels(data.vessels as VesselPosition[]);
          }
          if (data.zones && Array.isArray(data.zones)) {
            setMaritimeZones(data.zones as MaritimeZoneStats[]);
          }
          if (typeof data.aisConnected === 'boolean') {
            setAisConnected(data.aisConnected);
          }
        }
      } catch { /* silent — WS will handle if REST fails */ }
    }, 30000);

    // Refresh Hormuz blockade status every 60s (skip if endpoint returned 404)
    const blockadeRefresh = setInterval(async () => {
      if (!backendHasBlockade.current) return;
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 10000);
        const resp = await fetch(`${BACKEND_API_URL}/api/hormuz-blockade`, { signal: ctrl.signal });
        clearTimeout(t);
        if (resp.ok) {
          const data = await resp.json();
          setHormuzBlockade(data as HormuzBlockadeStatus);
        } else if (resp.status === 404) {
          backendHasBlockade.current = false;
        }
      } catch { /* silent */ }
    }, 60000);

    return () => {
      clearInterval(pingInterval);
      clearInterval(vesselRefresh);
      clearInterval(blockadeRefresh);
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
    <LiveDataContext.Provider value={{ events, alerts, indicators, vessels, maritimeZones, hormuzBlockade, aisConnected, newEventCount, isLive, isLoading, lastUpdate, clearNewCount, connectionStatus, sourceStatus, bahrainAlert, dismissBahrainAlert }}>
      {children}
    </LiveDataContext.Provider>
  );
}
