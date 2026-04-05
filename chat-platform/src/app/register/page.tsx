'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registrationClosed, setRegistrationClosed] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    fetch('/api/site-status')
      .then(res => res.json())
      .then(data => {
        if (!data.registrationEnabled) setRegistrationClosed(true);
      })
      .catch(() => {})
      .finally(() => setCheckingStatus(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('كلمة المرور غير متطابقة');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      router.push('/login?registered=true');
    } catch (_err) {
      setError('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#030711] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-violet-600/[0.06] rounded-full blur-[120px] bg-orb-1" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/[0.05] rounded-full blur-[100px] bg-orb-2" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(124,58,237,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.015)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center">
        <div className="relative z-10 text-center px-12">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500/15 to-violet-500/10 border border-indigo-500/10 flex items-center justify-center mx-auto mb-8">
            <span className="text-4xl">🚀</span>
          </div>
          <h2 className="text-4xl font-black text-white mb-4 tracking-tight">انضم إلينا</h2>
          <p className="text-gray-500 text-lg leading-relaxed max-w-sm mx-auto">
            أنشئ حسابك وابدأ التواصل مع مجتمع ChatZone
          </p>
          <div className="mt-12 grid grid-cols-2 gap-3 max-w-xs mx-auto">
            {[
              { icon: '💬', label: 'دردشة لحظية' },
              { icon: '🏠', label: 'غرف متعددة' },
              { icon: '🛡️', label: 'بيئة آمنة' },
              { icon: '⭐', label: 'رتب مميزة' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-gray-500 text-xs">
                <span className="text-base">{f.icon}</span>
                {f.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form section */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-[400px]">
          <div className="text-center mb-8 lg:hidden">
            <Link href="/" className="text-2xl font-black gradient-text-animated">ChatZone</Link>
          </div>

          {checkingStatus ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
            </div>
          ) : registrationClosed ? (
            <div className="text-center space-y-5">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-500/15 to-red-500/5 border border-red-500/15 flex items-center justify-center mx-auto">
                <span className="text-4xl">🚫</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">التسجيل مغلق حالياً</h2>
                <p className="text-gray-500 text-sm">التسجيل معطّل من قبل الإدارة. يرجى المحاولة لاحقاً.</p>
              </div>
              <div className="pt-4 space-y-3">
                <Link href="/login" className="block w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl text-white font-semibold text-sm transition-all text-center shadow-lg shadow-violet-500/20">
                  تسجيل الدخول
                </Link>
                <Link href="/" className="block text-gray-500 hover:text-white text-sm transition-colors">
                  ← العودة للصفحة الرئيسية
                </Link>
              </div>
            </div>
          ) : (
          <>
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-1">إنشاء حساب جديد</h1>
            <p className="text-gray-500 text-sm">أدخل بياناتك لإنشاء حسابك في ChatZone</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/[0.06] border border-red-500/15 rounded-xl px-4 py-3 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">اسم المستخدم</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.05] transition-all placeholder:text-gray-600"
                placeholder="اختر اسم مستخدم"
                required
                minLength={3}
                maxLength={20}
              />
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.05] transition-all placeholder:text-gray-600"
                placeholder="example@email.com"
                required
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">كلمة المرور</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.05] transition-all placeholder:text-gray-600"
                placeholder="6 أحرف على الأقل"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">تأكيد كلمة المرور</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.05] transition-all placeholder:text-gray-600"
                placeholder="أعد كتابة كلمة المرور"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl font-semibold text-white text-sm transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 disabled:opacity-50 mt-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  جاري التسجيل...
                </span>
              ) : 'إنشاء الحساب'}
            </button>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.04]" /></div>
              <div className="relative flex justify-center"><span className="bg-[#030711] px-4 text-gray-600 text-xs">أو</span></div>
            </div>

            <p className="text-center text-gray-500 text-sm">
              لديك حساب بالفعل؟{' '}
              <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">تسجيل الدخول</Link>
            </p>
          </form>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
