'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [codeError, setCodeError] = useState('');

  const handleAdminAccess = () => {
    if (adminCode === '3131') {
      router.push('/admin');
    } else if (adminCode === '2121') {
      router.push('/moderator');
    } else {
      setCodeError('رمز الدخول غير صحيح');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950/30 to-gray-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl" />
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
            ⚙
          </button>
        </div>
      </nav>

      {/* Hero section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
        <div className="mb-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm">
          <span className="w-2 h-2 bg-green-400 rounded-full online-indicator" />
          منصة الدردشة الاحترافية
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
            className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl font-semibold text-white transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
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
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-6 text-center">دخول لوحة التحكم</h3>
            <input
              type="password"
              value={adminCode}
              onChange={(e) => { setAdminCode(e.target.value); setCodeError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleAdminAccess()}
              placeholder="أدخل رمز الدخول"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-center text-lg tracking-widest focus:outline-none focus:border-indigo-500 mb-4"
              autoFocus
            />
            {codeError && <p className="text-red-400 text-sm text-center mb-4">{codeError}</p>}
            <button
              onClick={handleAdminAccess}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-white transition-colors"
            >
              دخول
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 text-gray-600 text-sm">
        ChatZone © {new Date().getFullYear()} - جميع الحقوق محفوظة
      </footer>
    </div>
  );
}
