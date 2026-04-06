import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { TrackerEvent, Alert, DashboardIndicator } from '../types';
import { events as initialEvents, alerts as initialAlerts, indicators as initialIndicators } from '../data/mockData';
import { generateLiveEvent } from '../data/liveEventGenerator';

interface LiveDataContextType {
  events: TrackerEvent[];
  alerts: Alert[];
  indicators: DashboardIndicator[];
  newEventCount: number;
  isLive: boolean;
  lastUpdate: Date;
  clearNewCount: () => void;
}

const LiveDataContext = createContext<LiveDataContextType | null>(null);

export function useLiveData() {
  const ctx = useContext(LiveDataContext);
  if (!ctx) throw new Error('useLiveData must be used within LiveDataProvider');
  return ctx;
}

// Generate a new alert from a live event
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

// Slightly randomize indicator scores for live feel
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
      // Small random fluctuation
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

const EVENT_INTERVAL_MIN = 15000; // 15 seconds minimum
const EVENT_INTERVAL_MAX = 45000; // 45 seconds maximum

export function LiveDataProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<TrackerEvent[]>(initialEvents);
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [indicators, setIndicators] = useState<DashboardIndicator[]>(initialIndicators);
  const [newEventCount, setNewEventCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const isLive = true;
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const addLiveEvent = useCallback(() => {
    const newEvent = generateLiveEvent();

    setEvents(prev => [newEvent, ...prev].slice(0, 500));
    setNewEventCount(prev => prev + 1);
    setLastUpdate(new Date());
    setIndicators(prev => updateIndicators(prev, newEvent));

    // Maybe create an alert
    const newAlert = createAlertFromEvent(newEvent);
    if (newAlert) {
      setAlerts(prev => [newAlert, ...prev]);
    }

    // Schedule next event with random interval
    const nextInterval = EVENT_INTERVAL_MIN + Math.random() * (EVENT_INTERVAL_MAX - EVENT_INTERVAL_MIN);
    timeoutRef.current = setTimeout(addLiveEvent, nextInterval);
  }, []);

  useEffect(() => {
    // Start generating events after initial delay
    const initialDelay = 5000 + Math.random() * 10000; // 5-15 seconds
    timeoutRef.current = setTimeout(addLiveEvent, initialDelay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [addLiveEvent]);

  const clearNewCount = useCallback(() => {
    setNewEventCount(0);
  }, []);

  return (
    <LiveDataContext.Provider value={{ events, alerts, indicators, newEventCount, isLive, lastUpdate, clearNewCount }}>
      {children}
    </LiveDataContext.Provider>
  );
}
