"use client";
import Link from "next/link";
import { useState } from "react";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<{ token?: string; resetUrl?: string; message?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/auth/reset-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "خطأ");
      setResult(json);
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
          <div className="text-4xl mb-2">🔑</div>
          <h1 className="text-2xl font-extrabold text-violet-900 dark:text-violet-100">استعادة كلمة المرور</h1>
          <p className="text-sm text-violet-600/80 dark:text-violet-300/70 mt-1">أدخلي بريدكِ لاستلام رابط إعادة التعيين</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="you@example.com"
            dir="ltr"
          />
          {error && <div className="text-sm text-rose-600">{error}</div>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "..." : "إرسال رابط الاستعادة"}
          </button>
        </form>

        {result && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700/40 text-emerald-800 dark:text-emerald-200 text-sm">
            <div>{result.message}</div>
            {result.resetUrl && (
              <Link href={result.resetUrl} className="mt-2 inline-block font-semibold underline">
                إعادة تعيين كلمة المرور →
              </Link>
            )}
          </div>
        )}

        <div className="mt-6 text-center text-sm">
          <Link href="/login" className="text-violet-700 dark:text-violet-300 hover:underline">العودة لتسجيل الدخول</Link>
        </div>
      </div>
    </div>
  );
}
