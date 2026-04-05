'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

const DEPARTMENTS: Record<string, string> = {
  technical: 'مشاكل تقنية',
  account: 'مشاكل الحساب',
  chat: 'مشاكل الدردشة',
  notifications: 'مشاكل الإشعارات',
  ranks: 'مشاكل الرتب أو الشارات',
  items: 'مشاكل الحقيبة أو العناصر',
  suggestions: 'الاقتراحات',
  reports: 'البلاغات',
  general: 'الدعم العام',
};

const TYPES: Record<string, string> = {
  bug: 'خطأ تقني',
  help: 'طلب مساعدة',
  report: 'بلاغ',
  inquiry: 'استفسار',
  suggestion: 'اقتراح',
  account_issue: 'مشكلة في الحساب',
  feature_issue: 'مشكلة في ميزة',
};

const PRIORITIES: Record<string, { label: string; color: string; bg: string }> = {
  LOW: { label: 'منخفضة', color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20' },
  MEDIUM: { label: 'متوسطة', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  HIGH: { label: 'عالية', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  URGENT: { label: 'عاجلة', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
};

const STATUSES: Record<string, { label: string; color: string; bg: string }> = {
  OPEN: { label: 'مفتوحة', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  REVIEWING: { label: 'قيد المراجعة', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  REPLIED: { label: 'تم الرد', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
  WAITING_USER: { label: 'بانتظار المستخدم', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  CLOSED: { label: 'مغلقة', color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20' },
  ESCALATED: { label: 'مصعدة للإدارة', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
};

export default function SupportPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [type, setType] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [description, setDescription] = useState('');

  const fetchTickets = async () => {
    try {
      const url = filterStatus ? `/api/tickets?status=${filterStatus}` : '/api/tickets';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchTickets(); }, [filterStatus]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, department, type, priority, description }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('تم إنشاء التذكرة بنجاح');
        setShowCreate(false);
        setTitle(''); setDepartment(''); setType(''); setPriority('MEDIUM'); setDescription('');
        fetchTickets();
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setError(data.error || 'فشل في إنشاء التذكرة');
      }
    } catch {
      setError('حدث خطأ في الاتصال');
    }
    setCreating(false);
  };

  return (
    <div className="min-h-screen bg-[#030711] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-amber-600/[0.05] rounded-full blur-[120px] bg-orb-1" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-violet-600/[0.04] rounded-full blur-[100px] bg-orb-2" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">🎫 الدعم الفني</h1>
            <p className="text-gray-500 text-sm">افتح تذكرة دعم فني وتابع حالتها</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-500 hover:text-white text-xs px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-all">← الرئيسية</Link>
            <button
              onClick={() => setShowCreate(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl font-medium text-white text-sm transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30"
            >
              + تذكرة جديدة
            </button>
          </div>
        </div>

        {success && (
          <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-400 text-sm text-center">{success}</div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setFilterStatus('')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!filterStatus ? 'bg-violet-500/15 text-violet-400 border border-violet-500/25' : 'bg-white/[0.03] text-gray-500 border border-white/[0.06] hover:text-white'}`}>الكل</button>
          {Object.entries(STATUSES).map(([key, s]) => (
            <button key={key} onClick={() => setFilterStatus(key)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterStatus === key ? `${s.bg} ${s.color} border` : 'bg-white/[0.03] text-gray-500 border border-white/[0.06] hover:text-white'}`}>{s.label}</button>
          ))}
        </div>

        {/* Tickets List */}
        {loading ? (
          <div className="text-center py-20"><span className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin inline-block" /></div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-20 bg-white/[0.02] rounded-2xl border border-white/[0.04]">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-gray-400 mb-2">لا توجد تذاكر {filterStatus ? STATUSES[filterStatus]?.label : ''}</p>
            <p className="text-gray-600 text-sm">اضغط &quot;تذكرة جديدة&quot; لفتح تذكرة دعم فني</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => {
              const st = STATUSES[ticket.status] || STATUSES.OPEN;
              const pr = PRIORITIES[ticket.priority] || PRIORITIES.MEDIUM;
              return (
                <Link
                  key={ticket.id}
                  href={`/support/${ticket.id}`}
                  className="block bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.1] rounded-xl p-5 transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium text-sm mb-1.5 truncate group-hover:text-violet-300 transition-colors">{ticket.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className={`px-2 py-0.5 rounded-md border ${st.bg} ${st.color}`}>{st.label}</span>
                        <span className={`px-2 py-0.5 rounded-md border ${pr.bg} ${pr.color}`}>{pr.label}</span>
                        <span className="text-gray-600">{DEPARTMENTS[ticket.department] || ticket.department}</span>
                        <span className="text-gray-700">•</span>
                        <span className="text-gray-600">{new Date(ticket.createdAt).toLocaleDateString('ar-SA')}</span>
                      </div>
                    </div>
                    <div className="text-gray-600 text-[11px] flex items-center gap-1.5 shrink-0">
                      <span>💬 {ticket._count?.replies || 0}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-[#0A0F1C] border border-white/[0.06] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-1">تذكرة دعم جديدة</h3>
              <p className="text-gray-500 text-xs mb-6">صف مشكلتك بالتفصيل وسيتم الرد عليك في أقرب وقت</p>

              {error && <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 text-red-400 text-sm">{error}</div>}

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1.5">عنوان الشكوى</label>
                  <input
                    type="text" value={title} onChange={e => setTitle(e.target.value)} maxLength={200} required
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/40 transition-all placeholder:text-gray-600"
                    placeholder="اكتب عنواناً واضحاً لمشكلتك"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-400 text-xs font-medium mb-1.5">القسم</label>
                    <select value={department} onChange={e => setDepartment(e.target.value)} required
                      className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/40 transition-all">
                      <option value="" className="bg-[#0A0F1C]">اختر القسم</option>
                      {Object.entries(DEPARTMENTS).map(([k, v]) => <option key={k} value={k} className="bg-[#0A0F1C]">{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs font-medium mb-1.5">نوع الشكوى</label>
                    <select value={type} onChange={e => setType(e.target.value)} required
                      className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/40 transition-all">
                      <option value="" className="bg-[#0A0F1C]">اختر النوع</option>
                      {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k} className="bg-[#0A0F1C]">{v}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1.5">الأولوية</label>
                  <div className="flex gap-2">
                    {Object.entries(PRIORITIES).map(([k, v]) => (
                      <button key={k} type="button" onClick={() => setPriority(k)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${priority === k ? `${v.bg} ${v.color}` : 'bg-white/[0.02] border-white/[0.06] text-gray-500 hover:text-white'}`}
                      >{v.label}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1.5">الوصف الكامل</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={5000} required rows={5}
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/40 transition-all resize-none placeholder:text-gray-600"
                    placeholder="اشرح مشكلتك بالتفصيل..."
                  />
                  <p className="text-[10px] text-gray-600 mt-1 text-left">{description.length}/5000</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreate(false)}
                    className="flex-1 py-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-xl text-gray-400 hover:text-white text-sm font-medium transition-all">إلغاء</button>
                  <button type="submit" disabled={creating}
                    className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl font-semibold text-white text-sm transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50">
                    {creating ? 'جاري الإنشاء...' : 'إرسال التذكرة'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
