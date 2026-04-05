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
      <div className="min-h-screen bg-[#060B18] flex items-center justify-center relative overflow-hidden">
        {/* Background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -right-32 w-96 h-96 bg-amber-500/8 rounded-full blur-3xl bg-orb-1" />
          <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-orange-500/8 rounded-full blur-3xl bg-orb-2" />
        </div>
        <div className="relative z-10 text-center px-6 max-w-lg">
          <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🔧</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">الموقع تحت الصيانة</h1>
          <p className="text-gray-400 text-lg mb-8 leading-relaxed">{maintenanceMessage}</p>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-6 py-3 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 hover:border-violet-500/30 rounded-xl text-violet-300 hover:text-violet-200 transition-all duration-300 text-sm"
          >
            <span>⚙️</span>
            <span>لوحة التحكم</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060B18] relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] bg-violet-600/8 rounded-full blur-[100px] bg-orb-1" />
        <div className="absolute bottom-1/4 -left-32 w-[400px] h-[400px] bg-indigo-600/8 rounded-full blur-[100px] bg-orb-2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-600/[0.04] rounded-full blur-[120px] bg-orb-3" />
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(124,58,237,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold gradient-text-animated">ChatZone</h1>
        <div className="flex items-center gap-1">
          {[
            { href: '/welcome', label: 'الترحيب' },
            { href: '/instructions', label: 'التعليمات' },
            { href: '/chat-guide', label: 'دليل الدردشة' },
            { href: '/rules', label: 'القوانين' },
            { href: '/team', label: 'فريق العمل' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-gray-400 hover:text-violet-300 transition-colors text-sm px-3 py-1.5 rounded-lg hover:bg-violet-500/5"
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={() => setShowAdminModal(true)}
            className="text-gray-600 hover:text-violet-400 transition-colors text-xs p-2 rounded-lg hover:bg-violet-500/5 mr-2"
            title="دخول الإدارة"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
        </div>
      </nav>

      {/* Hero section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
        {/* Online badge */}
        <div className="mb-6 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-violet-500/8 border border-violet-500/15 text-violet-300 text-sm backdrop-blur-sm">
          <span className="w-2 h-2 bg-emerald-400 rounded-full online-indicator" />
          {onlineCount > 0 ? `${onlineCount} متواجد الآن` : 'منصة الدردشة الاحترافية'}
        </div>

        {/* Main heading */}
        <h2 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          <span className="gradient-text-animated">ChatZone</span>
        </h2>

        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mb-12 leading-relaxed">
          منصة دردشة احترافية بنظام غرف متعددة، صلاحيات متقدمة، وإدارة كاملة.
          <br />
          <span className="text-violet-300/70">انضم الآن وكن جزءاً من مجتمعنا.</span>
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/register"
            className="px-8 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl font-semibold text-white transition-all duration-300 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5"
          >
            إنشاء حساب جديد
          </Link>
          <Link
            href="/login"
            className="px-8 py-3.5 bg-white/[0.03] hover:bg-violet-500/10 border border-violet-500/15 hover:border-violet-500/30 rounded-xl font-semibold text-white transition-all duration-300 hover:-translate-y-0.5"
          >
            تسجيل الدخول
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-4xl w-full">
          {[
            { icon: '💬', title: 'دردشة لحظية', desc: 'رسائل فورية مع مؤشرات الكتابة والحالة', color: 'violet' },
            { icon: '🏠', title: 'غرف متعددة', desc: 'غرف عامة وخاصة مع إدارة كاملة', color: 'indigo' },
            { icon: '🛡️', title: 'نظام صلاحيات', desc: 'رتب ديناميكية وصلاحيات مرنة', color: 'pink' },
          ].map((feature, i) => (
            <div key={i} className="feature-card glass rounded-2xl p-6 text-center hover:bg-violet-500/[0.04] transition-all duration-300 group cursor-default">
              <div className={`w-14 h-14 rounded-xl bg-${feature.color}-500/10 border border-${feature.color}-500/15 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                <span className="text-2xl">{feature.icon}</span>
              </div>
              <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-500 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Admin Access Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAdminModal(false)}>
          <div className="bg-[#0C1222] border border-violet-500/10 rounded-2xl p-8 w-full max-w-sm mx-4 shadow-2xl shadow-violet-500/5" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-6 text-center">دخول لوحة التحكم</h3>
            <input
              type="password"
              value={adminCode}
              onChange={(e) => { setAdminCode(e.target.value); setCodeError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleAdminAccess()}
              placeholder="أدخل رمز الدخول"
              className="w-full bg-white/[0.03] border border-violet-500/10 rounded-xl px-4 py-3 text-white text-center text-lg tracking-widest focus:outline-none focus:border-violet-500/40 mb-4 input-glow"
              autoFocus
            />
            {codeError && <p className="text-red-400 text-sm text-center mb-4">{codeError}</p>}
            <button
              onClick={handleAdminAccess}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl font-semibold text-white transition-all shadow-lg shadow-violet-500/20"
            >
              دخول
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 text-gray-600 text-sm border-t border-white/[0.03]">
        ChatZone &copy; {new Date().getFullYear()} - جميع الحقوق محفوظة
      </footer>
    </div>
  );
}
