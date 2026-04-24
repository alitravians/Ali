import { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, X } from 'lucide-react';

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export default function NotificationPrompt() {
  const [permission, setPermission] = useState<PermissionState>('default');
  const [dismissed, setDismissed] = useState(false);
  const [delayDone, setDelayDone] = useState(false);

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission as PermissionState);
    // Check if user previously dismissed
    if (localStorage.getItem('warscope_notif_dismissed') === '1') {
      setDismissed(true);
    }
  }, []);

  // Delay showing the prompt by 20 seconds so it doesn't appear immediately
  useEffect(() => {
    const timer = setTimeout(() => setDelayDone(true), 20000);
    return () => clearTimeout(timer);
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result as PermissionState);
      if (result === 'granted') {
        // Show a test notification
        const reg = await navigator.serviceWorker.ready;
        reg.showNotification('WarScope', {
          body: 'تم تفعيل الإشعارات بنجاح — ستصلك تنبيهات الأحداث العاجلة',
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          dir: 'rtl',
          lang: 'ar',
          tag: 'warscope-test',
        });
      }
    } catch {
      // Permission request failed
    }
  }, []);

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem('warscope_notif_dismissed', '1');
  };

  // Don't show if already granted, denied, unsupported, dismissed, or delay not done
  if (permission !== 'default' || dismissed || !delayDone) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 animate-slideUp">
      <div className="bg-[#12121a] border border-gray-700 rounded-xl shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-white mb-1">تفعيل الإشعارات</h4>
            <p className="text-[11px] text-gray-400 leading-relaxed mb-3">
              احصل على تنبيهات فورية عند حدوث أحداث عاجلة أو تطورات مهمة
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={requestPermission}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-lg text-[11px] font-semibold text-blue-400 hover:bg-blue-500/30 transition-colors"
              >
                <Bell className="w-3 h-3" />
                تفعيل
              </button>
              <button
                onClick={dismiss}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-gray-400 hover:text-gray-300 transition-colors"
              >
                <BellOff className="w-3 h-3" />
                لاحقاً
              </button>
            </div>
          </div>
          <button onClick={dismiss} className="text-gray-600 hover:text-gray-400 p-0.5" aria-label="إغلاق">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Send a local push notification for breaking events.
 * Call this from the data context when a breaking event arrives.
 */
export async function sendBreakingNotification(title: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    reg.showNotification(title, {
      body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      dir: 'rtl',
      lang: 'ar',
      tag: 'warscope-breaking',
      data: { url: '/live' },
    });
  } catch (err) {
    console.warn('[Notification] Failed to send breaking notification:', err instanceof Error ? err.message : err);
  }
}
