'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const user = session?.user as any;
  const isLoggedIn = sessionStatus === 'authenticated';
  const isAdmin = (user?.roleLevel || 0) >= 90;
  const isMod = (user?.roleLevel || 0) >= 50;

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [onlineCount, setOnlineCount] = useState(0);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [siteName, setSiteName] = useState('ChatZone');

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const res = await fetch('/api/site-status');
        if (res.ok) {
          const data = await res.json();
          setMaintenanceMode(data.maintenanceMode || false);
          setMaintenanceMessage(data.maintenanceMessage || 'الموقع تحت الصيانة');
          setSiteName(data.siteName || 'ChatZone');
        }
      } catch { /* ignore */ }
    };
    checkMaintenance();
  }, []);

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

  // Maintenance mode page
  if (maintenanceMode && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#030711] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-amber-500/[0.07] rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.015)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>
        <div className="relative z-10 text-center px-6 max-w-lg">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-amber-500/10">
            <span className="text-5xl">🔧</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-4 tracking-tight">الموقع تحت الصيانة</h1>
          <p className="text-gray-400 text-lg mb-10 leading-relaxed">{maintenanceMessage}</p>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-violet-500/30 rounded-2xl text-gray-300 hover:text-white transition-all duration-300 text-sm font-medium"
          >
            <span>⚙️</span>
            <span>لوحة التحكم</span>
          </Link>
        </div>
      </div>
    );
  }

  const navLinks = [
    { href: '/welcome', label: 'الترحيب', show: true },
    { href: '/rules', label: 'القوانين', show: true },
    { href: '/chat-guide', label: 'الدليل', show: true },
    { href: '/team', label: 'الفريق', show: true },
    { href: '/chat', label: 'الدردشة', show: isLoggedIn, icon: '💬' },
    { href: '/support', label: 'الدعم الفني', show: isLoggedIn, icon: '🎫' },

  ];

  const memberFeatures = [
    {
      href: '/chat',
      icon: '💬',
      title: 'الدردشة',
      desc: 'انضم لغرف الدردشة وتواصل مع المجتمع',
      gradient: 'from-violet-500/15 to-violet-500/[0.02]',
      border: 'border-violet-500/15 hover:border-violet-500/30',
    },
    {
      href: '/profile',
      icon: '👤',
      title: 'ملفك الشخصي',
      desc: 'أدر حسابك وعدّل بياناتك الشخصية',
      gradient: 'from-indigo-500/15 to-indigo-500/[0.02]',
      border: 'border-indigo-500/15 hover:border-indigo-500/30',
    },
    {
      href: '/team',
      icon: '👥',
      title: 'فريق العمل',
      desc: 'تعرّف على فريق إدارة المنصة',
      gradient: 'from-emerald-500/15 to-emerald-500/[0.02]',
      border: 'border-emerald-500/15 hover:border-emerald-500/30',
    },
    {
      href: '/support',
      icon: '🎫',
      title: 'الدعم الفني',
      desc: 'افتح تذكرة دعم فني وتابع طلباتك',
      gradient: 'from-amber-500/15 to-amber-500/[0.02]',
      border: 'border-amber-500/15 hover:border-amber-500/30',
    },
    {
      href: '/notifications',
      icon: '🔔',
      title: 'الإشعارات',
      desc: 'تابع إشعاراتك ورسائلك الخاصة',
      gradient: 'from-rose-500/15 to-rose-500/[0.02]',
      border: 'border-rose-500/15 hover:border-rose-500/30',
    },

  ];

  return (
    <div className="min-h-screen bg-[#030711] relative overflow-hidden">
      {/* Premium background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-violet-600/[0.07] rounded-full blur-[120px] bg-orb-1" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/[0.05] rounded-full blur-[100px] bg-orb-2" />
        <div className="absolute top-[40%] right-[-5%] w-[400px] h-[400px] bg-pink-600/[0.04] rounded-full blur-[100px] bg-orb-3" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(124,58,237,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#030711_70%)]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-20 border-b border-white/[0.04] backdrop-blur-sm bg-[#030711]/80">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3.5">
          <Link href="/" className="text-xl font-black gradient-text-animated tracking-tight">{siteName}</Link>
          <div className="flex items-center gap-0.5">
            {navLinks.filter(l => l.show).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-500 hover:text-white transition-colors text-[13px] px-3 py-2 rounded-lg hover:bg-white/[0.04]"
              >
                {link.label}
              </Link>
            ))}

            {/* Profile icon - only for logged in users */}
            {isLoggedIn && (
              <Link
                href="/profile"
                className="flex items-center gap-2 mr-2 px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-violet-500/20 transition-all"
                title="الملف الشخصي"
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
                  {user?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <span className="text-[12px] text-gray-300 hidden sm:inline">{user?.name}</span>
              </Link>
            )}

            {/* Admin icon - only for admin users */}
            {isLoggedIn && isAdmin && (
              <button
                onClick={() => setShowAdminModal(true)}
                className="text-violet-400 hover:text-violet-300 transition-colors p-2 rounded-lg hover:bg-violet-500/[0.08] mr-1"
                title="لوحة الإدارة"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center pt-8">
            {/* Status pill */}
            <div className="mb-6 inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-[13px] text-gray-400 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              {onlineCount > 0 ? `${onlineCount} متواجد الآن` : 'منصة الدردشة الاحترافية'}
            </div>

            {/* Title */}
            <h2 className="text-6xl md:text-8xl font-black mb-4 tracking-tight leading-none">
              <span className="gradient-text-animated">Chat</span>
              <span className="text-white">Zone</span>
            </h2>

            {/* Subtitle */}
            {isLoggedIn ? (
              <div className="mb-8">
                <p className="text-xl text-white font-medium mb-2">
                  أهلاً بعودتك، <span className="gradient-text">{user?.name}</span> 👋
                </p>
                <p className="text-gray-500 text-base max-w-lg mx-auto leading-relaxed">
                  استكشف أقسام المنصة وتواصل مع مجتمعك. كل شيء جاهز لك.
                </p>
              </div>
            ) : (
              <div className="mb-10">
                <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-3">
                  منصة دردشة احترافية توفر لك بيئة آمنة ومنظمة للتواصل
                </p>
                <p className="text-gray-600 text-sm max-w-xl mx-auto leading-relaxed">
                  نظام غرف متعددة • صلاحيات متقدمة • دعم فني متواصل • مجتمع تفاعلي
                </p>
              </div>
            )}

            {/* CTA Buttons */}
            {!isLoggedIn ? (
              <div className="flex flex-col sm:flex-row gap-3 mb-16">
                <Link
                  href="/register"
                  className="group px-8 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl font-semibold text-white transition-all duration-300 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/35 hover:-translate-y-0.5 text-[15px]"
                >
                  إنشاء حساب جديد
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-3.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.15] rounded-xl font-medium text-gray-300 hover:text-white transition-all duration-300 hover:-translate-y-0.5 text-[15px]"
                >
                  تسجيل الدخول
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-3 mb-10">
                <Link
                  href="/chat"
                  className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl font-semibold text-white transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/35 hover:-translate-y-0.5 text-sm"
                >
                  💬 الدخول للدردشة
                </Link>
                <Link
                  href="/profile"
                  className="px-6 py-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-violet-500/20 rounded-xl font-medium text-gray-300 hover:text-white transition-all hover:-translate-y-0.5 text-sm"
                >
                  👤 ملفي الشخصي
                </Link>
                <Link
                  href="/support"
                  className="px-6 py-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-amber-500/20 rounded-xl font-medium text-gray-300 hover:text-white transition-all hover:-translate-y-0.5 text-sm"
                >
                  🎫 الدعم الفني
                </Link>
              </div>
            )}
          </div>

          {/* Member Features Grid - shown after login */}
          {isLoggedIn && (
            <div className="pb-16 -mt-4">
              <div className="text-center mb-8">
                <h3 className="text-lg font-bold text-white mb-2">أقسام المنصة</h3>
                <p className="text-gray-500 text-sm">اختر القسم الذي تريد زيارته</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {memberFeatures.map((f, i) => (
                  <Link
                    key={i}
                    href={f.href}
                    className={`relative bg-gradient-to-b ${f.gradient} rounded-2xl p-6 border ${f.border} transition-all duration-300 group hover:-translate-y-1`}
                  >
                    <div className="text-3xl mb-3">{f.icon}</div>
                    <h4 className="font-bold text-white mb-1.5 text-base">{f.title}</h4>
                    <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Public Features - shown before login */}
          {!isLoggedIn && (
            <div className="pb-20 -mt-4">
              <div className="text-center mb-10">
                <h3 className="text-xl font-bold text-white mb-2">لماذا تختار {siteName}؟</h3>
                <p className="text-gray-500 text-sm">منصة مصممة لتوفير أفضل تجربة تواصل</p>
              </div>

              {/* Main features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto mb-12">
                {[
                  {
                    icon: '💬', title: 'دردشة لحظية',
                    desc: 'رسائل فورية مع مؤشرات الكتابة والحالة والإشعارات الذكية',
                    gradient: 'from-violet-500/10 to-violet-500/[0.02]', border: 'border-violet-500/10 hover:border-violet-500/25',
                  },
                  {
                    icon: '🏠', title: 'غرف متعددة',
                    desc: 'غرف عامة وخاصة مع نظام إدارة متكامل وصلاحيات مرنة',
                    gradient: 'from-indigo-500/10 to-indigo-500/[0.02]', border: 'border-indigo-500/10 hover:border-indigo-500/25',
                  },
                  {
                    icon: '🛡️', title: 'أمان متقدم',
                    desc: 'حماية شاملة مع نظام رتب ديناميكي ومراقبة متواصلة',
                    gradient: 'from-emerald-500/10 to-emerald-500/[0.02]', border: 'border-emerald-500/10 hover:border-emerald-500/25',
                  },
                ].map((f, i) => (
                  <div
                    key={i}
                    className={`relative bg-gradient-to-b ${f.gradient} rounded-2xl p-7 border ${f.border} transition-all duration-500 group`}
                  >
                    <div className="text-3xl mb-4">{f.icon}</div>
                    <h4 className="font-bold text-white mb-2 text-lg">{f.title}</h4>
                    <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>

              {/* Secondary features */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
                {[
                  { icon: '🎫', title: 'دعم فني', desc: 'نظام تذاكر متكامل' },
                  { icon: '📢', title: 'إعلانات', desc: 'تابع آخر الأخبار' },
                  { icon: '⭐', title: 'مستويات', desc: 'ارتقِ بمستواك' },
                  { icon: '🔒', title: 'حماية', desc: 'نظام آمن ومحمي' },
                ].map((f, i) => (
                  <div key={i} className="text-center p-5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-all group">
                    <div className="text-2xl mb-2">{f.icon}</div>
                    <h4 className="text-white font-medium text-sm mb-1">{f.title}</h4>
                    <p className="text-gray-600 text-[11px]">{f.desc}</p>
                  </div>
                ))}
              </div>

              {/* Stats bar */}
              <div className="mt-12 flex justify-center">
                <div className="inline-flex items-center gap-8 px-8 py-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                  {[
                    { value: onlineCount > 0 ? onlineCount : '—', label: 'متواجد الآن' },
                    { value: '78+', label: 'إصلاح أمني' },
                    { value: '12+', label: 'ميزة جديدة' },
                  ].map((s, i) => (
                    <div key={i} className="text-center">
                      <p className="text-xl font-bold gradient-text">{s.value}</p>
                      <p className="text-gray-600 text-[11px] mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Admin Modal - only accessible to admins */}
      {showAdminModal && isLoggedIn && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md" onClick={() => setShowAdminModal(false)}>
          <div className="bg-[#0A0F1C] border border-white/[0.06] rounded-3xl p-8 w-full max-w-sm mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/15 to-indigo-500/10 border border-violet-500/15 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-1 text-center">دخول لوحة التحكم</h3>
            <p className="text-gray-500 text-sm text-center mb-6">أدخل رمز الدخول الخاص بك</p>
            <input
              type="password"
              value={adminCode}
              onChange={(e) => { setAdminCode(e.target.value); setCodeError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleAdminAccess()}
              placeholder="• • • •"
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white text-center text-lg tracking-[0.4em] focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.05] mb-4 transition-all"
              autoFocus
            />
            {codeError && <p className="text-red-400 text-sm text-center mb-4">{codeError}</p>}
            <button
              onClick={handleAdminAccess}
              className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl font-semibold text-white transition-all shadow-lg shadow-violet-500/20"
            >
              دخول
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 text-gray-600 text-xs border-t border-white/[0.03]">
        {siteName} &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
