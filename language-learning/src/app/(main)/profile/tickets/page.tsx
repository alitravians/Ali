"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface Ticket {
  id: string;
  ticketCode: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
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

export default function TicketsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ subject: "", description: "", category: "general", priority: "medium" });
  const [successCode, setSuccessCode] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status !== "authenticated") return;
    fetchTickets();
  }, [status, router]);

  const fetchTickets = () => {
    fetch("/api/tickets")
      .then((r) => r.json())
      .then((data) => { setTickets(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const handleCreate = async () => {
    if (!form.subject || !form.description) return;
    setCreating(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessCode(data.ticketCode);
        setForm({ subject: "", description: "", category: "general", priority: "medium" });
        fetchTickets();
      }
    } catch {
      // error handled
    }
    setCreating(false);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50">
        <section className="gradient-bg text-white py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold mb-2">🎫 الدعم الفني</h1>
            <p className="text-primary-200">تواصل مع فريق الدعم عبر نظام التذاكر</p>
          </div>
        </section>

        <section className="py-8">
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">تذاكري</h2>
              <button onClick={() => { setShowCreate(true); setSuccessCode(""); }} className="btn-primary text-sm">
                + إنشاء تذكرة جديدة
              </button>
            </div>

            {/* Success message */}
            {successCode && (
              <div className="card p-6 mb-6 border-green-200 bg-green-50 text-center">
                <div className="text-4xl mb-3">✅</div>
                <h3 className="text-lg font-bold text-green-700 mb-2">تم إنشاء التذكرة بنجاح!</h3>
                <p className="text-gray-600 mb-2">رقم التذكرة الخاص بك:</p>
                <p className="text-2xl font-mono font-bold text-green-700 bg-green-100 inline-block px-4 py-2 rounded-xl">{successCode}</p>
                <p className="text-sm text-gray-500 mt-3">احتفظ بهذا الرقم لمتابعة حالة تذكرتك</p>
                <button onClick={() => { setSuccessCode(""); setShowCreate(false); }} className="btn-secondary text-sm mt-4">حسناً</button>
              </div>
            )}

            {/* Create ticket form */}
            {showCreate && !successCode && (
              <div className="card p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">إنشاء تذكرة جديدة</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">عنوان التذكرة *</label>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="input-field"
                      placeholder="اكتب عنوان المشكلة أو الاستفسار"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">القسم</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="input-field"
                      >
                        {Object.entries(categoryLabels).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
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
                        {Object.entries(priorityLabels).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">وصف المشكلة *</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="input-field min-h-[120px]"
                      placeholder="اشرح المشكلة أو الاستفسار بالتفصيل..."
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleCreate}
                      disabled={creating || !form.subject || !form.description}
                      className="btn-primary text-sm disabled:opacity-50"
                    >
                      {creating ? "جاري الإرسال..." : "إرسال التذكرة"}
                    </button>
                    <button onClick={() => setShowCreate(false)} className="btn-secondary text-sm">إلغاء</button>
                  </div>
                </div>
              </div>
            )}

            {/* Tickets list */}
            {tickets.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🎫</div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">لا توجد تذاكر</h3>
                <p className="text-gray-500">أنشئ تذكرة جديدة إذا كنت تحتاج مساعدة</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <Link key={ticket.id} href={`/profile/tickets/${ticket.id}`} className="block card-hover p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{ticket.ticketCode}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[ticket.status]}`}>
                            {statusLabels[ticket.status]}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[ticket.priority]}`}>
                            {priorityLabels[ticket.priority]}
                          </span>
                        </div>
                        <h4 className="font-bold text-gray-900">{ticket.subject}</h4>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>{categoryLabels[ticket.category]}</span>
                          <span>{ticket._count.messages} رسالة</span>
                          <span>{new Date(ticket.updatedAt).toLocaleDateString("ar")}</span>
                        </div>
                      </div>
                      <span className="text-gray-400 text-lg">←</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
