"use client";
// F7 — share result widget for /results/[id]. Uses the Web Share API when
// available (mobile), with a graceful fallback to "copy link" + WhatsApp
// + X (Twitter) share intents. All share targets use the canonical results
// page URL so previews are rendered server-side from the page metadata.

import { useEffect, useState } from "react";

function buildShareText({
  score,
  total,
  quizTitle,
  url,
}: {
  score: number;
  total: number;
  quizTitle: string;
  url: string;
}) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  return `حصلتُ على ${score} من ${total} (${pct}%) في اختبار «${quizTitle}» على تفوّقي.\n${url}`;
}

export default function ShareResult({
  resultId,
  score,
  total,
  quizTitle,
}: {
  resultId: string;
  score: number;
  total: number;
  quizTitle: string;
}) {
  const [url, setUrl] = useState("");
  const [canNative, setCanNative] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const u = `${window.location.origin}/results/${resultId}`;
    setUrl(u);
    setCanNative(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, [resultId]);

  const text = buildShareText({ score, total, quizTitle, url });

  async function nativeShare() {
    try {
      await navigator.share({
        title: "نتيجتي في تفوّقي",
        text,
        url,
      });
    } catch {
      // user cancelled — ignore
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(text);
      setToast("تم نسخ النصّ والرابط ✅");
    } catch {
      setToast("تعذّر النسخ");
    }
    setTimeout(() => setToast(null), 2500);
  }

  const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  const twUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;

  return (
    <div className="card p-4 mt-4">
      <div className="font-bold text-violet-900 dark:text-violet-100 mb-3 flex items-center gap-2">
        <span aria-hidden="true">📣</span> شاركي نتيجتكِ
      </div>
      <div className="flex flex-wrap gap-2">
        {canNative && (
          <button onClick={nativeShare} className="btn-primary text-sm px-3 py-2">
            مشاركة…
          </button>
        )}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary text-sm px-3 py-2"
        >
          واتساب
        </a>
        <a
          href={tgUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary text-sm px-3 py-2"
        >
          تيليجرام
        </a>
        <a
          href={twUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary text-sm px-3 py-2"
        >
          إكس
        </a>
        <button onClick={copyLink} className="btn-secondary text-sm px-3 py-2">
          نسخ الرابط
        </button>
      </div>
      {toast && (
        <div className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">{toast}</div>
      )}
    </div>
  );
}
