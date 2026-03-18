"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ContactMsg {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function AdminContactPage() {
  const [messages, setMessages] = useState<ContactMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ContactMsg | null>(null);

  const fetchData = () => {
    fetch("/api/admin/contact")
      .then((r) => r.json())
      .then((data) => { setMessages(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const toggleRead = async (msg: ContactMsg) => {
    await fetch("/api/admin/contact", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: msg.id, isRead: !msg.isRead }),
    });
    fetchData();
    if (selected?.id === msg.id) setSelected({ ...msg, isRead: !msg.isRead });
  };

  const deleteMsg = async (id: string) => {
    if (!confirm("هل تريد حذف هذه الرسالة؟")) return;
    await fetch("/api/admin/contact", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (selected?.id === id) setSelected(null);
    fetchData();
  };

  const unreadCount = messages.filter((m) => !m.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">📬 رسائل الاتصال</h1>
              <p className="text-sm text-gray-500">
                {messages.length} رسالة {unreadCount > 0 && <span className="text-red-500 font-bold">({unreadCount} غير مقروءة)</span>}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/admin" className="btn-secondary text-sm">← لوحة التحكم</Link>
              <Link href="/" className="btn-primary text-sm">← العودة للموقع</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Navigation */}
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
              { label: "رسائل الاتصال", href: "/admin/contact", icon: "📬" },
              { label: "الإشعارات", href: "/admin/notifications", icon: "🔔" },
              { label: "الإعدادات", href: "/admin/settings", icon: "⚙️" },
            ].map((nav) => (
              <Link
                key={nav.href}
                href={nav.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  nav.href === "/admin/contact" ? "bg-primary-50 text-primary-700" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {nav.icon} {nav.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📬</div>
            <p className="text-gray-500">لا توجد رسائل</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Messages List */}
            <div className="space-y-3">
              <h3 className="font-bold text-gray-900">قائمة الرسائل</h3>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => { setSelected(msg); if (!msg.isRead) toggleRead(msg); }}
                  className={`card p-4 cursor-pointer transition-all hover:shadow-md ${
                    selected?.id === msg.id ? "ring-2 ring-primary-500 border-primary-200" : ""
                  } ${!msg.isRead ? "border-r-4 border-r-primary-500" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {!msg.isRead && <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0"></span>}
                        <h4 className="font-bold text-gray-900 text-sm truncate">{msg.subject}</h4>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>👤 {msg.name}</span>
                        <span dir="ltr">📧 {msg.email}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 truncate">{msg.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(msg.createdAt).toLocaleString("ar")}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteMsg(msg.id); }}
                      className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100 flex-shrink-0"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Detail */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3">تفاصيل الرسالة</h3>
              {selected ? (
                <div className="card p-6">
                  <div className="border-b pb-4 mb-4">
                    <h3 className="font-bold text-gray-900 text-lg mb-3">{selected.subject}</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-500">
                      <p>👤 <span className="font-medium text-gray-700">{selected.name}</span></p>
                      <p dir="ltr">📧 <span className="font-medium text-gray-700">{selected.email}</span></p>
                      <p>📅 {new Date(selected.createdAt).toLocaleString("ar")}</p>
                      <p>
                        <span className={`badge text-xs ${selected.isRead ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {selected.isRead ? "مقروءة" : "غير مقروءة"}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{selected.message}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleRead(selected)}
                      className="btn-secondary text-sm"
                    >
                      {selected.isRead ? "تحديد كغير مقروءة" : "تحديد كمقروءة"}
                    </button>
                    <a
                      href={`mailto:${selected.email}?subject=Re: ${selected.subject}`}
                      className="btn-primary text-sm"
                    >
                      📧 رد بالبريد
                    </a>
                    <button
                      onClick={() => deleteMsg(selected.id)}
                      className="text-sm bg-red-50 text-red-600 px-4 py-2 rounded-xl hover:bg-red-100"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ) : (
                <div className="card p-8 text-center">
                  <div className="text-4xl mb-3">📩</div>
                  <p className="text-gray-500">اختر رسالة لعرض تفاصيلها</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
