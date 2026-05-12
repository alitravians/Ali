"use client";
// F6 — modal to report a problematic question from inside the quiz runner.
// Renders inline (controlled by parent) so it can re-use the runner state.

import { useState } from "react";

const REASONS: { value: string; label: string }[] = [
  { value: "wrong_answer", label: "الإجابة الصحيحة خاطئة" },
  { value: "confusing", label: "صياغة غير واضحة" },
  { value: "typo", label: "خطأ إملائيّ أو رياضيّ" },
  { value: "other", label: "ملاحظة أخرى" },
];

export default function ReportQuestionModal({
  questionId,
  onClose,
}: {
  questionId: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<string>("wrong_answer");
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<null | "ok" | string>(null);

  async function submit() {
    if (sending) return;
    setSending(true);
    setDone(null);
    try {
      const r = await fetch("/api/questions/report", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, reason, comment: comment.slice(0, 1000) }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        setDone("ok");
        setTimeout(onClose, 1200);
      } else {
        setDone(j.error || "تعذّر إرسال البلاغ. حاولي لاحقاً.");
      }
    } catch {
      setDone("تعذّر إرسال البلاغ. حاولي لاحقاً.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="إبلاغ عن خطأ في السؤال"
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md card p-5 animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-extrabold text-violet-900 dark:text-violet-100">
            إبلاغ عن خطأ في السؤال
          </div>
          <button
            onClick={onClose}
            className="text-violet-500 hover:text-violet-700 dark:text-violet-300"
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>
        <p className="text-xs text-violet-600/80 dark:text-violet-300/70 mb-4 leading-relaxed">
          ساعدينا في تحسين الأسئلة! يصل بلاغكِ مباشرةً للمشرفات وسيُراجَع قريباً.
        </p>

        <label className="block text-sm font-semibold text-violet-800 dark:text-violet-200 mb-1">
          نوع الملاحظة
        </label>
        <div className="space-y-2 mb-4">
          {REASONS.map((r) => (
            <label
              key={r.value}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition ${
                reason === r.value
                  ? "bg-violet-100 dark:bg-violet-900/40 border-violet-400"
                  : "bg-white dark:bg-[#1c1a3d]/50 border-violet-100 dark:border-violet-900/40 hover:bg-violet-50"
              }`}
            >
              <input
                type="radio"
                name="report-reason"
                value={r.value}
                checked={reason === r.value}
                onChange={() => setReason(r.value)}
                className="accent-violet-600"
              />
              <span className="text-sm text-violet-800 dark:text-violet-100">{r.label}</span>
            </label>
          ))}
        </div>

        <label className="block text-sm font-semibold text-violet-800 dark:text-violet-200 mb-1">
          ملاحظتكِ (اختياريّة)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="مثلاً: الإجابة الصحيحة هي ٤ وليس ٥"
          className="input mb-2"
        />
        <div className="text-[10px] text-left text-violet-400 num mb-3">{comment.length}/1000</div>

        {done === "ok" && (
          <div className="text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg px-3 py-2 mb-3">
            تمّ إرسال البلاغ، شكراً لكِ!
          </div>
        )}
        {typeof done === "string" && done !== "ok" && (
          <div className="text-sm text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/30 rounded-lg px-3 py-2 mb-3">
            {done}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost px-4 py-2 text-sm">إلغاء</button>
          <button onClick={submit} disabled={sending} className="btn-primary px-4 py-2 text-sm">
            {sending ? "جارٍ الإرسال…" : "إرسال البلاغ"}
          </button>
        </div>
      </div>
    </div>
  );
}
