"use client";

import { useState } from "react";

type Link = {
  id: string;
  token: string;
  label: string;
  createdAt: Date | string;
  lastViewedAt: Date | string | null;
};

export default function ParentLinksSection({ initialLinks }: { initialLinks: Link[] }) {
  const [links, setLinks] = useState<Link[]>(initialLinks);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [justCreated, setJustCreated] = useState<string | null>(null);

  async function createLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/parent-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErr(json.error || "فشلت العمليّة. حاولي لاحقاً.");
      } else {
        setLinks((l) => [{ ...json.link, lastViewedAt: null }, ...l]);
        setLabel("");
        setJustCreated(json.link.id);
        setTimeout(() => setJustCreated(null), 4000);
      }
    } catch {
      setErr("تعذّر الاتّصال بالخادم.");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    if (!confirm("هل أنتِ متأكّدة من إلغاء هذا الرابط؟ لن يعمل بعد الآن.")) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/parent-links?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j.error || "فشل الإلغاء.");
      } else {
        setLinks((l) => l.filter((x) => x.id !== id));
      }
    } finally {
      setBusy(false);
    }
  }

  function shareUrl(token: string) {
    if (typeof window === "undefined") return `/parent/${token}`;
    return `${window.location.origin}/parent/${token}`;
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setJustCreated("__copied__");
      setTimeout(() => setJustCreated(null), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <div className="card p-6 mb-6">
      <div className="font-bold text-violet-900 dark:text-violet-100 mb-1">
        👪 روابط متابعة وليّ الأمر
      </div>
      <p className="text-sm text-violet-600/90 dark:text-violet-300/80 mb-4 leading-relaxed">
        أنشئي رابطاً سرّيّاً لمشاركته مع والديكِ. يستطيعون عبره معاينة نقاطكِ ومستواكِ وآخر ١٠
        اختبارات فقط — بلا تسجيل دخول وبلا تعديل أيّ بيانات. يمكنكِ إلغاؤه في أيّ وقت.
      </p>

      <form onSubmit={createLink} className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          maxLength={40}
          placeholder="اسم الرابط (اختياري) — مثال: والدتي"
          className="input flex-1 min-w-[200px]"
          disabled={busy}
        />
        <button type="submit" className="btn-primary px-4" disabled={busy || links.length >= 5}>
          {busy ? "..." : "إنشاء رابط جديد"}
        </button>
      </form>

      {err && (
        <div className="mb-3 text-sm bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-200 rounded-lg p-3">
          {err}
        </div>
      )}
      {justCreated === "__copied__" && (
        <div className="mb-3 text-sm bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-200 rounded-lg p-3">
          تم نسخ الرابط.
        </div>
      )}

      {links.length === 0 ? (
        <div className="text-sm text-violet-500 dark:text-violet-300/70 text-center py-4">
          لا توجد روابط نشطة. أنشئي رابطاً بالأعلى.
        </div>
      ) : (
        <ul className="space-y-2">
          {links.map((l) => {
            const url = shareUrl(l.token);
            const isNew = justCreated === l.id;
            return (
              <li
                key={l.id}
                className={[
                  "rounded-xl border p-3 transition",
                  isNew
                    ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20"
                    : "border-violet-200 dark:border-violet-800 bg-white/60 dark:bg-violet-950/30",
                ].join(" ")}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-violet-900 dark:text-violet-100">
                      {l.label || "بدون اسم"}
                    </div>
                    <div className="text-xs text-violet-600/85 dark:text-violet-300/75 mt-0.5">
                      أُنشئ في {new Date(l.createdAt).toLocaleDateString("ar-SY")}
                      {l.lastViewedAt && (
                        <> — آخر مشاهدة {new Date(l.lastViewedAt).toLocaleDateString("ar-SY")}</>
                      )}
                    </div>
                    <div className="mt-2 font-mono text-xs text-violet-700/90 dark:text-violet-200/85 break-all bg-violet-50/60 dark:bg-violet-900/20 rounded px-2 py-1">
                      {url}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => copy(url)}
                      className="btn-secondary px-3 py-1.5 text-sm"
                    >
                      نسخ الرابط
                    </button>
                    <button
                      type="button"
                      onClick={() => revoke(l.id)}
                      disabled={busy}
                      className="px-3 py-1.5 text-sm rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-200"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-xs text-violet-500 dark:text-violet-300/70 mt-4">
        الحدّ الأقصى ٥ روابط نشطة لكلّ حساب. لا يمكن لوليّ الأمر تعديل أيّ شيء عبر الرابط.
      </p>
    </div>
  );
}
