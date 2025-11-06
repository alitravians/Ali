import { useEffect, useState } from 'react';

/**
 * شاشة تحميل BIGO LIVE — تظهر قبل تحميل الموقع.
 * - الشعار في المنتصف بحجم متوسط.
 * - الخلفية داكنة وثابتة.
 * - تختفي تلقائياً بعد 1.5 ثانية.
 */
export default function LoadingScreenBigo() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900">
      <img
        src="/bigo-logo.png"
        alt="BIGO LIVE Logo"
        className="w-44 h-auto mb-4 animate-pulse"
      />
      <p className="text-white text-lg font-semibold mt-2">
        جارٍ التحميل ...
      </p>
    </div>
  );
}
