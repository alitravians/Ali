'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

type Tab = 'dashboard' | 'rooms' | 'users' | 'roles' | 'announcements' | 'reports' | 'punishments' | 'audit' | 'settings';

export default function AdminPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [punishments, setPunishments] = useState<any>({ warnings: [], mutes: [], bans: [] });
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [bannedWords, setBannedWords] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [newRoom, setNewRoom] = useState({ name: '', description: '', type: 'PUBLIC' });
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', isPinned: false });
  const [searchUser, setSearchUser] = useState('');
  const [newBannedWord, setNewBannedWord] = useState('');
  const [chatEnabled, setChatEnabled] = useState(true);
  const [regEnabled, setRegEnabled] = useState(true);
  const [presenceEnabled, setPresenceEnabled] = useState(true);
  const [presencePublic, setPresencePublic] = useState(true);
  const [showLastSeen, setShowLastSeen] = useState(true);
  const [showRoomPresence, setShowRoomPresence] = useState(true);
  const [punishForm, setPunishForm] = useState({ type: 'warning', targetUserId: '', reason: '', duration: 30 });
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab]);

  const loadTabData = async (tab: Tab) => {
    setLoading(true);
    try {
      switch (tab) {
        case 'dashboard':
          const statsRes = await fetch('/api/admin/stats');
          const statsData = await statsRes.json();
          setStats(statsData);
          break;
        case 'rooms':
          const roomsRes = await fetch('/api/admin/rooms');
          setRooms(await roomsRes.json());
          break;
        case 'users':
          const usersRes = await fetch(`/api/admin/users?search=${searchUser}`);
          const usersData = await usersRes.json();
          setUsers(usersData.users || []);
          break;
        case 'reports':
          const reportsRes = await fetch('/api/reports');
          setReports(await reportsRes.json());
          break;
        case 'punishments':
          const punRes = await fetch('/api/admin/punishments');
          setPunishments(await punRes.json());
          break;
        case 'audit':
          const auditRes = await fetch('/api/admin/audit-log');
          setAuditLogs(await auditRes.json());
          break;
        case 'announcements':
          const annRes = await fetch('/api/announcements');
          setAnnouncements(await annRes.json());
          break;
        case 'settings':
          const setRes = await fetch('/api/admin/settings');
          const setData = await setRes.json();
          setSettings(setData.settings || {});
          setBannedWords(setData.bannedWords?.map((w: any) => w.word) || []);
          setChatEnabled(setData.settings?.chat_enabled !== 'false');
          setRegEnabled(setData.settings?.registration_enabled !== 'false');
          setPresenceEnabled(setData.settings?.presence_enabled !== 'false');
          setPresencePublic(setData.settings?.presence_public !== 'false');
          setShowLastSeen(setData.settings?.show_last_seen !== 'false');
          setShowRoomPresence(setData.settings?.show_room_presence !== 'false');
          break;
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const showMessage = (text: string, type: string) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const createRoom = async () => {
    if (!newRoom.name) return;
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRoom),
    });
    if (res.ok) {
      showMessage('تم إنشاء الغرفة بنجاح', 'success');
      setNewRoom({ name: '', description: '', type: 'PUBLIC' });
      loadTabData('rooms');
    }
  };

  const deleteRoom = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الغرفة؟')) return;
    await fetch('/api/admin/rooms', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    showMessage('تم حذف الغرفة', 'success');
    loadTabData('rooms');
  };

  const toggleFreezeRoom = async (id: string, currentState: boolean) => {
    await fetch('/api/admin/rooms', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isFrozen: !currentState }),
    });
    showMessage(currentState ? 'تم فتح الغرفة' : 'تم تجميد الغرفة', 'success');
    loadTabData('rooms');
  };

  const createAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) return;
    const res = await fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAnnouncement),
    });
    if (res.ok) {
      showMessage('تم نشر الإعلان', 'success');
      setNewAnnouncement({ title: '', content: '', isPinned: false });
      loadTabData('announcements');
    }
  };

  const issuePunishment = async () => {
    if (!punishForm.targetUserId || !punishForm.reason) {
      showMessage('جميع الحقول مطلوبة', 'error');
      return;
    }
    const res = await fetch('/api/admin/punishments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(punishForm),
    });
    const data = await res.json();
    if (res.ok) {
      showMessage('تم تطبيق العقوبة بنجاح', 'success');
      setPunishForm({ type: 'warning', targetUserId: '', reason: '', duration: 30 });
      loadTabData('punishments');
    } else {
      showMessage(data.error, 'error');
    }
  };

  const liftPunishment = async (type: string, id: string) => {
    await fetch('/api/admin/punishments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, id }),
    });
    showMessage('تم رفع العقوبة', 'success');
    loadTabData('punishments');
  };

  const resolveReport = async (id: string, status: string) => {
    await fetch('/api/reports', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, resolution: status === 'RESOLVED' ? 'تمت المعالجة' : 'تم الرفض' }),
    });
    showMessage('تم تحديث حالة البلاغ', 'success');
    loadTabData('reports');
  };

  const saveSettings = async () => {
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        settings: {
          ...settings,
          chat_enabled: String(chatEnabled),
          registration_enabled: String(regEnabled),
          presence_enabled: String(presenceEnabled),
          presence_public: String(presencePublic),
          show_last_seen: String(showLastSeen),
          show_room_presence: String(showRoomPresence),
        },
        bannedWords,
      }),
    });
    showMessage('تم حفظ الإعدادات', 'success');
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'لوحة القيادة', icon: '📊' },
    { id: 'rooms', label: 'إدارة الغرف', icon: '🏠' },
    { id: 'users', label: 'المستخدمين', icon: '👥' },
    { id: 'announcements', label: 'الإعلانات', icon: '📢' },
    { id: 'reports', label: 'البلاغات', icon: '🚨' },
    { id: 'punishments', label: 'العقوبات', icon: '⚖️' },
    { id: 'audit', label: 'السجل الإداري', icon: '📋' },
    { id: 'settings', label: 'الإعدادات', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900/50 border-l border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-bold gradient-text">لوحة الإدارة</h1>
          <p className="text-xs text-gray-500 mt-1">مرحباً {(session?.user as any)?.name}</p>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-right px-3 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all ${
                activeTab === tab.id ? 'bg-cyan-500/20 text-white border border-cyan-500/30' : 'text-gray-400 hover:bg-white/5'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
          {/* Team Management - separate page */}
          <Link
            href="/admin/team"
            className="w-full text-right px-3 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all text-gray-400 hover:bg-white/5"
          >
            <span>👨‍💼</span>
            إدارة فريق العمل
          </Link>
        </nav>
        <div className="p-3 border-t border-gray-800">
          <Link href="/chat" className="block text-center py-2 text-sm text-gray-400 hover:text-white bg-white/5 rounded-xl transition-colors">
            العودة للدردشة
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Message toast */}
        {message.text && (
          <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl text-sm font-medium shadow-lg ${
            message.type === 'success' ? 'bg-green-500/20 border border-green-500/30 text-green-400' : 'bg-red-500/20 border border-red-500/30 text-red-400'
          }`}>{message.text}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Dashboard */}
            {activeTab === 'dashboard' && stats && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">لوحة القيادة</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: 'المستخدمين', value: stats.stats.users, color: 'from-blue-500 to-blue-600' },
                    { label: 'الغرف', value: stats.stats.rooms, color: 'from-green-500 to-green-600' },
                    { label: 'الرسائل', value: stats.stats.messages, color: 'from-purple-500 to-purple-600' },
                    { label: 'بلاغات معلقة', value: stats.stats.pendingReports, color: 'from-orange-500 to-orange-600' },
                    { label: 'محظورين نشطين', value: stats.stats.activeBans, color: 'from-red-500 to-red-600' },
                    { label: 'مكتومين نشطين', value: stats.stats.activeMutes, color: 'from-yellow-500 to-yellow-600' },
                    { label: 'التحذيرات', value: stats.stats.warnings, color: 'from-pink-500 to-pink-600' },
                  ].map((stat, i) => (
                    <div key={i} className="glass rounded-xl p-4">
                      <p className="text-gray-400 text-xs mb-1">{stat.label}</p>
                      <p className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>{stat.value}</p>
                    </div>
                  ))}
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">آخر النشاطات</h3>
                <div className="glass rounded-xl divide-y divide-gray-800">
                  {stats.recentActivity?.map((log: any, i: number) => (
                    <div key={i} className="px-4 py-3 flex items-center justify-between text-sm">
                      <div>
                        <span className="text-cyan-400 font-medium">{log.performedBy}</span>
                        <span className="text-gray-400 mx-2">-</span>
                        <span className="text-gray-300">{log.action}</span>
                      </div>
                      <span className="text-gray-600 text-xs">{new Date(log.createdAt).toLocaleString('ar-SA')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rooms */}
            {activeTab === 'rooms' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">إدارة الغرف</h2>
                <div className="glass rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">إنشاء غرفة جديدة</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input value={newRoom.name} onChange={e => setNewRoom({ ...newRoom, name: e.target.value })} placeholder="اسم الغرفة" className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500" />
                    <input value={newRoom.description} onChange={e => setNewRoom({ ...newRoom, description: e.target.value })} placeholder="وصف الغرفة" className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500" />
                    <select value={newRoom.type} onChange={e => setNewRoom({ ...newRoom, type: e.target.value })} className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500">
                      <option value="PUBLIC">عامة</option>
                      <option value="PRIVATE">خاصة</option>
                      <option value="ANNOUNCEMENT">إعلانات</option>
                    </select>
                  </div>
                  <button onClick={createRoom} className="mt-4 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-sm text-white font-medium transition-colors">إنشاء الغرفة</button>
                </div>
                <div className="space-y-3">
                  {rooms.map((room: any) => (
                    <div key={room.id} className="glass rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium flex items-center gap-2">
                          {room.name}
                          {room.isFrozen && <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">مجمدة</span>}
                          <span className="text-xs text-gray-500">{room.type}</span>
                        </h4>
                        <p className="text-gray-400 text-xs mt-1">{room._count?.members || 0} عضو • {room._count?.messages || 0} رسالة</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleFreezeRoom(room.id, room.isFrozen)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${room.isFrozen ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {room.isFrozen ? 'فتح' : 'تجميد'}
                        </button>
                        <button onClick={() => deleteRoom(room.id)} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium">حذف</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Users */}
            {activeTab === 'users' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">إدارة المستخدمين</h2>
                <div className="flex gap-3 mb-6">
                  <input value={searchUser} onChange={e => setSearchUser(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadTabData('users')} placeholder="بحث بالاسم أو البريد..." className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500" />
                  <button onClick={() => loadTabData('users')} className="px-6 py-2.5 bg-cyan-600 rounded-xl text-sm text-white font-medium">بحث</button>
                </div>

                {/* Punishment form */}
                <div className="glass rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">تطبيق عقوبة</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select value={punishForm.type} onChange={e => setPunishForm({ ...punishForm, type: e.target.value })} className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500">
                      <option value="warning">تحذير</option>
                      <option value="mute">كتم</option>
                      <option value="ban">حظر</option>
                    </select>
                    <select value={punishForm.targetUserId} onChange={e => setPunishForm({ ...punishForm, targetUserId: e.target.value })} className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500">
                      <option value="">اختر المستخدم</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                    </select>
                    <input value={punishForm.reason} onChange={e => setPunishForm({ ...punishForm, reason: e.target.value })} placeholder="السبب" className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500" />
                    {punishForm.type !== 'warning' && (
                      <input type="number" value={punishForm.duration} onChange={e => setPunishForm({ ...punishForm, duration: Number(e.target.value) })} placeholder="المدة (بالدقائق)" className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500" />
                    )}
                  </div>
                  <button onClick={issuePunishment} className="mt-4 px-6 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-sm text-white font-medium transition-colors">تطبيق العقوبة</button>
                </div>

                <div className="space-y-3">
                  {users.map((u: any) => (
                    <div key={u.id} className="glass rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-sm font-bold">{u.username[0]?.toUpperCase()}</div>
                        <div>
                          <p className="text-white font-medium flex items-center gap-2">
                            {u.username}
                            <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: u.highestRole.color + '20', color: u.highestRole.color }}>{u.highestRole.displayName}</span>
                          </p>
                          <p className="text-gray-500 text-xs">{u.email} • {u.messageCount} رسالة • {u.warningCount} تحذير</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${u.status === 'ONLINE' ? 'bg-green-400' : 'bg-gray-600'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Announcements */}
            {activeTab === 'announcements' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">الإعلانات</h2>
                <div className="glass rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">إعلان جديد</h3>
                  <input value={newAnnouncement.title} onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })} placeholder="عنوان الإعلان" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm mb-3 focus:outline-none focus:border-cyan-500" />
                  <textarea value={newAnnouncement.content} onChange={e => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })} placeholder="محتوى الإعلان" rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm mb-3 focus:outline-none focus:border-cyan-500 resize-none" />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-gray-400">
                      <input type="checkbox" checked={newAnnouncement.isPinned} onChange={e => setNewAnnouncement({ ...newAnnouncement, isPinned: e.target.checked })} className="rounded" />
                      تثبيت الإعلان
                    </label>
                    <button onClick={createAnnouncement} className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-sm text-white font-medium transition-colors">نشر الإعلان</button>
                  </div>
                </div>
                <div className="space-y-3">
                  {announcements.map((ann: any) => (
                    <div key={ann.id} className="glass rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium flex items-center gap-2">
                          {ann.isPinned && <span className="text-yellow-400">📌</span>}
                          {ann.title}
                        </h4>
                        <span className="text-gray-600 text-xs">{new Date(ann.createdAt).toLocaleString('ar-SA')}</span>
                      </div>
                      <p className="text-gray-400 text-sm">{ann.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reports */}
            {activeTab === 'reports' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">البلاغات</h2>
                <div className="space-y-3">
                  {reports.map((report: any) => (
                    <div key={report.id} className="glass rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-cyan-400 text-sm font-medium">{report.reporter?.username}</span>
                          <span className="text-gray-500 text-sm mx-2">أبلغ عن</span>
                          <span className="text-orange-400 text-sm font-medium">{report.targetUser?.username || 'غير محدد'}</span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          report.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                          report.status === 'RESOLVED' ? 'bg-green-500/20 text-green-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>{report.status}</span>
                      </div>
                      <p className="text-gray-300 text-sm mb-1">السبب: {report.reason}</p>
                      {report.message && <p className="text-gray-500 text-xs mb-2">الرسالة: &quot;{report.message.content}&quot;</p>}
                      {report.status === 'PENDING' && (
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => resolveReport(report.id, 'RESOLVED')} className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium">معالجة</button>
                          <button onClick={() => resolveReport(report.id, 'DISMISSED')} className="px-3 py-1.5 bg-gray-500/20 text-gray-400 rounded-lg text-xs font-medium">رفض</button>
                        </div>
                      )}
                    </div>
                  ))}
                  {reports.length === 0 && <p className="text-gray-500 text-center py-8">لا توجد بلاغات</p>}
                </div>
              </div>
            )}

            {/* Punishments */}
            {activeTab === 'punishments' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">سجل العقوبات</h2>
                {/* Bans */}
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">🚫 الحظر</h3>
                <div className="space-y-2 mb-6">
                  {punishments.bans?.map((ban: any) => (
                    <div key={ban.id} className="glass rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="text-white text-sm"><span className="text-red-400">{ban.user?.username}</span> - {ban.reason}</p>
                        <p className="text-gray-500 text-xs">بواسطة {ban.issuer?.username} • {ban.duration ? `${ban.duration} دقيقة` : 'دائم'} • {ban.isActive ? 'نشط' : 'منتهي'}</p>
                      </div>
                      {ban.isActive && (
                        <button onClick={() => liftPunishment('ban', ban.id)} className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium">فك الحظر</button>
                      )}
                    </div>
                  ))}
                  {(!punishments.bans || punishments.bans.length === 0) && <p className="text-gray-500 text-sm">لا يوجد حظر</p>}
                </div>
                {/* Mutes */}
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">🔇 الكتم</h3>
                <div className="space-y-2 mb-6">
                  {punishments.mutes?.map((mute: any) => (
                    <div key={mute.id} className="glass rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="text-white text-sm"><span className="text-yellow-400">{mute.user?.username}</span> - {mute.reason}</p>
                        <p className="text-gray-500 text-xs">بواسطة {mute.issuer?.username} • {mute.duration} دقيقة • {mute.isActive ? 'نشط' : 'منتهي'}</p>
                      </div>
                      {mute.isActive && (
                        <button onClick={() => liftPunishment('mute', mute.id)} className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium">فك الكتم</button>
                      )}
                    </div>
                  ))}
                  {(!punishments.mutes || punishments.mutes.length === 0) && <p className="text-gray-500 text-sm">لا يوجد كتم</p>}
                </div>
                {/* Warnings */}
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">⚠️ التحذيرات</h3>
                <div className="space-y-2">
                  {punishments.warnings?.map((warn: any) => (
                    <div key={warn.id} className="glass rounded-xl p-4">
                      <p className="text-white text-sm"><span className="text-orange-400">{warn.user?.username}</span> - {warn.reason}</p>
                      <p className="text-gray-500 text-xs">بواسطة {warn.issuer?.username} • {new Date(warn.createdAt).toLocaleString('ar-SA')}</p>
                    </div>
                  ))}
                  {(!punishments.warnings || punishments.warnings.length === 0) && <p className="text-gray-500 text-sm">لا توجد تحذيرات</p>}
                </div>
              </div>
            )}

            {/* Audit Log */}
            {activeTab === 'audit' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">السجل الإداري</h2>
                <div className="glass rounded-xl divide-y divide-gray-800">
                  {auditLogs.map((log: any) => (
                    <div key={log.id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <span className="text-cyan-400 text-sm font-medium">{log.performerName}</span>
                        <span className="text-gray-400 text-sm mx-2">•</span>
                        <span className="text-white text-sm">{log.action}</span>
                        {log.details && typeof log.details === 'object' && (
                          <span className="text-gray-500 text-xs mr-2">{JSON.stringify(log.details).slice(0, 80)}</span>
                        )}
                      </div>
                      <span className="text-gray-600 text-xs whitespace-nowrap">{new Date(log.createdAt).toLocaleString('ar-SA')}</span>
                    </div>
                  ))}
                  {auditLogs.length === 0 && <p className="text-gray-500 text-center py-8">لا توجد سجلات</p>}
                </div>
              </div>
            )}

            {/* Settings */}
            {activeTab === 'settings' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">الإعدادات العامة</h2>
                <div className="space-y-6">
                  <div className="glass rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">التحكم العام</h3>
                    <div className="space-y-4">
                      <label className="flex items-center justify-between">
                        <span className="text-gray-300">تفعيل الدردشة</span>
                        <button onClick={() => setChatEnabled(!chatEnabled)} className={`w-12 h-6 rounded-full transition-colors ${chatEnabled ? 'bg-green-500' : 'bg-gray-700'}`}>
                          <div className={`w-5 h-5 bg-white rounded-full transition-transform ${chatEnabled ? '-translate-x-6' : '-translate-x-0.5'}`} />
                        </button>
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-gray-300">تفعيل التسجيل</span>
                        <button onClick={() => setRegEnabled(!regEnabled)} className={`w-12 h-6 rounded-full transition-colors ${regEnabled ? 'bg-green-500' : 'bg-gray-700'}`}>
                          <div className={`w-5 h-5 bg-white rounded-full transition-transform ${regEnabled ? '-translate-x-6' : '-translate-x-0.5'}`} />
                        </button>
                      </label>
                      <label className="flex items-center justify-between">
                        <div>
                          <span className="text-gray-300">عرض المتواجدين حالياً</span>
                          <p className="text-gray-500 text-xs mt-0.5">إظهار قائمة المتواجدين في الدردشة</p>
                        </div>
                        <button onClick={() => setPresenceEnabled(!presenceEnabled)} className={`w-12 h-6 rounded-full transition-colors ${presenceEnabled ? 'bg-green-500' : 'bg-gray-700'}`}>
                          <div className={`w-5 h-5 bg-white rounded-full transition-transform ${presenceEnabled ? '-translate-x-6' : '-translate-x-0.5'}`} />
                        </button>
                      </label>
                      <label className="flex items-center justify-between">
                        <div>
                          <span className="text-gray-300">المتواجدون للجميع</span>
                          <p className="text-gray-500 text-xs mt-0.5">إظهار القائمة لجميع الأعضاء أو فقط للمشرفين</p>
                        </div>
                        <button onClick={() => setPresencePublic(!presencePublic)} className={`w-12 h-6 rounded-full transition-colors ${presencePublic ? 'bg-green-500' : 'bg-gray-700'}`}>
                          <div className={`w-5 h-5 bg-white rounded-full transition-transform ${presencePublic ? '-translate-x-6' : '-translate-x-0.5'}`} />
                        </button>
                      </label>
                      <label className="flex items-center justify-between">
                        <div>
                          <span className="text-gray-300">إظهار آخر ظهور</span>
                          <p className="text-gray-500 text-xs mt-0.5">عرض وقت آخر ظهور للمستخدمين غير المتصلين</p>
                        </div>
                        <button onClick={() => setShowLastSeen(!showLastSeen)} className={`w-12 h-6 rounded-full transition-colors ${showLastSeen ? 'bg-green-500' : 'bg-gray-700'}`}>
                          <div className={`w-5 h-5 bg-white rounded-full transition-transform ${showLastSeen ? '-translate-x-6' : '-translate-x-0.5'}`} />
                        </button>
                      </label>
                      <label className="flex items-center justify-between">
                        <div>
                          <span className="text-gray-300">المتواجدون في كل غرفة</span>
                          <p className="text-gray-500 text-xs mt-0.5">إظهار عدد المتواجدين داخل كل غرفة</p>
                        </div>
                        <button onClick={() => setShowRoomPresence(!showRoomPresence)} className={`w-12 h-6 rounded-full transition-colors ${showRoomPresence ? 'bg-green-500' : 'bg-gray-700'}`}>
                          <div className={`w-5 h-5 bg-white rounded-full transition-transform ${showRoomPresence ? '-translate-x-6' : '-translate-x-0.5'}`} />
                        </button>
                      </label>
                    </div>
                  </div>

                  <div className="glass rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">الكلمات الممنوعة</h3>
                    <div className="flex gap-3 mb-4">
                      <input value={newBannedWord} onChange={e => setNewBannedWord(e.target.value)} placeholder="أضف كلمة ممنوعة" className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500" />
                      <button onClick={() => { if (newBannedWord) { setBannedWords([...bannedWords, newBannedWord]); setNewBannedWord(''); } }} className="px-4 py-2.5 bg-red-600 rounded-xl text-sm text-white font-medium">إضافة</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {bannedWords.map((word, i) => (
                        <span key={i} className="bg-red-500/10 text-red-400 px-3 py-1 rounded-lg text-sm flex items-center gap-2">
                          {word}
                          <button onClick={() => setBannedWords(bannedWords.filter((_, idx) => idx !== i))} className="hover:text-red-300">×</button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <button onClick={saveSettings} className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 rounded-xl text-white font-medium transition-colors">
                    حفظ الإعدادات
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
