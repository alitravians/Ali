'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

type Tab = 'overview' | 'reports' | 'actions' | 'mylog' | 'notes';

export default function ModeratorPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [reports, setReports] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [punishments, setPunishments] = useState<any>({ warnings: [], mutes: [], bans: [] });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [punishForm, setPunishForm] = useState({ type: 'warning', targetUserId: '', reason: '', duration: 30 });
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => { loadData(); }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'reports') {
        const res = await fetch('/api/reports');
        setReports(await res.json());
      } else if (activeTab === 'mylog' || activeTab === 'overview') {
        const res = await fetch('/api/admin/audit-log');
        const logs = await res.json();
        setAuditLogs(activeTab === 'mylog' ? logs.filter((l: any) => l.performedBy === user?.id) : logs);
      } else if (activeTab === 'actions') {
        const [punRes, usersRes] = await Promise.all([
          fetch('/api/admin/punishments'),
          fetch('/api/admin/users?limit=100'),
        ]);
        setPunishments(await punRes.json());
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const showMsg = (text: string, type: string) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const issuePunishment = async () => {
    if (!punishForm.targetUserId || !punishForm.reason) { showMsg('جميع الحقول مطلوبة', 'error'); return; }
    const res = await fetch('/api/admin/punishments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(punishForm),
    });
    const data = await res.json();
    if (res.ok) { showMsg('تم تطبيق العقوبة', 'success'); setPunishForm({ type: 'warning', targetUserId: '', reason: '', duration: 30 }); loadData(); }
    else showMsg(data.error, 'error');
  };

  const resolveReport = async (id: string, status: string) => {
    await fetch('/api/reports', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status, resolution: status === 'RESOLVED' ? 'تمت المعالجة' : 'تم الرفض' }) });
    showMsg('تم تحديث البلاغ', 'success');
    loadData();
  };

  const liftPunishment = async (type: string, id: string) => {
    await fetch('/api/admin/punishments', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, id }) });
    showMsg('تم رفع العقوبة', 'success');
    loadData();
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'نظرة عامة', icon: '📊' },
    { id: 'reports', label: 'البلاغات', icon: '🚨' },
    { id: 'actions', label: 'إجراءات', icon: '⚡' },
    { id: 'mylog', label: 'سجل إجراءاتي', icon: '📋' },
    { id: 'notes', label: 'ملاحظات الإدارة', icon: '📝' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <div className="w-60 bg-gray-900/50 border-l border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-lg font-bold text-green-400">لوحة المشرفين</h1>
          <p className="text-xs text-gray-500 mt-1">{user?.name} - {user?.roleDisplayName}</p>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full text-right px-3 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-green-500/20 text-white border border-green-500/30' : 'text-gray-400 hover:bg-white/5'}`}>
              <span>{tab.icon}</span>{tab.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-800">
          <Link href="/chat" className="block text-center py-2 text-sm text-gray-400 hover:text-white bg-white/5 rounded-xl">العودة للدردشة</Link>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {message.text && (
          <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl text-sm font-medium shadow-lg ${message.type === 'success' ? 'bg-green-500/20 border border-green-500/30 text-green-400' : 'bg-red-500/20 border border-red-500/30 text-red-400'}`}>{message.text}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" /></div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">نظرة عامة</h2>
                <div className="glass rounded-xl p-6 mb-6">
                  <p className="text-gray-300 mb-4">مرحباً <span className="text-green-400 font-bold">{user?.name}</span>، أنت مسجل كـ <span style={{ color: user?.roleColor }}>{user?.roleDisplayName}</span></p>
                  <p className="text-gray-400 text-sm">يمكنك من هنا مراجعة البلاغات، تطبيق العقوبات، ومتابعة سجل إجراءاتك.</p>
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">آخر الإجراءات</h3>
                <div className="glass rounded-xl divide-y divide-gray-800">
                  {auditLogs.slice(0, 10).map((log: any) => (
                    <div key={log.id} className="px-4 py-3 flex items-center justify-between text-sm">
                      <div>
                        <span className="text-green-400">{log.performerName}</span>
                        <span className="text-gray-400 mx-2">•</span>
                        <span className="text-white">{log.action}</span>
                      </div>
                      <span className="text-gray-600 text-xs">{new Date(log.createdAt).toLocaleString('ar-SA')}</span>
                    </div>
                  ))}
                  {auditLogs.length === 0 && <p className="text-gray-500 text-center py-6">لا توجد سجلات</p>}
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">البلاغات</h2>
                <div className="space-y-3">
                  {reports.map((r: any) => (
                    <div key={r.id} className="glass rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-green-400 text-sm">{r.reporter?.username}</span>
                          <span className="text-gray-500 text-sm mx-2">←</span>
                          <span className="text-orange-400 text-sm">{r.targetUser?.username || '—'}</span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${r.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>{r.status}</span>
                      </div>
                      <p className="text-gray-300 text-sm">السبب: {r.reason}</p>
                      {r.message && <p className="text-gray-500 text-xs mt-1">الرسالة: &quot;{r.message.content}&quot;</p>}
                      {r.room && <p className="text-gray-500 text-xs">الغرفة: {r.room.name}</p>}
                      {r.status === 'PENDING' && (
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => resolveReport(r.id, 'RESOLVED')} className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs">معالجة</button>
                          <button onClick={() => resolveReport(r.id, 'DISMISSED')} className="px-3 py-1.5 bg-gray-500/20 text-gray-400 rounded-lg text-xs">رفض</button>
                          <button onClick={() => resolveReport(r.id, 'ESCALATED')} className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-xs">تصعيد للإدارة</button>
                        </div>
                      )}
                    </div>
                  ))}
                  {reports.length === 0 && <p className="text-gray-500 text-center py-8">لا توجد بلاغات</p>}
                </div>
              </div>
            )}

            {activeTab === 'actions' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">إجراءات الإشراف</h2>
                <div className="glass rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">تطبيق عقوبة</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select value={punishForm.type} onChange={e => setPunishForm({ ...punishForm, type: e.target.value })} className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500">
                      <option value="warning">تحذير</option>
                      <option value="mute">كتم</option>
                      <option value="ban">حظر مؤقت</option>
                    </select>
                    <select value={punishForm.targetUserId} onChange={e => setPunishForm({ ...punishForm, targetUserId: e.target.value })} className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500">
                      <option value="">اختر المستخدم</option>
                      {users.map((u: any) => <option key={u.id} value={u.id}>{u.username}</option>)}
                    </select>
                    <input value={punishForm.reason} onChange={e => setPunishForm({ ...punishForm, reason: e.target.value })} placeholder="السبب" className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500" />
                    {punishForm.type !== 'warning' && (
                      <input type="number" value={punishForm.duration} onChange={e => setPunishForm({ ...punishForm, duration: Number(e.target.value) })} placeholder="المدة (بالدقائق)" className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500" />
                    )}
                  </div>
                  <button onClick={issuePunishment} className="mt-4 px-6 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-sm text-white font-medium">تطبيق</button>
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">العقوبات النشطة</h3>
                <div className="space-y-2">
                  {punishments.mutes?.filter((m: any) => m.isActive).map((mute: any) => (
                    <div key={mute.id} className="glass rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <span className="text-yellow-400 text-sm">{mute.user?.username}</span>
                        <span className="text-gray-500 text-xs mr-2">مكتوم • {mute.reason}</span>
                      </div>
                      <button onClick={() => liftPunishment('mute', mute.id)} className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs">فك</button>
                    </div>
                  ))}
                  {punishments.bans?.filter((b: any) => b.isActive).map((ban: any) => (
                    <div key={ban.id} className="glass rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <span className="text-red-400 text-sm">{ban.user?.username}</span>
                        <span className="text-gray-500 text-xs mr-2">محظور • {ban.reason}</span>
                      </div>
                      <button onClick={() => liftPunishment('ban', ban.id)} className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs">فك</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'mylog' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">سجل إجراءاتي</h2>
                <div className="glass rounded-xl divide-y divide-gray-800">
                  {auditLogs.map((log: any) => (
                    <div key={log.id} className="px-4 py-3 text-sm">
                      <span className="text-white">{log.action}</span>
                      <span className="text-gray-600 text-xs mr-3">{new Date(log.createdAt).toLocaleString('ar-SA')}</span>
                    </div>
                  ))}
                  {auditLogs.length === 0 && <p className="text-gray-500 text-center py-6">لا توجد إجراءات مسجلة</p>}
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">ملاحظات الإدارة</h2>
                <div className="glass rounded-xl p-8 text-center">
                  <p className="text-gray-400">ملاحظات وتعليمات الإدارة ستظهر هنا</p>
                  <p className="text-gray-500 text-sm mt-2">يتم إضافتها من قبل فريق الإدارة</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
