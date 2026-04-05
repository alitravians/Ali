'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [onlineCount, setOnlineCount] = useState(0);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');

  // Fetch site status (maintenance mode check)
  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const res = await fetch('/api/site-status');
        if (res.ok) {
          const data = await res.json();
          setMaintenanceMode(data.maintenanceMode || false);
          setMaintenanceMessage(data.maintenanceMessage || 'الموقع تحت الصيانة');
        }
      } catch { /* ignore */ }
    };
    checkMaintenance();
  }, []);

  // Fetch online count for homepage
  useEffect(() => {
    const fetchOnline = async () => {
      try {
        const res = await fetch('/api/presence/count');
        if (res.ok) {
          const data = await res.json();
          setOnlineCount(data.totalOnline || 0);
        }
      } catch { /* ignore */ }
    };
    fetchOnline();
    const interval = setInterval(fetchOnline, 15000);
    return () => clearInterval(interval);
  }, []);

  // Auto-open admin modal after login redirect
  useEffect(() => {
    const pending = sessionStorage.getItem('pendingAdminAccess');
    if (pending) {
      sessionStorage.removeItem('pendingAdminAccess');
      setShowAdminModal(true);
    }
  }, []);

  const handleAdminAccess = async () => {
    try {
      const res = await fetch('/api/admin/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: adminCode }),
      });
      const data = await res.json();
      if (data.needsLogin) {
        // User needs to log in first — flag to auto-open modal after login (no code stored)
        sessionStorage.setItem('pendingAdminAccess', '1');
        router.push(data.redirect);
      } else if (res.ok && data.redirect) {
        router.push(data.redirect);
      } else {
        setCodeError(data.error || 'رمز الدخول غير صحيح');
      }
    } catch {
      setCodeError('حدث خطأ في الاتصال');
    }
  };

  // Maintenance mode view
  if (maintenanceMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0b1120] via-[#0d1526] to-[#0b1120] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-center px-6 max-w-lg">
          <div className="text-6xl mb-6">🔧</div>
          <h1 className="text-3xl font-bold text-white mb-4">الموقع تحت الصيانة</h1>
          <p className="text-gray-400 text-lg mb-8 leading-relaxed">{maintenanceMessage}</p>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] rounded-xl text-gray-400 hover:text-cyan-400 transition-all duration-300 text-sm"
          >
            <span>⚙️</span>
            <span>لوحة التحكم</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1120] via-[#0d1526] to-[#0b1120] relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold gradient-text">ChatZone</h1>
        <div className="flex items-center gap-4">
          <Link href="/welcome" className="text-gray-400 hover:text-white transition-colors text-sm">الترحيب</Link>
          <Link href="/instructions" className="text-gray-400 hover:text-white transition-colors text-sm">التعليمات</Link>
          <Link href="/chat-guide" className="text-gray-400 hover:text-white transition-colors text-sm">دليل الدردشة</Link>
          <Link href="/rules" className="text-gray-400 hover:text-white transition-colors text-sm">القوانين</Link>
          <Link href="/team" className="text-gray-400 hover:text-white transition-colors text-sm">فريق العمل</Link>
          <button
            onClick={() => setShowAdminModal(true)}
            className="text-gray-600 hover:text-gray-400 transition-colors text-xs"
            title="دخول الإدارة"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
        </div>
      </nav>

      {/* Hero section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
        <div className="mb-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm">
          <span className="w-2 h-2 bg-emerald-400 rounded-full online-indicator" />
          {onlineCount > 0 ? `${onlineCount} متواجد الآن` : 'منصة الدردشة الاحترافية'}
        </div>

        <h2 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          <span className="gradient-text">ChatZone</span>
        </h2>

        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
          منصة دردشة احترافية بنظام غرف متعددة، صلاحيات متقدمة، وإدارة كاملة.
          <br />
          انضم الآن وكن جزءاً من مجتمعنا.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/register"
            className="px-8 py-3.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 rounded-xl font-semibold text-white transition-all duration-300 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:-translate-y-0.5"
          >
            إنشاء حساب جديد
          </Link>
          <Link
            href="/login"
            className="px-8 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-semibold text-white transition-all duration-300 hover:-translate-y-0.5"
          >
            تسجيل الدخول
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-4xl w-full">
          {[
            { icon: '💬', title: 'دردشة لحظية', desc: 'رسائل فورية مع مؤشرات الكتابة والحالة' },
            { icon: '🏠', title: 'غرف متعددة', desc: 'غرف عامة وخاصة مع إدارة كاملة' },
            { icon: '🛡️', title: 'نظام صلاحيات', desc: 'رتب ديناميكية وصلاحيات مرنة' },
          ].map((feature, i) => (
            <div key={i} className="glass rounded-2xl p-6 text-center hover:bg-white/5 transition-colors">
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Admin Access Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAdminModal(false)}>
          <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-8 w-full max-w-sm mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-6 text-center">دخول لوحة التحكم</h3>
            <input
              type="password"
              value={adminCode}
              onChange={(e) => { setAdminCode(e.target.value); setCodeError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleAdminAccess()}
              placeholder="أدخل رمز الدخول"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-center text-lg tracking-widest focus:outline-none focus:border-cyan-500/50 mb-4"
              autoFocus
            />
            {codeError && <p className="text-red-400 text-sm text-center mb-4">{codeError}</p>}
            <button
              onClick={handleAdminAccess}
              className="w-full py-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 rounded-xl font-semibold text-white transition-colors"
            >
              دخول
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 text-gray-600 text-sm">
        ChatZone &copy; {new Date().getFullYear()} - جميع الحقوق محفوظة
      </footer>
    </div>
  );
}
