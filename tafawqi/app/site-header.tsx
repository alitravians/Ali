"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "./theme-provider";
import NotificationBell from "./components/notification-bell";

type Me = {
  id: string;
  name: string;
  role: "student" | "admin";
  points: number;
  email: string;
  avatarUrl?: string | null;
  unreadNotificationCount?: number;
} | null;

export default function SiteHeader({ registrationOpen: initialRegistrationOpen = true }: { registrationOpen?: boolean }) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [me, setMe] = useState<Me>(null);
  const [open, setOpen] = useState(false);
  // Seed from the server-rendered value so the SSR HTML matches the first
  // client paint (no flash of the wrong CTA). /api/me refreshes it on
  // navigation if an admin toggles the flag mid-session.
  const [registrationOpen, setRegistrationOpen] = useState(initialRegistrationOpen);

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        setMe(d?.user ?? null);
        if (d && typeof d.registrationOpen === "boolean") {
          setRegistrationOpen(d.registrationOpen);
        }
      })
      .catch(() => setMe(null));
  }, [pathname]);

  const nav: { href: string; label: string }[] = [
    { href: "/", label: "الرئيسية" },
    { href: "/chapters", label: "الفصول" },
    { href: "/leaderboard", label: "المتصدرات" },
    { href: "/about", label: "عنّا" },
  ];

  async function logout() {
    // Same-origin POST with credentials so the new CSRF guard on
    // /api/auth/logout accepts our own request.
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
    });
    setMe(null);
    location.href = "/";
  }

  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-white/70 dark:bg-[#0b1020]/70 border-b border-violet-100 dark:border-violet-900/40">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-fuchsia-500 to-violet-600 grid place-items-center text-white font-extrabold shadow-lg shadow-violet-500/30 group-hover:scale-105 transition">
            ت
          </div>
          <div className="leading-tight">
            <div className="font-extrabold text-lg text-violet-900 dark:text-violet-100">تفوّقي</div>
            <div className="text-[11px] text-violet-500 dark:text-violet-300/70 -mt-0.5">رياضيات • الصف العاشر</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                pathname === n.href
                  ? "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-100"
                  : "text-violet-700 hover:bg-violet-50 dark:text-violet-200 dark:hover:bg-violet-900/30"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            aria-label="تبديل الوضع الليلي"
            className="w-9 h-9 grid place-items-center rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/40 transition"
            title={theme === "dark" ? "وضع نهاري" : "وضع ليلي"}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          {me && (
            <NotificationBell initialUnread={me.unreadNotificationCount ?? 0} />
          )}

          {me ? (
            <div className="relative">
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl px-3 py-1.5 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition"
              >
                <span className="w-8 h-8 grid place-items-center rounded-full bg-gradient-to-tr from-pink-400 to-violet-500 text-white text-sm font-bold overflow-hidden">
                  {me.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={me.avatarUrl} alt={me.name} className="w-full h-full object-cover" />
                  ) : (
                    me.name.slice(0, 1)
                  )}
                </span>
                <div className="hidden sm:block text-right leading-tight">
                  <div className="text-sm font-semibold text-violet-900 dark:text-violet-100">{me.name.split(" ")[0]}</div>
                  <div className="text-[11px] text-violet-500 dark:text-violet-300/70 num">{me.points} نقطة</div>
                </div>
              </button>
              {open && (
                <div
                  className="absolute end-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#161235] border border-violet-100 dark:border-violet-900/50 shadow-xl shadow-violet-200/30 dark:shadow-violet-900/30 overflow-hidden"
                  onMouseLeave={() => setOpen(false)}
                >
                  <Link href="/dashboard" className="block px-4 py-2.5 hover:bg-violet-50 dark:hover:bg-violet-900/30 text-sm">📊 لوحتي</Link>
                  <Link href="/profile" className="block px-4 py-2.5 hover:bg-violet-50 dark:hover:bg-violet-900/30 text-sm">👤 ملفي الشخصي</Link>
                  {me.role === "admin" && (
                    <Link href="/admin" className="block px-4 py-2.5 hover:bg-violet-50 dark:hover:bg-violet-900/30 text-sm">⚙️ لوحة الإدارة</Link>
                  )}
                  <button onClick={logout} className="w-full text-right px-4 py-2.5 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-sm text-rose-600">
                    🚪 تسجيل الخروج
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="btn-ghost text-sm hidden sm:inline-flex">دخول</Link>
              {registrationOpen ? (
                <Link href="/register" className="btn-primary text-sm">سجّلي الآن</Link>
              ) : (
                <Link href="/login" className="btn-primary text-sm">دخول</Link>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="md:hidden flex items-center justify-around border-t border-violet-100 dark:border-violet-900/40 py-1 text-xs">
        {nav.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`px-2 py-1.5 rounded-md ${pathname === n.href ? "text-violet-700 dark:text-violet-200 font-semibold" : "text-violet-500 dark:text-violet-300/80"}`}
          >
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
