import { useEffect, useState, useCallback, useRef } from 'react';
import { AlertTriangle, TrendingUp, Bell, Info, X, BellOff } from 'lucide-react';
import type { Alert } from '../../types';
import { timeAgo } from '../../utils/helpers';

interface AlertToastProps {
  alerts: Alert[];
}

interface ToastItem {
  alert: Alert;
  visible: boolean;
}

/**
 * AlertToast — Radical fix for annoying notifications
 * 
 * Rules:
 * 1. Max 1 toast at a time on ALL devices
 * 2. Only show critical/high severity (ignore medium/low)
 * 3. Min 30 seconds between toasts (throttle)
 * 4. Auto-dismiss after 4 seconds
 * 5. Users can mute toasts via X long-press or localStorage
 * 6. First 10 seconds after page load = no toasts (let page settle)
 */
export default function AlertToast({ alerts }: AlertToastProps) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const [muted, setMuted] = useState(() => localStorage.getItem('warscope_toasts_muted') === '1');
  const shownIdsRef = useRef<Set<string>>(new Set());
  const lastToastTimeRef = useRef<number>(0);
  const mountTimeRef = useRef<number>(Date.now());

  // Track new alerts and show toast (heavily throttled, only critical/high)
  useEffect(() => {
    if (muted) return;

    // Don't show toasts for first 10 seconds after page load
    if (Date.now() - mountTimeRef.current < 10000) return;

    const newAlerts = alerts.filter(a =>
      !shownIdsRef.current.has(a.id) &&
      !a.isRead &&
      (a.severity === 'critical' || a.severity === 'high') // Only important alerts
    );
    if (newAlerts.length === 0) {
      // Still mark non-critical as shown so they don't queue up
      alerts.forEach(a => shownIdsRef.current.add(a.id));
      return;
    }

    // Throttle: min 30 seconds between toasts
    const now = Date.now();
    if (now - lastToastTimeRef.current < 30000) {
      newAlerts.forEach(a => shownIdsRef.current.add(a.id));
      return;
    }

    // Show only the most important alert
    const sorted = [...newAlerts].sort((a, b) => {
      const sev = { critical: 4, high: 3, medium: 2, low: 1 };
      return (sev[b.severity as keyof typeof sev] || 0) - (sev[a.severity as keyof typeof sev] || 0);
    });

    // Mark all as shown
    newAlerts.forEach(a => shownIdsRef.current.add(a.id));
    lastToastTimeRef.current = now;

    setToast({ alert: sorted[0], visible: true });
  }, [alerts, muted]);

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    if (!toast || !toast.visible) return;
    const timer = setTimeout(() => {
      setToast(prev => prev ? { ...prev, visible: false } : null);
      setTimeout(() => setToast(null), 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const dismissToast = useCallback(() => {
    setToast(prev => prev ? { ...prev, visible: false } : null);
    setTimeout(() => setToast(null), 300);
  }, []);

  const muteToasts = useCallback(() => {
    setMuted(true);
    localStorage.setItem('warscope_toasts_muted', '1');
    setToast(null);
  }, []);

  const typeIcons: Record<string, typeof Bell> = {
    urgent: AlertTriangle,
    escalation: TrendingUp,
    change: Bell,
    info: Info,
  };

  if (!toast || muted) return null;

  const { alert, visible } = toast;
  const Icon = typeIcons[alert.type] || Bell;

  return (
    <div className="fixed z-[9998] bottom-20 left-4 right-4 sm:left-4 sm:right-auto sm:bottom-auto sm:top-24 sm:max-w-xs">
      <div
        className={`${visible ? 'animate-toastIn' : 'animate-toastOut'} rounded-xl border shadow-2xl shadow-black/50 p-3 backdrop-blur-sm ${
          alert.severity === 'critical'
            ? 'bg-red-500/10 border-red-500/40'
            : 'bg-orange-500/10 border-orange-500/40'
        }`}
      >
        <div className="flex items-start gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
            alert.severity === 'critical' ? 'bg-red-500/20' : 'bg-orange-500/20'
          }`}>
            <Icon className={`w-3.5 h-3.5 ${
              alert.severity === 'critical' ? 'text-red-400' : 'text-orange-400'
            }`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                alert.severity === 'critical' ? 'text-red-400 bg-red-500/15' : 'text-orange-400 bg-orange-500/15'
              }`}>
                {alert.severity === 'critical' ? 'حرج' : 'عالي'}
              </span>
              <span className="text-[10px] text-gray-400">{timeAgo(alert.timestamp)}</span>
            </div>
            <p className="text-xs font-bold text-white truncate">{alert.titleAr}</p>
          </div>
          <div className="flex flex-col gap-1 flex-shrink-0">
            <button
              onClick={dismissToast}
              className="w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center transition-colors"
              title="إغلاق"
              aria-label="إغلاق"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
            <button
              onClick={muteToasts}
              className="w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center transition-colors"
              title="إيقاف الإشعارات"
              aria-label="إيقاف الإشعارات"
            >
              <BellOff className="w-3 h-3 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
