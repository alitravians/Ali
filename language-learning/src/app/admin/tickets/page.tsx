"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

interface Ticket {
  id: string;
  ticketCode: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: { name: string; email: string };
  messages: { id: string; content: string; isAdmin: boolean; senderName: string; createdAt: string }[];
  _count: { messages: number };
}

interface TicketDetail {
  id: string;
  ticketCode: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: { name: string; email: string };
  messages: { id: string; content: string; isAdmin: boolean; senderName: string; createdAt: string }[];
}

const categoryLabels: Record<string, string> = {
  technical: "مشاكل تقنية",
  general: "استفسارات عامة",
  account: "مشاكل الحساب",
  tests: "مشاكل الاختبارات",
  certificates: "مشاكل الشهادات",
};

const priorityLabels: Record<string, string> = {
  low: "منخفضة",
  medium: "متوسطة",
  high: "عالية",
};

const statusLabels: Record<string, string> = {
  open: "مفتوحة",
  in_review: "قيد المراجعة",
  replied: "تم الرد",
  closed: "مغلقة",
};

const statusColors: Record<string, string> = {
  open: "bg-red-100 text-red-700",
  in_review: "bg-yellow-100 text-yellow-700",
  replied: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-500",
};

const priorityColors: Record<string, string> = {
  low: "bg-blue-100 text-blue-700",
  medium: "bg-orange-100 text-orange-700",
  high: "bg-red-100 text-red-700",
};

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [filters, setFilters] = useState({ status: "all", category: "all", priority: "all", search: "" });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTickets();
  }, [filters]);

  const fetchTickets = async () => {
    const params = new URLSearchParams();
    if (filters.status !== "all") params.set("status", filters.status);
    if (filters.category !== "all") params.set("category", filters.category);
    if (filters.priority !== "all") params.set("priority", filters.priority);
    if (filters.search) params.set("search", filters.search);

    try {
      const res = await fetch(`/api/admin/tickets?${params}`);
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch {
      // error handled
    }
    setLoading(false);
  };

  const openTicket = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/tickets/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedTicket(data);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } catch {
      // error handled
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedTicket || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/tickets/${selectedTicket.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyText }),
      });
      if (res.ok) {
        setReplyText("");
        openTicket(selectedTicket.id);
        fetchTickets();
      }
    } catch {
      // error handled
    }
    setSending(false);
  };

  const changeStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/admin/tickets/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchTickets();
      if (selectedTicket?.id === id) openTicket(id);
    } catch {
      // error handled
    }
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
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🎫 إدارة التذاكر</h1>
              <p className="text-gray-500 text-sm">إدارة تذاكر الدعم الفني والرد عليها</p>
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
              { label: "الإشعارات", href: "/admin/notifications", icon: "🔔" },
              { label: "فحص النظام", href: "/admin/scan", icon: "🔍" },
              { label: "الإعدادات", href: "/admin/settings", icon: "⚙️" },
            ].map((nav) => (
              <Link
                key={nav.href}
                href={nav.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  nav.href === "/admin/tickets" ? "bg-primary-50 text-primary-700" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {nav.icon} {nav.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="🔍 بحث بالعنوان أو الرقم أو الاسم..."
                className="input-field text-sm"
              />
            </div>
            <div>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="input-field text-sm"
              >
                <option value="all">جميع الحالات</option>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="input-field text-sm"
              >
                <option value="all">جميع الأقسام</option>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="input-field text-sm"
              >
                <option value="all">جميع الأولويات</option>
                {Object.entries(priorityLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-500">{tickets.length} تذكرة</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tickets List */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-900">قائمة التذاكر</h3>
            {tickets.length === 0 ? (
              <div className="card p-8 text-center">
                <div className="text-4xl mb-3">🎫</div>
                <p className="text-gray-500">لا توجد تذاكر</p>
              </div>
            ) : (
              tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => openTicket(ticket.id)}
                  className={`card p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedTicket?.id === ticket.id ? "ring-2 ring-primary-500 border-primary-200" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{ticket.ticketCode}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[ticket.status]}`}>
                          {statusLabels[ticket.status]}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[ticket.priority]}`}>
                          {priorityLabels[ticket.priority]}
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm truncate">{ticket.subject}</h4>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>👤 {ticket.user.name}</span>
                        <span>{categoryLabels[ticket.category]}</span>
                        <span>{ticket._count.messages} رسالة</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span>إنشاء: {new Date(ticket.createdAt).toLocaleDateString("ar")}</span>
                        <span>تحديث: {new Date(ticket.updatedAt).toLocaleDateString("ar")}</span>
                      </div>
                    </div>
                    {/* Status actions */}
                    <div className="flex flex-col gap-1">
                      {ticket.status !== "closed" ? (
                        <>
                          {ticket.status !== "in_review" && (
                            <button
                              onClick={(e) => { e.stopPropagation(); changeStatus(ticket.id, "in_review"); }}
                              className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-100"
                            >
                              مراجعة
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); changeStatus(ticket.id, "closed"); }}
                            className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded hover:bg-gray-100"
                          >
                            إغلاق
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); changeStatus(ticket.id, "open"); }}
                          className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100"
                        >
                          إعادة فتح
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Ticket Detail / Conversation */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3">تفاصيل التذكرة</h3>
            {selectedTicket ? (
              <div className="card p-5">
                {/* Ticket info */}
                <div className="border-b pb-4 mb-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{selectedTicket.ticketCode}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[selectedTicket.status]}`}>
                      {statusLabels[selectedTicket.status]}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900">{selectedTicket.subject}</h3>
                  <div className="grid grid-cols-2 gap-2 mt-3 text-sm text-gray-500">
                    <p>👤 {selectedTicket.user.name}</p>
                    <p>📧 {selectedTicket.user.email}</p>
                    <p>📁 {categoryLabels[selectedTicket.category]}</p>
                    <p>⚡ {priorityLabels[selectedTicket.priority]}</p>
                    <p>📅 {new Date(selectedTicket.createdAt).toLocaleString("ar")}</p>
                    <p>🔄 {new Date(selectedTicket.updatedAt).toLocaleString("ar")}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="space-y-3 max-h-[400px] overflow-y-auto mb-4">
                  {selectedTicket.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`rounded-xl px-4 py-3 ${
                        msg.isAdmin
                          ? "bg-primary-50 border border-primary-100 mr-6"
                          : "bg-gray-50 ml-6"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold ${msg.isAdmin ? "text-primary-600" : "text-gray-600"}`}>
                          {msg.isAdmin ? "🛡️ الإدارة" : "👤 " + msg.senderName}
                        </span>
                        <span className="text-xs text-gray-400">{new Date(msg.createdAt).toLocaleString("ar")}</span>
                      </div>
                      <p className="text-gray-800 text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply */}
                {selectedTicket.status !== "closed" ? (
                  <div className="border-t pt-4">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleReply();
                        }
                      }}
                      placeholder="اكتب الرد هنا..."
                      className="input-field w-full min-h-[80px] resize-none mb-3"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleReply}
                        disabled={sending || !replyText.trim()}
                        className="btn-primary text-sm disabled:opacity-50"
                      >
                        {sending ? "جاري الإرسال..." : "إرسال الرد"}
                      </button>
                      <button
                        onClick={() => changeStatus(selectedTicket.id, "in_review")}
                        className="btn-secondary text-sm"
                      >
                        قيد المراجعة
                      </button>
                      <button
                        onClick={() => changeStatus(selectedTicket.id, "closed")}
                        className="text-sm bg-gray-100 text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-200"
                      >
                        إغلاق
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">اضغط Enter للإرسال أو Shift+Enter لسطر جديد</p>
                  </div>
                ) : (
                  <div className="border-t pt-4">
                    <div className="text-center text-gray-500 text-sm mb-3">هذه التذكرة مغلقة</div>
                    <button
                      onClick={() => changeStatus(selectedTicket.id, "open")}
                      className="btn-secondary text-sm w-full"
                    >
                      إعادة فتح التذكرة
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="card p-12 text-center">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-gray-500">اختر تذكرة من القائمة لعرض التفاصيل والرد عليها</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
