'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const DEPARTMENTS: Record<string, string> = {
  technical: 'مشاكل تقنية', account: 'مشاكل الحساب', chat: 'مشاكل الدردشة',
  notifications: 'مشاكل الإشعارات', ranks: 'مشاكل الرتب', items: 'مشاكل العناصر',
  suggestions: 'اقتراحات', general: 'استفسارات عامة',
};

const TYPES: Record<string, string> = {
  bug: 'خطأ تقني', help: 'طلب مساعدة', report: 'بلاغ', inquiry: 'استفسار',
  suggestion: 'اقتراح', account_issue: 'مشكلة حساب', feature_issue: 'مشكلة ميزة',
};

const PRIORITIES: Record<string, { label: string; color: string }> = {
  LOW: { label: 'منخفضة', color: 'text-gray-400' },
  MEDIUM: { label: 'متوسطة', color: 'text-blue-400' },
  HIGH: { label: 'عالية', color: 'text-amber-400' },
  URGENT: { label: 'عاجلة', color: 'text-red-400' },
};

const STATUSES: Record<string, { label: string; color: string; bg: string }> = {
  OPEN: { label: 'مفتوحة', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  REVIEWING: { label: 'قيد المراجعة', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  REPLIED: { label: 'تم الرد', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
  WAITING_USER: { label: 'بانتظار المستخدم', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  CLOSED: { label: 'مغلقة', color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20' },
  ESCALATED: { label: 'مصعدة', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
};

export default function TicketDetailPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const user = session?.user as any;
  const isAdmin = (user?.roleLevel || 0) >= 90;
  const isMod = (user?.roleLevel || 0) >= 50;
  const isStaff = isAdmin || isMod;

  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [replying, setReplying] = useState(false);
  const [error, setError] = useState('');
  const repliesEndRef = useRef<HTMLDivElement>(null);

  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/tickets/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTicket(data);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchTicket(); }, [id]);

  useEffect(() => {
    repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.replies?.length]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    setReplying(true);
    setError('');
    try {
      const res = await fetch(`/api/tickets/${id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent }),
      });
      if (res.ok) {
        setReplyContent('');
        fetchTicket();
      } else {
        const data = await res.json();
        setError(data.error || 'فشل في إرسال الرد');
      }
    } catch {
      setError('حدث خطأ');
    }
    setReplying(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchTicket();
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030711] flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-[#030711] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-lg mb-4">التذكرة غير موجودة</p>
          <Link href="/support" className="text-violet-400 hover:text-violet-300 text-sm">← العودة للتذاكر</Link>
        </div>
      </div>
    );
  }

  const st = STATUSES[ticket.status] || STATUSES.OPEN;
  const pr = PRIORITIES[ticket.priority] || PRIORITIES.MEDIUM;

  return (
    <div className="min-h-screen bg-[#030711] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/[0.05] rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/support" className="text-gray-500 hover:text-white text-xs px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-all">← التذاكر</Link>
          <span className="text-gray-700">|</span>
          <span className="text-gray-600 text-xs">#{ticket.id.slice(-8)}</span>
        </div>

        {/* Ticket Info Card */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-lg font-bold text-white">{ticket.title}</h1>
            <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium shrink-0 ${st.bg} ${st.color}`}>{st.label}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] mb-5 text-gray-500">
            <span>📁 {DEPARTMENTS[ticket.department] || ticket.department}</span>
            <span>📋 {TYPES[ticket.type] || ticket.type}</span>
            <span className={pr.color}>⚡ {pr.label}</span>
            <span>👤 {ticket.user?.displayName || ticket.user?.username}</span>
            <span>📅 {new Date(ticket.createdAt).toLocaleDateString('ar-SA')}</span>
            {ticket.assignee && <span>👨‍💼 معين لـ: {ticket.assignee.displayName || ticket.assignee.username}</span>}
          </div>

          <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04]">
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {/* Admin controls */}
          {isStaff && ticket.status !== 'CLOSED' && (
            <div className="mt-4 pt-4 border-t border-white/[0.04] flex flex-wrap gap-2">
              {['REVIEWING', 'REPLIED', 'WAITING_USER', 'ESCALATED', 'CLOSED'].map(s => {
                const statusInfo = STATUSES[s];
                if (ticket.status === s) return null;
                return (
                  <button key={s} onClick={() => handleStatusChange(s)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all hover:opacity-80 ${statusInfo.bg} ${statusInfo.color}`}>
                    {statusInfo.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Replies */}
        <div className="space-y-4 mb-6">
          <h3 className="text-sm font-medium text-gray-400">المحادثة ({ticket.replies?.length || 0})</h3>
          {ticket.replies?.map((reply: any) => (
            <div key={reply.id} className={`rounded-xl p-4 border ${reply.isStaff ? 'bg-violet-500/[0.04] border-violet-500/10' : 'bg-white/[0.02] border-white/[0.06]'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white ${reply.isStaff ? 'bg-gradient-to-br from-violet-500 to-indigo-600' : 'bg-gradient-to-br from-gray-600 to-gray-700'}`}>
                  {reply.user?.username?.[0]?.toUpperCase() || '?'}
                </div>
                <span className="text-white text-xs font-medium">{reply.user?.displayName || reply.user?.username}</span>
                {reply.isStaff && <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400 border border-violet-500/20">فريق الدعم</span>}
                <span className="text-gray-600 text-[10px] mr-auto">{new Date(reply.createdAt).toLocaleString('ar-SA')}</span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{reply.content}</p>
            </div>
          ))}
          <div ref={repliesEndRef} />
        </div>

        {/* Reply Form */}
        {ticket.status !== 'CLOSED' ? (
          <form onSubmit={handleReply} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
            {error && <div className="mb-3 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-400 text-xs">{error}</div>}
            <textarea
              value={replyContent} onChange={e => setReplyContent(e.target.value)} maxLength={5000} required rows={3}
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/40 transition-all resize-none placeholder:text-gray-600 mb-3"
              placeholder="اكتب ردك هنا..."
            />
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-gray-600">{replyContent.length}/5000</p>
              <button type="submit" disabled={replying || !replyContent.trim()}
                className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl font-medium text-white text-sm transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50">
                {replying ? 'جاري الإرسال...' : 'إرسال الرد'}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
            <p className="text-gray-500 text-sm">هذه التذكرة مغلقة</p>
          </div>
        )}
      </div>
    </div>
  );
}
