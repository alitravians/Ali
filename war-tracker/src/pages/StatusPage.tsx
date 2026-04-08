import { useState, useEffect, useCallback } from 'react';
import {
  Activity, Server, Wifi, Globe2, Brain, Anchor, Rss,
  CheckCircle2, AlertTriangle, XCircle, Clock, RefreshCw,
  ChevronDown, ChevronUp, Wrench, Shield, Zap, TrendingUp,
  Radio, Newspaper, Plane, Database, Users, Bell, MapPin,
  Bot, ExternalLink, Loader2
} from 'lucide-react';
import { BACKEND_API_URL } from '../config/api';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
interface ServiceData {
  id: string;
  name: string;
  name_ar: string;
  type: string;
  status: string;
  status_ar: string;
  last_check: string | null;
  last_success: string | null;
  last_failure: string | null;
  response_time_ms: number | null;
  response_times_history: number[];
  uptime_24h: number;
  success_rate_24h: number;
  errors_24h: number;
  errors_7d: number;
  outages_24h: number;
  checks_24h: number;
  check_interval: number;
  auto_heal: boolean;
  enabled: boolean;
}

interface IncidentNote {
  id: string;
  message: string;
  message_ar: string;
  status: string;
  timestamp: string;
  auto_generated: boolean;
}

interface Incident {
  id: string;
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  severity: string;
  status: string;
  affected_services: string[];
  started_at: string;
  resolved_at: string | null;
  duration_seconds: number | null;
  auto_healed: boolean;
  notes: IncidentNote[];
}

interface SourceMonitor {
  id: string;
  active: boolean;
  event_count: number;
  errors: number;
  last_update: string | null;
  success_rate: number;
}

interface BahrainEvent {
  id: string;
  title: string;
  titleAr: string;
  category: string;
  timestamp: string;
  isBreaking: boolean;
}

interface BahrainMonitor {
  event_count_today: number;
  events: BahrainEvent[];
  has_active_alert: boolean;
  has_military_activity: boolean;
  risk_level: string;
}

interface WebSocketHealth {
  active_connections: number;
  max_connections: number;
}

interface FixSession {
  success: boolean;
  session_id: string;
  session_url: string;
  service_id: string;
  service_name: string;
  status: string;
  created_at: string;
  error_details: string;
}

interface StatusData {
  overall_status: string;
  overall_status_ar: string;
  services: ServiceData[];
  incidents: Incident[];
  last_updated: string;
  source_monitoring?: SourceMonitor[];
  websocket_health?: WebSocketHealth;
  bahrain_monitor?: BahrainMonitor;
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'لم يتم الفحص';
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return `منذ ${Math.floor(diff)} ث`;
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} د`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} س`;
  return `منذ ${Math.floor(diff / 86400)} يوم`;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '-';
  if (seconds < 60) return `${seconds} ثانية`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} دقيقة`;
  return `${Math.floor(seconds / 3600)} ساعة ${Math.floor((seconds % 3600) / 60)} دقيقة`;
}

function getServiceIcon(id: string) {
  const icons: Record<string, typeof Server> = {
    backend_api: Server,
    websocket: Wifi,
    gdelt: Globe2,
    rss_feeds: Rss,
    opensky: Plane,
    devin_ai: Brain,
    aisstream: Anchor,
    newsapi: Newspaper,
    mediastack: Newspaper,
    acled: Radio,
  };
  return icons[id] || Activity;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'operational': return { bg: 'bg-green-500/15', border: 'border-green-500/30', text: 'text-green-400', dot: 'bg-green-500' };
    case 'degraded': return { bg: 'bg-yellow-500/15', border: 'border-yellow-500/30', text: 'text-yellow-400', dot: 'bg-yellow-500' };
    case 'partial_outage': return { bg: 'bg-orange-500/15', border: 'border-orange-500/30', text: 'text-orange-400', dot: 'bg-orange-500' };
    case 'major_outage': return { bg: 'bg-red-500/15', border: 'border-red-500/30', text: 'text-red-400', dot: 'bg-red-500' };
    case 'maintenance': return { bg: 'bg-blue-500/15', border: 'border-blue-500/30', text: 'text-blue-400', dot: 'bg-blue-500' };
    default: return { bg: 'bg-gray-500/15', border: 'border-gray-500/30', text: 'text-gray-400', dot: 'bg-gray-500' };
  }
}

function getOverallStatusColor(status: string) {
  if (status.includes('operational')) return { bg: 'from-green-500/20 to-emerald-500/10', border: 'border-green-500/30', text: 'text-green-400', icon: CheckCircle2 };
  if (status.includes('degraded')) return { bg: 'from-yellow-500/20 to-amber-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', icon: AlertTriangle };
  if (status.includes('partial')) return { bg: 'from-orange-500/20 to-red-500/10', border: 'border-orange-500/30', text: 'text-orange-400', icon: AlertTriangle };
  if (status.includes('major')) return { bg: 'from-red-500/20 to-rose-500/10', border: 'border-red-500/30', text: 'text-red-400', icon: XCircle };
  if (status.includes('maintenance')) return { bg: 'from-blue-500/20 to-indigo-500/10', border: 'border-blue-500/30', text: 'text-blue-400', icon: Wrench };
  return { bg: 'from-gray-500/20 to-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-400', icon: Activity };
}

function getIncidentStatusAr(status: string): string {
  return { investigating: 'قيد التحقيق', identified: 'تم التحديد', monitoring: 'قيد المراقبة', resolved: 'تم الحل' }[status] || status;
}

function getSeverityAr(severity: string): string {
  return { minor: 'بسيط', major: 'كبير', critical: 'حرج' }[severity] || severity;
}

// ──────────────────────────────────────────────
// Mini Response Time Chart
// ──────────────────────────────────────────────
function ResponseTimeChart({ data, id }: { data: number[]; id: string }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const h = 40;
  const w = 200;
  const step = w / (data.length - 1);

  const points = data.map((v, i) => `${i * step},${h - (v / max) * (h - 4)}`).join(' ');
  const avg = Math.round(data.reduce((a, b) => a + b, 0) / data.length);

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-gray-500">زمن الاستجابة</span>
        <span className="text-[10px] text-gray-400">متوسط: {avg}ms</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10 overflow-visible">
        <polyline
          points={points}
          fill="none"
          stroke={`url(#chartGrad-${id})`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id={`chartGrad-${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// ──────────────────────────────────────────────
// Uptime Bar
// ──────────────────────────────────────────────
function UptimeBar({ percent }: { percent: number }) {
  const color = percent >= 99 ? 'bg-green-500' : percent >= 95 ? 'bg-yellow-500' : percent >= 90 ? 'bg-orange-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
      </div>
      <span className="text-[10px] text-gray-400 w-12 text-left">{percent}%</span>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Status Page
// ──────────────────────────────────────────────
export default function StatusPage() {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIncident, setExpandedIncident] = useState<string | null>(null);
  const [showAllIncidents, setShowAllIncidents] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [fixingSvc, setFixingSvc] = useState<string | null>(null);
  const [fixSessions, setFixSessions] = useState<FixSession[]>([]);
  const [fixResult, setFixResult] = useState<{ svcId: string; success: boolean; url?: string; error?: string } | null>(null);
  const [showCodePrompt, setShowCodePrompt] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState('');

  const requestFix = (serviceId: string) => {
    setShowCodePrompt(serviceId);
    setCodeInput('');
  };

  const confirmFixCode = (serviceId: string) => {
    if (codeInput === '3131') {
      setShowCodePrompt(null);
      setCodeInput('');
      triggerDevinFix(serviceId);
    } else {
      setFixResult({ svcId: serviceId, success: false, error: 'رمز التحقق غير صحيح' });
      setShowCodePrompt(null);
      setCodeInput('');
      setTimeout(() => setFixResult(null), 5000);
    }
  };

  const triggerDevinFix = async (serviceId: string) => {
    setFixingSvc(serviceId);
    setFixResult(null);
    try {
      const resp = await fetch(`${BACKEND_API_URL}/api/autofix/trigger/${serviceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fix_code: '3131' }),
      });
      const data = await resp.json();
      if (data.success) {
        setFixResult({ svcId: serviceId, success: true, url: data.session_url });
        setFixSessions(prev => [data, ...prev].slice(0, 10));
      } else {
        setFixResult({ svcId: serviceId, success: false, error: data.error_ar || data.error || 'فشل إنشاء جلسة الإصلاح' });
      }
    } catch {
      setFixResult({ svcId: serviceId, success: false, error: 'تعذّر الاتصال بالسيرفر' });
    } finally {
      setFixingSvc(null);
      setTimeout(() => setFixResult(null), 10000);
    }
  };

  const fetchFixSessions = useCallback(async () => {
    try {
      const resp = await fetch(`${BACKEND_API_URL}/api/autofix/sessions`);
      if (resp.ok) {
        const data = await resp.json();
        setFixSessions(data.sessions || []);
      }
    } catch { /* ignore */ }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const resp = await fetch(`${BACKEND_API_URL}/api/status`);
      if (!resp.ok) throw new Error('فشل تحميل بيانات الحالة');
      const json = await resp.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchFixSessions();
    if (!autoRefresh) return;
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus, fetchFixSessions, autoRefresh]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
          <span className="text-sm text-gray-400">جاري تحميل حالة النظام...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white mb-2">تعذّر تحميل صفحة الحالة</h2>
          <p className="text-sm text-gray-400 mb-4">{error || 'خطأ غير متوقع'}</p>
          <button onClick={fetchStatus} className="px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl text-sm hover:bg-blue-500/30 transition-colors">
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  const overallStyle = getOverallStatusColor(data.overall_status);
  const OverallIcon = overallStyle.icon;
  const activeIncidents = data.incidents.filter(i => i.status !== 'resolved');
  const resolvedIncidents = data.incidents.filter(i => i.status === 'resolved');
  const visibleIncidents = showAllIncidents ? data.incidents : data.incidents.slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" />
          <h1 className="text-base sm:text-lg font-bold text-white">حالة النظام</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors ${
              autoRefresh ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-gray-800 border border-gray-700 text-gray-400'
            }`}
          >
            <RefreshCw className={`w-3 h-3 ${autoRefresh ? 'animate-spin' : ''}`} style={autoRefresh ? { animationDuration: '3s' } : undefined} />
            {autoRefresh ? 'تحديث تلقائي' : 'تحديث متوقف'}
          </button>
          <button
            onClick={fetchStatus}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            title="تحديث الآن"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Overall Status Banner */}
      <div className={`rounded-2xl border ${overallStyle.border} bg-gradient-to-r ${overallStyle.bg} p-5 sm:p-6 mb-6`}>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl bg-black/20 flex items-center justify-center`}>
            <OverallIcon className={`w-7 h-7 ${overallStyle.text}`} />
          </div>
          <div className="flex-1">
            <h2 className={`text-lg sm:text-xl font-black ${overallStyle.text}`}>{data.overall_status_ar}</h2>
            <p className="text-xs text-gray-400 mt-1">
              آخر تحديث: {timeAgo(data.last_updated)} • {data.services.length} خدمة مراقبة
              {activeIncidents.length > 0 && (
                <span className="text-red-400"> • {activeIncidents.length} حادث نشط</span>
              )}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            {data.services.filter(s => s.status === 'operational').length > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-[10px] font-semibold text-green-400">
                {data.services.filter(s => s.status === 'operational').length} تعمل
              </span>
            )}
            {data.services.filter(s => s.status !== 'operational').length > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-[10px] font-semibold text-red-400">
                {data.services.filter(s => s.status !== 'operational').length} متأثرة
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Active Incidents Alert */}
      {activeIncidents.length > 0 && (
        <div className="mb-6 space-y-3">
          {activeIncidents.map(inc => {
            const isExpanded = expandedIncident === inc.id;
            return (
              <div key={inc.id} className="rounded-xl border border-red-500/30 bg-red-500/5 overflow-hidden">
                <button
                  onClick={() => setExpandedIncident(isExpanded ? null : inc.id)}
                  className="w-full flex items-center justify-between p-4 text-right"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <div>
                      <h3 className="text-sm font-bold text-red-400">{inc.title_ar}</h3>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {getSeverityAr(inc.severity)} • {getIncidentStatusAr(inc.status)} • {timeAgo(inc.started_at)}
                      </p>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-red-500/10">
                    <p className="text-xs text-gray-400 mt-3 mb-3">{inc.description_ar}</p>
                    <div className="space-y-2">
                      {inc.notes.map(note => (
                        <div key={note.id} className="flex gap-2 text-[11px]">
                          <span className="text-gray-500 shrink-0">{new Date(note.timestamp).toLocaleTimeString('ar-SA')}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium shrink-0 ${
                            note.status === 'resolved' ? 'bg-green-500/15 text-green-400' :
                            note.status === 'monitoring' ? 'bg-blue-500/15 text-blue-400' :
                            'bg-yellow-500/15 text-yellow-400'
                          }`}>
                            {getIncidentStatusAr(note.status)}
                          </span>
                          <span className="text-gray-300">{note.message_ar}</span>
                          {!note.auto_generated && (
                            <span className="text-purple-400 text-[9px]">(يدوي)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Services Grid */}
      <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
        <Server className="w-4 h-4 text-blue-400" />
        حالة الخدمات
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {data.services.map(svc => {
          const statusStyle = getStatusColor(svc.status);
          const Icon = getServiceIcon(svc.id);
          return (
            <div key={svc.id} className="rounded-xl border border-gray-800 bg-[#12121a] p-4 hover:border-gray-700 transition-colors">
              {/* Service Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-lg ${statusStyle.bg} border ${statusStyle.border} flex items-center justify-center`}>
                    <Icon className={`w-4.5 h-4.5 ${statusStyle.text}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{svc.name_ar}</h3>
                    <span className="text-[10px] text-gray-500">{svc.name}</span>
                  </div>
                </div>
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${statusStyle.bg} border ${statusStyle.border}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot} ${svc.status === 'operational' ? '' : 'animate-pulse'}`} />
                  <span className={`text-[10px] font-semibold ${statusStyle.text}`}>{svc.status_ar}</span>
                </span>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="text-center">
                  <div className="text-[10px] text-gray-500 mb-0.5">الاستجابة</div>
                  <div className="text-xs font-bold text-white">{svc.response_time_ms ? `${Math.round(svc.response_time_ms)}ms` : '-'}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-gray-500 mb-0.5">أخطاء 24س</div>
                  <div className={`text-xs font-bold ${svc.errors_24h > 0 ? 'text-red-400' : 'text-green-400'}`}>{svc.errors_24h}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-gray-500 mb-0.5">انقطاعات</div>
                  <div className={`text-xs font-bold ${svc.outages_24h > 0 ? 'text-orange-400' : 'text-green-400'}`}>{svc.outages_24h}</div>
                </div>
              </div>

              {/* Uptime Bar */}
              <div className="mb-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500">التشغيل المستمر (24 ساعة)</span>
                  <span className="text-[10px] text-gray-500">{svc.checks_24h} فحص</span>
                </div>
                <UptimeBar percent={svc.uptime_24h} />
              </div>

              {/* Response Time Chart */}
              <ResponseTimeChart data={svc.response_times_history} id={svc.id} />

              {/* Footer */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-800/50">
                <div className="flex items-center gap-1 text-[10px] text-gray-500">
                  <Clock className="w-3 h-3" />
                  {timeAgo(svc.last_check)}
                </div>
                <div className="flex items-center gap-1.5">
                  {svc.auto_heal && (
                    <span className="flex items-center gap-0.5 text-[9px] text-blue-400">
                      <Zap className="w-2.5 h-2.5" />
                      إصلاح تلقائي
                    </span>
                  )}
                  <span className="text-[9px] text-gray-600">كل {svc.check_interval < 60 ? `${svc.check_interval}ث` : `${Math.round(svc.check_interval / 60)}د`}</span>
                </div>
              </div>

              {/* Auto-Fix Button — only show for failing services */}
              {svc.status !== 'operational' && (
                <div className="mt-2 pt-2 border-t border-gray-800/50">
                  {showCodePrompt === svc.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        value={codeInput}
                        onChange={e => setCodeInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && confirmFixCode(svc.id)}
                        placeholder="أدخل رمز التحقق"
                        className="flex-1 px-3 py-1.5 rounded-lg bg-gray-900 border border-purple-500/30 text-white text-[11px] placeholder-gray-500 focus:outline-none focus:border-purple-500"
                        autoFocus
                      />
                      <button
                        onClick={() => confirmFixCode(svc.id)}
                        className="px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 text-[11px] font-semibold hover:bg-purple-500/30 transition-colors"
                      >
                        تأكيد
                      </button>
                      <button
                        onClick={() => { setShowCodePrompt(null); setCodeInput(''); }}
                        className="px-2 py-1.5 rounded-lg text-gray-500 hover:text-gray-300 text-[11px] transition-colors"
                      >
                        إلغاء
                      </button>
                    </div>
                  ) : fixResult && fixResult.svcId === svc.id ? (
                    fixResult.success ? (
                      <a
                        href={fixResult.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-[11px] font-semibold hover:bg-green-500/20 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        تم إنشاء جلسة الإصلاح — اضغط للمتابعة
                      </a>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[10px]">
                        <XCircle className="w-3 h-3" />
                        {fixResult.error}
                      </div>
                    )
                  ) : (
                    <button
                      onClick={() => requestFix(svc.id)}
                      disabled={fixingSvc === svc.id}
                      className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[11px] font-semibold hover:bg-purple-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {fixingSvc === svc.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Bot className="w-3.5 h-3.5" />
                      )}
                      {fixingSvc === svc.id ? 'جاري إنشاء جلسة الإصلاح...' : 'إصلاح بواسطة إدارة النظام'}
                    </button>
                  )}
                </div>
              )}

              {/* Active fix session link for this service */}
              {fixSessions.some(s => s.service_id === svc.id && s.status === 'running') && svc.status !== 'operational' && !(fixResult && fixResult.svcId === svc.id && fixResult.success) && (
                <a
                  href={fixSessions.find(s => s.service_id === svc.id && s.status === 'running')?.session_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 mt-1.5 text-[10px] text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <Bot className="w-3 h-3" />
                  جلسة إصلاح نشطة — اضغط للمتابعة
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          );
        })}
      </div>

      {/* Devin Fix Sessions */}
      {fixSessions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Bot className="w-4 h-4 text-purple-400" />
            جلسات الإصلاح بواسطة إدارة النظام
            <span className="text-[10px] text-gray-500 font-normal">({fixSessions.length} جلسة)</span>
          </h2>
          <div className="rounded-xl border border-gray-800 bg-[#12121a] overflow-hidden">
            {fixSessions.slice(0, 5).map((session, idx) => (
              <div key={session.session_id || idx} className="flex items-center justify-between p-3 border-b border-gray-800/50 last:border-0 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    session.status === 'running' ? 'bg-purple-500 animate-pulse' :
                    session.status === 'finished' ? 'bg-green-500' : 'bg-gray-500'
                  }`} />
                  <div className="min-w-0">
                    <div className="text-[11px] text-white font-medium truncate">{session.service_name}</div>
                    <div className="text-[10px] text-gray-500 truncate">{session.error_details?.slice(0, 80)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                    session.status === 'running' ? 'bg-purple-500/15 text-purple-400' :
                    session.status === 'finished' ? 'bg-green-500/15 text-green-400' : 'bg-gray-700/50 text-gray-400'
                  }`}>
                    {session.status === 'running' ? 'قيد العمل' : session.status === 'finished' ? 'اكتمل' : session.status}
                  </span>
                  <span className="text-[9px] text-gray-600">{timeAgo(session.created_at)}</span>
                  {session.session_url && (
                    <a
                      href={session.session_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────
          Advanced Monitoring Sections
          ────────────────────────────────────────────── */}

      {/* Bahrain Monitor Widget */}
      {data.bahrain_monitor && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-400" />
            مراقبة البحرين
            {data.bahrain_monitor.has_active_alert && (
              <span className="px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-[10px] font-semibold text-red-400 animate-pulse">
                تنبيه نشط
              </span>
            )}
          </h2>
          <div className={`rounded-2xl border ${
            data.bahrain_monitor.has_active_alert ? 'border-red-500/40 bg-gradient-to-r from-red-500/10 to-orange-500/5' :
            data.bahrain_monitor.has_military_activity ? 'border-orange-500/30 bg-gradient-to-r from-orange-500/10 to-yellow-500/5' :
            'border-gray-800 bg-[#12121a]'
          } p-5`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  data.bahrain_monitor.has_active_alert ? 'bg-red-500/20' :
                  data.bahrain_monitor.has_military_activity ? 'bg-orange-500/20' : 'bg-blue-500/20'
                }`}>
                  <Bell className={`w-6 h-6 ${
                    data.bahrain_monitor.has_active_alert ? 'text-red-400 animate-pulse' :
                    data.bahrain_monitor.has_military_activity ? 'text-orange-400' : 'text-blue-400'
                  }`} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">مملكة البحرين</h3>
                  <span className={`text-[10px] font-semibold ${
                    data.bahrain_monitor.risk_level === 'critical' ? 'text-red-400' :
                    data.bahrain_monitor.risk_level === 'high' ? 'text-orange-400' :
                    data.bahrain_monitor.risk_level === 'elevated' ? 'text-yellow-400' :
                    data.bahrain_monitor.risk_level === 'moderate' ? 'text-blue-400' : 'text-green-400'
                  }`}>
                    مستوى الخطر: {
                      data.bahrain_monitor.risk_level === 'critical' ? 'حرج' :
                      data.bahrain_monitor.risk_level === 'high' ? 'مرتفع' :
                      data.bahrain_monitor.risk_level === 'elevated' ? 'متصاعد' :
                      data.bahrain_monitor.risk_level === 'moderate' ? 'متوسط' : 'منخفض'
                    }
                  </span>
                </div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-black ${data.bahrain_monitor.event_count_today > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                  {data.bahrain_monitor.event_count_today}
                </div>
                <div className="text-[10px] text-gray-500">أحداث مرصودة</div>
              </div>
            </div>

            {data.bahrain_monitor.events.length > 0 && (
              <div className="space-y-2 border-t border-gray-800/50 pt-3">
                {data.bahrain_monitor.events.slice(0, 5).map(ev => (
                  <div key={ev.id} className={`flex items-start gap-2 text-[11px] ${ev.isBreaking ? 'text-red-300' : 'text-gray-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                      ev.isBreaking ? 'bg-red-500 animate-pulse' :
                      ev.category === 'military' ? 'bg-orange-500' : 'bg-blue-500'
                    }`} />
                    <span className="flex-1">{ev.titleAr || ev.title}</span>
                    <span className="text-[9px] text-gray-600 shrink-0">{timeAgo(ev.timestamp)}</span>
                  </div>
                ))}
              </div>
            )}

            {data.bahrain_monitor.events.length === 0 && (
              <div className="text-center py-3 text-gray-500 text-xs border-t border-gray-800/50 mt-2 pt-3">
                <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-green-400" />
                لا توجد أحداث مرصودة حالياً — الوضع مستقر
              </div>
            )}
          </div>
        </div>
      )}

      {/* Source Monitoring + WebSocket Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Source Monitoring */}
        {data.source_monitoring && (
          <div className="lg:col-span-2">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" />
              مراقبة مصادر البيانات
            </h2>
            <div className="rounded-xl border border-gray-800 bg-[#12121a] overflow-hidden">
              <div className="grid grid-cols-6 gap-2 px-4 py-2 bg-gray-900/50 text-[10px] text-gray-500 font-semibold border-b border-gray-800">
                <span className="col-span-2">المصدر</span>
                <span className="text-center">الحالة</span>
                <span className="text-center">الأحداث</span>
                <span className="text-center">الأخطاء</span>
                <span className="text-center">نسبة النجاح</span>
              </div>
              {data.source_monitoring.map(src => {
                const sourceNames: Record<string, string> = {
                  gdelt: 'GDELT', rss: 'RSS', opensky: 'OpenSky', devin_ai: 'إدارة النظام',
                  aisstream: 'AIS Maritime', newsapi: 'NewsAPI', mediastack: 'MediaStack', acled: 'ACLED',
                };
                return (
                  <div key={src.id} className="grid grid-cols-6 gap-2 px-4 py-2.5 border-b border-gray-800/50 last:border-0 hover:bg-white/[0.02] transition-colors items-center">
                    <div className="col-span-2 flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${src.active ? 'bg-green-500' : 'bg-gray-600'}`} />
                      <span className="text-[11px] text-white font-medium">{sourceNames[src.id] || src.id}</span>
                    </div>
                    <div className="text-center">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${src.active ? 'bg-green-500/10 text-green-400' : 'bg-gray-700/50 text-gray-500'}`}>
                        {src.active ? 'نشط' : 'معطّل'}
                      </span>
                    </div>
                    <div className="text-center text-[11px] text-white font-medium">{src.event_count}</div>
                    <div className={`text-center text-[11px] font-medium ${src.errors > 0 ? 'text-red-400' : 'text-green-400'}`}>{src.errors}</div>
                    <div className="text-center">
                      <span className={`text-[11px] font-bold ${
                        src.success_rate >= 95 ? 'text-green-400' :
                        src.success_rate >= 80 ? 'text-yellow-400' : 'text-red-400'
                      }`}>{src.success_rate}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* WebSocket Health */}
        {data.websocket_health && (
          <div>
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-green-400" />
              صحة WebSocket
            </h2>
            <div className="rounded-xl border border-gray-800 bg-[#12121a] p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Wifi className={`w-5 h-5 ${data.websocket_health.active_connections > 0 ? 'text-green-400' : 'text-gray-500'}`} />
                  <span className="text-xs text-gray-400">الاتصالات النشطة</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  data.websocket_health.active_connections > 0 ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-gray-800 border border-gray-700 text-gray-500'
                }`}>
                  {data.websocket_health.active_connections > 0 ? 'متصل' : 'لا اتصالات'}
                </span>
              </div>

              <div className="text-center mb-4">
                <div className="text-3xl font-black text-white">{data.websocket_health.active_connections}</div>
                <div className="text-[10px] text-gray-500">من {data.websocket_health.max_connections} كحد أقصى</div>
              </div>

              {/* Connection usage bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-gray-500">استخدام الاتصالات</span>
                  <span className="text-[10px] text-gray-400">
                    {Math.round((data.websocket_health.active_connections / data.websocket_health.max_connections) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      (data.websocket_health.active_connections / data.websocket_health.max_connections) > 0.8 ? 'bg-red-500' :
                      (data.websocket_health.active_connections / data.websocket_health.max_connections) > 0.5 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.max(2, (data.websocket_health.active_connections / data.websocket_health.max_connections) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-800/50">
                <div className="text-center">
                  <div className="text-xs font-bold text-white">{data.websocket_health.max_connections}</div>
                  <div className="text-[9px] text-gray-500">الحد الأقصى</div>
                </div>
                <div className="text-center">
                  <div className={`text-xs font-bold ${
                    data.websocket_health.max_connections - data.websocket_health.active_connections < 10 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {data.websocket_health.max_connections - data.websocket_health.active_connections}
                  </div>
                  <div className="text-[9px] text-gray-500">متاح</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Incident History */}
      <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
        <Shield className="w-4 h-4 text-purple-400" />
        سجل الحوادث
        {data.incidents.length > 0 && (
          <span className="text-[10px] text-gray-500 font-normal">({data.incidents.length} حادث)</span>
        )}
      </h2>

      {data.incidents.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-[#12121a] p-8 text-center">
          <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-2" />
          <p className="text-sm text-gray-400">لا توجد حوادث مسجلة — النظام يعمل بشكل ممتاز</p>
        </div>
      ) : (
        <div className="space-y-2 mb-6">
          {visibleIncidents.map(inc => {
            const isExpanded = expandedIncident === inc.id;
            const isResolved = inc.status === 'resolved';
            return (
              <div key={inc.id} className={`rounded-xl border ${isResolved ? 'border-gray-800 bg-[#12121a]' : 'border-orange-500/30 bg-orange-500/5'} overflow-hidden`}>
                <button
                  onClick={() => setExpandedIncident(isExpanded ? null : inc.id)}
                  className="w-full flex items-center justify-between p-3 text-right"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${isResolved ? 'bg-green-500' : 'bg-orange-500 animate-pulse'}`} />
                    <div className="min-w-0">
                      <h3 className={`text-xs font-bold truncate ${isResolved ? 'text-gray-300' : 'text-orange-400'}`}>{inc.title_ar}</h3>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500 flex-wrap">
                        <span>{getSeverityAr(inc.severity)}</span>
                        <span>•</span>
                        <span className={isResolved ? 'text-green-400' : 'text-orange-400'}>{getIncidentStatusAr(inc.status)}</span>
                        <span>•</span>
                        <span>{timeAgo(inc.started_at)}</span>
                        {inc.duration_seconds && (
                          <>
                            <span>•</span>
                            <span>مدة: {formatDuration(inc.duration_seconds)}</span>
                          </>
                        )}
                        {inc.auto_healed && (
                          <span className="text-blue-400 flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5" />
                            إصلاح تلقائي
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />}
                </button>
                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-gray-800/50">
                    <p className="text-[11px] text-gray-400 mt-2 mb-2">{inc.description_ar}</p>
                    <div className="space-y-1.5">
                      {inc.notes.map(note => (
                        <div key={note.id} className="flex gap-2 items-start text-[10px]">
                          <span className="text-gray-600 shrink-0 w-14">{new Date(note.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-medium shrink-0 ${
                            note.status === 'resolved' ? 'bg-green-500/15 text-green-400' :
                            note.status === 'monitoring' ? 'bg-blue-500/15 text-blue-400' :
                            note.status === 'identified' ? 'bg-purple-500/15 text-purple-400' :
                            'bg-yellow-500/15 text-yellow-400'
                          }`}>
                            {getIncidentStatusAr(note.status)}
                          </span>
                          <span className="text-gray-400">{note.message_ar}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {data.incidents.length > 5 && (
            <button
              onClick={() => setShowAllIncidents(!showAllIncidents)}
              className="w-full py-2 text-center text-xs text-gray-400 hover:text-white transition-colors"
            >
              {showAllIncidents ? 'عرض أقل' : `عرض الكل (${data.incidents.length})`}
            </button>
          )}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="rounded-xl border border-gray-800 bg-[#12121a] p-4 text-center">
          <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-1" />
          <div className="text-lg font-black text-white">
            {data.services.length > 0 ? Math.round(data.services.reduce((a, s) => a + s.uptime_24h, 0) / data.services.length) : 100}%
          </div>
          <div className="text-[10px] text-gray-500">متوسط التشغيل</div>
        </div>
        <div className="rounded-xl border border-gray-800 bg-[#12121a] p-4 text-center">
          <Activity className="w-5 h-5 text-blue-400 mx-auto mb-1" />
          <div className="text-lg font-black text-white">{data.services.length}</div>
          <div className="text-[10px] text-gray-500">خدمات مراقبة</div>
        </div>
        <div className="rounded-xl border border-gray-800 bg-[#12121a] p-4 text-center">
          <AlertTriangle className="w-5 h-5 text-orange-400 mx-auto mb-1" />
          <div className="text-lg font-black text-white">{data.services.reduce((a, s) => a + s.errors_24h, 0)}</div>
          <div className="text-[10px] text-gray-500">أخطاء (24 ساعة)</div>
        </div>
        <div className="rounded-xl border border-gray-800 bg-[#12121a] p-4 text-center">
          <Shield className="w-5 h-5 text-purple-400 mx-auto mb-1" />
          <div className="text-lg font-black text-white">{resolvedIncidents.length}</div>
          <div className="text-[10px] text-gray-500">حوادث تم حلها</div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] text-gray-600 mt-4">
        يتم فحص الخدمات تلقائياً كل 1-5 دقائق • آخر تحديث: {timeAgo(data.last_updated)}
      </div>
    </div>
  );
}
