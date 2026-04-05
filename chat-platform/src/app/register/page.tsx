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
    <div className="min-h-screen flex items-center justify-center bg-[#060B18] px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-violet-600/8 rounded-full blur-[100px] bg-orb-1" />
        <div className="absolute bottom-1/3 left-1/4 w-72 h-72 bg-indigo-600/8 rounded-full blur-[100px] bg-orb-2" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(124,58,237,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold gradient-text-animated">ChatZone</Link>
          <p className="text-gray-400 mt-2">إنشاء حساب جديد</p>
        </div>

        {checkingStatus ? (
          <div className="glass rounded-2xl p-12 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          </div>
        ) : registrationClosed ? (
          <div className="glass rounded-2xl p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
              <span className="text-3xl">🚫</span>
            </div>
            <h2 className="text-xl font-bold text-red-400">التسجيل مغلق حالياً</h2>
            <p className="text-gray-400 text-sm">التسجيل معطّل من قبل الإدارة. يرجى المحاولة لاحقاً.</p>
            <div className="pt-4 space-y-3">
              <Link href="/login" className="block w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl text-white font-medium transition-all text-center shadow-lg shadow-violet-500/20">
                تسجيل الدخول
              </Link>
              <Link href="/" className="block text-gray-400 hover:text-violet-300 text-sm transition-colors">
                ← العودة للصفحة الرئيسية
              </Link>
            </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-gray-400 text-sm mb-2">اسم المستخدم</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white/[0.03] border border-violet-500/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/40 transition-all input-glow"
              placeholder="اختر اسم مستخدم"
              required
              minLength={3}
              maxLength={20}
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/[0.03] border border-violet-500/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/40 transition-all input-glow"
              placeholder="example@email.com"
              required
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/[0.03] border border-violet-500/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/40 transition-all input-glow"
              placeholder="6 أحرف على الأقل"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">تأكيد كلمة المرور</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-white/[0.03] border border-violet-500/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/40 transition-all input-glow"
              placeholder="أعد كتابة كلمة المرور"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl font-semibold text-white transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                جاري التسجيل...
              </span>
            ) : 'إنشاء الحساب'}
          </button>

          <p className="text-center text-gray-400 text-sm">
            لديك حساب بالفعل؟{' '}
            <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors">تسجيل الدخول</Link>
          </p>
        </form>
        )}
      </div>
    </div>
  );
}
