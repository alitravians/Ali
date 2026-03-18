"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Notification {
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

const categoryFilters = [
  { value: "all", label: "الكل" },
  { value: "educational", label: "تعليمية" },
  { value: "certificates", label: "شهادات" },
  { value: "support", label: "دعم فني" },
  { value: "account", label: "حساب" },
  { value: "admin", label: "إعلانات" },
];

const statusFilters = [
  { value: "all", label: "الكل" },
  { value: "unread", label: "غير مقروءة" },
  { value: "read", label: "مقروءة" },
];

const iconMap: Record<string, string> = {
  bell: "🔔",
  book: "📚",
  award: "🎓",
  ticket: "🎫",
  user: "👤",
  megaphone: "📢",
  star: "⭐",
  check: "✅",
  alert: "⚠️",
  trophy: "🏆",
  key: "🔑",
  shield: "🛡️",
  rocket: "🚀",
};

const priorityBorders: Record<string, string> = {
  normal: "border-r-gray-300",
  important: "border-r-amber-400",
  urgent: "border-r-red-500",
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "الآن";
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays < 7) return `منذ ${diffDays} يوم`;
  return date.toLocaleDateString("ar");
}

export default function NotificationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchNotifications = async () => {
    const params = new URLSearchParams();
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    params.set("limit", "100");

    try {
      const res = await fetch(`/api/notifications?${params}`);
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      // Error handled silently
    }
    setLoading(false);
  };

  useEffect(() => {
    if (session?.user) {
      fetchNotifications();
    }
  }, [session, categoryFilter, statusFilter]);

  const markAsRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markAllRead" }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const deleteNotification = async (id: string) => {
    await fetch("/api/notifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">يرجى تسجيل الدخول</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الإشعارات</h1>
          <p className="text-gray-500 text-sm mt-1">
            {unreadCount > 0 ? `لديك ${unreadCount} إشعار غير مقروء` : "لا توجد إشعارات جديدة"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/profile/settings/notifications"
            className="text-sm text-gray-500 hover:text-primary-600 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
          >
            ⚙️ الإعدادات
          </Link>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium px-3 py-2 rounded-lg hover:bg-primary-50 transition-colors"
            >
              تحديد الكل كمقروء
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {categoryFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => { setCategoryFilter(f.value); setLoading(true); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                categoryFilter === f.value ? "bg-white shadow text-primary-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => { setStatusFilter(f.value); setLoading(true); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === f.value ? "bg-white shadow text-primary-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔔</div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">لا توجد إشعارات</h3>
          <p className="text-gray-500">ستظهر إشعاراتك هنا عند وجود تحديثات جديدة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`card p-4 border-r-4 cursor-pointer transition-all hover:shadow-md ${
                priorityBorders[notification.priority] || priorityBorders.normal
              } ${!notification.isRead ? "bg-primary-50/30 border-r-primary-500" : ""}`}
              onClick={() => handleClick(notification)}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl shrink-0 mt-0.5">
                  {iconMap[notification.icon] || "🔔"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-medium text-sm ${!notification.isRead ? "text-gray-900 font-bold" : "text-gray-700"}`}>
                      {notification.titleAr || notification.title}
                    </h4>
                    {!notification.isRead && (
                      <span className="w-2 h-2 bg-primary-500 rounded-full shrink-0"></span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm line-clamp-2">
                    {notification.messageAr || notification.message}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-400">{timeAgo(notification.createdAt)}</span>
                    {notification.link && (
                      <span className="text-xs text-primary-500">← عرض التفاصيل</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                  className="text-gray-300 hover:text-red-500 transition-colors shrink-0 p-1"
                  title="حذف"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
