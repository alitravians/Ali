import { useState, useEffect, useCallback } from 'react';
import {
  Shield, X,
  CheckCircle2, AlertTriangle, Info,
} from 'lucide-react';

// ──────────────────────────────────────────────
// Stat Card
// ──────────────────────────────────────────────
const colorMap: Record<string, { text: string; bg: string; border: string }> = {
  blue:   { text: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
  yellow: { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  red:    { text: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20' },
  green:  { text: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20' },
  purple: { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
};

export function StatCard({ icon: Icon, color, label, value }: {
  icon: typeof Shield; color: string; label: string; value: string | number;
}) {
  const c = colorMap[color] || colorMap.blue;
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} bg-[#12121a] p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${c.text}`} />
        <span className="text-[11px] text-gray-400">{label}</span>
      </div>
      <span className={`text-2xl font-black ${c.text}`}>{value}</span>
    </div>
  );
}

// ──────────────────────────────────────────────
// Info Card
// ──────────────────────────────────────────────
export function InfoCard({ icon: Icon, iconColor, title, rows }: {
  icon: typeof Shield;
  iconColor: string;
  title: string;
  rows: { label: string; value: string | number; valueColor?: string }[];
}) {
  return (
    <div className="p-4 bg-[#12121a] rounded-xl border border-gray-800">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <span className="text-xs font-bold text-white">{title}</span>
      </div>
      <div className="space-y-2.5">
        {rows.map((row, i) => (
          <div key={i} className="flex justify-between text-[11px]">
            <span className="text-gray-400">{row.label}</span>
            <span className={row.valueColor || 'text-white'}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Quick Action Button
// ──────────────────────────────────────────────
export function QuickAction({ label, icon: Icon, count, onClick }: {
  label: string; icon: typeof Shield; count?: number; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 p-3 rounded-xl bg-[#0a0a0f] border border-gray-800 hover:border-gray-700 hover:bg-white/3 transition-all text-right"
    >
      <Icon className="w-4 h-4 text-gray-400" />
      <span className="text-[11px] text-gray-300 flex-1">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="px-1.5 py-0.5 bg-yellow-500/15 text-yellow-400 rounded-full text-[9px] font-bold">{count}</span>
      )}
    </button>
  );
}

// ──────────────────────────────────────────────
// Section Header
// ──────────────────────────────────────────────
export function SectionHeader({ title, description, action }: {
  title: string; description?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-5">
      <div>
        <h2 className="text-sm font-bold text-white">{title}</h2>
        {description && <p className="text-[10px] text-gray-400 mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
  );
}

// ──────────────────────────────────────────────
// Toast Notification System
// ──────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

let toastId = 0;
const listeners: Set<(toast: Toast) => void> = new Set();

export function showToast(message: string, type: ToastType = 'info') {
  const toast: Toast = { id: ++toastId, message, type };
  listeners.forEach(fn => fn(toast));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Toast) => {
    setToasts(prev => [...prev, toast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id));
    }, 3500);
  }, []);

  useEffect(() => {
    listeners.add(addToast);
    return () => { listeners.delete(addToast); };
  }, [addToast]);

  if (toasts.length === 0) return null;

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-green-400" />,
    error: <AlertTriangle className="w-4 h-4 text-red-400" />,
    info: <Info className="w-4 h-4 text-blue-400" />,
  };
  const borders = {
    success: 'border-green-500/30',
    error: 'border-red-500/30',
    info: 'border-blue-500/30',
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center gap-2 px-4 py-2.5 bg-[#12121a] border ${borders[toast.type]} rounded-xl shadow-2xl animate-in slide-in-from-left text-xs text-white max-w-sm`}
        >
          {icons[toast.type]}
          <span className="flex-1">{toast.message}</span>
          <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="text-gray-400 hover:text-white">
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
