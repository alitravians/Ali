"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface NameRequest {
  id: string;
  userId: string;
  currentName: string;
  requestedName: string;
  status: string;
  reason: string;
  adminNote: string;
  reviewedBy: string;
  createdAt: string;
  reviewedAt: string | null;
  user: { id: string; name: string; email: string };
}

export default function AdminNameRequestsPage() {
  const [requests, setRequests] = useState<NameRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/admin/name-requests");
      const data = await res.json();
      if (Array.isArray(data)) {
        setRequests(data);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (requestId: string, action: "approve" | "reject") => {
    setActionLoading(requestId);
    try {
      await fetch("/api/admin/name-requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          action,
          adminNote: adminNotes[requestId] || "",
        }),
      });
      await fetchRequests();
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  const filteredRequests = requests.filter((r) => {
    if (filter === "all") return true;
    if (filter === "approved") return r.status === "approved" || r.status === "auto_approved";
    return r.status === filter;
  });

  const pendingCount = requests.filter((r) => r.status === "pending").length;

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
              <h1 className="text-2xl font-bold text-gray-900">طلبات تغيير الاسم</h1>
              <p className="text-gray-500 text-sm">مراجعة وإدارة طلبات تغيير أسماء المستخدمين</p>
            </div>
            <div className="flex gap-2">
              <Link href="/admin/settings" className="btn-secondary text-sm">الكلمات الممنوعة</Link>
              <Link href="/admin" className="btn-secondary text-sm">&#8592; لوحة التحكم</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
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
              { label: "الدردشة", href: "/admin/chat", icon: "💬" },
              { label: "تغيير الأسماء", href: "/admin/name-requests", icon: "✏️" },
              { label: "فحص النظام", href: "/admin/scan", icon: "🔍" },
              { label: "الإعدادات", href: "/admin/settings", icon: "⚙️" },
            ].map((nav) => (
              <Link
                key={nav.href}
                href={nav.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  nav.href === "/admin/name-requests" ? "bg-primary-50 text-primary-700" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {nav.icon} {nav.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
            <p className="text-sm text-gray-500">إجمالي الطلبات</p>
          </div>
          <div className="card p-4 text-center border-amber-200">
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            <p className="text-sm text-gray-500">قيد المراجعة</p>
          </div>
          <div className="card p-4 text-center border-emerald-200">
            <p className="text-2xl font-bold text-emerald-600">{requests.filter((r) => r.status === "approved" || r.status === "auto_approved").length}</p>
            <p className="text-sm text-gray-500">موافق عليها</p>
          </div>
          <div className="card p-4 text-center border-red-200">
            <p className="text-2xl font-bold text-red-600">{requests.filter((r) => r.status === "rejected").length}</p>
            <p className="text-sm text-gray-500">مرفوضة</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "all" as const, label: "الكل" },
            { key: "pending" as const, label: `قيد المراجعة ${pendingCount > 0 ? `(${pendingCount})` : ""}` },
            { key: "approved" as const, label: "موافق عليها" },
            { key: "rejected" as const, label: "مرفوضة" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f.key ? "bg-primary-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100 border"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">لا توجد طلبات</h3>
            <p className="text-gray-500">لا توجد طلبات تغيير اسم {filter !== "all" ? "بهذا التصنيف" : ""}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((req) => (
              <div key={req.id} className={`card p-6 ${req.status === "pending" ? "border-amber-300 bg-amber-50/30" : ""}`}>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* User Info */}
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-lg">
                      {req.user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{req.user.name}</p>
                      <p className="text-xs text-gray-500">{req.user.email}</p>
                    </div>
                  </div>

                  {/* Name Change Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="bg-gray-100 px-3 py-1 rounded-lg text-gray-700">{req.currentName}</span>
                      <span className="text-gray-400">&#8594;</span>
                      <span className="bg-primary-50 px-3 py-1 rounded-lg text-primary-700 font-medium">{req.requestedName}</span>
                    </div>
                    {req.reason && (
                      <p className="text-xs text-amber-600 mt-1">سبب التعليق: {req.reason}</p>
                    )}
                  </div>

                  {/* Status & Date */}
                  <div className="text-left">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      req.status === "pending" ? "bg-amber-100 text-amber-700" :
                      req.status === "approved" || req.status === "auto_approved" ? "bg-emerald-100 text-emerald-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {req.status === "pending" ? "قيد المراجعة" :
                       req.status === "approved" ? "موافق" :
                       req.status === "auto_approved" ? "موافق تلقائي" :
                       "مرفوض"}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">{new Date(req.createdAt).toLocaleDateString("ar")}</p>
                  </div>
                </div>

                {/* Admin Actions for pending requests */}
                {req.status === "pending" && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex flex-col md:flex-row gap-3">
                      <input
                        type="text"
                        value={adminNotes[req.id] || ""}
                        onChange={(e) => setAdminNotes({ ...adminNotes, [req.id]: e.target.value })}
                        placeholder="ملاحظة للمستخدم (اختياري)"
                        className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(req.id, "approve")}
                          disabled={actionLoading === req.id}
                          className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading === req.id ? "..." : "موافقة"}
                        </button>
                        <button
                          onClick={() => handleAction(req.id, "reject")}
                          disabled={actionLoading === req.id}
                          className="px-6 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading === req.id ? "..." : "رفض"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Admin Note for reviewed requests */}
                {req.adminNote && req.status !== "pending" && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-gray-600">ملاحظة الإدارة: {req.adminNote}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
