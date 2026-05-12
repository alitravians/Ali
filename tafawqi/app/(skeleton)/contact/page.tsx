"use client";

import { useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const json = await res.json();
      if (!res.ok) {
        setResult({ kind: "err", text: json.error || "تعذّر الإرسال." });
      } else {
        setResult({ kind: "ok", text: json.message || "تمّ الإرسال." });
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
      }
    } catch {
      setResult({ kind: "err", text: "تعذّر الاتصال بالخادم." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="card p-8 animate-fade-in">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">📬</div>
          <h1 className="text-2xl font-extrabold text-violet-900 dark:text-violet-100">تواصلي معنا</h1>
          <p className="text-sm text-violet-600/80 dark:text-violet-300/70 mt-1">
            عندكِ اقتراح أو ملاحظة أو حاجة لمساعدة؟ راسلينا وسنعود إليكِ قريباً.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">الاسم</label>
            <input
              type="text"
              required
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="اسمكِ الكامل"
            />
          </div>
          <div>
            <label className="label">البريد الإلكتروني</label>
            <input
              type="email"
              required
              maxLength={200}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@example.com"
              dir="ltr"
            />
          </div>
          <div>
            <label className="label">الموضوع</label>
            <input
              type="text"
              required
              maxLength={160}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="input"
              placeholder="مثلاً: اقتراح ميزة، استفسار، مشكلة تقنية…"
            />
          </div>
          <div>
            <label className="label">الرسالة</label>
            <textarea
              required
              minLength={5}
              maxLength={4000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="input min-h-[140px]"
              placeholder="اكتبي رسالتكِ هنا…"
            />
            <div className="text-xs text-violet-500/70 dark:text-violet-300/60 mt-1 text-end">
              {message.length} / 4000
            </div>
          </div>

          {result && (
            <div
              className={[
                "rounded-lg px-3 py-2 text-sm",
                result.kind === "ok"
                  ? "bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700/40 text-emerald-700 dark:text-emerald-200"
                  : "bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700/40 text-rose-700 dark:text-rose-200",
              ].join(" ")}
            >
              {result.text}
            </div>
          )}

          <button type="submit" className="btn-primary w-full text-base py-3" disabled={busy}>
            {busy ? "...جارٍ الإرسال" : "إرسال"}
          </button>
        </form>
      </div>
    </div>
  );
}
