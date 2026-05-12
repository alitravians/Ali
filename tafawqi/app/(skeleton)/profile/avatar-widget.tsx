"use client";
import { useRef, useState } from "react";

export default function AvatarWidget({
  initialAvatarUrl,
  userName,
}: {
  initialAvatarUrl: string | null;
  userName: string;
}) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        credentials: "same-origin",
        body: fd,
      });
      const data = await res.json();
      if (res.ok) {
        setAvatarUrl(data.avatarUrl ?? null);
        setMessage({ ok: true, text: "تم تحديث الصورة بنجاح" });
      } else {
        setMessage({ ok: false, text: data.error || "فشل في رفع الصورة" });
      }
    } catch {
      setMessage({ ok: false, text: "حدث خطأ أثناء رفع الصورة" });
    }
    setLoading(false);
    if (inputRef.current) inputRef.current.value = "";
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleDelete() {
    if (!confirm("هل تريدين حذف الصورة الرمزية؟")) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/profile/avatar", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setAvatarUrl(null);
        setMessage({ ok: true, text: "تم حذف الصورة" });
      } else {
        const data = await res.json().catch(() => ({}));
        setMessage({ ok: false, text: data.error || "فشل في الحذف" });
      }
    } catch {
      setMessage({ ok: false, text: "حدث خطأ أثناء الحذف" });
    }
    setLoading(false);
    setTimeout(() => setMessage(null), 3000);
  }

  const firstChar = userName.trim().charAt(0) || "👤";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative group">
        <div className="w-[150px] h-[150px] rounded-2xl overflow-hidden border-4 border-violet-200 dark:border-violet-900/60 shadow-md bg-gradient-to-tr from-pink-400 to-violet-500 grid place-items-center text-white text-6xl font-extrabold">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
          ) : (
            <span>{firstChar}</span>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleUpload}
          className="hidden"
          aria-label="رفع صورة رمزية"
        />

        <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="bg-white text-violet-700 text-xs font-bold px-3 py-1.5 rounded-lg shadow disabled:opacity-50"
          >
            {loading ? "..." : avatarUrl ? "تغيير" : "رفع"}
          </button>
          {avatarUrl && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow disabled:opacity-50"
            >
              حذف
            </button>
          )}
        </div>
      </div>

      <div className="text-[11px] text-violet-500 dark:text-violet-300/70 text-center max-w-[160px] leading-tight">
        مرّري المؤشر فوق الصورة للرفع.<br />JPG، PNG، WEBP — حتى ٥MB.
      </div>

      {message && (
        <div
          className={`text-xs font-medium px-3 py-1.5 rounded-lg ${
            message.ok
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
              : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
          }`}
          role="status"
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
