'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/chat';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error.startsWith('BANNED:')) {
          const banInfo = JSON.parse(result.error.replace('BANNED:', ''));
          router.push(`/banned?reason=${encodeURIComponent(banInfo.reason)}&expires=${banInfo.expiresAt || ''}`);
          return;
        }
        setError(result.error);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
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
          <p className="text-gray-400 mt-2">تسجيل الدخول إلى حسابك</p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

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
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl font-semibold text-white transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                جاري الدخول...
              </span>
            ) : 'تسجيل الدخول'}
          </button>

          <p className="text-center text-gray-400 text-sm">
            ليس لديك حساب؟{' '}
            <Link href="/register" className="text-violet-400 hover:text-violet-300 transition-colors">إنشاء حساب جديد</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#060B18]"><span className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
