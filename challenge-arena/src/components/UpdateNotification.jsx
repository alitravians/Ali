import { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { versionManager } from '../utils/versionManager';

function UpdateNotification() {
  const [showNotification, setShowNotification] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const versionInfo = versionManager.getVersionInfo();
    
    if (versionInfo.needsUpdate) {
      setShowNotification(true);
    }
  }, []);

  const handleUpdate = () => {
    setIsRefreshing(true);
    versionManager.clearCacheAndReload();
  };

  const handleDismiss = () => {
    setShowNotification(false);
    versionManager.updateStoredVersion();
  };

  if (!showNotification) return null;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] animate-slideDown">
      <div className="bg-gradient-to-r from-orange-500 to-cyan-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 max-w-md">
        <div className="flex-shrink-0">
          <RefreshCw size={24} className={isRefreshing ? 'animate-spin' : ''} />
        </div>
        <div className="flex-1">
          <p className="font-bold text-lg">تحديث جديد متاح!</p>
          <p className="text-sm opacity-90">يوجد نسخة جديدة من الموقع</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleUpdate}
            disabled={isRefreshing}
            className="px-4 py-2 bg-white text-orange-600 font-bold rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {isRefreshing ? 'جاري التحديث...' : 'تحديث الآن'}
          </button>
          <button
            onClick={handleDismiss}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default UpdateNotification;
