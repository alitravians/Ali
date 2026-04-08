import { AlertTriangle, X, MapPin } from 'lucide-react';
import { useLiveData } from '../../context/LiveDataContext';

export default function BahrainAlertBanner() {
  const { bahrainAlert, dismissBahrainAlert } = useLiveData();

  if (!bahrainAlert) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] animate-pulse">
      <div className="bg-gradient-to-r from-red-700 via-red-600 to-red-700 border-b-2 border-red-400 shadow-2xl shadow-red-900/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="bg-red-500/30 rounded-full p-2 animate-bounce">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <MapPin className="w-4 h-4" />
                <span>{bahrainAlert.message}</span>
              </div>
              {bahrainAlert.event?.title && (
                <p className="text-red-100 text-sm mt-0.5 line-clamp-1">
                  {bahrainAlert.event.titleAr || bahrainAlert.event.title}
                </p>
              )}
            </div>
            <div className="text-red-200 text-xs whitespace-nowrap hidden sm:block">
              {new Date(bahrainAlert.timestamp).toLocaleTimeString('ar-BH')}
            </div>
          </div>
          <button
            onClick={dismissBahrainAlert}
            className="text-red-200 hover:text-white transition-colors p-1 rounded-lg hover:bg-red-500/30"
            aria-label="إغلاق التنبيه"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
