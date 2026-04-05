'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

// ==================== Types ====================
type Tab = 'dashboard' | 'rooms' | 'users' | 'announcements' | 'reports' | 'punishments' | 'audit' | 'settings';

interface SidebarGroup {
  title: string;
  items: { id: Tab | 'team'; label: string; icon: string; badge?: number; href?: string }[];
}

// ==================== Component ====================
export default function AdminPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Data states
  const [stats, setStats] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
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
  const searchUserRef = useRef('');
  const [newBannedWord, setNewBannedWord] = useState('');
  const [auditFilter, setAuditFilter] = useState('all');

  // Settings states - organized by section
  const [chatEnabled, setChatEnabled] = useState(true);
  const [regEnabled, setRegEnabled] = useState(true);
  const [presenceEnabled, setPresenceEnabled] = useState(true);
  const [presencePublic, setPresencePublic] = useState(true);
  const [showLastSeen, setShowLastSeen] = useState(true);
  const [showRoomPresence, setShowRoomPresence] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [siteName, setSiteName] = useState('ChatZone');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [settingsSection, setSettingsSection] = useState<'site' | 'chat' | 'presence' | 'security'>('site');

  // Punishment form
  const [punishForm, setPunishForm] = useState({ type: 'warning', targetUserId: '', reason: '', duration: 30 });
  const [punishFilter, setPunishFilter] = useState<'all' | 'active'>('all');

  // Role change
  const [roleChangeUser, setRoleChangeUser] = useState<string>('');
  const [roleChangeRole, setRoleChangeRole] = useState<string>('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState<any>(null);

  // Toast
  const [message, setMessage] = useState({ text: '', type: '' });

  // Pending counts for badges
  const [pendingReports, setPendingReports] = useState(0);

  // ==================== Data Loading ====================
  const loadTabData = useCallback(async (tab: Tab) => {
    setLoading(true);
    try {
      switch (tab) {
        case 'dashboard': {
          const statsRes = await fetch('/api/admin/stats');
          const statsData = await statsRes.json();
          setStats(statsData);
          setPendingReports(statsData?.stats?.pendingReports || 0);
          break;
        }
        case 'rooms': {
          const roomsRes = await fetch('/api/admin/rooms');
          setRooms(await roomsRes.json());
          break;
        }
        case 'users': {
          const usersRes = await fetch(`/api/admin/users?search=${searchUserRef.current}`);
          const usersData = await usersRes.json();
          setUsers(usersData.users || []);
          // Also load roles for role management
          const rolesRes = await fetch('/api/admin/roles');
          if (rolesRes.ok) {
            const rolesData = await rolesRes.json();
            setRoles(rolesData.roles || []);
          }
          break;
        }
        case 'reports': {
          const reportsRes = await fetch('/api/reports');
          const reportsData = await reportsRes.json();
          setReports(reportsData);
          setPendingReports(reportsData.filter((r: any) => r.status === 'PENDING').length);
          break;
        }
        case 'punishments': {
          const punRes = await fetch('/api/admin/punishments');
          setPunishments(await punRes.json());
          // Load users for punishment form
          const usersForPun = await fetch('/api/admin/users?search=');
          const usersDataPun = await usersForPun.json();
          setUsers(usersDataPun.users || []);
          break;
        }
        case 'audit': {
          const auditRes = await fetch('/api/admin/audit-log');
          setAuditLogs(await auditRes.json());
          break;
        }
        case 'announcements': {
          const annRes = await fetch('/api/announcements');
          setAnnouncements(await annRes.json());
          break;
        }
        case 'settings': {
          const setRes = await fetch('/api/admin/settings');
          const setData = await setRes.json();
          const s = setData.settings || {};
          setSettings(s);
          setBannedWords(setData.bannedWords?.map((w: any) => w.word) || []);
          setChatEnabled(s.chat_enabled !== 'false');
          setRegEnabled(s.registration_enabled !== 'false');
          setPresenceEnabled(s.presence_enabled !== 'false');
          setPresencePublic(s.presence_public !== 'false');
          setShowLastSeen(s.show_last_seen !== 'false');
          setShowRoomPresence(s.show_room_presence !== 'false');
          setMaintenanceMode(s.maintenance_mode === 'true');
          setMaintenanceMessage(s.maintenance_message || '');
          setSiteName(s.site_name || 'ChatZone');
          setWelcomeMessage(s.welcome_message || '');
          break;
        }
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadTabData(activeTab); }, [activeTab, loadTabData]);

  // Load initial pending reports count
  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(d => {
      setPendingReports(d?.stats?.pendingReports || 0);
    }).catch(() => {});
  }, []);

  // ==================== Actions ====================
  const showMsg = (text: string, type: string) => {
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
      showMsg('تم إنشاء الغرفة بنجاح', 'success');
      setNewRoom({ name: '', description: '', type: 'PUBLIC' });
      loadTabData('rooms');
    }
  };

  const deleteRoom = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الغرفة؟')) return;
    await fetch('/api/admin/rooms', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    showMsg('تم حذف الغرفة', 'success');
    loadTabData('rooms');
  };

  const toggleFreezeRoom = async (id: string, currentState: boolean) => {
    await fetch('/api/admin/rooms', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isFrozen: !currentState }),
    });
    showMsg(currentState ? 'تم فتح الغرفة' : 'تم تجميد الغرفة', 'success');
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
      showMsg('تم نشر الإعلان', 'success');
      setNewAnnouncement({ title: '', content: '', isPinned: false });
      loadTabData('announcements');
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm('هل تريد حذف هذا الإعلان؟')) return;
    await fetch('/api/announcements', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    showMsg('تم حذف الإعلان', 'success');
    loadTabData('announcements');
  };

  const issuePunishment = async () => {
    if (!punishForm.targetUserId || !punishForm.reason) {
      showMsg('جميع الحقول مطلوبة', 'error');
      return;
    }
    const res = await fetch('/api/admin/punishments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(punishForm),
    });
    const data = await res.json();
    if (res.ok) {
      showMsg('تم تطبيق العقوبة بنجاح', 'success');
      setPunishForm({ type: 'warning', targetUserId: '', reason: '', duration: 30 });
      loadTabData('punishments');
    } else {
      showMsg(data.error, 'error');
    }
  };

  const liftPunishment = async (type: string, id: string) => {
    await fetch('/api/admin/punishments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, id }),
    });
    showMsg('تم رفع العقوبة', 'success');
    loadTabData('punishments');
  };

  const resolveReport = async (id: string, status: string) => {
    await fetch('/api/reports', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, resolution: status === 'RESOLVED' ? 'تمت المعالجة' : 'تم الرفض' }),
    });
    showMsg('تم تحديث حالة البلاغ', 'success');
    loadTabData('reports');
  };

  const changeUserRole = async () => {
    if (!selectedUserForRole || !roleChangeRole) return;
    const res = await fetch('/api/admin/roles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: selectedUserForRole.id, roleId: roleChangeRole }),
    });
    if (res.ok) {
      showMsg('تم تغيير رتبة المستخدم بنجاح', 'success');
      setShowRoleModal(false);
      setSelectedUserForRole(null);
      setRoleChangeRole('');
      loadTabData('users');
    } else {
      const data = await res.json();
      showMsg(data.error || 'فشل في تغيير الرتبة', 'error');
    }
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
          maintenance_mode: String(maintenanceMode),
          maintenance_message: maintenanceMessage,
          site_name: siteName,
          welcome_message: welcomeMessage,
        },
        bannedWords,
      }),
    });
    showMsg('تم حفظ الإعدادات بنجاح', 'success');
  };

  // ==================== Sidebar Config ====================
  const sidebarGroups: SidebarGroup[] = [
    {
      title: 'نظرة عامة',
      items: [
        { id: 'dashboard', label: 'لوحة القيادة', icon: '📊' },
      ],
    },
    {
      title: 'إدارة المحتوى',
      items: [
        { id: 'rooms', label: 'إدارة الغرف', icon: '🏠' },
        { id: 'announcements', label: 'الإعلانات', icon: '📢' },
      ],
    },
    {
      title: 'إدارة المستخدمين',
      items: [
        { id: 'users', label: 'المستخدمين', icon: '👥' },
        { id: 'punishments', label: 'العقوبات', icon: '⚖️' },
        { id: 'reports', label: 'البلاغات', icon: '🚨', badge: pendingReports },
      ],
    },
    {
      title: 'النظام',
      items: [
        { id: 'team' as any, label: 'فريق العمل', icon: '👨‍💼', href: '/admin/team' },
        { id: 'audit', label: 'السجل الإداري', icon: '📋' },
        { id: 'settings', label: 'الإعدادات', icon: '⚙️' },
      ],
    },
  ];

  // ==================== Settings Sub-sections ====================
  const settingsSections = [
    { id: 'site' as const, label: 'إعدادات الموقع', icon: '🌐', desc: 'اسم الموقع، وضع الصيانة، رسالة الترحيب' },
    { id: 'chat' as const, label: 'إعدادات الدردشة', icon: '💬', desc: 'تفعيل الدردشة، الكلمات الممنوعة' },
    { id: 'presence' as const, label: 'إعدادات المتواجدين', icon: '👁', desc: 'التحكم بعرض المتواجدين وآخر ظهور' },
    { id: 'security' as const, label: 'الأمان والتسجيل', icon: '🔒', desc: 'تفعيل التسجيل وإعدادات الأمان' },
  ];

  // ==================== Toggle Component ====================
  const Toggle = ({ enabled, onChange, label, desc }: { enabled: boolean; onChange: () => void; label: string; desc?: string }) => (
    <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-gray-800/40 hover:bg-gray-800/60 transition-colors">
      <div className="flex-1 ml-4">
        <span className="text-gray-200 text-sm font-medium">{label}</span>
        {desc && <p className="text-gray-500 text-xs mt-0.5">{desc}</p>}
      </div>
      <button
        onClick={onChange}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${enabled ? 'bg-cyan-500' : 'bg-gray-700'}`}
      >
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${enabled ? 'right-0.5' : 'right-[22px]'}`} />
      </button>
    </div>
  );

  // ==================== Stat Card ====================
  const StatCard = ({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) => (
    <div className="glass rounded-2xl p-5 hover:bg-white/[0.04] transition-colors group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className={`text-3xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{value}</span>
      </div>
      <p className="text-gray-400 text-sm">{label}</p>
    </div>
  );

  // ==================== Breadcrumb ====================
  const tabLabels: Record<Tab, string> = {
    dashboard: 'لوحة القيادة',
    rooms: 'إدارة الغرف',
    users: 'المستخدمين',
    announcements: 'الإعلانات',
    reports: 'البلاغات',
    punishments: 'العقوبات',
    audit: 'السجل الإداري',
    settings: 'الإعدادات',
  };

  // Filtered audit logs
  const filteredAuditLogs = auditFilter === 'all'
    ? auditLogs
    : auditLogs.filter((log: any) => log.action?.includes(auditFilter));

  const auditActions = [...new Set(auditLogs.map((l: any) => l.action))];

  // ==================== Render ====================
  return (
    <div className="min-h-screen bg-gray-950 flex" dir="rtl">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-72' : 'w-16'} bg-gray-900/60 backdrop-blur-xl border-l border-gray-800/60 flex flex-col transition-all duration-300 sticky top-0 h-screen`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-800/60">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div>
                <h1 className="text-lg font-bold gradient-text">لوحة الإدارة</h1>
                <p className="text-xs text-gray-500 mt-0.5">مرحباً {(session?.user as any)?.name}</p>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
              title={sidebarOpen ? 'تصغير القائمة' : 'توسيع القائمة'}
            >
              {sidebarOpen ? '◀' : '▶'}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-4 mt-2">
          {sidebarGroups.map((group, gi) => (
            <div key={gi}>
              {sidebarOpen && (
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider px-3 mb-1.5">{group.title}</p>
              )}
              <div className="space-y-0.5">
                {group.items.map(item => {
                  if (item.href) {
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        className="w-full text-right px-3 py-2.5 rounded-xl text-sm flex items-center gap-2.5 transition-all text-gray-400 hover:bg-white/5 hover:text-gray-200"
                        title={!sidebarOpen ? item.label : undefined}
                      >
                        <span className="text-base flex-shrink-0">{item.icon}</span>
                        {sidebarOpen && <span>{item.label}</span>}
                        {sidebarOpen && <span className="mr-auto text-[10px] text-gray-600">↗</span>}
                      </Link>
                    );
                  }
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as Tab)}
                      className={`w-full text-right px-3 py-2.5 rounded-xl text-sm flex items-center gap-2.5 transition-all ${
                        isActive
                          ? 'bg-gradient-to-l from-cyan-500/15 to-teal-500/10 text-white border border-cyan-500/20 shadow-lg shadow-cyan-500/5'
                          : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                      }`}
                      title={!sidebarOpen ? item.label : undefined}
                    >
                      <span className="text-base flex-shrink-0">{item.icon}</span>
                      {sidebarOpen && <span>{item.label}</span>}
                      {item.badge && item.badge > 0 && (
                        <span className={`${sidebarOpen ? 'mr-auto' : ''} bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-800/60 space-y-2">
          {sidebarOpen && maintenanceMode && (
            <div className="px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-center">
              <p className="text-yellow-400 text-xs font-medium">⚠ وضع الصيانة مفعّل</p>
            </div>
          )}
          <Link href="/chat" className="block text-center py-2.5 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
            {sidebarOpen ? '← العودة للدردشة' : '←'}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        {/* Top Bar with Breadcrumb */}
        <div className="sticky top-0 z-30 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/40 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">لوحة الإدارة</span>
              <span className="text-gray-700">/</span>
              <span className="text-white font-medium">{tabLabels[activeTab]}</span>
            </div>
            <div className="flex items-center gap-3">
              {pendingReports > 0 && (
                <button
                  onClick={() => setActiveTab('reports')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors"
                >
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  {pendingReports} بلاغ معلق
                </button>
              )}
              <div className="flex items-center gap-2 text-gray-400 text-xs">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                متصل
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto">
          {/* Toast */}
          {message.text && (
            <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl text-sm font-medium shadow-2xl backdrop-blur-xl ${
              message.type === 'success'
                ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                : 'bg-red-500/20 border border-red-500/30 text-red-400'
            }`}>
              <div className="flex items-center gap-2">
                <span>{message.type === 'success' ? '✓' : '✕'}</span>
                {message.text}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                <p className="text-gray-500 text-sm">جاري التحميل...</p>
              </div>
            </div>
          ) : (
            <>
              {/* ==================== DASHBOARD ==================== */}
              {activeTab === 'dashboard' && stats && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">لوحة القيادة</h2>
                    <p className="text-gray-500 text-sm">نظرة عامة على إحصائيات ونشاط المنصة</p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="إجمالي المستخدمين" value={stats.stats.users} color="from-blue-400 to-blue-600" icon="👥" />
                    <StatCard label="الغرف النشطة" value={stats.stats.rooms} color="from-green-400 to-green-600" icon="🏠" />
                    <StatCard label="إجمالي الرسائل" value={stats.stats.messages} color="from-purple-400 to-purple-600" icon="💬" />
                    <StatCard label="بلاغات معلقة" value={stats.stats.pendingReports} color="from-orange-400 to-orange-600" icon="🚨" />
                  </div>

                  {/* Secondary Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="glass rounded-2xl p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-xl">🚫</div>
                      <div>
                        <p className="text-2xl font-bold text-red-400">{stats.stats.activeBans}</p>
                        <p className="text-gray-500 text-xs">محظورين نشطين</p>
                      </div>
                    </div>
                    <div className="glass rounded-2xl p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-xl">🔇</div>
                      <div>
                        <p className="text-2xl font-bold text-yellow-400">{stats.stats.activeMutes}</p>
                        <p className="text-gray-500 text-xs">مكتومين نشطين</p>
                      </div>
                    </div>
                    <div className="glass rounded-2xl p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center text-xl">⚠️</div>
                      <div>
                        <p className="text-2xl font-bold text-pink-400">{stats.stats.warnings}</p>
                        <p className="text-gray-500 text-xs">إجمالي التحذيرات</p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">إجراءات سريعة</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        { label: 'إنشاء غرفة', icon: '➕', tab: 'rooms' as Tab, color: 'from-green-500/20 to-green-600/10 border-green-500/20 text-green-400' },
                        { label: 'نشر إعلان', icon: '📢', tab: 'announcements' as Tab, color: 'from-blue-500/20 to-blue-600/10 border-blue-500/20 text-blue-400' },
                        { label: 'مراجعة البلاغات', icon: '🚨', tab: 'reports' as Tab, color: 'from-orange-500/20 to-orange-600/10 border-orange-500/20 text-orange-400' },
                        { label: 'إدارة الإعدادات', icon: '⚙️', tab: 'settings' as Tab, color: 'from-gray-500/20 to-gray-600/10 border-gray-500/20 text-gray-300' },
                      ].map((action, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveTab(action.tab)}
                          className={`p-4 rounded-xl bg-gradient-to-br ${action.color} border hover:scale-[1.02] transition-all text-right`}
                        >
                          <span className="text-2xl block mb-2">{action.icon}</span>
                          <span className="text-sm font-medium">{action.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">آخر النشاطات</h3>
                    <div className="glass rounded-2xl divide-y divide-gray-800/60 overflow-hidden">
                      {stats.recentActivity?.length === 0 && (
                        <p className="text-gray-500 text-center py-8 text-sm">لا توجد نشاطات حديثة</p>
                      )}
                      {stats.recentActivity?.map((log: any, i: number) => (
                        <div key={i} className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-xs text-cyan-400 font-bold">
                              {log.performedBy?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <span className="text-cyan-400 font-medium text-sm">{log.performedBy}</span>
                              <span className="text-gray-600 mx-2">•</span>
                              <span className="text-gray-300 text-sm">{log.action}</span>
                            </div>
                          </div>
                          <span className="text-gray-600 text-xs">{new Date(log.createdAt).toLocaleString('ar-SA')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== ROOMS ==================== */}
              {activeTab === 'rooms' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">إدارة الغرف</h2>
                    <p className="text-gray-500 text-sm">إنشاء وإدارة غرف الدردشة</p>
                  </div>

                  {/* Create Room */}
                  <div className="glass rounded-2xl p-6">
                    <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-sm">➕</span>
                      إنشاء غرفة جديدة
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input value={newRoom.name} onChange={e => setNewRoom({ ...newRoom, name: e.target.value })} placeholder="اسم الغرفة" className="bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20" />
                      <input value={newRoom.description} onChange={e => setNewRoom({ ...newRoom, description: e.target.value })} placeholder="وصف الغرفة (اختياري)" className="bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20" />
                      <select value={newRoom.type} onChange={e => setNewRoom({ ...newRoom, type: e.target.value })} className="bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50">
                        <option value="PUBLIC">عامة</option>
                        <option value="PRIVATE">خاصة</option>
                        <option value="ANNOUNCEMENT">إعلانات</option>
                      </select>
                    </div>
                    <button onClick={createRoom} className="mt-4 px-6 py-2.5 bg-gradient-to-l from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 rounded-xl text-sm text-white font-medium transition-all hover:shadow-lg hover:shadow-cyan-500/20">
                      إنشاء الغرفة
                    </button>
                  </div>

                  {/* Rooms List */}
                  <div className="space-y-3">
                    {rooms.length === 0 && <p className="text-gray-500 text-center py-8 text-sm">لا توجد غرف</p>}
                    {rooms.map((room: any) => (
                      <div key={room.id} className="glass rounded-2xl p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ${room.isFrozen ? 'bg-blue-500/10 text-blue-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                            {room.type === 'PRIVATE' ? '🔒' : room.type === 'ANNOUNCEMENT' ? '📢' : '🏠'}
                          </div>
                          <div>
                            <h4 className="text-white font-medium flex items-center gap-2">
                              {room.name}
                              {room.isFrozen && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-medium">مجمدة</span>}
                            </h4>
                            <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-3">
                              <span>{room._count?.members || 0} عضو</span>
                              <span>•</span>
                              <span>{room._count?.messages || 0} رسالة</span>
                              <span>•</span>
                              <span className="text-gray-600">{room.type === 'PUBLIC' ? 'عامة' : room.type === 'PRIVATE' ? 'خاصة' : 'إعلانات'}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleFreezeRoom(room.id, room.isFrozen)} className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${room.isFrozen ? 'bg-green-500/15 text-green-400 hover:bg-green-500/25' : 'bg-blue-500/15 text-blue-400 hover:bg-blue-500/25'}`}>
                            {room.isFrozen ? '☀ فتح' : '❄ تجميد'}
                          </button>
                          <button onClick={() => deleteRoom(room.id)} className="px-3.5 py-1.5 bg-red-500/15 text-red-400 hover:bg-red-500/25 rounded-lg text-xs font-medium transition-colors">
                            حذف
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ==================== USERS ==================== */}
              {activeTab === 'users' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">إدارة المستخدمين</h2>
                    <p className="text-gray-500 text-sm">البحث عن المستخدمين وإدارة رتبهم وصلاحياتهم</p>
                  </div>

                  {/* Search */}
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <input
                        value={searchUser}
                        onChange={e => { setSearchUser(e.target.value); searchUserRef.current = e.target.value; }}
                        onKeyDown={e => e.key === 'Enter' && loadTabData('users')}
                        placeholder="بحث بالاسم أو البريد الإلكتروني..."
                        className="w-full bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3 pr-10 text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
                    </div>
                    <button onClick={() => loadTabData('users')} className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-sm text-white font-medium transition-colors">
                      بحث
                    </button>
                  </div>

                  {/* Users List */}
                  <div className="space-y-2">
                    {users.length === 0 && <p className="text-gray-500 text-center py-8 text-sm">لا يوجد مستخدمين</p>}
                    {users.map((u: any) => (
                      <div key={u.id} className="glass rounded-2xl p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-sm font-bold overflow-hidden">
                              {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : u.username[0]?.toUpperCase()}
                            </div>
                            <span className={`absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full border-2 border-gray-900 ${u.status === 'ONLINE' ? 'bg-green-400' : 'bg-gray-600'}`} />
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm flex items-center gap-2">
                              {u.username}
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: (u.highestRole?.color || '#808080') + '15', color: u.highestRole?.color || '#808080' }}>
                                {u.highestRole?.displayName || 'عضو'}
                              </span>
                            </p>
                            <p className="text-gray-500 text-xs mt-0.5">
                              {u.email && <span>{u.email} • </span>}
                              {u.messageCount} رسالة • {u.warningCount} تحذير
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setSelectedUserForRole(u); setShowRoleModal(true); setRoleChangeRole(''); }}
                            className="px-3 py-1.5 bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 rounded-lg text-xs font-medium transition-colors"
                          >
                            تغيير الرتبة
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ==================== ANNOUNCEMENTS ==================== */}
              {activeTab === 'announcements' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">الإعلانات</h2>
                    <p className="text-gray-500 text-sm">نشر وإدارة إعلانات المنصة</p>
                  </div>

                  {/* New Announcement */}
                  <div className="glass rounded-2xl p-6">
                    <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-sm">📢</span>
                      إعلان جديد
                    </h3>
                    <input
                      value={newAnnouncement.title}
                      onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                      placeholder="عنوان الإعلان"
                      className="w-full bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3 text-white text-sm mb-3 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                    />
                    <textarea
                      value={newAnnouncement.content}
                      onChange={e => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                      placeholder="محتوى الإعلان..."
                      rows={3}
                      className="w-full bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3 text-white text-sm mb-3 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                        <input type="checkbox" checked={newAnnouncement.isPinned} onChange={e => setNewAnnouncement({ ...newAnnouncement, isPinned: e.target.checked })} className="rounded" />
                        📌 تثبيت الإعلان
                      </label>
                      <button onClick={createAnnouncement} className="px-6 py-2.5 bg-gradient-to-l from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 rounded-xl text-sm text-white font-medium transition-all">
                        نشر الإعلان
                      </button>
                    </div>
                  </div>

                  {/* Announcements List */}
                  <div className="space-y-3">
                    {announcements.length === 0 && <p className="text-gray-500 text-center py-8 text-sm">لا توجد إعلانات</p>}
                    {announcements.map((ann: any) => (
                      <div key={ann.id} className="glass rounded-2xl p-5 hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-medium flex items-center gap-2">
                            {ann.isPinned && <span className="text-yellow-400 text-sm">📌</span>}
                            {ann.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600 text-xs">{new Date(ann.createdAt).toLocaleString('ar-SA')}</span>
                            <button onClick={() => deleteAnnouncement(ann.id)} className="px-2 py-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs transition-colors">حذف</button>
                          </div>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">{ann.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ==================== REPORTS ==================== */}
              {activeTab === 'reports' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">البلاغات</h2>
                      <p className="text-gray-500 text-sm">مراجعة ومعالجة بلاغات المستخدمين</p>
                    </div>
                    {pendingReports > 0 && (
                      <div className="px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                        <span className="text-orange-400 text-sm font-medium">{pendingReports} بلاغ بحاجة مراجعة</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {reports.length === 0 && <p className="text-gray-500 text-center py-8 text-sm">لا توجد بلاغات</p>}
                    {reports.map((report: any) => (
                      <div key={report.id} className={`glass rounded-2xl p-5 hover:bg-white/[0.02] transition-colors ${report.status === 'PENDING' ? 'border-r-2 border-r-orange-500/50' : ''}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-cyan-400 font-medium">{report.reporter?.username}</span>
                            <span className="text-gray-600">أبلغ عن</span>
                            <span className="text-orange-400 font-medium">{report.targetUser?.username || 'غير محدد'}</span>
                          </div>
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${
                            report.status === 'PENDING' ? 'bg-yellow-500/15 text-yellow-400' :
                            report.status === 'RESOLVED' ? 'bg-green-500/15 text-green-400' :
                            'bg-gray-500/15 text-gray-400'
                          }`}>
                            {report.status === 'PENDING' ? 'معلق' : report.status === 'RESOLVED' ? 'تم المعالجة' : 'مرفوض'}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm mb-1">السبب: {report.reason}</p>
                        {report.message && <p className="text-gray-500 text-xs mb-3 bg-gray-800/40 px-3 py-2 rounded-lg">الرسالة: &quot;{report.message.content}&quot;</p>}
                        {report.status === 'PENDING' && (
                          <div className="flex gap-2 mt-3">
                            <button onClick={() => resolveReport(report.id, 'RESOLVED')} className="px-4 py-2 bg-green-500/15 text-green-400 hover:bg-green-500/25 rounded-lg text-xs font-medium transition-colors">
                              ✓ معالجة
                            </button>
                            <button onClick={() => resolveReport(report.id, 'DISMISSED')} className="px-4 py-2 bg-gray-500/15 text-gray-400 hover:bg-gray-500/25 rounded-lg text-xs font-medium transition-colors">
                              ✕ رفض
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ==================== PUNISHMENTS ==================== */}
              {activeTab === 'punishments' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">العقوبات</h2>
                    <p className="text-gray-500 text-sm">تطبيق وإدارة العقوبات على المستخدمين المخالفين</p>
                  </div>

                  {/* Issue Punishment */}
                  <div className="glass rounded-2xl p-6">
                    <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-sm">⚖️</span>
                      تطبيق عقوبة جديدة
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-gray-400 text-xs mb-1.5 block">نوع العقوبة</label>
                        <select value={punishForm.type} onChange={e => setPunishForm({ ...punishForm, type: e.target.value })} className="w-full bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50">
                          <option value="warning">⚠️ تحذير</option>
                          <option value="mute">🔇 كتم</option>
                          <option value="ban">🚫 حظر</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-gray-400 text-xs mb-1.5 block">المستخدم المستهدف</label>
                        <select value={punishForm.targetUserId} onChange={e => setPunishForm({ ...punishForm, targetUserId: e.target.value })} className="w-full bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50">
                          <option value="">اختر المستخدم</option>
                          {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-gray-400 text-xs mb-1.5 block">السبب</label>
                        <input value={punishForm.reason} onChange={e => setPunishForm({ ...punishForm, reason: e.target.value })} placeholder="سبب العقوبة" className="w-full bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50" />
                      </div>
                      {punishForm.type !== 'warning' && (
                        <div>
                          <label className="text-gray-400 text-xs mb-1.5 block">المدة (بالدقائق)</label>
                          <input type="number" value={punishForm.duration} onChange={e => setPunishForm({ ...punishForm, duration: Number(e.target.value) })} placeholder="المدة بالدقائق" className="w-full bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50" />
                        </div>
                      )}
                    </div>
                    <button onClick={issuePunishment} className="mt-4 px-6 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-sm text-white font-medium transition-colors">
                      تطبيق العقوبة
                    </button>
                  </div>

                  {/* Filter */}
                  <div className="flex gap-2">
                    <button onClick={() => setPunishFilter('all')} className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${punishFilter === 'all' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-gray-800/40 text-gray-400 hover:bg-gray-800/60'}`}>الكل</button>
                    <button onClick={() => setPunishFilter('active')} className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${punishFilter === 'active' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-gray-800/40 text-gray-400 hover:bg-gray-800/60'}`}>النشطة فقط</button>
                  </div>

                  {/* Bans */}
                  <div>
                    <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                      <span className="text-red-400">🚫</span> الحظر
                      <span className="text-xs text-gray-600 font-normal">({(punishFilter === 'active' ? punishments.bans?.filter((b: any) => b.isActive) : punishments.bans)?.length || 0})</span>
                    </h3>
                    <div className="space-y-2">
                      {(punishFilter === 'active' ? punishments.bans?.filter((b: any) => b.isActive) : punishments.bans)?.map((ban: any) => (
                        <div key={ban.id} className="glass rounded-xl p-4 flex items-center justify-between hover:bg-white/[0.02]">
                          <div>
                            <p className="text-white text-sm"><span className="text-red-400 font-medium">{ban.user?.username}</span> — {ban.reason}</p>
                            <p className="text-gray-500 text-xs mt-1">بواسطة {ban.issuer?.username} • {ban.duration ? `${ban.duration} دقيقة` : 'دائم'} • <span className={ban.isActive ? 'text-red-400' : 'text-gray-600'}>{ban.isActive ? 'نشط' : 'منتهي'}</span></p>
                          </div>
                          {ban.isActive && (
                            <button onClick={() => liftPunishment('ban', ban.id)} className="px-3.5 py-1.5 bg-green-500/15 text-green-400 hover:bg-green-500/25 rounded-lg text-xs font-medium transition-colors">فك الحظر</button>
                          )}
                        </div>
                      ))}
                      {(!punishments.bans || punishments.bans.length === 0) && <p className="text-gray-600 text-sm py-2">لا يوجد حظر</p>}
                    </div>
                  </div>

                  {/* Mutes */}
                  <div>
                    <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                      <span className="text-yellow-400">🔇</span> الكتم
                      <span className="text-xs text-gray-600 font-normal">({(punishFilter === 'active' ? punishments.mutes?.filter((m: any) => m.isActive) : punishments.mutes)?.length || 0})</span>
                    </h3>
                    <div className="space-y-2">
                      {(punishFilter === 'active' ? punishments.mutes?.filter((m: any) => m.isActive) : punishments.mutes)?.map((mute: any) => (
                        <div key={mute.id} className="glass rounded-xl p-4 flex items-center justify-between hover:bg-white/[0.02]">
                          <div>
                            <p className="text-white text-sm"><span className="text-yellow-400 font-medium">{mute.user?.username}</span> — {mute.reason}</p>
                            <p className="text-gray-500 text-xs mt-1">بواسطة {mute.issuer?.username} • {mute.duration} دقيقة • <span className={mute.isActive ? 'text-yellow-400' : 'text-gray-600'}>{mute.isActive ? 'نشط' : 'منتهي'}</span></p>
                          </div>
                          {mute.isActive && (
                            <button onClick={() => liftPunishment('mute', mute.id)} className="px-3.5 py-1.5 bg-green-500/15 text-green-400 hover:bg-green-500/25 rounded-lg text-xs font-medium transition-colors">فك الكتم</button>
                          )}
                        </div>
                      ))}
                      {(!punishments.mutes || punishments.mutes.length === 0) && <p className="text-gray-600 text-sm py-2">لا يوجد كتم</p>}
                    </div>
                  </div>

                  {/* Warnings */}
                  <div>
                    <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                      <span className="text-orange-400">⚠️</span> التحذيرات
                      <span className="text-xs text-gray-600 font-normal">({punishments.warnings?.length || 0})</span>
                    </h3>
                    <div className="space-y-2">
                      {punishments.warnings?.map((warn: any) => (
                        <div key={warn.id} className="glass rounded-xl p-4 hover:bg-white/[0.02]">
                          <p className="text-white text-sm"><span className="text-orange-400 font-medium">{warn.user?.username}</span> — {warn.reason}</p>
                          <p className="text-gray-500 text-xs mt-1">بواسطة {warn.issuer?.username} • {new Date(warn.createdAt).toLocaleString('ar-SA')}</p>
                        </div>
                      ))}
                      {(!punishments.warnings || punishments.warnings.length === 0) && <p className="text-gray-600 text-sm py-2">لا توجد تحذيرات</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== AUDIT LOG ==================== */}
              {activeTab === 'audit' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">السجل الإداري</h2>
                    <p className="text-gray-500 text-sm">سجل كامل لجميع العمليات الإدارية</p>
                  </div>

                  {/* Filters */}
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setAuditFilter('all')} className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${auditFilter === 'all' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-gray-800/40 text-gray-400 hover:bg-gray-800/60'}`}>
                      الكل ({auditLogs.length})
                    </button>
                    {auditActions.map(action => (
                      <button key={action} onClick={() => setAuditFilter(action)} className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${auditFilter === action ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-gray-800/40 text-gray-400 hover:bg-gray-800/60'}`}>
                        {action} ({auditLogs.filter((l: any) => l.action === action).length})
                      </button>
                    ))}
                  </div>

                  {/* Log Entries */}
                  <div className="glass rounded-2xl divide-y divide-gray-800/60 overflow-hidden">
                    {filteredAuditLogs.length === 0 && <p className="text-gray-500 text-center py-8 text-sm">لا توجد سجلات</p>}
                    {filteredAuditLogs.map((log: any) => (
                      <div key={log.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-xs text-cyan-400 font-bold flex-shrink-0">
                            {log.performerName?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-cyan-400 text-sm font-medium">{log.performerName}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">{log.action}</span>
                            </div>
                            {log.details && typeof log.details === 'object' && (
                              <p className="text-gray-600 text-xs mt-0.5 max-w-md truncate">{JSON.stringify(log.details).slice(0, 100)}</p>
                            )}
                          </div>
                        </div>
                        <span className="text-gray-600 text-xs whitespace-nowrap mr-4">{new Date(log.createdAt).toLocaleString('ar-SA')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ==================== SETTINGS ==================== */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">الإعدادات</h2>
                    <p className="text-gray-500 text-sm">تخصيص وضبط إعدادات المنصة</p>
                  </div>

                  {/* Settings Navigation */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {settingsSections.map(section => (
                      <button
                        key={section.id}
                        onClick={() => setSettingsSection(section.id)}
                        className={`p-4 rounded-xl text-right transition-all ${
                          settingsSection === section.id
                            ? 'bg-gradient-to-bl from-cyan-500/15 to-teal-500/10 border border-cyan-500/25 shadow-lg shadow-cyan-500/5'
                            : 'glass hover:bg-white/[0.04]'
                        }`}
                      >
                        <span className="text-2xl block mb-2">{section.icon}</span>
                        <p className={`text-sm font-medium ${settingsSection === section.id ? 'text-white' : 'text-gray-300'}`}>{section.label}</p>
                        <p className="text-gray-500 text-[10px] mt-1">{section.desc}</p>
                      </button>
                    ))}
                  </div>

                  {/* Site Settings */}
                  {settingsSection === 'site' && (
                    <div className="space-y-4">
                      <div className="glass rounded-2xl p-6">
                        <h3 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
                          <span className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-sm">🌐</span>
                          إعدادات الموقع
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="text-gray-400 text-xs mb-1.5 block">اسم الموقع</label>
                            <input
                              value={siteName}
                              onChange={e => setSiteName(e.target.value)}
                              placeholder="اسم الموقع"
                              className="w-full bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                            />
                          </div>
                          <div>
                            <label className="text-gray-400 text-xs mb-1.5 block">رسالة الترحيب</label>
                            <textarea
                              value={welcomeMessage}
                              onChange={e => setWelcomeMessage(e.target.value)}
                              placeholder="رسالة ترحيب تظهر للمستخدمين الجدد..."
                              rows={3}
                              className="w-full bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 resize-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="glass rounded-2xl p-6">
                        <h3 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
                          <span className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-sm">🔧</span>
                          وضع الصيانة
                        </h3>
                        <div className="space-y-4">
                          <Toggle
                            enabled={maintenanceMode}
                            onChange={() => setMaintenanceMode(!maintenanceMode)}
                            label="تفعيل وضع الصيانة"
                            desc="عند التفعيل، يظهر للمستخدمين رسالة صيانة ولا يمكنهم استخدام المنصة"
                          />
                          {maintenanceMode && (
                            <div>
                              <label className="text-gray-400 text-xs mb-1.5 block">رسالة الصيانة</label>
                              <textarea
                                value={maintenanceMessage}
                                onChange={e => setMaintenanceMessage(e.target.value)}
                                placeholder="مثال: المنصة تحت الصيانة، سنعود قريباً..."
                                rows={2}
                                className="w-full bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 resize-none"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Chat Settings */}
                  {settingsSection === 'chat' && (
                    <div className="space-y-4">
                      <div className="glass rounded-2xl p-6">
                        <h3 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
                          <span className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-sm">💬</span>
                          التحكم بالدردشة
                        </h3>
                        <div className="space-y-3">
                          <Toggle
                            enabled={chatEnabled}
                            onChange={() => setChatEnabled(!chatEnabled)}
                            label="تفعيل الدردشة"
                            desc="عند التعطيل، لا يمكن لأي مستخدم إرسال رسائل"
                          />
                        </div>
                      </div>

                      <div className="glass rounded-2xl p-6">
                        <h3 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
                          <span className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-sm">🚫</span>
                          الكلمات الممنوعة
                        </h3>
                        <p className="text-gray-500 text-xs mb-4">الرسائل التي تحتوي على هذه الكلمات سيتم حظرها تلقائياً</p>
                        <div className="flex gap-3 mb-4">
                          <input
                            value={newBannedWord}
                            onChange={e => setNewBannedWord(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && newBannedWord) {
                                setBannedWords([...bannedWords, newBannedWord]);
                                setNewBannedWord('');
                              }
                            }}
                            placeholder="أضف كلمة ممنوعة..."
                            className="flex-1 bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20"
                          />
                          <button onClick={() => { if (newBannedWord) { setBannedWords([...bannedWords, newBannedWord]); setNewBannedWord(''); } }} className="px-5 py-3 bg-red-600 hover:bg-red-500 rounded-xl text-sm text-white font-medium transition-colors">
                            إضافة
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {bannedWords.length === 0 && <p className="text-gray-600 text-xs">لا توجد كلمات ممنوعة</p>}
                          {bannedWords.map((word, i) => (
                            <span key={i} className="bg-red-500/10 text-red-400 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2">
                              {word}
                              <button onClick={() => setBannedWords(bannedWords.filter((_, idx) => idx !== i))} className="hover:text-red-300 text-red-500">×</button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Presence Settings */}
                  {settingsSection === 'presence' && (
                    <div className="glass rounded-2xl p-6">
                      <h3 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-sm">👁</span>
                        إعدادات المتواجدين
                      </h3>
                      <div className="space-y-3">
                        <Toggle
                          enabled={presenceEnabled}
                          onChange={() => setPresenceEnabled(!presenceEnabled)}
                          label="عرض المتواجدين حالياً"
                          desc="إظهار قائمة المتواجدين في الدردشة"
                        />
                        <Toggle
                          enabled={presencePublic}
                          onChange={() => setPresencePublic(!presencePublic)}
                          label="المتواجدون للجميع"
                          desc="إظهار القائمة لجميع الأعضاء أو فقط للمشرفين"
                        />
                        <Toggle
                          enabled={showLastSeen}
                          onChange={() => setShowLastSeen(!showLastSeen)}
                          label="إظهار آخر ظهور"
                          desc="عرض وقت آخر ظهور للمستخدمين غير المتصلين"
                        />
                        <Toggle
                          enabled={showRoomPresence}
                          onChange={() => setShowRoomPresence(!showRoomPresence)}
                          label="المتواجدون في كل غرفة"
                          desc="إظهار عدد المتواجدين داخل كل غرفة"
                        />
                      </div>
                    </div>
                  )}

                  {/* Security Settings */}
                  {settingsSection === 'security' && (
                    <div className="glass rounded-2xl p-6">
                      <h3 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-sm">🔒</span>
                        الأمان والتسجيل
                      </h3>
                      <div className="space-y-3">
                        <Toggle
                          enabled={regEnabled}
                          onChange={() => setRegEnabled(!regEnabled)}
                          label="تفعيل التسجيل"
                          desc="السماح للمستخدمين الجدد بإنشاء حسابات"
                        />
                      </div>
                    </div>
                  )}

                  {/* Save Button */}
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-gray-600 text-xs">يتم حفظ جميع الإعدادات في قسم واحد</p>
                    <button onClick={saveSettings} className="px-8 py-3 bg-gradient-to-l from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 rounded-xl text-white font-medium transition-all hover:shadow-lg hover:shadow-cyan-500/20">
                      حفظ الإعدادات
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* ==================== Role Change Modal ==================== */}
      {showRoleModal && selectedUserForRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowRoleModal(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-2">تغيير رتبة المستخدم</h3>
            <p className="text-gray-500 text-sm mb-5">تغيير رتبة <span className="text-cyan-400 font-medium">{selectedUserForRole.username}</span></p>

            <div className="mb-4">
              <p className="text-gray-400 text-xs mb-2">الرتبة الحالية:</p>
              <div className="px-3 py-2 bg-gray-800/60 rounded-lg text-sm" style={{ color: selectedUserForRole.highestRole?.color }}>
                {selectedUserForRole.highestRole?.displayName || 'عضو'}
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-400 text-xs mb-2">الرتبة الجديدة:</p>
              <select
                value={roleChangeRole}
                onChange={e => setRoleChangeRole(e.target.value)}
                className="w-full bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50"
              >
                <option value="">اختر الرتبة</option>
                {roles.map((r: any) => (
                  <option key={r.id} value={r.id}>{r.displayName} (مستوى {r.level})</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button onClick={changeUserRole} disabled={!roleChangeRole} className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:hover:bg-cyan-600 rounded-xl text-sm text-white font-medium transition-colors">
                تأكيد التغيير
              </button>
              <button onClick={() => setShowRoleModal(false)} className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm text-gray-300 font-medium transition-colors">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
