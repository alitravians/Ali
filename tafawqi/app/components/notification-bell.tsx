"use client";
// F1 — bell button + dropdown panel.
// Polls /api/notifications every 60s while mounted, plus on-demand when
// the user opens the panel. POST same-origin to mark items read.

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type NotifKind = "info" | "success" | "warning" | "suggestion";
type Notif = {
  id: string;
  title: string;
  body: string;
  kind: NotifKind;
  isRead: boolean;
  link: string | null;
  createdAt: string;
};

const KIND_ICON: Record<NotifKind, string> = {
  info: "ℹ️",
  success: "🎉",
  warning: "⚠️",
  suggestion: "💡",
};

function timeAgoAr(iso: string): string {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const sec = Math.max(0, Math.round((now - t) / 1000));
  if (sec < 60) return "قبل قليل";
  if (sec < 3600) return `قبل ${Math.floor(sec / 60)} د`;
  if (sec < 86400) return `قبل ${Math.floor(sec / 3600)} س`;
  if (sec < 7 * 86400) return `قبل ${Math.floor(sec / 86400)} يوم`;
  return new Date(iso).toLocaleDateString("ar-EG");
}

export default function NotificationBell({ initialUnread = 0 }: { initialUnread?: number }) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(initialUnread);
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/notifications", { cache: "no-store", credentials: "same-origin" });
      if (!r.ok) return;
      const j = await r.json();
      const list: Notif[] = j.notifications ?? [];
      setItems(list);
      setUnread(list.filter((n) => !n.isRead).length);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial poll + every 60s while mounted.
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 60_000);
    return () => clearInterval(t);
  }, [refresh]);

  // Close when clicking outside.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function markOne(id: string) {
    setItems((arr) => arr.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
    try {
      await fetch("/api/notifications", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {}
  }

  async function markAll() {
    setItems((arr) => arr.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
    try {
      await fetch("/api/notifications", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
    } catch {}
  }

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) refresh();
        }}
        aria-label="الإشعارات"
        title="الإشعارات"
        className="relative w-9 h-9 grid place-items-center rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/40 transition"
      >
        <span aria-hidden="true">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-1 -left-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-extrabold grid place-items-center num">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-[320px] max-w-[92vw] rounded-2xl border border-violet-100 dark:border-violet-900/40 bg-white dark:bg-[#15102a] shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-violet-100 dark:border-violet-900/40">
            <div className="font-extrabold text-violet-900 dark:text-violet-100">الإشعارات</div>
            <button
              onClick={markAll}
              disabled={unread === 0}
              className="text-xs text-violet-600 dark:text-violet-300 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
            >
              تحديد الكلّ مقروءاً
            </button>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {loading && items.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-violet-500">جارٍ التحميل…</div>
            )}
            {!loading && items.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-violet-500 dark:text-violet-300/70">
                لا توجد إشعارات حاليّاً.
              </div>
            )}
            {items.map((n) => {
              const body = (
                <div className="flex gap-3">
                  <div className="text-xl shrink-0" aria-hidden="true">{KIND_ICON[n.kind] ?? "🔔"}</div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-bold text-sm leading-snug ${n.isRead ? "text-violet-700 dark:text-violet-300/80" : "text-violet-900 dark:text-violet-100"}`}>
                      {n.title}
                    </div>
                    {n.body && (
                      <div className="text-xs text-violet-600/90 dark:text-violet-300/70 mt-1 leading-snug">
                        {n.body}
                      </div>
                    )}
                    <div className="text-[10px] text-violet-400 dark:text-violet-300/50 mt-1.5">
                      {timeAgoAr(n.createdAt)}
                    </div>
                  </div>
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-2" aria-label="غير مقروء" />
                  )}
                </div>
              );
              const baseCls = `block w-full text-right px-4 py-3 border-b border-violet-50 dark:border-violet-900/30 transition ${
                n.isRead ? "bg-white dark:bg-[#15102a]" : "bg-violet-50/60 dark:bg-violet-900/20"
              } hover:bg-violet-100/70 dark:hover:bg-violet-900/30`;
              return n.link ? (
                <Link
                  key={n.id}
                  href={n.link}
                  onClick={() => {
                    setOpen(false);
                    if (!n.isRead) markOne(n.id);
                  }}
                  className={baseCls}
                >
                  {body}
                </Link>
              ) : (
                <button
                  key={n.id}
                  onClick={() => { if (!n.isRead) markOne(n.id); }}
                  className={baseCls}
                >
                  {body}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
