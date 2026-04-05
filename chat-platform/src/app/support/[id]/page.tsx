'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const DEPARTMENTS: Record<string, string> = {
  technical: 'مشاكل تقنية', account: 'مشاكل الحساب', chat: 'مشاكل الدردشة',
  notifications: 'مشاكل الإشعارات', ranks: 'مشاكل الرتب أو الشارات',
  items: 'مشاكل الحقيبة أو العناصر', suggestions: 'اقتراحات',
  reports: 'البلاغات', general: 'الدعم العام',
};

const TYPES: Record<string, string> = {
  bug: 'مشكلة تقنية', help: 'طلب مساعدة', report: 'بلاغ', inquiry: 'استفسار',
  suggestion: 'اقتراح', account_issue: 'مشكلة حساب', feature_issue: 'مشكلة عنصر أو ميزة',
};

const PRIORITIES: Record<string, { label: string; color: string; bg: string }> = {
  LOW: { label: 'منخفضة', color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20' },
  MEDIUM: { label: 'متوسطة', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  HIGH: { label: 'عالية', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  URGENT: { label: 'عاجلة', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
};

const STATUSES: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  OPEN: { label: 'مفتوحة', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: '🟢' },
  REVIEWING: { label: 'قيد المراجعة', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: '🔵' },
  REPLIED: { label: 'تم الرد', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20', icon: '💬' },
  WAITING_USER: { label: 'بانتظار المستخدم', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: '⏳' },
  CLOSED: { label: 'مغلقة', color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20', icon: '🔒' },
  ESCALATED: { label: 'مصعدة للإدارة', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: '🔺' },
  ARCHIVED: { label: 'مؤرشفة', color: 'text-gray-500', bg: 'bg-gray-600/10 border-gray-600/20', icon: '📦' },
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
  const [statusMsg, setStatusMsg] = useState('');
  const repliesEndRef = useRef<HTMLDivElement>(null);

  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/tickets/${id}`);
      if (res.ok) setTicket(await res.json());
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
    } catch { setError('حدث خطأ'); }
    setReplying(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchTicket();
        const label = STATUSES[newStatus]?.label || newStatus;
        setStatusMsg(`تم تغيير الحالة إلى ${label}`);
        setTimeout(() => setStatusMsg(''), 3000);
      }
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
  const isOwner = user?.id === ticket.userId;
  const isClosed = ticket.status === 'CLOSED' || ticket.status === 'ARCHIVED';

  return (
    <div className="min-h-screen bg-[#030711] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/[0.05] rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/support" className="text-gray-500 hover:text-white text-xs px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-all">← التذاكر</Link>
          <span className="text-gray-700">|</span>
          <span className="text-gray-600 text-xs">#{ticket.id.slice(-8)}</span>
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-emerald-400 text-sm text-center">{statusMsg}</div>
        )}

        {/* Ticket Info Card */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-lg font-bold text-white">{ticket.title}</h1>
            <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium shrink-0 ${st.bg} ${st.color}`}>
              {st.icon} {st.label}
            </span>
          </div>

          {/* Ticket metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'القسم', value: DEPARTMENTS[ticket.department] || ticket.department, icon: '📁' },
              { label: 'النوع', value: TYPES[ticket.type] || ticket.type, icon: '📋' },
              { label: 'الأولوية', value: pr.label, icon: '⚡', color: pr.color },
              { label: 'التاريخ', value: new Date(ticket.createdAt).toLocaleDateString('ar-SA'), icon: '📅' },
            ].map((item, i) => (
              <div key={i} className="bg-white/[0.02] rounded-lg border border-white/[0.04] px-3 py-2">
                <p className="text-gray-600 text-[9px] mb-0.5">{item.icon} {item.label}</p>
                <p className={`text-xs font-medium ${item.color || 'text-gray-300'}`}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* User info */}
          <div className="flex items-center gap-2 mb-4 text-[11px] text-gray-500">
            <span>👤 {ticket.user?.displayName || ticket.user?.username}</span>
            {ticket.assignee && <><span className="text-gray-700">•</span><span>👨‍💼 معين لـ: {ticket.assignee.displayName || ticket.assignee.username}</span></>}
            {ticket.closedAt && <><span className="text-gray-700">•</span><span>🔒 أُغلقت {new Date(ticket.closedAt).toLocaleDateString('ar-SA')}</span></>}
          </div>

          {/* Description */}
          <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04]">
            <p className="text-[10px] text-gray-600 mb-1.5">الوصف</p>
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {/* User controls */}
          {isOwner && !isStaff && (
            <div className="mt-4 pt-4 border-t border-white/[0.04] flex gap-2">
              {!isClosed ? (
                <button onClick={() => handleStatusChange('CLOSED')}
                  className="px-4 py-2 rounded-lg text-[11px] font-medium border bg-gray-500/10 border-gray-500/20 text-gray-400 hover:bg-gray-500/20 transition-all">
                  🔒 إغلاق التذكرة
                </button>
              ) : (
                <button onClick={() => handleStatusChange('OPEN')}
                  className="px-4 py-2 rounded-lg text-[11px] font-medium border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all">
                  🔓 إعادة فتح التذكرة
                </button>
              )}
            </div>
          )}

          {/* Staff controls */}
          {isStaff && (
            <div className="mt-4 pt-4 border-t border-white/[0.04]">
              <p className="text-[10px] text-gray-600 mb-2">تغيير الحالة:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(STATUSES).map(([key, s]) => {
                  if (ticket.status === key || key === 'ARCHIVED') return null;
                  return (
                    <button key={key} onClick={() => handleStatusChange(key)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all hover:opacity-80 ${s.bg} ${s.color}`}>
                      {s.icon} {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Thread / Conversation */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-medium text-gray-400">المحادثة</h3>
            <span className="px-2 py-0.5 rounded-full bg-white/[0.04] text-gray-500 text-[10px]">{ticket.replies?.length || 0} رد</span>
          </div>

          <div className="space-y-3">
            {/* Original message as first thread item */}
            <div className="rounded-xl p-4 border bg-white/[0.02] border-white/[0.06]">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold text-white bg-gradient-to-br from-gray-600 to-gray-700 shrink-0">
                  {ticket.user?.avatar ? (
                    <img src={ticket.user.avatar} alt="" className="w-full h-full rounded-lg object-cover" />
                  ) : (
                    ticket.user?.username?.[0]?.toUpperCase() || '?'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white text-xs font-medium">{ticket.user?.displayName || ticket.user?.username}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/15">صاحب التذكرة</span>
                  </div>
                  <span className="text-gray-700 text-[10px]">{new Date(ticket.createdAt).toLocaleString('ar-SA')}</span>
                </div>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
            </div>

            {/* Replies */}
            {ticket.replies?.map((reply: any) => (
              <div key={reply.id}
                className={`rounded-xl p-4 border transition-all ${
                  reply.isStaff
                    ? 'bg-violet-500/[0.04] border-violet-500/15 mr-0 ml-4'
                    : 'bg-white/[0.02] border-white/[0.06] ml-0 mr-4'
                }`}>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0 ${
                    reply.isStaff ? 'bg-gradient-to-br from-violet-500 to-indigo-600' : 'bg-gradient-to-br from-gray-600 to-gray-700'
                  }`}>
                    {reply.user?.avatar ? (
                      <img src={reply.user.avatar} alt="" className="w-full h-full rounded-lg object-cover" />
                    ) : (
                      reply.user?.username?.[0]?.toUpperCase() || '?'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-white text-xs font-medium">{reply.user?.displayName || reply.user?.username}</span>
                      {reply.isStaff && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400 border border-violet-500/20">فريق الدعم</span>
                      )}
                    </div>
                    <span className="text-gray-700 text-[10px]">{new Date(reply.createdAt).toLocaleString('ar-SA')}</span>
                  </div>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{reply.content}</p>
              </div>
            ))}
            <div ref={repliesEndRef} />
          </div>
        </div>

        {/* Reply Form */}
        {!isClosed ? (
          <form onSubmit={handleReply} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
            {error && <div className="mb-3 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-400 text-xs">{error}</div>}
            <textarea
              value={replyContent} onChange={e => setReplyContent(e.target.value)} maxLength={5000} required rows={3}
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/40 transition-all resize-none placeholder:text-gray-600 mb-3"
              placeholder="اكتب ردك هنا..."
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && replyContent.trim()) { e.preventDefault(); handleReply(e); } }}
            />
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-gray-600">{replyContent.length}/5000 • Enter للإرسال، Shift+Enter لسطر جديد</p>
              <button type="submit" disabled={replying || !replyContent.trim()}
                className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl font-medium text-white text-sm transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50">
                {replying ? 'جاري الإرسال...' : 'إرسال الرد'}
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 text-center">
            <p className="text-gray-500 text-sm mb-3">🔒 هذه التذكرة مغلقة</p>
            {isOwner && (
              <button onClick={() => handleStatusChange('OPEN')}
                className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-medium transition-all">
                🔓 إعادة فتح التذكرة
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
