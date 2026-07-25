"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AdminLog {
  id: string;
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  category: string;
  priority: string;
  targetType: string;
  sentCount: number;
  readCount: number;
  sentAt: string;
}

const categoryOptions = [
  { value: "admin", label: "إعلان إداري" },
  { value: "educational", label: "تعليمية" },
  { value: "certificates", label: "شهادات" },
  { value: "support", label: "دعم فني" },
  { value: "account", label: "حساب" },
];

const priorityOptions = [
  { value: "normal", label: "عادي" },
  { value: "important", label: "مهم" },
  { value: "urgent", label: "عاجل" },
];

const categoryLabels: Record<string, string> = {
  admin: "إعلان إداري",
  educational: "تعليمية",
  certificates: "شهادات",
  support: "دعم فني",
  account: "حساب",
  general: "عامة",
};

const priorityLabels: Record<string, string> = {
  normal: "عادي",
  important: "مهم",
  urgent: "عاجل",
};

const priorityColors: Record<string, string> = {
  normal: "bg-gray-100 text-gray-700",
  important: "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-700",
};

export default function AdminNotificationsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"send" | "log">("send");

  const [form, setForm] = useState({
    titleAr: "",
    messageAr: "",
    category: "admin",
    link: "",
    priority: "normal",
    targetType: "all" as "all" | "specific",
    targetUserIds: [] as string[],
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/admin/notifications").then((r) => r.json()),
    ])
      .then(([usersData, logsData]) => {
        setUsers(Array.isArray(usersData) ? usersData : []);
        setLogs(Array.isArray(logsData) ? logsData : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSend = async () => {
    if (!form.titleAr || !form.messageAr) return;
    setSending(true);
    setSuccess("");

    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.titleAr,
          titleAr: form.titleAr,
          message: form.messageAr,
          messageAr: form.messageAr,
          category: form.category,
          link: form.link,
          priority: form.priority,
          targetType: form.targetType,
          targetUserIds: form.targetType === "specific" ? form.targetUserIds : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(`تم إرسال الإشعار بنجاح إلى ${data.sentCount} مستخدم`);
        setForm({ titleAr: "", messageAr: "", category: "admin", link: "", priority: "normal", targetType: "all", targetUserIds: [] });
        const logsRes = await fetch("/api/admin/notifications");
        const logsData = await logsRes.json();
        setLogs(Array.isArray(logsData) ? logsData : []);
      }
    } catch {
      // Error handled silently
    }
    setSending(false);
  };

  const toggleUser = (userId: string) => {
    setForm((prev) => ({
      ...prev,
      targetUserIds: prev.targetUserIds.includes(userId)
        ? prev.targetUserIds.filter((id) => id !== userId)
        : [...prev.targetUserIds, userId],
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">إدارة الإشعارات</h1>
              <p className="text-gray-500 text-sm">إرسال إشعارات للأعضاء وعرض السجل</p>
            </div>
            <div className="flex gap-2">
              <Link href="/admin" className="btn-primary text-sm">← العودة للوحة التحكم</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {[
              { label: "الرئيسية", href: "/admin", icon: "🏠" },
              { label: "اللغات", href: "/admin/languages", icon: "🌐" },
              { label: "المستويات", href: "/admin/levels", icon: "📊" },
              { label: "الدروس", href: "/admin/lessons", icon: "📚" },
              { label: "الأسئلة", href: "/admin/questions", icon: "❓" },
              { label: "الشهادات", href: "/admin/certificates", icon: "🎓" },
              { label: "المستخدمين", href: "/admin/users", icon: "👥" },
              { label: "التذاكر", href: "/admin/tickets", icon: "🎫" },
              { label: "الإشعارات", href: "/admin/notifications", icon: "🔔" },
              { label: "فحص النظام", href: "/admin/scan", icon: "🔍" },
              { label: "الإعدادات", href: "/admin/settings", icon: "⚙️" },
            ].map((nav) => (
              <Link
                key={nav.href}
                href={nav.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  nav.href === "/admin/notifications" ? "bg-primary-50 text-primary-700" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {nav.icon} {nav.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-8 max-w-md">
          <button
            onClick={() => setActiveTab("send")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === "send" ? "bg-white shadow text-primary-600" : "text-gray-500"
            }`}
          >
            📤 إرسال إشعار
          </button>
          <button
            onClick={() => setActiveTab("log")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === "log" ? "bg-white shadow text-primary-600" : "text-gray-500"
            }`}
          >
            📋 سجل الإشعارات ({logs.length})
          </button>
        </div>

        {activeTab === "send" && (
          <div className="card p-6 max-w-2xl animate-fadeIn">
            <h3 className="font-bold text-gray-900 mb-6 text-lg">إرسال إشعار جديد</h3>

            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-4 mb-6">
                {success}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">عنوان الإشعار *</label>
                <input
                  type="text"
                  value={form.titleAr}
                  onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
                  className="input-field"
                  placeholder="مثال: تحديث جديد في المنصة"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">محتوى الإشعار *</label>
                <textarea
                  value={form.messageAr}
                  onChange={(e) => setForm({ ...form, messageAr: e.target.value })}
                  className="input-field min-h-[100px]"
                  placeholder="اكتب محتوى الإشعار هنا..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الفئة</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="input-field"
                  >
                    {categoryOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الأولوية</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="input-field"
                  >
                    {priorityOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الرابط المرتبط (اختياري)</label>
                <input
                  type="text"
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  className="input-field"
                  placeholder="مثال: /languages أو /profile/certificates"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الجمهور المستهدف</label>
                <div className="flex gap-4 mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={form.targetType === "all"}
                      onChange={() => setForm({ ...form, targetType: "all", targetUserIds: [] })}
                      className="accent-primary-600"
                    />
                    <span className="text-sm">جميع الأعضاء ({users.length})</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={form.targetType === "specific"}
                      onChange={() => setForm({ ...form, targetType: "specific" })}
                      className="accent-primary-600"
                    />
                    <span className="text-sm">أعضاء محددين</span>
                  </label>
                </div>

                {form.targetType === "specific" && (
                  <div className="bg-gray-50 rounded-xl p-4 max-h-48 overflow-y-auto space-y-2">
                    {users.map((user) => (
                      <label key={user.id} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded-lg transition-colors">
                        <input
                          type="checkbox"
                          checked={form.targetUserIds.includes(user.id)}
                          onChange={() => toggleUser(user.id)}
                          className="accent-primary-600"
                        />
                        <span className="text-sm font-medium">{user.name}</span>
                        <span className="text-xs text-gray-400">{user.email}</span>
                      </label>
                    ))}
                    {form.targetUserIds.length > 0 && (
                      <p className="text-xs text-primary-600 pt-2 border-t">
                        تم اختيار {form.targetUserIds.length} مستخدم
                      </p>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={handleSend}
                disabled={sending || !form.titleAr || !form.messageAr}
                className="btn-primary w-full py-3 disabled:opacity-50"
              >
                {sending ? "جاري الإرسال..." : "📤 إرسال الإشعار"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "log" && (
          <div className="animate-fadeIn">
            {logs.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">لا توجد إشعارات مرسلة</h3>
                <p className="text-gray-500">لم يتم إرسال أي إشعارات من الإدارة بعد</p>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div key={log.id} className="card p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-bold text-gray-900">{log.titleAr || log.title}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[log.priority] || priorityColors.normal}`}>
                            {priorityLabels[log.priority] || log.priority}
                          </span>
                          <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">
                            {categoryLabels[log.category] || log.category}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mt-1">{log.messageAr || log.message}</p>
                        {log.targetType === "specific" && (
                          <p className="text-xs text-gray-400 mt-1">مرسل لأعضاء محددين</p>
                        )}
                      </div>
                      <div className="text-left shrink-0">
                        <div className="flex gap-3 text-center">
                          <div>
                            <p className="text-lg font-bold text-primary-600">{log.sentCount}</p>
                            <p className="text-xs text-gray-400">مرسل</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-emerald-600">{log.readCount}</p>
                            <p className="text-xs text-gray-400">مقروء</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(log.sentAt).toLocaleDateString("ar")} - {new Date(log.sentAt).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
