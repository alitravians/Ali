import { useState, useEffect, useCallback } from 'react';
import { useLiveData } from '../context/LiveDataContext';
import {
  Shield, Database, FileSearch,
  Activity, Server, MessageSquare,
  Lock, LogOut, Loader2, AlertTriangle,
  LayoutDashboard, FolderOpen, MonitorCheck, Cpu,
  ChevronLeft, ChevronRight, Settings, Clock,
} from 'lucide-react';
import { BACKEND_API_URL } from '../config/api';
import { ToastContainer } from '../components/admin/AdminUI';

// Sections
import OverviewSection from '../components/admin/OverviewSection';
import SourcesSection from '../components/admin/SourcesSection';
import EventsSection from '../components/admin/EventsSection';
import ServiceStatusSection from '../components/admin/ServiceStatusSection';
import BugReportsSection from '../components/admin/BugReportsSection';
import SystemSection from '../components/admin/SystemSection';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
type AdminSection = 'overview' | 'sources' | 'events' | 'service-status' | 'bug-reports' | 'system';

interface NavGroup {
  id: string;
  label: string;
  icon: typeof Shield;
  items: { id: AdminSection; label: string; icon: typeof Shield; badge?: number }[];
}

// ──────────────────────────────────────────────
// localStorage helpers
// ──────────────────────────────────────────────
const STORAGE_KEYS = {
  section: 'warscope_admin_section',
  sidebar: 'warscope_admin_sidebar',
} as const;

function loadSection(): AdminSection {
  const saved = localStorage.getItem(STORAGE_KEYS.section);
  const valid: AdminSection[] = ['overview', 'sources', 'events', 'service-status', 'bug-reports', 'system'];
  return saved && valid.includes(saved as AdminSection) ? (saved as AdminSection) : 'overview';
}

function loadSidebarCollapsed(): boolean {
  return localStorage.getItem(STORAGE_KEYS.sidebar) === 'true';
}

// ──────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────
export default function Admin() {
  const { events, alerts, connectionStatus } = useLiveData();
  const [activeSection, setActiveSectionState] = useState<AdminSection>(loadSection);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | false>(false);
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);
  const [backendLatency, setBackendLatency] = useState<number | null>(null);
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(loadSidebarCollapsed);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sessionWarning, setSessionWarning] = useState(false);

  // Persist section
  const setActiveSection = useCallback((s: AdminSection) => {
    setActiveSectionState(s);
    localStorage.setItem(STORAGE_KEYS.section, s);
  }, []);

  // Persist sidebar
  const setSidebarCollapsed = useCallback((v: boolean) => {
    setSidebarCollapsedState(v);
    localStorage.setItem(STORAGE_KEYS.sidebar, String(v));
  }, []);

  // Auth check
  useEffect(() => {
    const token = sessionStorage.getItem('warscope_admin_token');
    if (token) {
      fetch(`${BACKEND_API_URL}/api/admin/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      })
        .then(r => { if (r.ok) setIsAuthenticated(true); else sessionStorage.removeItem('warscope_admin_token'); })
        .catch(() => sessionStorage.removeItem('warscope_admin_token'));
    }
  }, []);

  // Backend health polling
  useEffect(() => {
    async function checkHealth() {
      const start = Date.now();
      try {
        const resp = await fetch(`${BACKEND_API_URL}/api/events?limit=1`);
        setBackendLatency(Date.now() - start);
        setBackendHealthy(resp.ok);
      } catch {
        setBackendLatency(null);
        setBackendHealthy(false);
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Session timeout warning (warn at 50 minutes, token expires at 60)
  useEffect(() => {
    if (!isAuthenticated) return;
    const warnTimer = setTimeout(() => setSessionWarning(true), 50 * 60 * 1000);
    const expireTimer = setTimeout(() => {
      sessionStorage.removeItem('warscope_admin_token');
      setIsAuthenticated(false);
      setSessionWarning(false);
    }, 60 * 60 * 1000);
    return () => { clearTimeout(warnTimer); clearTimeout(expireTimer); };
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const resp = await fetch(`${BACKEND_API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (resp.ok) {
        const data = await resp.json();
        sessionStorage.setItem('warscope_admin_token', data.token);
        setIsAuthenticated(true);
        setLoginError(false);
        setSessionWarning(false);
      } else if (resp.status === 429) {
        setLoginError('تم تجاوز عدد المحاولات المسموح. حاول مجدداً بعد 5 دقائق.');
        setPassword('');
      } else {
        setLoginError('كلمة المرور غير صحيحة');
        setPassword('');
      }
    } catch {
      setLoginError('خطأ في الاتصال بالخادم');
      setPassword('');
    }
    setIsLoggingIn(false);
  };

  const handleLogout = () => {
    const token = sessionStorage.getItem('warscope_admin_token');
    if (token) {
      fetch(`${BACKEND_API_URL}/api/admin/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      }).catch(() => {});
    }
    setIsAuthenticated(false);
    sessionStorage.removeItem('warscope_admin_token');
    setSessionWarning(false);
  };

  const handleRenewSession = async () => {
    const oldToken = sessionStorage.getItem('warscope_admin_token');
    if (!oldToken) return;
    try {
      const resp = await fetch(`${BACKEND_API_URL}/api/admin/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${oldToken}` },
      });
      if (resp.ok) {
        setSessionWarning(false);
      } else {
        handleLogout();
      }
    } catch {
      handleLogout();
    }
  };

  // ── Login Screen ──
  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-gray-800 bg-[#12121a] p-8 shadow-2xl">
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 rounded-full bg-purple-500/15 border border-purple-500/30 flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-purple-400" />
              </div>
              <h1 className="text-lg font-bold text-white">لوحة الإدارة</h1>
              <p className="text-xs text-gray-500 mt-1">أدخل كلمة المرور للوصول</p>
            </div>
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <input
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setLoginError(false); }}
                  placeholder="كلمة المرور"
                  className={`w-full bg-[#0a0a0f] border ${loginError ? 'border-red-500' : 'border-gray-700'} rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none text-center`}
                  autoFocus
                  dir="ltr"
                />
                {loginError && (
                  <p className="text-xs text-red-400 text-center mt-2">{loginError}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl text-sm font-bold hover:bg-purple-500/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                {isLoggingIn ? 'جاري التحقق...' : 'دخول'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Navigation Groups ──
  const pendingReviewEvents = events.filter(e => e.trustLevel === 'low' || e.trustLevel === 'medium');
  const unreadAlerts = alerts.filter(a => !a.isRead).length;

  const navGroups: NavGroup[] = [
    {
      id: 'main',
      label: 'الرئيسية',
      icon: LayoutDashboard,
      items: [
        { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
      ],
    },
    {
      id: 'data',
      label: 'إدارة البيانات',
      icon: FolderOpen,
      items: [
        { id: 'sources', label: 'مصادر البيانات', icon: Database },
        { id: 'events', label: 'الأحداث', icon: FileSearch, badge: pendingReviewEvents.length || undefined },
      ],
    },
    {
      id: 'monitoring',
      label: 'المراقبة',
      icon: MonitorCheck,
      items: [
        { id: 'service-status', label: 'حالة الخدمات', icon: Activity },
        { id: 'bug-reports', label: 'بلاغات المستخدمين', icon: MessageSquare },
      ],
    },
    {
      id: 'system',
      label: 'النظام',
      icon: Cpu,
      items: [
        { id: 'system', label: 'معلومات النظام', icon: Server },
      ],
    },
  ];

  const currentItem = navGroups.flatMap(g => g.items).find(i => i.id === activeSection);

  const sectionDescriptions: Record<AdminSection, string> = {
    overview: 'ملخص شامل لحالة النظام والبيانات',
    sources: 'إدارة ومراقبة جميع مصادر البيانات',
    events: 'عرض الأحداث الواردة وحالة تصنيفها',
    'service-status': 'مراقبة حالة الخدمات وصحتها',
    'bug-reports': 'البلاغات الواردة من المستخدمين',
    system: 'معلومات الخادم والاتصالات ومحرك التحليل',
  };

  // ── Main Layout ──
  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <ToastContainer />

      {/* Session Timeout Warning */}
      {sessionWarning && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-[#12121a] border border-yellow-500/40 rounded-xl shadow-2xl max-w-sm">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-white font-bold">الجلسة ستنتهي قريباً</p>
            <p className="text-[10px] text-gray-400">سيتم تسجيل الخروج تلقائياً خلال 10 دقائق</p>
          </div>
          <button
            onClick={handleRenewSession}
            className="px-3 py-1.5 bg-yellow-500/15 text-yellow-400 border border-yellow-500/25 rounded-lg text-[11px] font-bold hover:bg-yellow-500/25 transition-colors whitespace-nowrap"
          >
            تمديد
          </button>
        </div>
      )}

      {/* ── Sidebar (Desktop) ── */}
      <aside className={`hidden lg:flex flex-col border-l border-gray-800 bg-[#0a0a0f] transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-56'}`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-800">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              <span className="text-sm font-bold text-white">لوحة الإدارة</span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            {sidebarCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav Groups */}
        <nav className="flex-1 overflow-y-auto py-2">
          {navGroups.map(group => (
            <div key={group.id} className="mb-1">
              {!sidebarCollapsed && (
                <div className="px-4 py-2">
                  <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">{group.label}</span>
                </div>
              )}
              {group.items.map(item => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-blue-500/10 text-blue-400 border-l-2 border-blue-500'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/3 border-l-2 border-transparent'
                    } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-right">{item.label}</span>
                        {item.badge && (
                          <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded-full text-[9px] font-bold min-w-[18px] text-center">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-gray-800 p-3">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-4 h-4" />
            {!sidebarCollapsed && <span>تسجيل الخروج</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-[#0a0a0f]/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
            >
              <Settings className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-white flex items-center gap-2">
                {currentItem && <currentItem.icon className="w-4 h-4 text-blue-400" />}
                {currentItem?.label || 'لوحة الإدارة'}
              </h1>
              <p className="text-[10px] text-gray-600 mt-0.5 hidden sm:block">
                {sectionDescriptions[activeSection]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border" style={{
              borderColor: backendHealthy ? 'rgba(34,197,94,0.3)' : backendHealthy === false ? 'rgba(239,68,68,0.3)' : 'rgba(234,179,8,0.3)',
              backgroundColor: backendHealthy ? 'rgba(34,197,94,0.1)' : backendHealthy === false ? 'rgba(239,68,68,0.1)' : 'rgba(234,179,8,0.1)',
            }}>
              <span className={`w-2 h-2 rounded-full ${backendHealthy ? 'bg-green-500' : backendHealthy === false ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`} />
              <span className={`text-[10px] font-semibold ${backendHealthy ? 'text-green-400' : backendHealthy === false ? 'text-red-400' : 'text-yellow-400'}`}>
                {backendHealthy ? 'متصل' : backendHealthy === false ? 'غير متصل' : 'جاري الفحص'}
              </span>
              {backendLatency && <span className="text-[9px] text-gray-500">{backendLatency}ms</span>}
            </div>
            <button
              onClick={handleLogout}
              className="lg:hidden flex items-center gap-1 px-2.5 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-[10px] font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <LogOut className="w-3 h-3" />
              خروج
            </button>
          </div>
        </header>

        {/* Mobile Nav Dropdown */}
        {mobileNavOpen && (
          <div className="lg:hidden bg-[#0a0a0f] border-b border-gray-800 p-3 space-y-1">
            {navGroups.map(group => (
              <div key={group.id}>
                <div className="px-2 py-1.5">
                  <span className="text-[10px] font-bold text-gray-600 uppercase">{group.label}</span>
                </div>
                {group.items.map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setActiveSection(item.id); setMobileNavOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                        activeSection === item.id
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="mr-auto px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded-full text-[9px] font-bold">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {activeSection === 'overview' && (
            <OverviewSection
              events={events}
              alerts={alerts}
              backendHealthy={backendHealthy}
              backendLatency={backendLatency}
              connectionStatus={connectionStatus}
              pendingReviewEvents={pendingReviewEvents}
              unreadAlerts={unreadAlerts}
              setActiveSection={setActiveSection}
            />
          )}
          {activeSection === 'sources' && <SourcesSection />}
          {activeSection === 'events' && <EventsSection pendingReviewEvents={pendingReviewEvents} allEvents={events} />}
          {activeSection === 'service-status' && <ServiceStatusSection />}
          {activeSection === 'bug-reports' && <BugReportsSection />}
          {activeSection === 'system' && (
            <SystemSection
              backendHealthy={backendHealthy}
              backendLatency={backendLatency}
              connectionStatus={connectionStatus}
              events={events}
              alerts={alerts}
            />
          )}
        </div>

        {/* Session Timer Footer */}
        <div className="px-4 py-2 border-t border-gray-800/50 bg-[#0a0a0f]/50">
          <p className="text-[10px] text-gray-600 flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            الجلسة تنتهي تلقائياً بعد 60 دقيقة من تسجيل الدخول
          </p>
        </div>
      </main>
    </div>
  );
}
