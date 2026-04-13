import { useState, useEffect } from 'react';
import { sources, mapLayers } from '../data/staticConfig';
import { useLiveData } from '../context/LiveDataContext';
import { timeAgo, sourceTypeAr } from '../utils/helpers';
import TrustBadge from '../components/shared/TrustBadge';
import type { TrackerEvent, Alert } from '../types';
import {
  Shield, Database, Layers, FileSearch, Bell,
  Brain, Wifi, Settings, Server, BarChart3,
  Eye, EyeOff, Plus, RefreshCw, Search, CheckCircle2, XCircle,
  Lock, LogOut, Loader2, Activity, Zap, AlertTriangle,
  LayoutDashboard, FolderOpen, MonitorCheck, Cpu,
  ChevronLeft, ChevronRight, Globe, HardDrive, Clock, TrendingUp
} from 'lucide-react';

import { BACKEND_API_URL } from '../config/api';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
type AdminSection =
  | 'overview'
  | 'sources' | 'events' | 'layers'
  | 'service-status' | 'alerts'
  | 'ai' | 'system';

interface NavGroup {
  id: string;
  label: string;
  icon: typeof Shield;
  items: { id: AdminSection; label: string; icon: typeof Shield; badge?: number }[];
}

interface StatusAdminService {
  id: string;
  name: string;
  name_ar: string;
  type: string;
  endpoint: string | null;
  check_interval_seconds: number;
  enabled: boolean;
  auto_heal: boolean;
  timeout_ms: number;
  degraded_threshold_ms: number;
  status: string;
}

interface StatusAdminData {
  services: StatusAdminService[];
  incidents_count: number;
  active_incidents: number;
}

// ──────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────
export default function Admin() {
  const { events, alerts, connectionStatus } = useLiveData();
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | false>(false);
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);
  const [backendLatency, setBackendLatency] = useState<number | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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

  // Backend health
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
        { id: 'events', label: 'مراجعة الأحداث', icon: FileSearch, badge: pendingReviewEvents.length || undefined },
        { id: 'layers', label: 'طبقات الخريطة', icon: Layers },
      ],
    },
    {
      id: 'monitoring',
      label: 'المراقبة والتنبيهات',
      icon: MonitorCheck,
      items: [
        { id: 'service-status', label: 'حالة الخدمات', icon: Activity },
        { id: 'alerts', label: 'إعدادات التنبيهات', icon: Bell, badge: unreadAlerts || undefined },
      ],
    },
    {
      id: 'system',
      label: 'التحليل والنظام',
      icon: Cpu,
      items: [
        { id: 'ai', label: 'محرك التحليل', icon: Brain },
        { id: 'system', label: 'معلومات النظام', icon: Server },
      ],
    },
  ];

  const currentItem = navGroups.flatMap(g => g.items).find(i => i.id === activeSection);

  // ── Main Layout ──
  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* ── Sidebar (Desktop) ── */}
      <aside className={`hidden lg:flex flex-col border-l border-gray-800 bg-[#0a0a0f] transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-60'}`}>
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
                    {sidebarCollapsed && item.badge && (
                      <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
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
                {activeSection === 'overview' && 'ملخص شامل لحالة النظام والبيانات'}
                {activeSection === 'sources' && 'إدارة ومراقبة جميع مصادر البيانات'}
                {activeSection === 'events' && 'مراجعة الأحداث غير المؤكدة وتصنيفها'}
                {activeSection === 'layers' && 'التحكم بطبقات العرض على الخريطة'}
                {activeSection === 'service-status' && 'مراقبة حالة الخدمات وصحتها'}
                {activeSection === 'alerts' && 'إعدادات التنبيهات والكلمات المفتاحية'}
                {activeSection === 'ai' && 'إعدادات محرك التحليل الذكي'}
                {activeSection === 'system' && 'معلومات الخادم والاتصالات'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 border border-green-500/30 rounded-full">
              <span className={`w-2 h-2 rounded-full ${backendHealthy ? 'bg-green-500' : backendHealthy === false ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`} />
              <span className="text-[10px] font-semibold text-green-400">
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
          {/* ═══════════════════════════ OVERVIEW ═══════════════════════════ */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard icon={Database} color="blue" label="المصادر النشطة" value={`${sources.filter(s => s.isActive).length}/${sources.length}`} />
                <StatCard icon={FileSearch} color="yellow" label="بانتظار المراجعة" value={pendingReviewEvents.length} />
                <StatCard icon={Bell} color="red" label="تنبيهات غير مقروءة" value={unreadAlerts} />
                <StatCard icon={BarChart3} color="green" label="إجمالي الأحداث" value={events.length} />
              </div>

              {/* System Health Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Server */}
                <InfoCard
                  icon={Server}
                  iconColor="text-green-400"
                  title="الخادم"
                  rows={[
                    { label: 'الحالة', value: backendHealthy === null ? 'جاري الفحص...' : backendHealthy ? 'يعمل' : 'غير متصل', valueColor: backendHealthy === null ? 'text-yellow-400' : backendHealthy ? 'text-green-400' : 'text-red-400' },
                    { label: 'الاستجابة', value: backendLatency !== null ? `${backendLatency}ms` : '—' },
                    { label: 'الاستضافة', value: 'Fly.io', valueColor: 'text-gray-400' },
                  ]}
                />
                {/* Data */}
                <InfoCard
                  icon={HardDrive}
                  iconColor="text-blue-400"
                  title="البيانات"
                  rows={[
                    { label: 'الأحداث المحملة', value: events.length, valueColor: 'text-white font-bold' },
                    { label: 'التنبيهات', value: alerts.length },
                    { label: 'المصادر النشطة', value: sources.filter(s => s.isActive).length },
                  ]}
                />
                {/* WebSocket */}
                <InfoCard
                  icon={Wifi}
                  iconColor="text-purple-400"
                  title="الاتصال المباشر"
                  rows={[
                    { label: 'الحالة', value: connectionStatus === 'connected' ? 'متصل' : connectionStatus === 'connecting' ? 'جاري الاتصال...' : 'غير متصل', valueColor: connectionStatus === 'connected' ? 'text-green-400' : connectionStatus === 'connecting' ? 'text-yellow-400' : 'text-red-400' },
                    { label: 'البروتوكول', value: 'WSS (مشفّر)' },
                    { label: 'التحديث', value: 'لحظي' },
                  ]}
                />
              </div>

              {/* Quick Actions */}
              <div className="rounded-xl border border-gray-800 bg-[#12121a] p-4">
                <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  إجراءات سريعة
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <QuickAction label="مراجعة الأحداث" icon={FileSearch} count={pendingReviewEvents.length} onClick={() => setActiveSection('events')} />
                  <QuickAction label="حالة الخدمات" icon={Activity} onClick={() => setActiveSection('service-status')} />
                  <QuickAction label="إدارة المصادر" icon={Database} onClick={() => setActiveSection('sources')} />
                  <QuickAction label="محرك التحليل" icon={Brain} onClick={() => setActiveSection('ai')} />
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════ SOURCES ═══════════════════════════ */}
          {activeSection === 'sources' && <SourcesSection />}

          {/* ═══════════════════════════ EVENTS ═══════════════════════════ */}
          {activeSection === 'events' && <EventsSection pendingReviewEvents={pendingReviewEvents} />}

          {/* ═══════════════════════════ MAP LAYERS ═══════════════════════════ */}
          {activeSection === 'layers' && <LayersSection events={events} />}

          {/* ═══════════════════════════ SERVICE STATUS ═══════════════════════════ */}
          {activeSection === 'service-status' && <ServiceStatusSection />}

          {/* ═══════════════════════════ ALERTS ═══════════════════════════ */}
          {activeSection === 'alerts' && <AlertsSection />}

          {/* ═══════════════════════════ AI ENGINE ═══════════════════════════ */}
          {activeSection === 'ai' && <AISection events={events} />}

          {/* ═══════════════════════════ SYSTEM INFO ═══════════════════════════ */}
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
      </main>
    </div>
  );
}


// ──────────────────────────────────────────────
// Reusable UI Components
// ──────────────────────────────────────────────
function StatCard({ icon: Icon, color, label, value }: { icon: typeof Shield; color: string; label: string; value: string | number }) {
  const colors: Record<string, string> = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
    green: 'text-green-400 bg-green-500/10 border-green-500/20',
  };
  const iconColors: Record<string, string> = { blue: 'text-blue-400', yellow: 'text-yellow-400', red: 'text-red-400', green: 'text-green-400' };

  return (
    <div className={`rounded-xl border bg-[#12121a] p-4 ${colors[color] || ''}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${iconColors[color]}`} />
        <span className="text-[11px] text-gray-400">{label}</span>
      </div>
      <span className={`text-2xl font-black ${iconColors[color]}`}>{value}</span>
    </div>
  );
}

function InfoCard({ icon: Icon, iconColor, title, rows }: {
  icon: typeof Shield;
  iconColor: string;
  title: string;
  rows: { label: string; value: string | number; valueColor?: string }[];
}) {
  return (
    <div className="p-4 bg-[#12121a] rounded-xl border border-gray-800">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <span className="text-xs font-bold text-white">{title}</span>
      </div>
      <div className="space-y-2.5">
        {rows.map((row, i) => (
          <div key={i} className="flex justify-between text-[11px]">
            <span className="text-gray-500">{row.label}</span>
            <span className={row.valueColor || 'text-white'}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickAction({ label, icon: Icon, count, onClick }: {
  label: string; icon: typeof Shield; count?: number; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 p-3 rounded-xl bg-[#0a0a0f] border border-gray-800 hover:border-gray-700 hover:bg-white/3 transition-all text-right"
    >
      <Icon className="w-4 h-4 text-gray-400" />
      <span className="text-[11px] text-gray-300 flex-1">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="px-1.5 py-0.5 bg-yellow-500/15 text-yellow-400 rounded-full text-[9px] font-bold">{count}</span>
      )}
    </button>
  );
}

function SectionHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-5">
      <div>
        <h2 className="text-sm font-bold text-white">{title}</h2>
        {description && <p className="text-[10px] text-gray-500 mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
  );
}

function ToggleSwitch({ enabled, onChange, label }: { enabled: boolean; onChange?: () => void; label: string }) {
  return (
    <div className="flex items-center justify-between py-2 px-1">
      <span className="text-[11px] text-gray-300">{label}</span>
      <button
        onClick={onChange}
        className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer ${enabled ? 'bg-green-500' : 'bg-gray-700'}`}
      >
        <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow transition-all ${enabled ? 'left-[18px]' : 'left-0.5'}`} />
      </button>
    </div>
  );
}


// ──────────────────────────────────────────────
// Section: Sources
// ──────────────────────────────────────────────
function SourcesSection() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div>
      <SectionHeader
        title="مصادر البيانات"
        description="جميع مصادر البيانات المتصلة بالنظام وحالتها"
        action={
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="بحث..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-[#0a0a0f] border border-gray-700 rounded-lg pr-8 pl-3 py-1.5 text-xs text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none w-full sm:w-40"
              />
            </div>
          </div>
        }
      />

      <div className="rounded-xl border border-gray-800 bg-[#12121a] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800 bg-[#0a0a0f]">
                <th className="text-right py-3 px-4 text-gray-500 font-medium">المصدر</th>
                <th className="text-right py-3 px-4 text-gray-500 font-medium">النوع</th>
                <th className="text-right py-3 px-4 text-gray-500 font-medium">الثقة</th>
                <th className="text-right py-3 px-4 text-gray-500 font-medium">الحالة</th>
                <th className="text-right py-3 px-4 text-gray-500 font-medium">آخر تحديث</th>
                <th className="text-right py-3 px-4 text-gray-500 font-medium">الأخبار</th>
              </tr>
            </thead>
            <tbody>
              {sources
                .filter(s => !searchQuery || s.nameAr.includes(searchQuery) || s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(source => (
                  <tr key={source.id} className="border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{source.nameAr}</div>
                      <div className="text-[10px] text-gray-600 mt-0.5">{source.name}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-gray-800 rounded-full text-gray-300">{sourceTypeAr(source.type)}</span>
                    </td>
                    <td className="py-3 px-4"><TrustBadge level={source.trustLevel} /></td>
                    <td className="py-3 px-4">
                      <span className={`flex items-center gap-1 ${source.isActive ? 'text-green-400' : 'text-red-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${source.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                        {source.isActive ? 'نشط' : 'متوقف'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400">{timeAgo(source.lastUpdate)}</td>
                    <td className="py-3 px-4 text-white font-semibold">{source.eventCount}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


// ──────────────────────────────────────────────
// Section: Events Review
// ──────────────────────────────────────────────
function EventsSection({ pendingReviewEvents }: { pendingReviewEvents: TrackerEvent[] }) {
  return (
    <div>
      <SectionHeader
        title="مراجعة الأحداث"
        description="الأحداث التي تحتاج تأكيد يدوي أو مراجعة إضافية"
        action={
          <span className="text-[11px] text-yellow-400 bg-yellow-500/10 px-2.5 py-1 rounded-full border border-yellow-500/20">
            {pendingReviewEvents.length} بانتظار المراجعة
          </span>
        }
      />

      {pendingReviewEvents.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-[#12121a] p-12 text-center">
          <CheckCircle2 className="w-10 h-10 text-green-400/30 mx-auto mb-3" />
          <p className="text-sm text-gray-400">لا توجد أحداث بانتظار المراجعة</p>
          <p className="text-[10px] text-gray-600 mt-1">جميع الأحداث تم تأكيدها تلقائياً عبر نظام الثقة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingReviewEvents.map(event => (
            <div key={event.id} className="rounded-xl border border-gray-800 bg-[#12121a] p-4 hover:border-gray-700 transition-colors">
              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <TrustBadge level={event.trustLevel} reason={event.trustReasonAr} />
                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(event.timestamp)}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">{event.titleAr}</h3>
                  <p className="text-xs text-gray-400 mb-2 line-clamp-2">{event.descriptionAr}</p>
                  <div className="text-[10px] text-gray-600">
                    المصادر: {event.sources.map(s => s.sourceNameAr).join('، ')}
                  </div>
                </div>
                <div className="flex sm:flex-col gap-2 w-full sm:w-auto flex-shrink-0">
                  <button className="flex-1 sm:flex-initial px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-xs hover:bg-green-500/20 transition-colors flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    تأكيد
                  </button>
                  <button className="flex-1 sm:flex-initial px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1">
                    <XCircle className="w-3 h-3" />
                    رفض
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// ──────────────────────────────────────────────
// Section: Map Layers
// ──────────────────────────────────────────────
function LayersSection({ events }: { events: TrackerEvent[] }) {
  return (
    <div>
      <SectionHeader
        title="طبقات الخريطة"
        description="التحكم بالطبقات المعروضة على خريطة الأحداث"
      />
      <div className="space-y-2">
        {mapLayers.map(layer => (
          <div key={layer.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#12121a] rounded-xl border border-gray-800 hover:border-gray-700 transition-colors">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: layer.color }} />
              <div>
                <span className="text-sm font-medium text-white">{layer.nameAr}</span>
                <span className="text-[10px] text-gray-600 mr-2">{layer.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2 sm:mt-0">
              <span className="text-[11px] text-gray-500 bg-gray-800/50 px-2 py-0.5 rounded-full">
                {events.filter(e => e.category === layer.id).length} حدث
              </span>
              <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                layer.isActive
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-gray-800 text-gray-500 border border-gray-700'
              }`}>
                {layer.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                {layer.isActive ? 'مفعّل' : 'معطّل'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// ──────────────────────────────────────────────
// Section: Service Status
// ──────────────────────────────────────────────
function ServiceStatusSection() {
  const [statusData, setStatusData] = useState<StatusAdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const token = sessionStorage.getItem('warscope_admin_token') || '';

  const fetchStatusAdmin = async () => {
    try {
      const resp = await fetch(`${BACKEND_API_URL}/api/status/admin`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (resp.ok) setStatusData(await resp.json());
    } catch (err) {
      console.warn('[StatusAdmin] Failed to fetch:', err instanceof Error ? err.message : err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchStatusAdmin(); }, []);

  const updateService = async (serviceId: string, updates: Record<string, unknown>) => {
    setUpdating(serviceId);
    try {
      await fetch(`${BACKEND_API_URL}/api/status/admin/service/${serviceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updates),
      });
      await fetchStatusAdmin();
    } catch (err) {
      console.warn('[StatusAdmin] Update failed:', err instanceof Error ? err.message : err);
    }
    setUpdating(null);
  };

  const triggerCheck = async (serviceId: string) => {
    setUpdating(serviceId);
    try {
      await fetch(`${BACKEND_API_URL}/api/status/admin/check/${serviceId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      await fetchStatusAdmin();
    } catch (err) {
      console.warn('[StatusAdmin] Check failed:', err instanceof Error ? err.message : err);
    }
    setUpdating(null);
  };

  const statusColors: Record<string, string> = {
    operational: 'text-green-400', degraded: 'text-yellow-400',
    partial_outage: 'text-orange-400', major_outage: 'text-red-400',
  };
  const statusDots: Record<string, string> = {
    operational: 'bg-green-500', degraded: 'bg-yellow-500',
    partial_outage: 'bg-orange-500', major_outage: 'bg-red-500',
  };
  const statusAr: Record<string, string> = {
    operational: 'يعمل', degraded: 'بطيء', partial_outage: 'انقطاع جزئي',
    major_outage: 'متوقف', maintenance: 'صيانة',
  };
  const typeAr: Record<string, string> = {
    api: 'واجهة برمجة', websocket: 'ويب سوكت', external: 'خدمة خارجية',
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 text-blue-400 animate-spin" /></div>;
  if (!statusData) return <div className="p-8 text-center text-sm text-gray-400">تعذّر تحميل بيانات الحالة</div>;

  return (
    <div>
      <SectionHeader
        title="مراقبة حالة الخدمات"
        description="التحكم بمراقبة صحة الخدمات والإصلاح التلقائي"
        action={
          <div className="flex items-center gap-2">
            {statusData.active_incidents > 0 ? (
              <span className="text-[10px] text-red-400 flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20">
                <AlertTriangle className="w-3 h-3" /> {statusData.active_incidents} حادث نشط
              </span>
            ) : (
              <span className="text-[10px] text-green-400 flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
                <CheckCircle2 className="w-3 h-3" /> لا حوادث نشطة
              </span>
            )}
            <button onClick={fetchStatusAdmin} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        }
      />

      <div className="rounded-xl border border-gray-800 bg-[#12121a] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800 bg-[#0a0a0f]">
                <th className="text-right py-3 px-4 text-gray-500 font-medium">الخدمة</th>
                <th className="text-right py-3 px-4 text-gray-500 font-medium">النوع</th>
                <th className="text-right py-3 px-4 text-gray-500 font-medium">الحالة</th>
                <th className="text-right py-3 px-4 text-gray-500 font-medium">الفحص</th>
                <th className="text-right py-3 px-4 text-gray-500 font-medium">مفعّل</th>
                <th className="text-right py-3 px-4 text-gray-500 font-medium">إصلاح تلقائي</th>
                <th className="text-right py-3 px-4 text-gray-500 font-medium">فحص</th>
              </tr>
            </thead>
            <tbody>
              {statusData.services.map(svc => (
                <tr key={svc.id} className="border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{svc.name_ar}</div>
                    <div className="text-[10px] text-gray-600">{svc.name}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 bg-gray-800 rounded-full text-gray-300">{typeAr[svc.type] || svc.type}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`flex items-center gap-1 ${statusColors[svc.status] || 'text-gray-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDots[svc.status] || 'bg-gray-500'}`} />
                      {statusAr[svc.status] || svc.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400">
                    {svc.check_interval_seconds < 60 ? `${svc.check_interval_seconds}ث` : `${Math.round(svc.check_interval_seconds / 60)}د`}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => updateService(svc.id, { enabled: !svc.enabled })}
                      disabled={updating === svc.id}
                      className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer ${svc.enabled ? 'bg-green-500' : 'bg-gray-700'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow transition-all ${svc.enabled ? 'left-[18px]' : 'left-0.5'}`} />
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => updateService(svc.id, { auto_heal: !svc.auto_heal })}
                      disabled={updating === svc.id}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] transition-colors ${svc.auto_heal ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' : 'bg-gray-800 text-gray-500 border border-gray-700'}`}
                    >
                      <Zap className="w-2.5 h-2.5" />
                      {svc.auto_heal ? 'مفعّل' : 'معطّل'}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => triggerCheck(svc.id)}
                      disabled={updating === svc.id}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors disabled:opacity-50"
                    >
                      {updating === svc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 p-3 bg-[#0a0a0f] rounded-xl border border-gray-800">
        <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-blue-400" />
          صفحة الحالة العامة متاحة للجميع على <a href="/status" className="text-blue-400 hover:underline">/status</a>
        </p>
      </div>
    </div>
  );
}


// ──────────────────────────────────────────────
// Section: Alerts
// ──────────────────────────────────────────────
function AlertsSection() {
  return (
    <div>
      <SectionHeader
        title="إعدادات التنبيهات"
        description="التحكم بأنواع التنبيهات والكلمات المفتاحية للمراقبة"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Alert Types */}
        <div className="rounded-xl border border-gray-800 bg-[#12121a] p-5">
          <h3 className="text-xs font-bold text-white mb-1 flex items-center gap-2">
            <Bell className="w-4 h-4 text-yellow-400" />
            أنواع التنبيهات
          </h3>
          <p className="text-[10px] text-gray-600 mb-4">اختر التنبيهات التي تريد تفعيلها</p>
          <div className="space-y-0.5 divide-y divide-gray-800/50">
            <ToggleSwitch enabled={true} label="تنبيهات الأحداث العاجلة" />
            <ToggleSwitch enabled={true} label="تنبيهات التصعيد" />
            <ToggleSwitch enabled={true} label="تنبيهات التغييرات الكبيرة" />
            <ToggleSwitch enabled={true} label="تنبيهات المصادر الجديدة" />
            <ToggleSwitch enabled={true} label="تنبيهات أخطاء النظام" />
          </div>
        </div>

        {/* Keywords */}
        <div className="rounded-xl border border-gray-800 bg-[#12121a] p-5">
          <h3 className="text-xs font-bold text-white mb-1 flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-400" />
            الكلمات المفتاحية للمراقبة
          </h3>
          <p className="text-[10px] text-gray-600 mb-4">كلمات يتم رصدها تلقائياً في الأخبار والأحداث</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {['صاروخ', 'قبة حديدية', 'مضيق هرمز', 'نووي', 'حرس ثوري', 'حزب الله', 'تصعيد'].map((kw, i) => (
              <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0a0a0f] border border-gray-800 rounded-lg text-[11px] text-gray-300">
                {kw}
                <button className="text-gray-600 hover:text-red-400 transition-colors">
                  <XCircle className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="أضف كلمة مفتاحية..."
              className="flex-1 bg-[#0a0a0f] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
            <button className="px-3 py-2 bg-blue-500/15 text-blue-400 border border-blue-500/20 rounded-lg text-xs hover:bg-blue-500/25 transition-colors">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ──────────────────────────────────────────────
// Section: AI Engine
// ──────────────────────────────────────────────
function AISection({ events }: { events: TrackerEvent[] }) {
  return (
    <div>
      <SectionHeader
        title="محرك التحليل"
        description="إعدادات محرك التحليل الذكي وقدراته"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* AI Status */}
        <div className="rounded-xl border border-gray-800 bg-[#12121a] p-5">
          <h3 className="text-xs font-bold text-white mb-4 flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-400" />
            حالة المحرك
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-gray-400">الحالة</span>
              <span className="flex items-center gap-1.5 text-[11px] text-green-400">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                نشط
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-gray-400">المحرك</span>
              <span className="text-[11px] text-white font-medium">Groq Llama 3.3</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-gray-400">المسار</span>
              <span className="text-[11px] text-gray-300">تحليلات الأنظمة → Groq → إحصائي</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-gray-400">الأحداث المحملة</span>
              <span className="text-[11px] text-white font-bold">{events.length}</span>
            </div>
          </div>
        </div>

        {/* AI Settings */}
        <div className="rounded-xl border border-gray-800 bg-[#12121a] p-5">
          <h3 className="text-xs font-bold text-white mb-1 flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-400" />
            قدرات التحليل
          </h3>
          <p className="text-[10px] text-gray-600 mb-4">الميزات المفعّلة في محرك التحليل</p>
          <div className="space-y-0.5 divide-y divide-gray-800/50">
            <ToggleSwitch enabled={true} label="الملخصات التلقائية" />
            <ToggleSwitch enabled={true} label="كشف التضارب" />
            <ToggleSwitch enabled={true} label="تقييم الأهمية" />
            <ToggleSwitch enabled={true} label="رصد التصعيد" />
            <ToggleSwitch enabled={true} label="دمج الأحداث المتشابهة" />
          </div>
        </div>
      </div>
    </div>
  );
}


// ──────────────────────────────────────────────
// Section: System Info
// ──────────────────────────────────────────────
function SystemSection({ backendHealthy, backendLatency, connectionStatus, events, alerts }: {
  backendHealthy: boolean | null;
  backendLatency: number | null;
  connectionStatus: string;
  events: TrackerEvent[];
  alerts: Alert[];
}) {
  return (
    <div>
      <SectionHeader
        title="معلومات النظام"
        description="تفاصيل تقنية عن الخادم والاتصالات والبيانات"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <InfoCard
          icon={Server}
          iconColor="text-green-400"
          title="الخادم"
          rows={[
            { label: 'الحالة', value: backendHealthy === null ? 'جاري الفحص...' : backendHealthy ? 'يعمل' : 'غير متصل', valueColor: backendHealthy === null ? 'text-yellow-400' : backendHealthy ? 'text-green-400' : 'text-red-400' },
            { label: 'زمن الاستجابة', value: backendLatency !== null ? `${backendLatency}ms` : '—' },
            { label: 'الاستضافة', value: 'Fly.io' },
            { label: 'المنطقة', value: 'أمريكا الشمالية' },
          ]}
        />
        <InfoCard
          icon={HardDrive}
          iconColor="text-blue-400"
          title="قاعدة البيانات"
          rows={[
            { label: 'النوع', value: 'SQLite (WAL mode)' },
            { label: 'الأحداث', value: events.length, valueColor: 'text-white font-bold' },
            { label: 'التنبيهات', value: alerts.length },
            { label: 'التخزين', value: 'Fly.io Volume (1GB)' },
          ]}
        />
        <InfoCard
          icon={Wifi}
          iconColor="text-purple-400"
          title="الاتصال المباشر"
          rows={[
            { label: 'WebSocket', value: connectionStatus === 'connected' ? 'متصل' : connectionStatus === 'connecting' ? 'جاري الاتصال' : 'غير متصل', valueColor: connectionStatus === 'connected' ? 'text-green-400' : 'text-red-400' },
            { label: 'التشفير', value: 'WSS (TLS)' },
            { label: 'الحد الأقصى', value: '100 اتصال' },
          ]}
        />
        <InfoCard
          icon={Shield}
          iconColor="text-yellow-400"
          title="الأمان"
          rows={[
            { label: 'HTTPS', value: 'HSTS مفعّل', valueColor: 'text-green-400' },
            { label: 'CSP', value: 'مفعّل', valueColor: 'text-green-400' },
            { label: 'CORS', value: 'محدد (4 نطاقات)', valueColor: 'text-green-400' },
            { label: 'Rate Limit', value: '5 محاولات / 5 دقائق', valueColor: 'text-green-400' },
          ]}
        />
        <InfoCard
          icon={Globe}
          iconColor="text-cyan-400"
          title="الفرونتند"
          rows={[
            { label: 'الاستضافة', value: 'Vercel' },
            { label: 'الإطار', value: 'React 19 + Vite' },
            { label: 'PWA', value: 'مفعّل', valueColor: 'text-green-400' },
            { label: 'الاتجاه', value: 'RTL (عربي)' },
          ]}
        />
        <InfoCard
          icon={TrendingUp}
          iconColor="text-orange-400"
          title="مصادر البيانات"
          rows={[
            { label: 'النشطة', value: `${sources.filter(s => s.isActive).length} مصدر` },
            { label: 'GDELT', value: 'كل دقيقتين' },
            { label: 'RSS', value: 'كل 3 دقائق' },
            { label: 'OpenSky', value: 'كل دقيقة' },
          ]}
        />
      </div>
    </div>
  );
}
