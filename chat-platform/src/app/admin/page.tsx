'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

// ==================== Types ====================
type Tab = 'dashboard' | 'rooms' | 'users' | 'announcements' | 'reports' | 'punishments' | 'audit' | 'settings' | 'tickets' | 'send_notifications' | 'github_monitor';

interface SidebarGroup {
  title: string;
  items: { id: Tab | 'team'; label: string; icon: string; badge?: number; href?: string }[];
}

const TICKET_STATUSES: Record<string, { label: string; color: string; bg: string }> = {
  OPEN: { label: 'مفتوحة', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  REVIEWING: { label: 'قيد المراجعة', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  REPLIED: { label: 'تم الرد', color: 'text-violet-400', bg: 'bg-violet-500/10' },
  WAITING_USER: { label: 'بانتظار المستخدم', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  CLOSED: { label: 'مغلقة', color: 'text-gray-400', bg: 'bg-gray-500/10' },
  ESCALATED: { label: 'مصعدة', color: 'text-red-400', bg: 'bg-red-500/10' },
};

const TICKET_PRIORITIES: Record<string, { label: string; color: string }> = {
  LOW: { label: 'منخفضة', color: 'text-gray-400' },
  MEDIUM: { label: 'متوسطة', color: 'text-blue-400' },
  HIGH: { label: 'عالية', color: 'text-amber-400' },
  URGENT: { label: 'عاجلة', color: 'text-red-400' },
};

const TICKET_DEPARTMENTS: Record<string, string> = {
  technical: 'مشاكل تقنية', account: 'مشاكل الحساب', chat: 'مشاكل الدردشة',
  notifications: 'مشاكل الإشعارات', ranks: 'مشاكل الرتب', items: 'مشاكل العناصر',
  suggestions: 'اقتراحات', general: 'استفسارات عامة',
};

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
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketReply, setTicketReply] = useState('');
  const [ticketFilter, setTicketFilter] = useState('');
  const ticketFilterRef = useRef('');
  const [pendingTickets, setPendingTickets] = useState(0);
  const [ticketSearch, setTicketSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Notification sending states
  const [notifTitle, setNotifTitle] = useState('');
  const [notifContent, setNotifContent] = useState('');
  const [notifType, setNotifType] = useState('ADMIN');
  const [notifCategory, setNotifCategory] = useState('ADMIN');
  const [notifPriority, setNotifPriority] = useState('NORMAL');
  const [notifLink, setNotifLink] = useState('');
  const [notifTarget, setNotifTarget] = useState('all');
  const [notifTargetUser, setNotifTargetUser] = useState('');
  const [notifHistory, setNotifHistory] = useState<any[]>([]);
  const [sendingNotif, setSendingNotif] = useState(false);

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
  const [settingsSection, setSettingsSection] = useState<'site' | 'chat' | 'presence' | 'security' | 'pages'>('site');

  // Dynamic pages
  const [pageRules, setPageRules] = useState('');
  const [pageWelcome, setPageWelcome] = useState('');
  const [pageAbout, setPageAbout] = useState('');
  const [pagePrivacy, setPagePrivacy] = useState('');
  const [activePageTab, setActivePageTab] = useState<'rules' | 'welcome' | 'about' | 'privacy'>('rules');
  const [_pageSaving, _setPageSaving] = useState(false);
  const [_pageMessage, _setPageMessage] = useState('');

  // Punishment form
  const [punishForm, setPunishForm] = useState({ type: 'warning', targetUserId: '', reason: '', duration: 30 });
  const [punishFilter, setPunishFilter] = useState<'all' | 'active'>('all');

  // Role change
  const [_roleChangeUser, _setRoleChangeUser] = useState<string>('');
  const [roleChangeRole, setRoleChangeRole] = useState<string>('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState<any>(null);

  // Toast
  const [message, setMessage] = useState({ text: '', type: '' });

  // Pending counts for badges
  const [pendingReports, setPendingReports] = useState(0);

  // GitHub Monitor states
  const [ghSummary, setGhSummary] = useState<any>(null);
  const [ghEvents, setGhEvents] = useState<any[]>([]);
  const [ghFiles, setGhFiles] = useState<any[]>([]);
  const [ghAlerts, setGhAlerts] = useState<any[]>([]);
  const [ghChecks, setGhChecks] = useState<any[]>([]);
  const [ghFixes, setGhFixes] = useState<any[]>([]);
  const [ghView, setGhView] = useState<'overview' | 'events' | 'files' | 'alerts' | 'checks' | 'fixes' | 'setup' | 'editor' | 'scanner'>('overview');
  const [ghEventFilter, setGhEventFilter] = useState('');
  const [ghAlertFilter, setGhAlertFilter] = useState('');
  const [ghSetup, setGhSetup] = useState({ appId: '', privateKey: '', installationId: '', webhookSecret: '', repoOwner: '', repoName: '', defaultBranch: 'main' });
  const [ghSyncing, setGhSyncing] = useState(false);
  const [ghFileContent, setGhFileContent] = useState<any>(null);
  const [ghEditContent, setGhEditContent] = useState('');
  const [ghCommitMsg, setGhCommitMsg] = useState('');
  const [ghPrTitle, setGhPrTitle] = useState('');
  const [ghFixMode, setGhFixMode] = useState<'pr' | 'direct'>('pr');

  // Scanner states
  const [ghScanResult, setGhScanResult] = useState<any>(null);
  const [ghScanning, setGhScanning] = useState(false);
  const [ghScanProgress, setGhScanProgress] = useState(0);
  const [ghScanStep, setGhScanStep] = useState('');
  const [ghScanHistory, setGhScanHistory] = useState<any[]>([]);
  const [ghScanFilter, setGhScanFilter] = useState<string>('');

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
          const usersRes = await fetch(`/api/admin/users?search=${encodeURIComponent(searchUserRef.current)}`);
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
          const usersForPun = await fetch('/api/admin/users?search=&limit=100');
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
          // Load dynamic pages
          setPageRules(s.page_rules || '');
          setPageWelcome(s.page_welcome || '');
          setPageAbout(s.page_about || '');
          setPagePrivacy(s.page_privacy || '');
          break;
        }
        case 'tickets': {
          const url = ticketFilterRef.current ? `/api/tickets?status=${ticketFilterRef.current}` : '/api/tickets';
          const ticketsRes = await fetch(url);
          if (ticketsRes.ok) {
            const ticketsData = await ticketsRes.json();
            setTickets(ticketsData);
            setPendingTickets(ticketsData.filter((t: any) => t.status === 'OPEN' || t.status === 'ESCALATED').length);
          }
          break;
        }
        case 'send_notifications': {
          const histRes = await fetch('/api/admin/notifications');
          if (histRes.ok) {
            const histData = await histRes.json();
            setNotifHistory(histData);
          }
          break;
        }
        case 'github_monitor': {
          const [summaryRes, eventsRes, filesRes, alertsRes, checksRes, fixesRes] = await Promise.all([
            fetch('/api/admin/github?action=summary'),
            fetch('/api/admin/github?action=events&limit=30'),
            fetch('/api/admin/github?action=files&limit=30'),
            fetch('/api/admin/github?action=alerts'),
            fetch('/api/admin/github?action=checks'),
            fetch('/api/admin/github?action=fixes'),
          ]);
          if (summaryRes.ok) setGhSummary(await summaryRes.json());
          if (eventsRes.ok) setGhEvents(await eventsRes.json());
          if (filesRes.ok) setGhFiles(await filesRes.json());
          if (alertsRes.ok) setGhAlerts(await alertsRes.json());
          if (checksRes.ok) setGhChecks(await checksRes.json());
          if (fixesRes.ok) setGhFixes(await fixesRes.json());
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
    const res = await fetch('/api/admin/rooms', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    if (res.ok) {
      showMsg('تم حذف الغرفة', 'success');
      loadTabData('rooms');
    } else {
      const data = await res.json().catch(() => ({}));
      showMsg(data.error || 'فشل في حذف الغرفة', 'error');
    }
  };

  const toggleFreezeRoom = async (id: string, currentState: boolean) => {
    const res = await fetch('/api/admin/rooms', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isFrozen: !currentState }),
    });
    if (res.ok) {
      showMsg(currentState ? 'تم فتح الغرفة' : 'تم تجميد الغرفة', 'success');
      loadTabData('rooms');
    } else {
      const data = await res.json().catch(() => ({}));
      showMsg(data.error || 'فشل في تحديث حالة الغرفة', 'error');
    }
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
    const res = await fetch('/api/announcements', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      showMsg('تم حذف الإعلان', 'success');
      loadTabData('announcements');
    } else {
      const data = await res.json().catch(() => ({}));
      showMsg(data.error || 'فشل في حذف الإعلان', 'error');
    }
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
    const res = await fetch('/api/admin/punishments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, id }),
    });
    if (res.ok) {
      showMsg('تم رفع العقوبة', 'success');
      loadTabData('punishments');
    } else {
      const data = await res.json().catch(() => ({}));
      showMsg(data.error || 'فشل في رفع العقوبة', 'error');
    }
  };

  const resolveReport = async (id: string, status: string) => {
    const res = await fetch('/api/reports', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, resolution: status === 'RESOLVED' ? 'تمت المعالجة' : 'تم الرفض' }),
    });
    if (res.ok) {
      showMsg('تم تحديث حالة البلاغ', 'success');
      loadTabData('reports');
    } else {
      const data = await res.json().catch(() => ({}));
      showMsg(data.error || 'فشل في تحديث البلاغ', 'error');
    }
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
    const res = await fetch('/api/admin/settings', {
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
          page_rules: pageRules,
          page_welcome: pageWelcome,
          page_about: pageAbout,
          page_privacy: pagePrivacy,
        },
        bannedWords,
      }),
    });
    if (res.ok) {
      showMsg('تم حفظ الإعدادات بنجاح', 'success');
    } else {
      const data = await res.json().catch(() => ({}));
      showMsg(data.error || 'فشل في حفظ الإعدادات', 'error');
    }
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
        { id: 'tickets', label: 'التذاكر', icon: '🎫', badge: pendingTickets },
        { id: 'send_notifications', label: 'إرسال إشعارات', icon: '🔔' },
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
    {
      title: 'المطور',
      items: [
        { id: 'github_monitor', label: 'مراقبة الكود', icon: '🔍' },
      ],
    },
  ];

  // ==================== Settings Sub-sections ====================
  const settingsSections = [
    { id: 'site' as const, label: 'إعدادات الموقع', icon: '🌐', desc: 'اسم الموقع، وضع الصيانة، رسالة الترحيب' },
    { id: 'chat' as const, label: 'إعدادات الدردشة', icon: '💬', desc: 'تفعيل الدردشة، الكلمات الممنوعة' },
    { id: 'presence' as const, label: 'إعدادات المتواجدين', icon: '👁', desc: 'التحكم بعرض المتواجدين وآخر ظهور' },
    { id: 'security' as const, label: 'الأمان والتسجيل', icon: '🔒', desc: 'تفعيل التسجيل وإعدادات الأمان' },
    { id: 'pages' as const, label: 'صفحات المحتوى', icon: '📄', desc: 'القوانين، الترحيب، عن الموقع' },
  ];

  // ==================== Toggle Component ====================
  const Toggle = ({ enabled, onChange, label, desc }: { enabled: boolean; onChange: () => void; label: string; desc?: string }) => (
    <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] transition-colors">
      <div className="flex-1 ml-4">
        <span className="text-gray-200 text-sm font-medium">{label}</span>
        {desc && <p className="text-gray-500 text-xs mt-0.5">{desc}</p>}
      </div>
      <button
        onClick={onChange}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${enabled ? 'bg-violet-500' : 'bg-gray-700'}`}
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
    tickets: 'التذاكر',
    send_notifications: 'إرسال إشعارات',
    github_monitor: 'مراقبة الكود',
  };

  // Filtered audit logs
  const filteredAuditLogs = auditFilter === 'all'
    ? auditLogs
    : auditLogs.filter((log: any) => log.action?.includes(auditFilter));

  const auditActions = [...new Set(auditLogs.map((l: any) => l.action))];

  // ==================== Render ====================
  return (
    <div className="min-h-screen bg-[#030711] flex" dir="rtl">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-72' : 'w-16'} bg-[#0A0F1C]/80 backdrop-blur-xl border-l border-white/[0.04] flex flex-col transition-all duration-300 sticky top-0 h-screen`}>
        {/* Header */}
        <div className="p-4 border-b border-white/[0.04]">
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
                          ? 'bg-gradient-to-l from-violet-500/15 to-indigo-500/10 text-white border border-violet-500/20 shadow-lg shadow-violet-500/5'
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
        <div className="p-3 border-t border-white/[0.04] space-y-2">
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
        <div className="sticky top-0 z-30 bg-[#030711]/80 backdrop-blur-xl border-b border-white/[0.04] px-6 py-3">
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
                <div className="w-10 h-10 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
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
                            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-xs text-violet-400 font-bold">
                              {log.performedBy?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <span className="text-violet-400 font-medium text-sm">{log.performedBy}</span>
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
                      <input value={newRoom.name} onChange={e => setNewRoom({ ...newRoom, name: e.target.value })} placeholder="اسم الغرفة" className="bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20" />
                      <input value={newRoom.description} onChange={e => setNewRoom({ ...newRoom, description: e.target.value })} placeholder="وصف الغرفة (اختياري)" className="bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20" />
                      <select value={newRoom.type} onChange={e => setNewRoom({ ...newRoom, type: e.target.value })} className="bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/50">
                        <option value="PUBLIC">عامة</option>
                        <option value="PRIVATE">خاصة</option>
                        <option value="ANNOUNCEMENT">إعلانات</option>
                      </select>
                    </div>
                    <button onClick={createRoom} className="mt-4 px-6 py-2.5 bg-gradient-to-l from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl text-sm text-white font-medium transition-all hover:shadow-lg hover:shadow-violet-500/20">
                      إنشاء الغرفة
                    </button>
                  </div>

                  {/* Rooms List */}
                  <div className="space-y-3">
                    {rooms.length === 0 && <p className="text-gray-500 text-center py-8 text-sm">لا توجد غرف</p>}
                    {rooms.map((room: any) => (
                      <div key={room.id} className="glass rounded-2xl p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ${room.isFrozen ? 'bg-blue-500/10 text-blue-400' : 'bg-violet-500/10 text-violet-400'}`}>
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
                        className="w-full bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3 pr-10 text-white text-sm focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
                    </div>
                    <button onClick={() => loadTabData('users')} className="px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm text-white font-medium transition-colors">
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
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-sm font-bold overflow-hidden">
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
                            className="px-3 py-1.5 bg-violet-500/15 text-violet-400 hover:bg-violet-500/25 rounded-lg text-xs font-medium transition-colors"
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
                      className="w-full bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3 text-white text-sm mb-3 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
                    />
                    <textarea
                      value={newAnnouncement.content}
                      onChange={e => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                      placeholder="محتوى الإعلان..."
                      rows={3}
                      className="w-full bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3 text-white text-sm mb-3 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                        <input type="checkbox" checked={newAnnouncement.isPinned} onChange={e => setNewAnnouncement({ ...newAnnouncement, isPinned: e.target.checked })} className="rounded" />
                        📌 تثبيت الإعلان
                      </label>
                      <button onClick={createAnnouncement} className="px-6 py-2.5 bg-gradient-to-l from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl text-sm text-white font-medium transition-all">
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
                            <span className="text-violet-400 font-medium">{report.reporter?.username}</span>
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
                        <select value={punishForm.type} onChange={e => setPunishForm({ ...punishForm, type: e.target.value })} className="w-full bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/50">
                          <option value="warning">⚠️ تحذير</option>
                          <option value="mute">🔇 كتم</option>
                          <option value="ban">🚫 حظر</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-gray-400 text-xs mb-1.5 block">المستخدم المستهدف</label>
                        <select value={punishForm.targetUserId} onChange={e => setPunishForm({ ...punishForm, targetUserId: e.target.value })} className="w-full bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/50">
                          <option value="">اختر المستخدم</option>
                          {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-gray-400 text-xs mb-1.5 block">السبب</label>
                        <input value={punishForm.reason} onChange={e => setPunishForm({ ...punishForm, reason: e.target.value })} placeholder="سبب العقوبة" className="w-full bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/50" />
                      </div>
                      {punishForm.type !== 'warning' && (
                        <div>
                          <label className="text-gray-400 text-xs mb-1.5 block">المدة (بالدقائق)</label>
                          <input type="number" value={punishForm.duration} onChange={e => setPunishForm({ ...punishForm, duration: Number(e.target.value) })} placeholder="المدة بالدقائق" className="w-full bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/50" />
                        </div>
                      )}
                    </div>
                    <button onClick={issuePunishment} className="mt-4 px-6 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-sm text-white font-medium transition-colors">
                      تطبيق العقوبة
                    </button>
                  </div>

                  {/* Filter */}
                  <div className="flex gap-2">
                    <button onClick={() => setPunishFilter('all')} className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${punishFilter === 'all' ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' : 'bg-gray-800/40 text-gray-400 hover:bg-gray-800/60'}`}>الكل</button>
                    <button onClick={() => setPunishFilter('active')} className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${punishFilter === 'active' ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' : 'bg-gray-800/40 text-gray-400 hover:bg-gray-800/60'}`}>النشطة فقط</button>
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
                    <button onClick={() => setAuditFilter('all')} className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${auditFilter === 'all' ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' : 'bg-gray-800/40 text-gray-400 hover:bg-gray-800/60'}`}>
                      الكل ({auditLogs.length})
                    </button>
                    {auditActions.map(action => (
                      <button key={action} onClick={() => setAuditFilter(action)} className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${auditFilter === action ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' : 'bg-gray-800/40 text-gray-400 hover:bg-gray-800/60'}`}>
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
                          <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-xs text-violet-400 font-bold flex-shrink-0">
                            {log.performerName?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-violet-400 text-sm font-medium">{log.performerName}</span>
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

              {/* ==================== TICKETS ==================== */}
              {activeTab === 'tickets' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">إدارة التذاكر</h2>
                      <p className="text-gray-500 text-sm">مراجعة والرد على تذاكر الدعم الفني</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'مفتوحة', count: tickets.filter((t: any) => t.status === 'OPEN').length, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                      { label: 'قيد المراجعة', count: tickets.filter((t: any) => t.status === 'REVIEWING').length, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                      { label: 'مصعدة', count: tickets.filter((t: any) => t.status === 'ESCALATED').length, color: 'text-red-400', bg: 'bg-red-500/10' },
                      { label: 'الإجمالي', count: tickets.length, color: 'text-violet-400', bg: 'bg-violet-500/10' },
                    ].map((s, i) => (
                      <div key={i} className={`${s.bg} rounded-xl p-3 text-center`}>
                        <p className={`text-lg font-bold ${s.color}`}>{s.count}</p>
                        <p className="text-gray-500 text-[10px]">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Search + Filter */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input type="text" value={ticketSearch} onChange={e => setTicketSearch(e.target.value)}
                      placeholder="🔍 بحث بالعنوان أو اسم المستخدم..."
                      className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500/40 placeholder:text-gray-600" />
                    <div className="flex items-center gap-1.5 text-xs overflow-x-auto">
                      {['', 'OPEN', 'REVIEWING', 'REPLIED', 'WAITING_USER', 'ESCALATED', 'CLOSED'].map(s => {
                        const info = s ? TICKET_STATUSES[s] : { label: 'الكل', color: 'text-white', bg: 'bg-violet-500/10' };
                        return (
                          <button key={s} onClick={() => { setTicketFilter(s); ticketFilterRef.current = s; loadTabData('tickets'); }}
                            className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap ${ticketFilter === s ? `${info.bg} ${info.color} font-medium` : 'text-gray-500 hover:text-white'}`}>
                            {info.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {selectedTicket ? (
                    <div className="space-y-4">
                      <button onClick={() => setSelectedTicket(null)} className="text-gray-500 hover:text-white text-xs">← العودة للقائمة</button>
                      <div className="content-card p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-white mb-1">{selectedTicket.title}</h3>
                            <div className="flex flex-wrap gap-2 text-[11px]">
                              <span className={`px-2 py-0.5 rounded ${TICKET_STATUSES[selectedTicket.status]?.bg} ${TICKET_STATUSES[selectedTicket.status]?.color}`}>{TICKET_STATUSES[selectedTicket.status]?.label}</span>
                              <span className={TICKET_PRIORITIES[selectedTicket.priority]?.color}>⚡ {TICKET_PRIORITIES[selectedTicket.priority]?.label}</span>
                              <span className="text-gray-500">📁 {TICKET_DEPARTMENTS[selectedTicket.department] || selectedTicket.department}</span>
                              <span className="text-gray-500">👤 {selectedTicket.user?.displayName || selectedTicket.user?.username}</span>
                              <span className="text-gray-600">📅 {new Date(selectedTicket.createdAt).toLocaleDateString('ar-SA')}</span>
                              {selectedTicket.assignee && <span className="text-violet-400">👨‍💼 {selectedTicket.assignee.displayName || selectedTicket.assignee.username}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Status + Priority controls */}
                        <div className="flex flex-wrap gap-4 mb-4 p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                          <div>
                            <p className="text-[9px] text-gray-600 mb-1">تغيير الحالة:</p>
                            <div className="flex gap-1">
                              {['OPEN', 'REVIEWING', 'REPLIED', 'WAITING_USER', 'ESCALATED', 'CLOSED'].map(s => {
                                if (selectedTicket.status === s) return null;
                                const si = TICKET_STATUSES[s];
                                return (
                                  <button key={s} onClick={async () => {
                                    const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
                                      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ status: s }),
                                    });
                                    if (res.ok) {
                                      const updated = await res.json();
                                      setSelectedTicket({ ...selectedTicket, status: updated.status });
                                      loadTabData('tickets');
                                      showMsg(`تم تغيير الحالة إلى ${si.label}`, 'success');
                                    }
                                  }} className={`px-2 py-1 rounded text-[10px] ${si.bg} ${si.color} hover:opacity-80 transition-all`}>
                                    {si.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div>
                            <p className="text-[9px] text-gray-600 mb-1">تغيير الأولوية:</p>
                            <div className="flex gap-1">
                              {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => {
                                if (selectedTicket.priority === p) return null;
                                const pi = TICKET_PRIORITIES[p];
                                return (
                                  <button key={p} onClick={async () => {
                                    const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
                                      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ priority: p }),
                                    });
                                    if (res.ok) {
                                      setSelectedTicket({ ...selectedTicket, priority: p });
                                      loadTabData('tickets');
                                      showMsg(`تم تغيير الأولوية إلى ${pi.label}`, 'success');
                                    }
                                  }} className={`px-2 py-1 rounded text-[10px] ${pi.color} bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all`}>
                                    {pi.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04] mb-4">
                          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{selectedTicket.description}</p>
                        </div>

                        {/* Replies */}
                        <h4 className="text-sm font-medium text-gray-400 mb-3">الردود ({selectedTicket.replies?.length || 0})</h4>
                        <div className="space-y-3 mb-4">
                          {selectedTicket.replies?.map((reply: any) => (
                            <div key={reply.id} className={`rounded-xl p-3 border ${reply.isStaff ? 'bg-violet-500/[0.04] border-violet-500/10' : 'bg-white/[0.02] border-white/[0.06]'}`}>
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-white text-xs font-medium">{reply.user?.displayName || reply.user?.username}</span>
                                {reply.isStaff && <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400">فريق الدعم</span>}
                                <span className="text-gray-600 text-[10px] mr-auto">{new Date(reply.createdAt).toLocaleString('ar-SA')}</span>
                              </div>
                              <p className="text-gray-300 text-sm whitespace-pre-wrap">{reply.content}</p>
                            </div>
                          ))}
                        </div>

                        {selectedTicket.status !== 'CLOSED' && (
                          <div className="flex gap-2">
                            <input
                              type="text" value={ticketReply} onChange={e => setTicketReply(e.target.value)}
                              placeholder="اكتب ردك هنا..."
                              className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500/40 placeholder:text-gray-600"
                              onKeyDown={e => { if (e.key === 'Enter' && ticketReply.trim()) {
                                (async () => {
                                  const res = await fetch(`/api/tickets/${selectedTicket.id}/replies`, {
                                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ content: ticketReply }),
                                  });
                                  if (res.ok) {
                                    setTicketReply('');
                                    const tRes = await fetch(`/api/tickets/${selectedTicket.id}`);
                                    if (tRes.ok) setSelectedTicket(await tRes.json());
                                    showMsg('تم إرسال الرد', 'success');
                                  }
                                })();
                              }}}
                            />
                            <button onClick={async () => {
                              if (!ticketReply.trim()) return;
                              const res = await fetch(`/api/tickets/${selectedTicket.id}/replies`, {
                                method: 'POST', headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ content: ticketReply }),
                              });
                              if (res.ok) {
                                setTicketReply('');
                                const tRes = await fetch(`/api/tickets/${selectedTicket.id}`);
                                if (tRes.ok) setSelectedTicket(await tRes.json());
                                showMsg('تم إرسال الرد', 'success');
                              }
                            }} className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-white text-sm font-medium transition-colors">
                              إرسال
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {tickets.length === 0 ? (
                        <div className="text-center py-16 content-card">
                          <div className="text-4xl mb-3">📭</div>
                          <p className="text-gray-400">لا توجد تذاكر</p>
                        </div>
                      ) : tickets.filter((ticket: any) => {
                        if (!ticketSearch.trim()) return true;
                        const q = ticketSearch.toLowerCase();
                        return ticket.title?.toLowerCase().includes(q) ||
                          ticket.user?.displayName?.toLowerCase().includes(q) ||
                          ticket.user?.username?.toLowerCase().includes(q);
                      }).map((ticket) => (
                        <div key={ticket.id} onClick={async () => {
                          const res = await fetch(`/api/tickets/${ticket.id}`);
                          if (res.ok) setSelectedTicket(await res.json());
                        }} className="content-card p-4 cursor-pointer hover:bg-white/[0.04] transition-all">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white text-sm font-medium truncate mb-1">{ticket.title}</h4>
                              <div className="flex flex-wrap items-center gap-2 text-[10px]">
                                <span className={`px-1.5 py-0.5 rounded ${TICKET_STATUSES[ticket.status]?.bg} ${TICKET_STATUSES[ticket.status]?.color}`}>{TICKET_STATUSES[ticket.status]?.label}</span>
                                <span className={TICKET_PRIORITIES[ticket.priority]?.color}>{TICKET_PRIORITIES[ticket.priority]?.label}</span>
                                <span className="text-gray-600">{TICKET_DEPARTMENTS[ticket.department] || ticket.department}</span>
                                <span className="text-gray-600">👤 {ticket.user?.displayName || ticket.user?.username}</span>
                                <span className="text-gray-700">{new Date(ticket.createdAt).toLocaleDateString('ar-SA')}</span>
                              </div>
                            </div>
                            <span className="text-gray-600 text-[11px]">💬 {ticket._count?.replies || 0}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ==================== SEND NOTIFICATIONS ==================== */}
              {activeTab === 'send_notifications' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">إرسال إشعارات</h2>
                    <p className="text-gray-500 text-sm">إرسال إشعارات للمستخدمين مع تحديد النوع والأهمية</p>
                  </div>

                  {/* Send Form */}
                  <div className="content-card p-6 space-y-4">
                    <div>
                      <label className="block text-gray-400 text-xs font-medium mb-1.5">عنوان الإشعار *</label>
                      <input type="text" value={notifTitle} onChange={e => setNotifTitle(e.target.value)} maxLength={200}
                        className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/40 transition-all placeholder:text-gray-600"
                        placeholder="عنوان واضح للإشعار" />
                    </div>

                    <div>
                      <label className="block text-gray-400 text-xs font-medium mb-1.5">محتوى الإشعار</label>
                      <textarea value={notifContent} onChange={e => setNotifContent(e.target.value)} rows={3} maxLength={1000}
                        className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/40 transition-all resize-none placeholder:text-gray-600"
                        placeholder="وصف مختصر للإشعار..." />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 text-xs font-medium mb-1.5">التصنيف</label>
                        <select value={notifCategory} onChange={e => setNotifCategory(e.target.value)}
                          className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/40">
                          <option value="ADMIN" className="bg-[#0A0F1C]">👑 إدارية</option>
                          <option value="GENERAL" className="bg-[#0A0F1C]">🔔 عامة</option>
                          <option value="TICKET" className="bg-[#0A0F1C]">🎫 تذاكر</option>
                          <option value="CHAT" className="bg-[#0A0F1C]">💬 دردشة</option>
                          <option value="BADGE" className="bg-[#0A0F1C]">🏅 شارات</option>
                          <option value="LEVEL" className="bg-[#0A0F1C]">💎 مستوى</option>
                          <option value="ITEM" className="bg-[#0A0F1C]">🎒 عناصر</option>
                          <option value="PROFILE" className="bg-[#0A0F1C]">👤 ملف شخصي</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-400 text-xs font-medium mb-1.5">الأهمية</label>
                        <select value={notifPriority} onChange={e => setNotifPriority(e.target.value)}
                          className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/40">
                          <option value="LOW" className="bg-[#0A0F1C]">منخفضة</option>
                          <option value="NORMAL" className="bg-[#0A0F1C]">عادية</option>
                          <option value="HIGH" className="bg-[#0A0F1C]">عالية</option>
                          <option value="URGENT" className="bg-[#0A0F1C]">عاجلة</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-400 text-xs font-medium mb-1.5">رابط داخلي (اختياري)</label>
                      <input type="text" value={notifLink} onChange={e => setNotifLink(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/40 transition-all placeholder:text-gray-600"
                        placeholder="/chat أو /support أو أي صفحة داخلية" />
                    </div>

                    <div>
                      <label className="block text-gray-400 text-xs font-medium mb-1.5">إرسال إلى</label>
                      <div className="flex gap-3">
                        <button type="button" onClick={() => setNotifTarget('all')}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-medium border transition-all ${notifTarget === 'all' ? 'bg-violet-500/15 text-violet-400 border-violet-500/25' : 'bg-white/[0.02] border-white/[0.06] text-gray-500 hover:text-white'}`}>
                          👥 جميع المستخدمين
                        </button>
                        <button type="button" onClick={() => setNotifTarget('user')}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-medium border transition-all ${notifTarget === 'user' ? 'bg-violet-500/15 text-violet-400 border-violet-500/25' : 'bg-white/[0.02] border-white/[0.06] text-gray-500 hover:text-white'}`}>
                          👤 مستخدم محدد
                        </button>
                      </div>
                      {notifTarget === 'user' && (
                        <input type="text" value={notifTargetUser} onChange={e => setNotifTargetUser(e.target.value)}
                          className="w-full mt-2 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/40 transition-all placeholder:text-gray-600"
                          placeholder="معرف المستخدم (User ID)" />
                      )}
                    </div>

                    <button onClick={async () => {
                      if (!notifTitle.trim()) { showMsg('العنوان مطلوب', 'error'); return; }
                      setSendingNotif(true);
                      try {
                        const res = await fetch('/api/admin/notifications', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            title: notifTitle, content: notifContent, type: notifType,
                            category: notifCategory, priority: notifPriority, link: notifLink,
                            targetType: notifTarget, targetUserId: notifTarget === 'user' ? notifTargetUser : undefined,
                          }),
                        });
                        if (res.ok) {
                          showMsg('تم إرسال الإشعار بنجاح', 'success');
                          setNotifTitle(''); setNotifContent(''); setNotifLink('');
                          loadTabData('send_notifications');
                        } else {
                          const d = await res.json();
                          showMsg(d.error || 'فشل الإرسال', 'error');
                        }
                      } catch { showMsg('خطأ في الاتصال', 'error'); }
                      setSendingNotif(false);
                    }} disabled={sendingNotif || !notifTitle.trim()}
                      className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl font-semibold text-white text-sm transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50">
                      {sendingNotif ? 'جاري الإرسال...' : '📤 إرسال الإشعار'}
                    </button>
                  </div>

                  {/* History */}
                  <div>
                    <h3 className="text-lg font-bold text-white mb-3">سجل الإشعارات المرسلة</h3>
                    {notifHistory.length === 0 ? (
                      <div className="text-center py-10 content-card"><p className="text-gray-500 text-sm">لا توجد إشعارات مرسلة</p></div>
                    ) : (
                      <div className="space-y-2">
                        {notifHistory.map((log: any) => (
                          <div key={log.id} className="content-card p-4">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-white text-sm font-medium">{(log.details as any)?.title || 'إشعار'}</h4>
                              <span className="text-gray-600 text-[10px]">{new Date(log.createdAt).toLocaleString('ar-SA')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-gray-500">
                              <span>👤 {log.performer?.displayName || log.performer?.username}</span>
                              <span>📨 {(log.details as any)?.targetType === 'user' ? 'مستخدم محدد' : 'جميع المستخدمين'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
                            ? 'bg-gradient-to-bl from-violet-500/15 to-indigo-500/10 border border-violet-500/25 shadow-lg shadow-violet-500/5'
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
                          <span className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-sm">🌐</span>
                          إعدادات الموقع
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="text-gray-400 text-xs mb-1.5 block">اسم الموقع</label>
                            <input
                              value={siteName}
                              onChange={e => setSiteName(e.target.value)}
                              placeholder="اسم الموقع"
                              className="w-full bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
                            />
                          </div>
                          <div>
                            <label className="text-gray-400 text-xs mb-1.5 block">رسالة الترحيب</label>
                            <textarea
                              value={welcomeMessage}
                              onChange={e => setWelcomeMessage(e.target.value)}
                              placeholder="رسالة ترحيب تظهر للمستخدمين الجدد..."
                              rows={3}
                              className="w-full bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 resize-none"
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

                  {/* Dynamic Pages Editor */}
                  {settingsSection === 'pages' && (
                    <div className="space-y-4">
                      <div className="glass rounded-2xl p-6">
                        <h3 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
                          <span className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-sm">📄</span>
                          صفحات المحتوى الديناميكية
                        </h3>
                        <p className="text-gray-500 text-xs mb-4">تعديل محتوى الصفحات العامة (القوانين، الترحيب، عن الموقع، الخصوصية)</p>

                        {/* Page tabs */}
                        <div className="flex gap-2 mb-4 flex-wrap">
                          {[
                            { id: 'rules' as const, label: 'القوانين', icon: '📜' },
                            { id: 'welcome' as const, label: 'الترحيب', icon: '👋' },
                            { id: 'about' as const, label: 'عن الموقع', icon: 'ℹ️' },
                            { id: 'privacy' as const, label: 'الخصوصية', icon: '🔐' },
                          ].map(pt => (
                            <button
                              key={pt.id}
                              onClick={() => setActivePageTab(pt.id)}
                              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                                activePageTab === pt.id
                                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                                  : 'bg-white/[0.03] text-gray-400 hover:bg-white/[0.06]'
                              }`}
                            >
                              {pt.icon} {pt.label}
                            </button>
                          ))}
                        </div>

                        {/* Editor */}
                        <textarea
                          value={
                            activePageTab === 'rules' ? pageRules :
                            activePageTab === 'welcome' ? pageWelcome :
                            activePageTab === 'about' ? pageAbout : pagePrivacy
                          }
                          onChange={e => {
                            const v = e.target.value;
                            if (activePageTab === 'rules') setPageRules(v);
                            else if (activePageTab === 'welcome') setPageWelcome(v);
                            else if (activePageTab === 'about') setPageAbout(v);
                            else setPagePrivacy(v);
                          }}
                          placeholder={`اكتب محتوى صفحة ${
                            activePageTab === 'rules' ? 'القوانين' :
                            activePageTab === 'welcome' ? 'الترحيب' :
                            activePageTab === 'about' ? 'عن الموقع' : 'الخصوصية'
                          }...`}
                          rows={10}
                          className="w-full bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 resize-none font-mono leading-relaxed"
                          dir="auto"
                        />
                        <p className="text-gray-600 text-[10px] mt-2">يمكنك استخدام نص عادي. المحتوى يُحفظ مع باقي الإعدادات عند الضغط على &quot;حفظ الإعدادات&quot;</p>
                      </div>
                    </div>
                  )}

                  {/* Save Button */}
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-gray-600 text-xs">يتم حفظ جميع الإعدادات في قسم واحد</p>
                    <button onClick={saveSettings} className="px-8 py-3 bg-gradient-to-l from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl text-white font-medium transition-all hover:shadow-lg hover:shadow-violet-500/20">
                      حفظ الإعدادات
                    </button>
                  </div>
                </div>
              )}

              {/* ==================== GITHUB MONITOR ==================== */}
              {activeTab === 'github_monitor' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">🔍 مراقبة الكود</h2>
                      <p className="text-gray-500 text-sm">مركز مراقبة GitHub — الأحداث، التنبيهات، الفحوصات، والإصلاحات</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {ghSummary?.configured && (
                        <button
                          onClick={async () => {
                            setGhSyncing(true);
                            try {
                              const res = await fetch('/api/admin/github', {
                                method: 'POST', headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'sync' }),
                              });
                              if (res.ok) { showMsg('تمت المزامنة بنجاح', 'success'); loadTabData('github_monitor'); }
                              else { const d = await res.json(); showMsg(d.error || 'فشلت المزامنة', 'error'); }
                            } catch { showMsg('خطأ في المزامنة', 'error'); }
                            setGhSyncing(false);
                          }}
                          disabled={ghSyncing}
                          className="px-4 py-2 bg-blue-600/20 border border-blue-500/20 text-blue-400 rounded-xl text-sm hover:bg-blue-600/30 transition-colors disabled:opacity-50"
                        >
                          {ghSyncing ? '⏳ جاري المزامنة...' : '🔄 مزامنة الآن'}
                        </button>
                      )}
                      <button
                        onClick={() => setGhView('setup')}
                        className={`px-4 py-2 rounded-xl text-sm transition-colors ${ghView === 'setup' ? 'bg-violet-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                      >
                        ⚙️ الإعداد
                      </button>
                    </div>
                  </div>

                  {/* Sub-navigation */}
                  {ghSummary?.configured && ghView !== 'setup' && ghView !== 'editor' && ghView !== 'scanner' && (
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { id: 'overview' as const, label: '📊 نظرة عامة' },
                        { id: 'events' as const, label: '📋 الأحداث' },
                        { id: 'files' as const, label: '📁 الملفات' },
                        { id: 'alerts' as const, label: `🔔 التنبيهات ${ghSummary?.openAlerts > 0 ? `(${ghSummary.openAlerts})` : ''}` },
                        { id: 'checks' as const, label: '✅ الفحوصات' },
                        { id: 'fixes' as const, label: '🔧 الإصلاحات' },
                      ].map(v => (
                        <button key={v.id} onClick={() => setGhView(v.id)}
                          className={`px-4 py-2 rounded-xl text-sm transition-all ${ghView === v.id ? 'bg-violet-600/20 border border-violet-500/30 text-violet-400' : 'bg-white/[0.03] text-gray-400 hover:bg-white/[0.06]'}`}
                        >{v.label}</button>
                      ))}
                      <button onClick={() => { setGhView('scanner'); fetch('/api/admin/github?action=scan_history').then(r => r.json()).then(d => setGhScanHistory(d)).catch(() => {}); }}
                        className={`px-4 py-2 rounded-xl text-sm transition-all bg-gradient-to-l from-emerald-600/20 to-teal-600/20 border border-emerald-500/20 text-emerald-400 hover:from-emerald-600/30 hover:to-teal-600/30`}
                      >🔬 الفحص الذكي</button>
                    </div>
                  )}

                  {/* Setup View */}
                  {ghView === 'setup' && (
                    <div className="space-y-6">
                      <div className="glass rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-2">🔗 ربط GitHub App</h3>
                        <p className="text-gray-500 text-sm mb-6">أدخل بيانات تطبيق GitHub الخاص بك للربط مع الريبو</p>

                        {/* Setup Instructions */}
                        <div className="mb-6 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                          <h4 className="text-blue-400 text-sm font-bold mb-3">📖 خطوات الإعداد:</h4>
                          <ol className="text-gray-400 text-xs space-y-2 list-decimal pr-5">
                            <li>اذهب إلى <a href="https://github.com/settings/apps/new" target="_blank" rel="noopener" className="text-blue-400 underline">github.com/settings/apps/new</a></li>
                            <li>اكتب اسم التطبيق (مثل: ChatZone Monitor)</li>
                            <li>Webhook URL: <code className="bg-white/10 px-1 rounded text-xs">{typeof window !== 'undefined' ? window.location.origin : ''}/api/github/webhook</code></li>
                            <li>اختر الصلاحيات: Contents (R/W), Pull requests (R/W), Checks (R), Actions (R), Security events (R)</li>
                            <li>اشترك بالأحداث: Push, Pull request, Check run, Check suite, Code scanning alert, Secret scanning alert, Dependabot alert</li>
                            <li>أنشئ التطبيق ← انسخ App ID</li>
                            <li>اضغط &quot;Generate a private key&quot; ← حمّل الملف وانسخ محتواه</li>
                            <li>ثبّت التطبيق على الريبو ← انسخ Installation ID من الرابط</li>
                          </ol>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-gray-400 text-xs mb-1 block">App ID *</label>
                            <input value={ghSetup.appId} onChange={e => setGhSetup(s => ({ ...s, appId: e.target.value }))}
                              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500/50" placeholder="123456" />
                          </div>
                          <div>
                            <label className="text-gray-400 text-xs mb-1 block">Installation ID *</label>
                            <input value={ghSetup.installationId} onChange={e => setGhSetup(s => ({ ...s, installationId: e.target.value }))}
                              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500/50" placeholder="78901234" />
                          </div>
                          <div>
                            <label className="text-gray-400 text-xs mb-1 block">Repo Owner *</label>
                            <input value={ghSetup.repoOwner} onChange={e => setGhSetup(s => ({ ...s, repoOwner: e.target.value }))}
                              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500/50" placeholder="alitravians" />
                          </div>
                          <div>
                            <label className="text-gray-400 text-xs mb-1 block">Repo Name *</label>
                            <input value={ghSetup.repoName} onChange={e => setGhSetup(s => ({ ...s, repoName: e.target.value }))}
                              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500/50" placeholder="Ali" />
                          </div>
                          <div>
                            <label className="text-gray-400 text-xs mb-1 block">Default Branch</label>
                            <input value={ghSetup.defaultBranch} onChange={e => setGhSetup(s => ({ ...s, defaultBranch: e.target.value }))}
                              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500/50" placeholder="main" />
                          </div>
                          <div>
                            <label className="text-gray-400 text-xs mb-1 block">Webhook Secret</label>
                            <input value={ghSetup.webhookSecret} onChange={e => setGhSetup(s => ({ ...s, webhookSecret: e.target.value }))}
                              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500/50" placeholder="اختياري — لتأمين الـ Webhooks" />
                          </div>
                        </div>

                        <div className="mt-4">
                          <label className="text-gray-400 text-xs mb-1 block">Private Key * (محتوى ملف .pem)</label>
                          <textarea value={ghSetup.privateKey} onChange={e => setGhSetup(s => ({ ...s, privateKey: e.target.value }))}
                            rows={4} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-violet-500/50 resize-none"
                            placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----" />
                        </div>

                        <div className="flex gap-3 mt-6">
                          <button
                            onClick={async () => {
                              if (!ghSetup.appId || !ghSetup.privateKey || !ghSetup.installationId || !ghSetup.repoOwner || !ghSetup.repoName) {
                                showMsg('جميع الحقول المطلوبة (*) يجب تعبئتها', 'error'); return;
                              }
                              setGhSyncing(true);
                              try {
                                const res = await fetch('/api/admin/github', {
                                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ action: 'save_config', ...ghSetup }),
                                });
                                const data = await res.json();
                                if (data.success) {
                                  showMsg(data.warning || 'تم ربط GitHub بنجاح وبدأت المزامنة', 'success');
                                  setGhView('overview');
                                  loadTabData('github_monitor');
                                } else { showMsg(data.error || 'فشل الربط', 'error'); }
                              } catch { showMsg('خطأ في الاتصال', 'error'); }
                              setGhSyncing(false);
                            }}
                            disabled={ghSyncing}
                            className="flex-1 py-3 bg-gradient-to-l from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl text-white font-medium transition-all disabled:opacity-50"
                          >
                            {ghSyncing ? '⏳ جاري الربط...' : '🔗 ربط وبدء المزامنة'}
                          </button>
                          {ghSummary?.configured && (
                            <button onClick={() => setGhView('overview')} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 text-sm transition-colors">
                              العودة
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Not Configured */}
                  {!ghSummary?.configured && ghView !== 'setup' && (
                    <div className="glass rounded-2xl p-12 text-center">
                      <div className="text-6xl mb-4">🔗</div>
                      <h3 className="text-xl font-bold text-white mb-2">لم يتم ربط GitHub بعد</h3>
                      <p className="text-gray-500 text-sm mb-6">اربط تطبيق GitHub الخاص بك لبدء مراقبة الكود والملفات والتنبيهات الأمنية</p>
                      <button onClick={() => setGhView('setup')} className="px-8 py-3 bg-gradient-to-l from-violet-600 to-indigo-600 rounded-xl text-white font-medium hover:from-violet-500 hover:to-indigo-500 transition-all">
                        ⚙️ إعداد الربط
                      </button>
                    </div>
                  )}

                  {/* Overview */}
                  {ghView === 'overview' && ghSummary?.configured && (
                    <div className="space-y-6">
                      {/* Summary Cards */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="glass rounded-2xl p-5">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl">🔔</span>
                            <span className={`text-3xl font-bold ${ghSummary.openAlerts > 0 ? 'text-red-400' : 'text-green-400'}`}>{ghSummary.openAlerts}</span>
                          </div>
                          <p className="text-gray-400 text-sm">تنبيهات مفتوحة</p>
                        </div>
                        <div className="glass rounded-2xl p-5">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl">🔴</span>
                            <span className={`text-3xl font-bold ${ghSummary.criticalAlerts > 0 ? 'text-red-400' : 'text-green-400'}`}>{ghSummary.criticalAlerts}</span>
                          </div>
                          <p className="text-gray-400 text-sm">تنبيهات حرجة</p>
                        </div>
                        <div className="glass rounded-2xl p-5">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl">❌</span>
                            <span className={`text-3xl font-bold ${ghSummary.failedChecks > 0 ? 'text-red-400' : 'text-green-400'}`}>{ghSummary.failedChecks}</span>
                          </div>
                          <p className="text-gray-400 text-sm">فحوصات فاشلة</p>
                        </div>
                        <div className="glass rounded-2xl p-5">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl">📝</span>
                            <span className="text-3xl font-bold text-blue-400">{ghSummary.todayChanges}</span>
                          </div>
                          <p className="text-gray-400 text-sm">تغييرات اليوم</p>
                        </div>
                      </div>

                      {/* Repo Info */}
                      {ghSummary.repoInfo && (
                        <div className="glass rounded-2xl p-5">
                          <h3 className="text-white font-bold mb-3">📦 معلومات الريبو</h3>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div><span className="text-gray-500">الاسم:</span> <span className="text-white mr-2">{ghSummary.repoInfo.fullName}</span></div>
                            <div><span className="text-gray-500">الفرع:</span> <span className="text-violet-400 mr-2">{ghSummary.repoInfo.defaultBranch}</span></div>
                            <div><span className="text-gray-500">اللغة:</span> <span className="text-blue-400 mr-2">{ghSummary.repoInfo.language || '—'}</span></div>
                            <div><span className="text-gray-500">الرؤية:</span> <span className="text-green-400 mr-2">{ghSummary.repoInfo.visibility}</span></div>
                          </div>
                          <p className="text-gray-600 text-xs mt-3">آخر مزامنة: {ghSummary.lastSyncAt ? new Date(ghSummary.lastSyncAt).toLocaleString('ar-SA') : 'لم تتم بعد'}</p>
                        </div>
                      )}

                      {/* Recent Events */}
                      <div className="glass rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-white font-bold">📋 آخر الأحداث</h3>
                          <button onClick={() => setGhView('events')} className="text-violet-400 text-xs hover:text-violet-300">عرض الكل ←</button>
                        </div>
                        {ghSummary.recentEvents?.length === 0 ? (
                          <p className="text-gray-600 text-sm text-center py-4">لا توجد أحداث بعد</p>
                        ) : (
                          <div className="space-y-2">
                            {(ghSummary.recentEvents || []).slice(0, 5).map((ev: any) => (
                              <div key={ev.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                                <span className="text-lg">
                                  {ev.eventType === 'PUSH' ? '📤' : ev.eventType === 'PULL_REQUEST' ? '🔀' : ev.eventType.includes('ALERT') ? '🔔' : ev.eventType.includes('CHECK') ? (ev.severity === 'ERROR' ? '❌' : '✅') : '⚙️'}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-sm truncate">{ev.title}</p>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span>{ev.actor || '—'}</span>
                                    {ev.branch && <><span>•</span><span className="text-violet-400">{ev.branch}</span></>}
                                    <span>•</span>
                                    <span>{new Date(ev.createdAt).toLocaleString('ar-SA')}</span>
                                  </div>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-lg ${
                                  ev.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400' :
                                  ev.severity === 'ERROR' ? 'bg-orange-500/10 text-orange-400' :
                                  ev.severity === 'WARNING' ? 'bg-yellow-500/10 text-yellow-400' :
                                  'bg-gray-500/10 text-gray-400'
                                }`}>{ev.severity === 'CRITICAL' ? 'حرج' : ev.severity === 'ERROR' ? 'خطأ' : ev.severity === 'WARNING' ? 'تحذير' : 'معلومة'}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Events View */}
                  {ghView === 'events' && ghSummary?.configured && (
                    <div className="space-y-4">
                      <div className="flex gap-2 flex-wrap">
                        {['', 'PUSH', 'PULL_REQUEST', 'CHECK_RUN', 'WORKFLOW_RUN'].map(t => (
                          <button key={t} onClick={() => setGhEventFilter(t)}
                            className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${ghEventFilter === t ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30' : 'bg-white/[0.03] text-gray-500 hover:text-gray-300'}`}
                          >{t === '' ? 'الكل' : t === 'PUSH' ? '📤 Push' : t === 'PULL_REQUEST' ? '🔀 PR' : t === 'CHECK_RUN' ? '✅ Checks' : '⚙️ Workflows'}</button>
                        ))}
                      </div>
                      <div className="space-y-2">
                        {ghEvents.filter(e => !ghEventFilter || e.eventType === ghEventFilter).map((ev: any) => (
                          <div key={ev.id} className="glass rounded-xl p-4 hover:bg-white/[0.04] transition-colors">
                            <div className="flex items-start gap-3">
                              <span className="text-xl mt-0.5">
                                {ev.eventType === 'PUSH' ? '📤' : ev.eventType === 'PULL_REQUEST' ? '🔀' : ev.eventType.includes('ALERT') ? '🔔' : ev.eventType.includes('CHECK') ? '✅' : '⚙️'}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium">{ev.title}</p>
                                {ev.description && <p className="text-gray-500 text-xs mt-1 line-clamp-2">{ev.description}</p>}
                                <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                                  {ev.actor && <span>👤 {ev.actor}</span>}
                                  {ev.branch && <span className="text-violet-400/60">🌿 {ev.branch}</span>}
                                  {ev.commitSha && (
                                    <button onClick={async () => {
                                      try {
                                        const res = await fetch(`/api/admin/github?action=diff&sha=${ev.commitSha}`);
                                        if (res.ok) { const d = await res.json(); alert(d.diff || 'No diff'); }
                                      } catch {}
                                    }} className="text-blue-400 hover:underline">#{ev.commitSha.slice(0, 7)}</button>
                                  )}
                                  <span>{new Date(ev.createdAt).toLocaleString('ar-SA')}</span>
                                </div>
                                {ev.fileChanges?.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {ev.fileChanges.slice(0, 5).map((fc: any) => (
                                      <span key={fc.id} className={`text-[10px] px-2 py-0.5 rounded ${
                                        fc.changeType === 'ADDED' ? 'bg-green-500/10 text-green-400' :
                                        fc.changeType === 'DELETED' ? 'bg-red-500/10 text-red-400' :
                                        fc.changeType === 'RENAMED' ? 'bg-blue-500/10 text-blue-400' :
                                        'bg-yellow-500/10 text-yellow-400'
                                      }`}>
                                        {fc.changeType === 'ADDED' ? '+' : fc.changeType === 'DELETED' ? '−' : fc.changeType === 'RENAMED' ? '→' : '~'} {fc.filePath.split('/').pop()}
                                      </span>
                                    ))}
                                    {ev.fileChanges.length > 5 && <span className="text-[10px] text-gray-600">+{ev.fileChanges.length - 5} ملفات</span>}
                                  </div>
                                )}
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-lg flex-shrink-0 ${
                                ev.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400' :
                                ev.severity === 'ERROR' ? 'bg-orange-500/10 text-orange-400' :
                                ev.severity === 'WARNING' ? 'bg-yellow-500/10 text-yellow-400' :
                                'bg-gray-500/10 text-gray-400'
                              }`}>{ev.severity === 'CRITICAL' ? 'حرج' : ev.severity === 'ERROR' ? 'خطأ' : ev.severity === 'WARNING' ? 'تحذير' : 'معلومة'}</span>
                            </div>
                          </div>
                        ))}
                        {ghEvents.filter(e => !ghEventFilter || e.eventType === ghEventFilter).length === 0 && (
                          <p className="text-center text-gray-600 py-8">لا توجد أحداث</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Files View */}
                  {ghView === 'files' && ghSummary?.configured && (
                    <div className="space-y-2">
                      {ghFiles.map((fc: any) => (
                        <div key={fc.id} className="glass rounded-xl p-4 flex items-center gap-4 hover:bg-white/[0.04] transition-colors">
                          <span className={`text-lg ${
                            fc.changeType === 'ADDED' ? 'text-green-400' : fc.changeType === 'DELETED' ? 'text-red-400' :
                            fc.changeType === 'RENAMED' ? 'text-blue-400' : 'text-yellow-400'
                          }`}>
                            {fc.changeType === 'ADDED' ? '🟢' : fc.changeType === 'DELETED' ? '🔴' : fc.changeType === 'RENAMED' ? '🔄' : '🟡'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-mono truncate">{fc.filePath}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                              <span>{fc.changeType === 'ADDED' ? 'مُضاف' : fc.changeType === 'DELETED' ? 'محذوف' : fc.changeType === 'RENAMED' ? 'مُعاد تسمية' : 'مُعدل'}</span>
                              {fc.author && <><span>•</span><span>{fc.author}</span></>}
                              {(fc.additions > 0 || fc.deletions > 0) && <><span>•</span><span className="text-green-500">+{fc.additions}</span><span className="text-red-500">-{fc.deletions}</span></>}
                              <span>•</span><span>{new Date(fc.createdAt).toLocaleString('ar-SA')}</span>
                            </div>
                          </div>
                          <button onClick={async () => {
                            try {
                              const res = await fetch(`/api/admin/github?action=file_content&path=${encodeURIComponent(fc.filePath)}`);
                              if (res.ok) {
                                const data = await res.json();
                                setGhFileContent({ path: fc.filePath, content: data.decodedContent || '', sha: data.sha });
                                setGhEditContent(data.decodedContent || '');
                                setGhCommitMsg(''); setGhPrTitle('');
                                setGhView('editor');
                              }
                            } catch { showMsg('فشل تحميل الملف', 'error'); }
                          }} className="text-violet-400 text-xs hover:text-violet-300 px-3 py-1.5 bg-violet-500/10 rounded-lg">
                            فتح ←
                          </button>
                        </div>
                      ))}
                      {ghFiles.length === 0 && <p className="text-center text-gray-600 py-8">لا توجد تغييرات في الملفات</p>}
                    </div>
                  )}

                  {/* Alerts View */}
                  {ghView === 'alerts' && ghSummary?.configured && (
                    <div className="space-y-4">
                      <div className="flex gap-2 flex-wrap">
                        {['', 'CODE_SCAN', 'SECRET_SCAN', 'DEPENDABOT'].map(t => (
                          <button key={t} onClick={() => setGhAlertFilter(t)}
                            className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${ghAlertFilter === t ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30' : 'bg-white/[0.03] text-gray-500 hover:text-gray-300'}`}
                          >{t === '' ? 'الكل' : t === 'CODE_SCAN' ? '🔍 فحص الكود' : t === 'SECRET_SCAN' ? '🔑 الأسرار' : '📦 التبعيات'}</button>
                        ))}
                      </div>
                      <div className="space-y-2">
                        {ghAlerts.filter(a => !ghAlertFilter || a.alertType === ghAlertFilter).map((alert: any) => (
                          <div key={alert.id} className="glass rounded-xl p-4 hover:bg-white/[0.04] transition-colors">
                            <div className="flex items-start gap-3">
                              <span className="text-xl mt-0.5">
                                {alert.alertType === 'CODE_SCAN' ? '🔍' : alert.alertType === 'SECRET_SCAN' ? '🔑' : '📦'}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium">{alert.title}</p>
                                {alert.description && <p className="text-gray-500 text-xs mt-1 line-clamp-2">{alert.description}</p>}
                                <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                                  {alert.filePath && <span className="font-mono text-blue-400/60">📄 {alert.filePath}{alert.lineNumber ? `:${alert.lineNumber}` : ''}</span>}
                                  {alert.ruleId && <span>Rule: {alert.ruleId}</span>}
                                  <span>{new Date(alert.createdAt).toLocaleString('ar-SA')}</span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                <span className={`text-xs px-2 py-1 rounded-lg ${
                                  alert.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400' :
                                  alert.severity === 'ERROR' ? 'bg-orange-500/10 text-orange-400' :
                                  alert.severity === 'WARNING' ? 'bg-yellow-500/10 text-yellow-400' :
                                  'bg-gray-500/10 text-gray-400'
                                }`}>{alert.severity === 'CRITICAL' ? 'حرج' : alert.severity === 'ERROR' ? 'خطأ' : alert.severity === 'WARNING' ? 'تحذير' : 'معلومة'}</span>
                                <span className={`text-[10px] ${alert.state === 'OPEN' ? 'text-red-400' : alert.state === 'FIXED' ? 'text-green-400' : 'text-gray-500'}`}>
                                  {alert.state === 'OPEN' ? '🔴 مفتوح' : alert.state === 'FIXED' ? '✅ مُصلح' : '⬜ مرفوض'}
                                </span>
                              </div>
                            </div>
                            {alert.filePath && alert.state === 'OPEN' && (
                              <button onClick={async () => {
                                try {
                                  const res = await fetch(`/api/admin/github?action=file_content&path=${encodeURIComponent(alert.filePath)}`);
                                  if (res.ok) {
                                    const data = await res.json();
                                    setGhFileContent({ path: alert.filePath, content: data.decodedContent || '', sha: data.sha });
                                    setGhEditContent(data.decodedContent || '');
                                    setGhCommitMsg(`fix: ${alert.title}`);
                                    setGhPrTitle(`Fix: ${alert.title}`);
                                    setGhView('editor');
                                  }
                                } catch { showMsg('فشل تحميل الملف', 'error'); }
                              }} className="mt-3 text-violet-400 text-xs hover:text-violet-300 bg-violet-500/10 px-3 py-1.5 rounded-lg">
                                🔧 فتح الملف وإصلاح
                              </button>
                            )}
                          </div>
                        ))}
                        {ghAlerts.filter(a => !ghAlertFilter || a.alertType === ghAlertFilter).length === 0 && (
                          <div className="text-center py-8">
                            <span className="text-4xl block mb-3">🛡️</span>
                            <p className="text-gray-600">لا توجد تنبيهات أمنية</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Checks View */}
                  {ghView === 'checks' && ghSummary?.configured && (
                    <div className="space-y-2">
                      {ghChecks.map((check: any) => (
                        <div key={check.id} className="glass rounded-xl p-4 flex items-center gap-4 hover:bg-white/[0.04] transition-colors">
                          <span className="text-2xl">
                            {check.conclusion === 'SUCCESS' ? '✅' : check.conclusion === 'FAILURE' ? '❌' :
                             check.status === 'IN_PROGRESS' ? '⏳' : check.status === 'QUEUED' ? '⏸️' : '⬜'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium">{check.name}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                              {check.branch && <span className="text-violet-400/60">🌿 {check.branch}</span>}
                              {check.commitSha && <span className="font-mono">#{check.commitSha.slice(0, 7)}</span>}
                              {check.completedAt && <span>{new Date(check.completedAt).toLocaleString('ar-SA')}</span>}
                            </div>
                          </div>
                          <span className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
                            check.conclusion === 'SUCCESS' ? 'bg-green-500/10 text-green-400' :
                            check.conclusion === 'FAILURE' ? 'bg-red-500/10 text-red-400' :
                            check.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-400' :
                            'bg-gray-500/10 text-gray-400'
                          }`}>
                            {check.conclusion === 'SUCCESS' ? 'نجح' : check.conclusion === 'FAILURE' ? 'فشل' :
                             check.status === 'IN_PROGRESS' ? 'قيد التنفيذ' : check.status === 'QUEUED' ? 'بالانتظار' : check.conclusion || check.status}
                          </span>
                          {check.detailsUrl && (
                            <a href={check.detailsUrl} target="_blank" rel="noopener" className="text-blue-400 text-xs hover:underline">تفاصيل ↗</a>
                          )}
                        </div>
                      ))}
                      {ghChecks.length === 0 && (
                        <div className="text-center py-8"><span className="text-4xl block mb-3">✅</span><p className="text-gray-600">لا توجد فحوصات</p></div>
                      )}
                    </div>
                  )}

                  {/* Fixes History View */}
                  {ghView === 'fixes' && ghSummary?.configured && (
                    <div className="space-y-2">
                      {ghFixes.map((fix: any) => (
                        <div key={fix.id} className="glass rounded-xl p-4 hover:bg-white/[0.04] transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{fix.fixType === 'PR' ? '🔀' : '⚡'}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium font-mono">{fix.filePath}</p>
                              <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                                <span>{fix.commitMessage}</span>
                                <span>•</span>
                                <span>{fix.performer?.username || fix.performer?.displayName || '—'}</span>
                                <span>•</span>
                                <span>{new Date(fix.createdAt).toLocaleString('ar-SA')}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`text-xs px-2 py-1 rounded-lg ${fix.fixType === 'PR' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                {fix.fixType === 'PR' ? 'Pull Request' : 'مباشر'}
                              </span>
                              {fix.prUrl && <a href={fix.prUrl} target="_blank" rel="noopener" className="text-blue-400 text-xs hover:underline">PR ↗</a>}
                            </div>
                          </div>
                        </div>
                      ))}
                      {ghFixes.length === 0 && (
                        <div className="text-center py-8"><span className="text-4xl block mb-3">🔧</span><p className="text-gray-600">لا توجد إصلاحات سابقة</p></div>
                      )}
                    </div>
                  )}

                  {/* ==================== Smart Scanner View ==================== */}
                  {ghView === 'scanner' && ghSummary?.configured && (
                    <div className="space-y-6">
                      {/* Scanner Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button onClick={() => setGhView('overview')} className="text-gray-400 hover:text-white text-sm">→ العودة</button>
                          <h3 className="text-xl font-bold text-white">🔬 الفحص الذكي للمشروع</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          {ghScanResult && (
                            <button
                              onClick={() => {
                                if (!ghScanResult) return;
                                const r = ghScanResult;
                                const lines: string[] = [];
                                lines.push('='.repeat(60));
                                lines.push('تقرير الفحص الذكي للمشروع');
                                lines.push('='.repeat(60));
                                lines.push(`التاريخ: ${new Date(r.scannedAt).toLocaleString('ar-SA')}`);
                                lines.push(`المدة: ${r.duration}`);
                                lines.push(`إجمالي الملفات: ${r.totalFiles}`);
                                lines.push(`الحجم: ${(r.totalSize / 1024 / 1024).toFixed(1)}MB`);
                                lines.push(`اللغات: ${Object.keys(r.languages || {}).join(', ')}`);
                                lines.push('');
                                lines.push(`نسبة الصحة: ${r.healthScore}%`);
                                lines.push('');
                                lines.push('-'.repeat(40));
                                lines.push('النتائج حسب الفئة:');
                                lines.push('-'.repeat(40));
                                r.categories.forEach((cat: { labelAr: string; score: number; maxScore: number; issues: { severity: string; title: string; description: string; file?: string; suggestion?: string }[] }) => {
                                  lines.push(`${cat.labelAr}: ${cat.score}/${cat.maxScore}`);
                                  if (cat.issues.length > 0) {
                                    cat.issues.forEach((issue: { severity: string; title: string; description: string; file?: string; suggestion?: string }) => {
                                      const sev = issue.severity === 'critical' ? '🔴 حرج' : issue.severity === 'warning' ? '🟡 تحذير' : 'ℹ️ معلومة';
                                      lines.push(`  ${sev}: ${issue.title}`);
                                      lines.push(`    ${issue.description}`);
                                      if (issue.file) lines.push(`    📄 ${issue.file}`);
                                      if (issue.suggestion) lines.push(`    💡 ${issue.suggestion}`);
                                    });
                                  }
                                  lines.push('');
                                });
                                const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `scan-report-${Date.now()}.txt`;
                                a.click();
                                URL.revokeObjectURL(url);
                              }}
                              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 text-sm transition-colors"
                            >📥 تصدير التقرير</button>
                          )}
                          <button
                            onClick={async () => {
                              setGhScanning(true);
                              setGhScanResult(null);
                              setGhScanProgress(0);
                              const steps = [
                                { pct: 10, text: 'جاري تحليل بنية المشروع...' },
                                { pct: 25, text: 'جاري فحص الأمان...' },
                                { pct: 45, text: 'جاري فحص جودة الكود...' },
                                { pct: 60, text: 'جاري فحص التبعيات...' },
                                { pct: 75, text: 'جاري فحص الأداء...' },
                                { pct: 90, text: 'جاري حساب النتائج...' },
                              ];
                              let stepIdx = 0;
                              const interval = setInterval(() => {
                                if (stepIdx < steps.length) {
                                  setGhScanProgress(steps[stepIdx].pct);
                                  setGhScanStep(steps[stepIdx].text);
                                  stepIdx++;
                                }
                              }, 1200);
                              try {
                                const res = await fetch('/api/admin/github', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ action: 'scan' }),
                                });
                                const data = await res.json();
                                clearInterval(interval);
                                setGhScanProgress(100);
                                setGhScanStep('اكتمل الفحص!');
                                if (data.success) {
                                  setTimeout(() => {
                                    setGhScanResult(data.result);
                                    setGhScanning(false);
                                    // Reload scan history
                                    fetch('/api/admin/github?action=scan_history').then(r => r.json()).then(d => setGhScanHistory(d)).catch(() => {});
                                  }, 500);
                                } else {
                                  showMsg(data.error || 'فشل الفحص', 'error');
                                  setGhScanning(false);
                                }
                              } catch {
                                clearInterval(interval);
                                showMsg('خطأ في الاتصال', 'error');
                                setGhScanning(false);
                              }
                            }}
                            disabled={ghScanning}
                            className="px-6 py-2.5 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl text-white font-medium text-sm transition-all disabled:opacity-50"
                          >
                            {ghScanning ? '⏳ جاري الفحص...' : '🔬 بدء الفحص'}
                          </button>
                        </div>
                      </div>

                      {/* Scanning Progress */}
                      {ghScanning && (
                        <div className="glass rounded-2xl p-8 text-center">
                          <div className="w-24 h-24 mx-auto mb-6 relative">
                            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                              <circle cx="50" cy="50" r="42" fill="none" stroke="url(#scanGrad)" strokeWidth="8"
                                strokeDasharray={`${ghScanProgress * 2.64} 264`}
                                strokeLinecap="round" className="transition-all duration-700" />
                              <defs>
                                <linearGradient id="scanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#10b981" />
                                  <stop offset="100%" stopColor="#14b8a6" />
                                </linearGradient>
                              </defs>
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-emerald-400">
                              {ghScanProgress}%
                            </span>
                          </div>
                          <p className="text-white font-medium mb-2">{ghScanStep}</p>
                          <div className="w-full max-w-xs mx-auto bg-white/5 rounded-full h-2 overflow-hidden">
                            <div className="h-full bg-gradient-to-l from-emerald-500 to-teal-500 rounded-full transition-all duration-700"
                              style={{ width: `${ghScanProgress}%` }} />
                          </div>
                        </div>
                      )}

                      {/* No scan results yet */}
                      {!ghScanning && !ghScanResult && (
                        <div className="glass rounded-2xl p-12 text-center">
                          <div className="text-6xl mb-4">🔬</div>
                          <h3 className="text-xl font-bold text-white mb-2">الفحص الذكي للمشروع</h3>
                          <p className="text-gray-500 text-sm mb-2 max-w-md mx-auto">
                            فحص شامل لملفات المشروع يشمل: الأمان، جودة الكود، التبعيات، بنية المشروع، والأداء
                          </p>
                          <p className="text-gray-600 text-xs mb-6">يتم تحليل الملفات مباشرة من الريبو عبر GitHub API</p>
                          <div className="grid grid-cols-5 gap-3 max-w-lg mx-auto mb-8">
                            {[
                              { icon: '🔒', label: 'الأمان', desc: 'أسرار، مصادقة، XSS' },
                              { icon: '📝', label: 'الجودة', desc: 'أنواع، أخطاء، تنظيم' },
                              { icon: '📦', label: 'التبعيات', desc: 'ثغرات، تحديثات' },
                              { icon: '📁', label: 'البنية', desc: 'تنظيم، اختبارات' },
                              { icon: '⚡', label: 'الأداء', desc: 'حجم، سرعة' },
                            ].map(c => (
                              <div key={c.label} className="text-center p-3 rounded-xl bg-white/[0.02]">
                                <span className="text-2xl block mb-1">{c.icon}</span>
                                <span className="text-gray-300 text-xs block">{c.label}</span>
                                <span className="text-gray-600 text-[10px] block">{c.desc}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Scan Results */}
                      {!ghScanning && ghScanResult && (
                        <div className="space-y-6">
                          {/* Health Score + Summary */}
                          <div className="glass rounded-2xl p-6">
                            <div className="flex items-center gap-8">
                              {/* Health Gauge */}
                              <div className="flex-shrink-0">
                                <div className="w-32 h-32 relative">
                                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                                    <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                                    <circle cx="60" cy="60" r="50" fill="none"
                                      stroke={ghScanResult.healthScore >= 90 ? '#10b981' : ghScanResult.healthScore >= 70 ? '#3b82f6' : ghScanResult.healthScore >= 50 ? '#f59e0b' : '#ef4444'}
                                      strokeWidth="10"
                                      strokeDasharray={`${ghScanResult.healthScore * 3.14} 314`}
                                      strokeLinecap="round" />
                                  </svg>
                                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className={`text-3xl font-bold ${ghScanResult.healthScore >= 90 ? 'text-emerald-400' : ghScanResult.healthScore >= 70 ? 'text-blue-400' : ghScanResult.healthScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                                      {ghScanResult.healthScore}%
                                    </span>
                                    <span className="text-gray-500 text-xs">
                                      {ghScanResult.healthScore >= 90 ? 'ممتاز' : ghScanResult.healthScore >= 70 ? 'جيد' : ghScanResult.healthScore >= 50 ? 'متوسط' : 'ضعيف'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {/* Summary Info */}
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-white mb-3">نتيجة الفحص</h3>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                  <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3 text-center">
                                    <span className="text-2xl font-bold text-red-400 block">{ghScanResult.summary.critical}</span>
                                    <span className="text-gray-500 text-xs">حرج</span>
                                  </div>
                                  <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 text-center">
                                    <span className="text-2xl font-bold text-amber-400 block">{ghScanResult.summary.warning}</span>
                                    <span className="text-gray-500 text-xs">تحذير</span>
                                  </div>
                                  <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3 text-center">
                                    <span className="text-2xl font-bold text-blue-400 block">{ghScanResult.summary.info}</span>
                                    <span className="text-gray-500 text-xs">معلومة</span>
                                  </div>
                                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 text-center">
                                    <span className="text-2xl font-bold text-gray-300 block">{ghScanResult.scannedFiles}</span>
                                    <span className="text-gray-500 text-xs">ملف مفحوص</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
                                  <span>📁 {ghScanResult.totalFiles} ملف</span>
                                  <span>💾 {(ghScanResult.totalSize / (1024 * 1024)).toFixed(1)}MB</span>
                                  <span>⏱️ {(ghScanResult.duration / 1000).toFixed(1)}s</span>
                                  {ghScanResult.languages && (
                                    <span>🔤 {Object.entries(ghScanResult.languages).sort((a: any, b: any) => b[1] - a[1]).slice(0, 3).map(([l]) => l).join(', ')}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Category Cards */}
                          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                            {Object.entries(ghScanResult.categories).map(([key, cat]: [string, any]) => (
                              <button key={key} onClick={() => setGhScanFilter(ghScanFilter === key ? '' : key)}
                                className={`glass rounded-2xl p-4 text-center transition-all hover:bg-white/[0.04] ${ghScanFilter === key ? 'ring-2 ring-violet-500/50 bg-violet-500/5' : ''}`}>
                                <span className="text-2xl block mb-1">{cat.icon}</span>
                                <span className="text-white text-sm font-medium block">{cat.labelAr}</span>
                                <div className="flex items-center justify-center gap-1 mt-2">
                                  <span className={`text-lg font-bold ${cat.score >= cat.maxScore * 0.8 ? 'text-emerald-400' : cat.score >= cat.maxScore * 0.5 ? 'text-amber-400' : 'text-red-400'}`}>
                                    {cat.score}
                                  </span>
                                  <span className="text-gray-600 text-xs">/{cat.maxScore}</span>
                                </div>
                                {cat.issues.length > 0 && (
                                  <span className="text-gray-500 text-[10px] mt-1 block">{cat.issues.length} مشكلة</span>
                                )}
                              </button>
                            ))}
                          </div>

                          {/* Issues List */}
                          <div className="glass rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-white font-bold">
                                📋 المشاكل المكتشفة
                                {ghScanFilter && (
                                  <span className="text-violet-400 text-sm font-normal mr-2">
                                    ({ghScanResult.categories[ghScanFilter]?.labelAr})
                                  </span>
                                )}
                              </h3>
                              {ghScanFilter && (
                                <button onClick={() => setGhScanFilter('')} className="text-gray-500 text-xs hover:text-gray-300">عرض الكل</button>
                              )}
                            </div>
                            <div className="space-y-2">
                              {(() => {
                                const allIssues = Object.entries(ghScanResult.categories)
                                  .filter(([key]) => !ghScanFilter || key === ghScanFilter)
                                  .flatMap(([, cat]: [string, any]) => cat.issues)
                                  .sort((a: any, b: any) => {
                                    const sev = { critical: 0, warning: 1, info: 2 };
                                    return (sev[a.severity as keyof typeof sev] || 2) - (sev[b.severity as keyof typeof sev] || 2);
                                  });

                                if (allIssues.length === 0) {
                                  return (
                                    <div className="text-center py-8">
                                      <span className="text-4xl block mb-3">🎉</span>
                                      <p className="text-gray-500">لا توجد مشاكل — المشروع بحالة ممتازة!</p>
                                    </div>
                                  );
                                }

                                return allIssues.map((issue: any) => (
                                  <div key={issue.id} className="rounded-xl p-4 bg-white/[0.02] hover:bg-white/[0.04] transition-colors border-r-2"
                                    style={{
                                      borderColor: issue.severity === 'critical' ? '#ef4444' : issue.severity === 'warning' ? '#f59e0b' : '#6b7280',
                                    }}>
                                    <div className="flex items-start gap-3">
                                      <span className="text-lg mt-0.5">
                                        {issue.severity === 'critical' ? '🔴' : issue.severity === 'warning' ? '🟡' : 'ℹ️'}
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <p className="text-white text-sm font-medium">{issue.title}</p>
                                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                            issue.category === 'security' ? 'bg-red-500/10 text-red-400' :
                                            issue.category === 'quality' ? 'bg-blue-500/10 text-blue-400' :
                                            issue.category === 'dependencies' ? 'bg-amber-500/10 text-amber-400' :
                                            issue.category === 'structure' ? 'bg-violet-500/10 text-violet-400' :
                                            'bg-teal-500/10 text-teal-400'
                                          }`}>
                                            {issue.category === 'security' ? 'أمان' : issue.category === 'quality' ? 'جودة' :
                                             issue.category === 'dependencies' ? 'تبعيات' : issue.category === 'structure' ? 'بنية' : 'أداء'}
                                          </span>
                                        </div>
                                        <p className="text-gray-500 text-xs">{issue.description}</p>
                                        {issue.filePath && (
                                          <p className="text-blue-400/60 text-xs font-mono mt-1">
                                            📄 {issue.filePath}{issue.line ? `:${issue.line}` : ''}
                                          </p>
                                        )}
                                        {issue.suggestion && (
                                          <p className="text-emerald-400/60 text-xs mt-1">💡 {issue.suggestion}</p>
                                        )}
                                      </div>
                                      {issue.filePath && (
                                        <button onClick={async () => {
                                          try {
                                            const res = await fetch(`/api/admin/github?action=file_content&path=${encodeURIComponent(issue.filePath)}`);
                                            if (res.ok) {
                                              const data = await res.json();
                                              setGhFileContent({ path: issue.filePath, content: data.decodedContent || '', sha: data.sha });
                                              setGhEditContent(data.decodedContent || '');
                                              setGhCommitMsg(`fix: ${issue.title}`);
                                              setGhPrTitle(`Fix: ${issue.title}`);
                                              setGhView('editor');
                                            }
                                          } catch { showMsg('فشل تحميل الملف', 'error'); }
                                        }} className="text-violet-400 text-xs hover:text-violet-300 px-2 py-1 bg-violet-500/10 rounded-lg flex-shrink-0">
                                          فتح ←
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ));
                              })()}
                            </div>
                          </div>

                          {/* Scan History */}
                          {ghScanHistory.length > 0 && (
                            <div className="glass rounded-2xl p-5">
                              <h3 className="text-white font-bold mb-3">📜 سجل الفحوصات السابقة</h3>
                              <div className="space-y-2">
                                {ghScanHistory.map((scan: any) => (
                                  <div key={scan.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
                                    <div className="flex items-center gap-3">
                                      <span className={`text-lg ${
                                        (scan.details?.healthScore || 0) >= 90 ? 'text-emerald-400' :
                                        (scan.details?.healthScore || 0) >= 70 ? 'text-blue-400' :
                                        (scan.details?.healthScore || 0) >= 50 ? 'text-amber-400' : 'text-red-400'
                                      }`}>
                                        {(scan.details?.healthScore || 0) >= 70 ? '✅' : '⚠️'}
                                      </span>
                                      <div>
                                        <span className="text-white text-sm font-medium">{scan.details?.healthScore || 0}% صحة</span>
                                        <span className="text-gray-600 text-xs mr-3">
                                          {scan.details?.total || 0} مشكلة ({scan.details?.critical || 0} حرج)
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-gray-600 text-xs">
                                      {scan.performer?.username || '—'} • {new Date(scan.createdAt).toLocaleString('ar-SA')}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* File Editor View */}
                  {ghView === 'editor' && ghFileContent && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <button onClick={() => { setGhView('files'); setGhFileContent(null); }} className="text-gray-400 hover:text-white text-sm">→ العودة</button>
                        <h3 className="text-white font-bold font-mono text-sm">{ghFileContent.path}</h3>
                      </div>

                      {/* Editor */}
                      <div className="glass rounded-2xl overflow-hidden">
                        <div className="bg-white/[0.02] px-4 py-2 border-b border-white/[0.06] flex items-center justify-between">
                          <span className="text-gray-400 text-xs font-mono">محرر الملف</span>
                          <div className="flex gap-2">
                            <button onClick={() => setGhEditContent(ghFileContent.content)} className="text-xs text-gray-500 hover:text-gray-300">↩ استعادة الأصل</button>
                          </div>
                        </div>
                        <textarea
                          value={ghEditContent}
                          onChange={e => setGhEditContent(e.target.value)}
                          className="w-full bg-transparent text-white text-xs font-mono p-4 focus:outline-none resize-none leading-relaxed"
                          rows={Math.min(30, Math.max(15, ghEditContent.split('\n').length + 2))}
                          dir="ltr"
                          spellCheck={false}
                        />
                      </div>

                      {/* Fix Options */}
                      <div className="glass rounded-2xl p-5 space-y-4">
                        <div className="flex gap-3">
                          <button onClick={() => setGhFixMode('pr')}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${ghFixMode === 'pr' ? 'bg-blue-600/20 border border-blue-500/30 text-blue-400' : 'bg-white/[0.03] text-gray-500'}`}>
                            🔀 إرسال كـ Pull Request (آمن)
                          </button>
                          <button onClick={() => setGhFixMode('direct')}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${ghFixMode === 'direct' ? 'bg-amber-600/20 border border-amber-500/30 text-amber-400' : 'bg-white/[0.03] text-gray-500'}`}>
                            ⚡ تعديل مباشر (محدود)
                          </button>
                        </div>

                        <div>
                          <label className="text-gray-400 text-xs mb-1 block">رسالة التعديل (Commit Message) *</label>
                          <input value={ghCommitMsg} onChange={e => setGhCommitMsg(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500/50"
                            placeholder="fix: وصف التعديل" dir="ltr" />
                        </div>

                        {ghFixMode === 'pr' && (
                          <div>
                            <label className="text-gray-400 text-xs mb-1 block">عنوان Pull Request</label>
                            <input value={ghPrTitle} onChange={e => setGhPrTitle(e.target.value)}
                              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500/50"
                              placeholder={`Fix: ${ghFileContent.path}`} dir="ltr" />
                          </div>
                        )}

                        {ghFixMode === 'direct' && (
                          <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                            <p className="text-amber-400/80 text-xs">⚠️ التعديل المباشر يرسل التغييرات مباشرة للفرع الرئيسي. يُنصح باستخدام PR للسلامة.</p>
                          </div>
                        )}

                        <button
                          onClick={async () => {
                            if (!ghCommitMsg) { showMsg('رسالة التعديل مطلوبة', 'error'); return; }
                            if (ghEditContent === ghFileContent.content) { showMsg('لم يتم إجراء أي تعديل', 'error'); return; }
                            setGhSyncing(true);
                            try {
                              const res = await fetch('/api/admin/github', {
                                method: 'POST', headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  action: ghFixMode === 'pr' ? 'fix_pr' : 'fix_direct',
                                  filePath: ghFileContent.path,
                                  newContent: ghEditContent,
                                  commitMessage: ghCommitMsg,
                                  prTitle: ghPrTitle || `Fix: ${ghFileContent.path}`,
                                  prBody: `تعديل من لوحة الإدارة\n\nالملف: ${ghFileContent.path}\n${ghCommitMsg}`,
                                }),
                              });
                              const data = await res.json();
                              if (data.success) {
                                showMsg(data.prUrl ? `تم إنشاء PR بنجاح: #${data.prNumber}` : 'تم التعديل المباشر بنجاح', 'success');
                                setGhView('fixes');
                                loadTabData('github_monitor');
                              } else { showMsg(data.error || 'فشل الإرسال', 'error'); }
                            } catch { showMsg('خطأ في الاتصال', 'error'); }
                            setGhSyncing(false);
                          }}
                          disabled={ghSyncing || !ghCommitMsg}
                          className={`w-full py-3 rounded-xl text-white font-medium transition-all disabled:opacity-50 ${
                            ghFixMode === 'pr' ? 'bg-gradient-to-l from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500' :
                            'bg-gradient-to-l from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500'
                          }`}
                        >
                          {ghSyncing ? '⏳ جاري الإرسال...' : ghFixMode === 'pr' ? '🔀 إنشاء Pull Request' : '⚡ إرسال مباشر'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* ==================== Role Change Modal ==================== */}
      {showRoleModal && selectedUserForRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowRoleModal(false)}>
          <div className="bg-[#0A0F1C] border border-white/[0.06] rounded-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-2">تغيير رتبة المستخدم</h3>
            <p className="text-gray-500 text-sm mb-5">تغيير رتبة <span className="text-violet-400 font-medium">{selectedUserForRole.username}</span></p>

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
                className="w-full bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/50"
              >
                <option value="">اختر الرتبة</option>
                {roles.map((r: any) => (
                  <option key={r.id} value={r.id}>{r.displayName} (مستوى {r.level})</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button onClick={changeUserRole} disabled={!roleChangeRole} className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:hover:bg-violet-600 rounded-xl text-sm text-white font-medium transition-colors">
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
