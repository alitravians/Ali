"use client";
// F20 — admin tab listing contact messages with filters and per-row actions.

import { useCallback, useEffect, useState } from "react";

type Filter = "pending" | "resolved" | "all";

type Msg = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  ip: string | null;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: { name: string } | null;
};

export default function ContactsTab() {
  const [filter, setFilter] = useState<Filter>("pending");
  const [items, setItems] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/contact?status=${filter}`, { cache: "no-store" });
      if (r.ok) {
        const d = await r.json();
        setItems(d.messages || []);
      }
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id: string, action: "resolve" | "reopen" | "delete") {
    if (action === "delete" && !confirm("حذف الرسالة نهائيّاً؟")) return;
    setBusy(id);
    setFeedback(null);
    try {
      const r = await fetch("/api/admin/contact", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id }),
      });
      if (r.ok) {
        setFeedback(
          action === "resolve"
            ? "تم وضع علامة \"محلولة\""
            : action === "reopen"
            ? "تم إعادة فتح الرسالة"
            : "تم حذف الرسالة",
        );
        load();
      } else {
        const d = await r.json().catch(() => ({}));
        setFeedback(d.error || "تعذّر التنفيذ");
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-bold text-violet-900 dark:text-violet-100">📬 رسائل التواصل</span>
        {(["pending", "resolved", "all"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={[
              "px-3 py-1.5 rounded-full text-sm border",
              filter === f
                ? "bg-violet-600 text-white border-violet-600"
                : "bg-white dark:bg-violet-950/40 text-violet-700 dark:text-violet-200 border-violet-200 dark:border-violet-800",
            ].join(" ")}
          >
            {f === "pending" ? "قيد المراجعة" : f === "resolved" ? "محلولة" : "الكلّ"}
          </button>
        ))}
        <button onClick={load} className="btn-secondary px-3 py-1.5 text-sm">
          تحديث
        </button>
      </div>

      {feedback && (
        <div className="rounded-lg bg-violet-50 dark:bg-violet-900/30 text-violet-800 dark:text-violet-100 px-3 py-2 text-sm">
          {feedback}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-violet-600 dark:text-violet-300">...تحميل</div>
      ) : items.length === 0 ? (
        <div className="card p-6 text-center text-violet-700/80 dark:text-violet-200/80 text-sm">
          لا توجد رسائل في هذا التصنيف.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((m) => (
            <div key={m.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <div className="font-bold text-violet-900 dark:text-violet-100">
                    {m.subject}
                  </div>
                  <div className="text-sm text-violet-700/80 dark:text-violet-200/80">
                    {m.name} ·{" "}
                    <a href={`mailto:${m.email}`} className="underline" dir="ltr">
                      {m.email}
                    </a>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 text-xs text-violet-500/80 dark:text-violet-300/70">
                  <span className="num">{new Date(m.createdAt).toLocaleString("ar")}</span>
                  {m.resolvedAt ? (
                    <span className="chip bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
                      محلولة
                      {m.resolvedBy ? ` · ${m.resolvedBy.name}` : ""}
                    </span>
                  ) : (
                    <span className="chip bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
                      قيد المراجعة
                    </span>
                  )}
                </div>
              </div>
              <div className="whitespace-pre-wrap text-sm text-violet-800 dark:text-violet-100 leading-relaxed bg-violet-50/40 dark:bg-violet-950/40 rounded p-3">
                {m.message}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {m.resolvedAt ? (
                  <button
                    onClick={() => act(m.id, "reopen")}
                    disabled={busy === m.id}
                    className="btn-secondary px-3 py-1.5 text-sm"
                  >
                    إعادة فتح
                  </button>
                ) : (
                  <button
                    onClick={() => act(m.id, "resolve")}
                    disabled={busy === m.id}
                    className="btn-primary px-3 py-1.5 text-sm"
                  >
                    وضع علامة محلولة
                  </button>
                )}
                <a
                  href={`mailto:${m.email}?subject=${encodeURIComponent("ردّاً على: " + m.subject)}`}
                  className="btn-secondary px-3 py-1.5 text-sm"
                >
                  ردّ بالبريد
                </a>
                <button
                  onClick={() => act(m.id, "delete")}
                  disabled={busy === m.id}
                  className="px-3 py-1.5 rounded-xl text-sm bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
