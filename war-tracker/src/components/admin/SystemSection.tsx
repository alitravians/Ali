import { useState, useEffect } from 'react';
import {
  Server, Wifi, Shield, Globe, HardDrive, TrendingUp, Brain,
  Play, Loader2, Trash2, CheckCircle2, Wrench, ExternalLink, Clock,
} from 'lucide-react';
import { sources } from '../../data/staticConfig';
import { BACKEND_API_URL } from '../../config/api';
import { InfoCard, SectionHeader, showToast } from './AdminUI';
import type { TrackerEvent, Alert } from '../../types';

interface AutofixSession {
  service_id: string;
  service_name: string;
  session_id?: string;
  session_url?: string;
  triggered_at: string;
  status: string;
}

export default function SystemSection({ backendHealthy, backendLatency, connectionStatus, events, alerts }: {
  backendHealthy: boolean | null;
  backendLatency: number | null;
  connectionStatus: string;
  events: TrackerEvent[];
  alerts: Alert[];
}) {
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [autofixSessions, setAutofixSessions] = useState<AutofixSession[]>([]);
  const [autofixLoading, setAutofixLoading] = useState(true);

  const token = sessionStorage.getItem('warscope_admin_token') || '';

  // Fetch autofix sessions
  useEffect(() => {
    async function fetchSessions() {
      try {
        const resp = await fetch(`${BACKEND_API_URL}/api/autofix/sessions`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (resp.ok) {
          const data = await resp.json();
          setAutofixSessions(data.sessions || []);
        }
      } catch (err) {
        console.warn('[Autofix] Failed:', err instanceof Error ? err.message : err);
      }
      setAutofixLoading(false);
    }
    fetchSessions();
  }, []);

  const triggerAnalysis = async () => {
    setAnalysisLoading(true);
    try {
      const resp = await fetch(`${BACKEND_API_URL}/api/analysis/trigger`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.error) {
          showToast(data.error, 'info');
        } else {
          showToast('تم تشغيل التحليل بنجاح', 'success');
        }
      } else {
        const err = await resp.json().catch(() => ({}));
        showToast(err.detail || 'فشل تشغيل التحليل', 'error');
      }
    } catch {
      showToast('خطأ في الاتصال بالخادم', 'error');
    }
    setAnalysisLoading(false);
  };

  const clearCache = () => {
    // Only touch keys that belong to this app (warscope_*) and never the admin
    // session/settings keys. The previous implementation also swept ALL other
    // localStorage entries, which would delete data belonging to unrelated apps
    // sharing the same origin (e.g. other dev apps on localhost).
    const keys = Object.keys(localStorage);
    const cachesToClear = keys.filter(k =>
      k.startsWith('warscope_') &&
      k !== 'warscope_admin_token' &&
      k !== 'warscope_admin_section' &&
      k !== 'warscope_admin_sidebar'
    );
    cachesToClear.forEach(k => localStorage.removeItem(k));
    showToast(`تم مسح ${cachesToClear.length} عنصر من الذاكرة المؤقتة`, 'success');
  };

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return ts; }
  };

  return (
    <div>
      <SectionHeader
        title="معلومات النظام"
        description="تفاصيل تقنية، أدوات التحليل، جلسات الإصلاح التلقائي"
      />

      {/* System Info Cards */}
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

      {/* AI Analysis Trigger */}
      <div className="mt-6 rounded-xl border border-gray-800 bg-[#12121a] p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">محرك التحليل — Groq Llama 3.3</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">تشغيل تحليل فوري لآخر 20 حدث — المسار: تحليلات → Groq → إحصائي</p>
            </div>
          </div>
          <button
            onClick={triggerAnalysis}
            disabled={analysisLoading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/15 text-purple-400 border border-purple-500/25 rounded-lg text-xs font-bold hover:bg-purple-500/25 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {analysisLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {analysisLoading ? 'جاري التحليل...' : 'تشغيل التحليل'}
          </button>
        </div>
      </div>

      {/* Autofix Sessions */}
      <div className="mt-4 rounded-xl border border-gray-800 bg-[#12121a] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Wrench className="w-4 h-4 text-orange-400" />
          <h3 className="text-xs font-bold text-white">جلسات الإصلاح التلقائي</h3>
          <span className="text-[10px] text-gray-600 mr-auto">سجل عمليات الإصلاح التلقائي للخدمات</span>
        </div>
        {autofixLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-blue-400 animate-spin" /></div>
        ) : autofixSessions.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-8 h-8 text-green-400/30 mx-auto mb-2" />
            <p className="text-[11px] text-gray-400">لا توجد جلسات إصلاح سابقة — النظام مستقر</p>
          </div>
        ) : (
          <div className="space-y-2">
            {autofixSessions.slice(0, 10).map((session, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-[#0a0a0f] rounded-lg border border-gray-800/50">
                <Wrench className={`w-4 h-4 flex-shrink-0 ${session.status === 'completed' ? 'text-green-400' : session.status === 'running' ? 'text-blue-400' : 'text-orange-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-white font-medium truncate">{session.service_name}</div>
                  <div className="text-[10px] text-gray-600 flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {formatTime(session.triggered_at)}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  session.status === 'completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                  session.status === 'running' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                  'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                }`}>
                  {session.status === 'completed' ? 'مكتمل' : session.status === 'running' ? 'جاري' : session.status}
                </span>
                {session.session_url && (
                  <a href={session.session_url} target="_blank" rel="noopener noreferrer" className="p-1 text-gray-400 hover:text-blue-400 transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cache Clearing */}
      <div className="mt-4 rounded-xl border border-gray-800 bg-[#12121a] p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">مسح الذاكرة المؤقتة</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">مسح بيانات الكاش المحفوظة بالمتصفح (لا يؤثر على جلسة الإدارة)</p>
            </div>
          </div>
          <button
            onClick={clearCache}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-colors whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5" />
            مسح الكاش
          </button>
        </div>
      </div>
    </div>
  );
}
