import { useEffect, useState, useCallback, useRef } from 'react';
import { AlertTriangle, TrendingUp, Bell, Info, X } from 'lucide-react';
import type { Alert } from '../../types';
import { timeAgo } from '../../utils/helpers';

interface AlertToastProps {
  alerts: Alert[];
  maxVisible?: number;
}

interface ToastItem {
  alert: Alert;
  visible: boolean;
}

export default function AlertToast({ alerts, maxVisible = 3 }: AlertToastProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const shownIdsRef = useRef<Set<string>>(new Set());

  // Track new alerts and show toasts
  useEffect(() => {
    const newAlerts = alerts.filter(a => !shownIdsRef.current.has(a.id) && !a.isRead);
    if (newAlerts.length === 0) return;

    newAlerts.forEach(a => shownIdsRef.current.add(a.id));

    const newToasts = newAlerts.slice(0, maxVisible).map(alert => ({ alert, visible: true }));
    setToasts(prev => [...newToasts, ...prev].slice(0, maxVisible));
  }, [alerts, maxVisible]);

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts(prev => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], visible: false };
        return updated;
      });
      // Remove after animation
      setTimeout(() => {
        setToasts(prev => prev.slice(0, -1));
      }, 300);
    }, 8000);
    return () => clearTimeout(timer);
  }, [toasts]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.map(t => t.alert.id === id ? { ...t, visible: false } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.alert.id !== id));
    }, 300);
  }, []);

  const typeIcons = {
    urgent: AlertTriangle,
    escalation: TrendingUp,
    change: Bell,
    info: Info,
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-24 left-4 z-[9998] flex flex-col gap-2 max-w-sm">
      {toasts.map(({ alert, visible }) => {
        const Icon = typeIcons[alert.type] || Bell;
        return (
          <div
            key={alert.id}
            className={`${visible ? 'animate-toastIn' : 'animate-toastOut'} rounded-xl border shadow-2xl shadow-black/50 p-3 backdrop-blur-sm ${
              alert.severity === 'critical'
                ? 'bg-red-500/10 border-red-500/40'
                : alert.severity === 'high'
                ? 'bg-orange-500/10 border-orange-500/40'
                : alert.severity === 'medium'
                ? 'bg-yellow-500/10 border-yellow-500/40'
                : 'bg-blue-500/10 border-blue-500/40'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                alert.severity === 'critical' ? 'bg-red-500/20' :
                alert.severity === 'high' ? 'bg-orange-500/20' :
                alert.severity === 'medium' ? 'bg-yellow-500/20' : 'bg-blue-500/20'
              }`}>
                <Icon className={`w-4 h-4 ${
                  alert.severity === 'critical' ? 'text-red-400' :
                  alert.severity === 'high' ? 'text-orange-400' :
                  alert.severity === 'medium' ? 'text-yellow-400' : 'text-blue-400'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    alert.severity === 'critical' ? 'text-red-400 bg-red-500/15' :
                    alert.severity === 'high' ? 'text-orange-400 bg-orange-500/15' :
                    alert.severity === 'medium' ? 'text-yellow-400 bg-yellow-500/15' : 'text-blue-400 bg-blue-500/15'
                  }`}>
                    {alert.severity === 'critical' ? 'حرج' : alert.severity === 'high' ? 'عالي' : alert.severity === 'medium' ? 'متوسط' : 'منخفض'}
                  </span>
                  <span className="text-[10px] text-gray-500">{timeAgo(alert.timestamp)}</span>
                </div>
                <p className="text-xs font-bold text-white truncate">{alert.titleAr}</p>
                <p className="text-[11px] text-gray-400 line-clamp-2 mt-0.5">{alert.descriptionAr}</p>
              </div>
              <button
                onClick={() => dismissToast(alert.id)}
                className="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center flex-shrink-0 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
