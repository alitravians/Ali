import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import {
  Bell, BellOff, CheckCheck, Trash2, MessageSquare,
  AlertTriangle, Shield, Zap, Clock
} from 'lucide-react';
import { useState } from 'react';

export default function NotificationsPage() {
  const {
    notifications, markNotificationRead,
    markAllNotificationsRead, clearNotifications, unreadCount
  } = useApp();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const getIcon = (type: string) => {
    switch (type) {
      case 'match': return <MessageSquare size={16} className="text-emerald-400" />;
      case 'failure': return <AlertTriangle size={16} className="text-red-400" />;
      case 'service': return <Zap size={16} className="text-amber-400" />;
      case 'permission': return <Shield size={16} className="text-blue-400" />;
      default: return <Bell size={16} className="text-gray-400" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'match': return 'border-emerald-500/20 bg-emerald-500/5';
      case 'failure': return 'border-red-500/20 bg-red-500/5';
      case 'service': return 'border-amber-500/20 bg-amber-500/5';
      case 'permission': return 'border-blue-500/20 bg-blue-500/5';
      default: return 'border-gray-800 bg-gray-900';
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 pb-20">
      <Header
        title="التنبيهات"
        rightAction={
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="p-2 text-gray-400 hover:text-emerald-400 transition-colors"
                title="قراءة الكل"
              >
                <CheckCheck size={18} />
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="p-2 text-gray-400 hover:text-red-400 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        }
      />

      <div className="px-4 py-4 max-w-lg mx-auto space-y-3">
        {unreadCount > 0 && (
          <div className="bg-emerald-500/10 rounded-xl px-3 py-2 border border-emerald-500/20 text-center">
            <span className="text-xs text-emerald-400">{unreadCount} تنبيه غير مقروء</span>
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <BellOff size={48} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">لا توجد تنبيهات</p>
            <p className="text-gray-600 text-xs mt-1">ستظهر التنبيهات هنا عند وصول رسائل مطابقة</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => !notification.isRead && markNotificationRead(notification.id)}
                className={`w-full text-right rounded-xl border p-3 transition-all ${
                  notification.isRead
                    ? 'bg-gray-900 border-gray-800 opacity-60'
                    : getTypeColor(notification.type)
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-gray-500">
                        <Clock size={10} />
                        <span className="text-[10px]">{formatTimeAgo(notification.timestamp)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-white">{notification.title}</h4>
                        {!notification.isRead && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{notification.message}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Clear Confirmation */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-sm p-5">
            <h3 className="text-lg font-bold text-white mb-2">مسح التنبيهات</h3>
            <p className="text-sm text-gray-400 mb-5">هل أنت متأكد من مسح جميع التنبيهات؟</p>
            <div className="flex gap-3">
              <button
                onClick={() => { clearNotifications(); setShowClearConfirm(false); }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 rounded-xl transition-colors"
              >
                مسح الكل
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2.5 rounded-xl transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'الآن';
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return `منذ ${days} يوم`;
}
