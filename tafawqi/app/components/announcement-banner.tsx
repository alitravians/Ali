"use client";

// F21 — Site-wide announcement banner. Renders the admin-set message at the
// top of every page until the student dismisses it. Dismissal is keyed by a
// stable hash of the message so a new announcement bypasses old dismissals.
import { useEffect, useState } from "react";

type Props = {
  enabled: boolean;
  text: string;
  level: "info" | "warning" | "success";
};

function tinyHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return String(h);
}

const levelStyles: Record<Props["level"], string> = {
  info: "bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-100 border-sky-200 dark:border-sky-800",
  warning:
    "bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100 border-amber-200 dark:border-amber-800",
  success:
    "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 border-emerald-200 dark:border-emerald-800",
};

const levelIcons: Record<Props["level"], string> = {
  info: "📣",
  warning: "⚠️",
  success: "🎉",
};

export default function AnnouncementBanner({ enabled, text, level }: Props) {
  const [dismissed, setDismissed] = useState(true);
  const trimmed = text.trim();
  const key = `tafawqi:announcement:${tinyHash(trimmed)}`;

  useEffect(() => {
    if (!enabled || !trimmed) return;
    try {
      const v = window.localStorage.getItem(key);
      setDismissed(v === "1");
    } catch {
      setDismissed(false);
    }
  }, [enabled, trimmed, key]);

  if (!enabled || !trimmed || dismissed) return null;

  function dismiss() {
    try {
      window.localStorage.setItem(key, "1");
    } catch {
      // Ignore — banner just won't persist dismissal across reloads.
    }
    setDismissed(true);
  }

  return (
    <div className={`border-b ${levelStyles[level]}`}>
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3">
        <span className="text-lg" aria-hidden>
          {levelIcons[level]}
        </span>
        <div className="flex-1 text-sm font-semibold whitespace-pre-wrap">{trimmed}</div>
        <button
          onClick={dismiss}
          className="text-xs opacity-70 hover:opacity-100 px-2 py-1 rounded"
          aria-label="إخفاء الإعلان"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
