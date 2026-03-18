"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface NotificationItem {
  id: string;
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  type: string;
  category: string;
  icon: string;
  link: string;
  priority: string;
  isRead: boolean;
  createdAt: string;
}

const iconMap: Record<string, string> = {
  bell: "🔔", book: "📚", award: "🎓", ticket: "🎫", user: "👤",
  megaphone: "📢", star: "⭐", check: "✅", alert: "⚠️",
  trophy: "🏆", key: "🔑", shield: "🛡️", rocket: "🚀",
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "الآن";
  if (diffMins < 60) return `منذ ${diffMins} د`;
  if (diffHours < 24) return `منذ ${diffHours} س`;
  if (diffDays < 7) return `منذ ${diffDays} ي`;
  return date.toLocaleDateString("ar");
}

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/notifications?countOnly=true")
        .then((res) => res.json())
        .then((data) => {
          if (data && typeof data.unreadCount === "number") {
            setUnreadCount(data.unreadCount);
          }
        })
        .catch(() => {});
    }
  }, [session]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    setLoadingNotifs(true);
    try {
      const res = await fetch("/api/notifications?limit=10");
      const data = await res.json();
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch {
      // Error handled silently
    }
    setLoadingNotifs(false);
  };

  const toggleNotifications = () => {
    if (!showNotifications) {
      fetchNotifications();
    }
    setShowNotifications(!showNotifications);
  };

  const markAsRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markAllRead" }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleNotifClick = (notif: NotificationItem) => {
    if (!notif.isRead) markAsRead(notif.id);
    setShowNotifications(false);
    if (notif.link) router.push(notif.link);
  };


  return (
    <>
      <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <span className="text-xl font-bold gradient-text hidden sm:block">LinguaMaster</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="nav-link">الرئيسية</Link>
              <Link href="/languages" className="nav-link">اللغات</Link>
              <Link href="/verify-certificate" className="nav-link">التحقق من شهادة</Link>
              <Link href="/contact" className="nav-link">تواصل معنا</Link>
              
              {/* Admin Dashboard Button - always visible */}
              <Link
                href="/admin/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-colors text-sm font-medium"
                title="لوحة تحكم الإدارة"
              >
                <span>⚙</span>
                <span>لوحة التحكم</span>
              </Link>

              {session?.user ? (
                <>
                  <Link href="/profile/tickets" className="nav-link">🎫 الدعم الفني</Link>
                  <Link href="/profile" className="nav-link">ملفي الشخصي</Link>
                  {/* Notification Bell */}
                  <div className="relative" ref={notifRef}>
                    <button
                      onClick={toggleNotifications}
                      className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      title="الإشعارات"
                    >
                      <span className="text-xl">🔔</span>
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </button>
                    {showNotifications && (
                      <div className="absolute left-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                        <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                          <h3 className="font-bold text-gray-900">الإشعارات</h3>
                          <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                              <button onClick={markAllRead} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                                تحديد الكل كمقروء
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {loadingNotifs ? (
                            <div className="flex items-center justify-center py-8">
                              <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                            </div>
                          ) : notifications.length === 0 ? (
                            <div className="text-center py-8">
                              <div className="text-4xl mb-2">🔔</div>
                              <p className="text-gray-500 text-sm">لا توجد إشعارات</p>
                            </div>
                          ) : (
                            notifications.map((notif) => (
                              <div
                                key={notif.id}
                                onClick={() => handleNotifClick(notif)}
                                className={`p-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors flex items-start gap-3 ${
                                  !notif.isRead ? "bg-primary-50/40" : ""
                                }`}
                              >
                                <span className="text-lg shrink-0 mt-0.5">{iconMap[notif.icon] || "🔔"}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className={`text-sm line-clamp-1 ${!notif.isRead ? "font-bold text-gray-900" : "text-gray-700"}`}>
                                      {notif.titleAr || notif.title}
                                    </p>
                                    {!notif.isRead && <span className="w-2 h-2 bg-primary-500 rounded-full shrink-0"></span>}
                                  </div>
                                  <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{notif.messageAr || notif.message}</p>
                                  <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        <Link
                          href="/profile/notifications"
                          onClick={() => setShowNotifications(false)}
                          className="block text-center py-3 text-sm text-primary-600 hover:bg-gray-50 font-medium border-t"
                        >
                          عرض جميع الإشعارات
                        </Link>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="btn-danger text-sm py-2 px-4"
                  >
                    تسجيل خروج
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/login" className="btn-secondary text-sm py-2 px-4">
                    تسجيل دخول
                  </Link>
                  <Link href="/register" className="btn-primary text-sm py-2 px-4">
                    إنشاء حساب
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Nav */}
          {isMenuOpen && (
            <div className="md:hidden pb-4 border-t border-gray-100 mt-2 pt-4 space-y-3">
              <Link href="/" className="block nav-link py-2" onClick={() => setIsMenuOpen(false)}>الرئيسية</Link>
              <Link href="/languages" className="block nav-link py-2" onClick={() => setIsMenuOpen(false)}>اللغات</Link>
              <Link href="/verify-certificate" className="block nav-link py-2" onClick={() => setIsMenuOpen(false)}>التحقق من شهادة</Link>
              <Link href="/contact" className="block nav-link py-2" onClick={() => setIsMenuOpen(false)}>تواصل معنا</Link>
              {/* Admin Dashboard Button - always visible in mobile */}
              <Link
                href="/admin/login"
                className="block py-2 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-colors text-sm font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                ⚙ لوحة تحكم الإدارة
              </Link>
              {session?.user ? (
                <>
                  <Link href="/profile/tickets" className="block nav-link py-2" onClick={() => setIsMenuOpen(false)}>🎫 الدعم الفني</Link>
                  <Link href="/profile" className="block nav-link py-2" onClick={() => setIsMenuOpen(false)}>ملفي الشخصي</Link>
                  <Link href="/profile/notifications" className="block nav-link py-2" onClick={() => setIsMenuOpen(false)}>
                    🔔 الإشعارات
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 mr-2">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="block w-full text-right btn-danger text-sm py-2 px-4"
                  >
                    تسجيل خروج
                  </button>
                </>
              ) : (
                <div className="space-y-2 pt-2">
                  <Link href="/login" className="block text-center btn-secondary text-sm py-2" onClick={() => setIsMenuOpen(false)}>
                    تسجيل دخول
                  </Link>
                  <Link href="/register" className="block text-center btn-primary text-sm py-2" onClick={() => setIsMenuOpen(false)}>
                    إنشاء حساب
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

    </>
  );
}
