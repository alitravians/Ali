// S2 — Email verification landing page.
//
// User arrives here via the link emailed to them after registration. The
// component immediately POSTs the token to /api/auth/verify-email and shows
// success or a clear Arabic error message. If no token is provided in the URL
// it shows an inline field so the user can paste a token they received by
// other means (e.g., copy-paste from inbox preview).

"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function VerifyEmailInner() {
  const search = useSearchParams();
  const tokenFromUrl = search.get("token") || "";
  const [token, setToken] = useState(tokenFromUrl);
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">(
    tokenFromUrl ? "loading" : "idle",
  );
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!tokenFromUrl) return;
    (async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(tokenFromUrl)}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (res.ok) {
          setState("ok");
          setMessage(data.message || "تم التأكيد بنجاح");
        } else {
          setState("error");
          setMessage(data.error || "تعذّر تأكيد البريد");
        }
      } catch {
        setState("error");
        setMessage("تعذّر الاتصال بالخادم");
      }
    })();
  }, [tokenFromUrl]);

  async function submitManualToken(e: React.FormEvent) {
    e.preventDefault();
    if (!token.trim()) return;
    setState("loading");
    try {
      const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token.trim())}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (res.ok) {
        setState("ok");
        setMessage(data.message || "تم التأكيد بنجاح");
      } else {
        setState("error");
        setMessage(data.error || "تعذّر تأكيد البريد");
      }
    } catch {
      setState("error");
      setMessage("تعذّر الاتصال بالخادم");
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="card p-8">
        <h1 className="text-2xl font-extrabold text-violet-900 dark:text-violet-100 text-center mb-2">
          📧 تأكيد البريد الإلكتروني
        </h1>
        {state === "loading" && (
          <p className="text-center text-violet-600 dark:text-violet-300 mt-4">
            جاري التحقّق…
          </p>
        )}
        {state === "ok" && (
          <div className="mt-4 text-center">
            <div className="text-5xl mb-2">✅</div>
            <p className="font-bold text-emerald-700 dark:text-emerald-300">{message}</p>
            <Link href="/dashboard" className="btn-primary mt-6 inline-block">
              المتابعة إلى لوحتي
            </Link>
          </div>
        )}
        {state === "error" && (
          <div className="mt-4 text-center">
            <div className="text-5xl mb-2">⚠️</div>
            <p className="font-bold text-rose-700 dark:text-rose-300">{message}</p>
          </div>
        )}
        {state === "idle" && (
          <form onSubmit={submitManualToken} className="mt-4 space-y-3">
            <p className="text-sm text-violet-700 dark:text-violet-200/90 text-center">
              ألصقي رمز التأكيد الذي تلقّيتِه على بريدكِ:
            </p>
            <input
              required
              className="input"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="رمز التأكيد"
              dir="ltr"
            />
            <button type="submit" className="btn-primary w-full">
              تأكيد
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto px-4 py-10">
          <div className="card p-8 text-center text-violet-600 dark:text-violet-300">
            جاري التحقّق…
          </div>
        </div>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  );
}
