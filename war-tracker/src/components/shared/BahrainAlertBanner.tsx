import { AlertTriangle, ShieldCheck, X, MapPin } from 'lucide-react';
import { useLiveData } from '../../context/LiveDataContext';

export default function BahrainAlertBanner() {
  const { bahrainAlert, dismissBahrainAlert } = useLiveData();

  if (!bahrainAlert) return null;

  const isCritical = bahrainAlert.severity === 'critical';

  const bgClass = isCritical
    ? 'bg-gradient-to-r from-red-700 via-red-600 to-red-700 border-b-2 border-red-400 shadow-2xl shadow-red-900/50'
    : 'bg-gradient-to-r from-green-700 via-green-600 to-green-700 border-b-2 border-green-400 shadow-2xl shadow-green-900/50';

  const iconBgClass = isCritical ? 'bg-red-500/30' : 'bg-green-500/30';
  const subtextClass = isCritical ? 'text-red-100' : 'text-green-100';
  const timeClass = isCritical ? 'text-red-200' : 'text-green-200';
  const btnClass = isCritical
    ? 'text-red-200 hover:text-white hover:bg-red-500/30'
    : 'text-green-200 hover:text-white hover:bg-green-500/30';

  const Icon = isCritical ? AlertTriangle : ShieldCheck;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999]">
      <div className={bgClass}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className={`${iconBgClass} rounded-full p-2 ${isCritical ? 'animate-bounce' : ''}`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <MapPin className="w-4 h-4" />
                <span>{bahrainAlert.message}</span>
              </div>
              {bahrainAlert.event?.title && (
                <p className={`${subtextClass} text-sm mt-0.5 line-clamp-1`}>
                  {bahrainAlert.event.titleAr || bahrainAlert.event.title}
                </p>
              )}
            </div>
            <div className={`${timeClass} text-xs whitespace-nowrap hidden sm:block`}>
              {new Date(bahrainAlert.timestamp).toLocaleTimeString('ar-BH')}
            </div>
          </div>
          <button
            onClick={dismissBahrainAlert}
            className={`${btnClass} transition-colors p-1 rounded-lg`}
            aria-label="إغلاق التنبيه"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
