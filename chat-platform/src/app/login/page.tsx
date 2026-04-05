'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSiteName } from '@/hooks/useSiteName';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const siteName = useSiteName();
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
    <div className="min-h-screen flex bg-[#030711] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-violet-600/[0.06] rounded-full blur-[120px] bg-orb-1" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/[0.05] rounded-full blur-[100px] bg-orb-2" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(124,58,237,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.015)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center">
        <div className="relative z-10 text-center px-12">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500/15 to-indigo-500/10 border border-violet-500/10 flex items-center justify-center mx-auto mb-8">
            <span className="text-4xl">💬</span>
          </div>
          <h2 className="text-4xl font-black text-white mb-4 tracking-tight">مرحباً بعودتك</h2>
          <p className="text-gray-500 text-lg leading-relaxed max-w-sm mx-auto">
            سجل دخولك للعودة إلى محادثاتك والتواصل مع أصدقائك
          </p>
          <div className="mt-12 flex items-center justify-center gap-6 text-gray-600 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-base">🔒</div>
              <span>آمن</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-base">⚡</div>
              <span>سريع</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-base">🌐</div>
              <span>متاح</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form section */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-[400px]">
          <div className="text-center mb-8 lg:hidden">
            <Link href="/" className="text-2xl font-black gradient-text-animated">{siteName}</Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-1">تسجيل الدخول</h1>
            <p className="text-gray-500 text-sm">أدخل بياناتك للوصول إلى حسابك</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/[0.06] border border-red-500/15 rounded-xl px-4 py-3 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

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
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl font-semibold text-white text-sm transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  جاري الدخول...
                </span>
              ) : 'تسجيل الدخول'}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.04]" /></div>
              <div className="relative flex justify-center"><span className="bg-[#030711] px-4 text-gray-600 text-xs">أو</span></div>
            </div>

            <p className="text-center text-gray-500 text-sm">
              ليس لديك حساب؟{' '}
              <Link href="/register" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">إنشاء حساب جديد</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#030711]"><span className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
