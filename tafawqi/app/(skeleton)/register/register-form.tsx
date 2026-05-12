"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import PasswordStrengthMeter from "@/app/components/password-strength-meter";

export default function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "فشل التسجيل");
      // S2 — if email verification is required, route the new user to the
      // verification screen instead of straight into the dashboard.
      router.push(json.verificationRequired ? "/verify-email" : "/dashboard");
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
          <div className="text-4xl mb-2">🌟</div>
          <h1 className="text-2xl font-extrabold text-violet-900 dark:text-violet-100">أنشئي حسابكِ المجاني</h1>
          <p className="text-sm text-violet-600/80 dark:text-violet-300/70 mt-1">دقيقة واحدة فقط، ثم تبدئين بأول اختبار</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">الاسم الكامل</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              placeholder="مثلاً: ليلى أحمد"
            />
          </div>
          <div>
            <label className="label">البريد الإلكتروني</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input"
              placeholder="you@example.com"
              dir="ltr"
            />
          </div>
          <div>
            <label className="label">رقم الهاتف <span className="text-violet-400 text-xs">(اختياري)</span></label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="input"
              placeholder="+963…"
              dir="ltr"
            />
          </div>
          <div>
            <label className="label">كلمة المرور</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input"
              placeholder="٨ أحرف فأكثر + رقم أو رمز"
              dir="ltr"
            />
            <PasswordStrengthMeter password={form.password} />
          </div>

          {error && (
            <div className="rounded-lg bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700/40 text-rose-700 dark:text-rose-200 px-3 py-2 text-sm">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full text-base py-3" disabled={loading}>
            {loading ? "...جارٍ الإنشاء" : "أنشئي الحساب"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-violet-600 dark:text-violet-300/80">
          لديكِ حساب؟ <Link href="/login" className="font-semibold hover:underline">سجّلي الدخول</Link>
        </div>
      </div>
    </div>
  );
}
