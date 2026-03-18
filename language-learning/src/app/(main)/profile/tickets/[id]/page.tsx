"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface Message {
  id: string;
  content: string;
  isAdmin: boolean;
  senderName: string;
  createdAt: string;
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
  messages: Message[];
  user: { name: string; email: string };
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

export default function TicketDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status !== "authenticated") return;
    fetchTicket();
  }, [status, router, params.id]);

  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/tickets/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setTicket(data);
      }
    } catch {
      // error handled
    }
    setLoading(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/tickets/${params.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      });
      if (res.ok) {
        setNewMessage("");
        fetchTicket();
      }
    } catch {
      // error handled
    }
    setSending(false);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">التذكرة غير موجودة</h2>
            <Link href="/profile/tickets" className="btn-primary text-sm mt-4 inline-block">العودة للتذاكر</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50">
        <section className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center gap-2 mb-4">
              <Link href="/profile/tickets" className="text-primary-600 hover:text-primary-700 text-sm">
                ← العودة للتذاكر
              </Link>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{ticket.ticketCode}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[ticket.status]}`}>
                    {statusLabels[ticket.status]}
                  </span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">{ticket.subject}</h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span>{categoryLabels[ticket.category]}</span>
                  <span>الأولوية: {priorityLabels[ticket.priority]}</span>
                  <span>تاريخ الإنشاء: {new Date(ticket.createdAt).toLocaleDateString("ar")}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-6">
          <div className="max-w-4xl mx-auto px-4">
            {/* Messages */}
            <div className="card p-6 mb-4">
              <h3 className="font-bold text-gray-900 mb-4">المحادثة</h3>
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {ticket.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isAdmin ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        msg.isAdmin
                          ? "bg-primary-50 border border-primary-100"
                          : "bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold ${msg.isAdmin ? "text-primary-600" : "text-gray-600"}`}>
                          {msg.isAdmin ? "🛡️ الإدارة" : "👤 " + msg.senderName}
                        </span>
                      </div>
                      <p className="text-gray-800 text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(msg.createdAt).toLocaleString("ar")}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Reply box */}
            {ticket.status !== "closed" ? (
              <div className="card p-4">
                <div className="flex gap-3">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="اكتب ردك هنا..."
                    className="input-field flex-1 min-h-[60px] resize-none"
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !newMessage.trim()}
                    className="btn-primary text-sm self-end disabled:opacity-50"
                  >
                    {sending ? "..." : "إرسال"}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">اضغط Enter للإرسال أو Shift+Enter لسطر جديد</p>
              </div>
            ) : (
              <div className="card p-4 text-center text-gray-500 bg-gray-50">
                هذه التذكرة مغلقة ولا يمكن إضافة ردود جديدة
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
