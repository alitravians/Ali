"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function Form() {
  const router = useRouter();
  const search = useSearchParams();
  const token = search.get("token") || "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "خطأ");
      setDone(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto px-4 py-10">
        <div className="card p-8 text-center">
          <div className="text-5xl mb-2">✅</div>
          <h1 className="text-2xl font-extrabold text-violet-900 dark:text-violet-100">تم تغيير كلمة المرور</h1>
          <p className="text-sm text-violet-600 dark:text-violet-300 mt-1">سيتم تحويلكِ لتسجيل الدخول...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="card p-8">
        <h1 className="text-2xl font-extrabold text-violet-900 dark:text-violet-100 mb-4">كلمة مرور جديدة</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="كلمة مرور جديدة (٦ أحرف فأكثر)"
            dir="ltr"
          />
          {error && <div className="text-sm text-rose-600">{error}</div>}
          <button type="submit" className="btn-primary w-full" disabled={loading || !token}>
            {loading ? "..." : "حفظ"}
          </button>
        </form>
        {!token && (
          <div className="mt-3 text-sm text-rose-600">رمز غير صالح. <Link href="/forgot" className="underline">حاولي مجدداً</Link></div>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-center">تحميل…</div>}>
      <Form />
    </Suspense>
  );
}
