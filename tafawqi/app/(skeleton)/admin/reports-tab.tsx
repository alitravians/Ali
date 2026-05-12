"use client";
// F6 — admin tab listing pending / resolved / dismissed question reports.
// Loads from GET /api/admin/reports?status=...; resolves/dismisses with
// same-origin POST. All actions are audit-logged server-side.

import { useCallback, useEffect, useState } from "react";

type Filter = "pending" | "resolved" | "dismissed" | "all";

type Report = {
  id: string;
  status: "pending" | "resolved" | "dismissed";
  reason: string;
  reasonLabel: string;
  comment: string;
  adminNote: string;
  createdAt: string;
  resolvedAt: string | null;
  question: { id: string; prompt: string; type: string; sectionId: string } | null;
  user: { id: string; name: string; email: string } | null;
  resolvedBy: { id: string; name: string } | null;
};

export default function ReportsTab() {
  const [filter, setFilter] = useState<Filter>("pending");
  const [items, setItems] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/reports?status=${filter}`, { cache: "no-store" });
      if (r.ok) {
        const d = await r.json();
        setItems(d.reports || []);
      }
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function act(id: string, action: "resolve" | "dismiss") {
    setBusy(id);
    setMsg(null);
    try {
      const r = await fetch("/api/admin/reports", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id, note: notes[id] || "" }),
      });
      if (r.ok) {
        setMsg(action === "resolve" ? "تم حلّ البلاغ ✅" : "تم تجاهل البلاغ");
        load();
      } else {
        const e = await r.json().catch(() => ({}));
        setMsg(e.error || "تعذّر تنفيذ الإجراء");
      }
    } finally {
      setBusy(null);
      setTimeout(() => setMsg(null), 2500);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {([
          ["pending", "قيد المراجعة"],
          ["resolved", "محلولة"],
          ["dismissed", "متجاهَلة"],
          ["all", "الكلّ"],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition ${
              filter === k
                ? "bg-violet-600 text-white"
                : "bg-white dark:bg-[#161235] text-violet-700 dark:text-violet-200 border border-violet-100 dark:border-violet-900/40"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {msg && <div className="text-sm text-emerald-600 font-bold">{msg}</div>}

      {loading ? (
        <div className="text-violet-600">تحميل…</div>
      ) : items.length === 0 ? (
        <div className="card p-6 text-center text-violet-600">
          {filter === "pending" ? "لا توجد بلاغات قيد المراجعة 🎉" : "لا توجد بلاغات."}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <div key={r.id} className="card p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-violet-500 mb-1">
                    <span className="font-bold">{r.reasonLabel}</span>
                    {" · "}
                    <span className="num">{new Date(r.createdAt).toLocaleString("ar-EG")}</span>
                  </div>
                  <div className="font-bold text-violet-900 dark:text-violet-100 line-clamp-2">
                    {r.question?.prompt ?? "— سؤال محذوف —"}
                  </div>
                  {r.user && (
                    <div className="text-xs text-violet-500 mt-1">
                      الطالبة: {r.user.name} · {r.user.email}
                    </div>
                  )}
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  r.status === "pending" ? "bg-amber-100 text-amber-800" :
                  r.status === "resolved" ? "bg-emerald-100 text-emerald-800" :
                  "bg-slate-100 text-slate-700"
                }`}>
                  {r.status === "pending" ? "قيد المراجعة" : r.status === "resolved" ? "محلول" : "متجاهَل"}
                </span>
              </div>

              {r.comment && (
                <div className="text-sm text-violet-700 dark:text-violet-200 bg-violet-50 dark:bg-violet-900/20 rounded p-2 mb-2 whitespace-pre-wrap">
                  💬 {r.comment}
                </div>
              )}

              {r.status === "pending" && (
                <>
                  <textarea
                    placeholder="ملاحظة داخلية (اختياري)"
                    value={notes[r.id] || ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                    className="input text-sm mb-2"
                    rows={2}
                    maxLength={500}
                  />
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => act(r.id, "resolve")}
                      disabled={busy === r.id}
                      className="btn-primary text-sm px-3 py-1.5"
                    >
                      ✅ حلّ المشكلة
                    </button>
                    <button
                      onClick={() => act(r.id, "dismiss")}
                      disabled={busy === r.id}
                      className="btn-secondary text-sm px-3 py-1.5"
                    >
                      تجاهل
                    </button>
                    {r.question && (
                      <a
                        href={`/admin?qid=${r.question.id}`}
                        className="text-sm text-violet-600 hover:underline px-3 py-1.5"
                      >
                        تحرير السؤال →
                      </a>
                    )}
                  </div>
                </>
              )}

              {r.status !== "pending" && r.resolvedBy && (
                <div className="text-xs text-violet-500 dark:text-violet-300/70 mt-1">
                  {r.status === "resolved" ? "حُلّت بواسطة" : "تجاهلتها"} {r.resolvedBy.name}
                  {r.resolvedAt && <> · <span className="num">{new Date(r.resolvedAt).toLocaleString("ar-EG")}</span></>}
                  {r.adminNote && <div className="mt-1 italic">📝 {r.adminNote}</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
