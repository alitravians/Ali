"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const redirect = search.get("redirect") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "فشل تسجيل الدخول");
      router.push(redirect);
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="card p-8 animate-fade-in">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">👋</div>
          <h1 className="text-2xl font-extrabold text-violet-900 dark:text-violet-100">أهلاً بعودتكِ</h1>
          <p className="text-sm text-violet-600/80 dark:text-violet-300/70 mt-1">سجّلي دخولكِ لمتابعة رحلتكِ مع الرياضيات</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">البريد الإلكتروني</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@example.com"
              dir="ltr"
            />
          </div>
          <div>
            <label className="label">كلمة المرور</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
              dir="ltr"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700/40 text-rose-700 dark:text-rose-200 px-3 py-2 text-sm">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full text-base py-3" disabled={loading}>
            {loading ? "...جارٍ الدخول" : "دخول"}
          </button>
        </form>

        <div className="flex justify-between mt-4 text-sm">
          <Link href="/forgot" className="text-violet-700 dark:text-violet-300 hover:underline">نسيتِ كلمة المرور؟</Link>
          <Link href="/register" className="text-violet-700 dark:text-violet-300 hover:underline">إنشاء حساب جديد</Link>
        </div>

        <div className="mt-6 pt-4 border-t border-violet-100 dark:border-violet-900/40 text-xs text-violet-500 dark:text-violet-300/70 text-center">
          حسابات تجريبية: <span dir="ltr" className="num">demo@tafawqi.app / demo1234</span>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-center">تحميل…</div>}>
      <LoginForm />
    </Suspense>
  );
}
