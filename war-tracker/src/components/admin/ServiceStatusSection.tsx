import { useState, useEffect } from 'react';
import {
  RefreshCw, CheckCircle2, AlertTriangle, Loader2, Zap, Globe,
} from 'lucide-react';
import { BACKEND_API_URL } from '../../config/api';
import { SectionHeader, showToast } from './AdminUI';

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

export default function ServiceStatusSection() {
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
      const resp = await fetch(`${BACKEND_API_URL}/api/status/admin/service/${serviceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updates),
      });
      if (resp.ok) {
        showToast('تم تحديث إعدادات الخدمة', 'success');
        await fetchStatusAdmin();
      } else {
        showToast('فشل تحديث الخدمة', 'error');
      }
    } catch (err) {
      console.warn('[StatusAdmin] Update failed:', err instanceof Error ? err.message : err);
      showToast('خطأ في الاتصال', 'error');
    }
    setUpdating(null);
  };

  const triggerCheck = async (serviceId: string) => {
    setUpdating(serviceId);
    try {
      const resp = await fetch(`${BACKEND_API_URL}/api/status/admin/check/${serviceId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (resp.ok) {
        showToast('تم تشغيل الفحص', 'success');
        await fetchStatusAdmin();
      } else {
        showToast('فشل تشغيل الفحص', 'error');
      }
    } catch (err) {
      console.warn('[StatusAdmin] Check failed:', err instanceof Error ? err.message : err);
      showToast('خطأ في الاتصال', 'error');
    }
    setUpdating(null);
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
                <th className="text-right py-3 px-4 text-gray-400 font-medium">الخدمة</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium hidden sm:table-cell">النوع</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">الحالة</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium hidden md:table-cell">الفحص</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">مفعّل</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium hidden lg:table-cell">إصلاح تلقائي</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">فحص</th>
              </tr>
            </thead>
            <tbody>
              {statusData.services.map(svc => (
                <tr key={svc.id} className="border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{svc.name_ar}</div>
                    <div className="text-[10px] text-gray-600">{svc.name}</div>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell">
                    <span className="px-2 py-0.5 bg-gray-800 rounded-full text-gray-300">{typeAr[svc.type] || svc.type}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`flex items-center gap-1 ${statusColors[svc.status] || 'text-gray-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDots[svc.status] || 'bg-gray-500'}`} />
                      {statusAr[svc.status] || svc.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 hidden md:table-cell">
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
                  <td className="py-3 px-4 hidden lg:table-cell">
                    <button
                      onClick={() => updateService(svc.id, { auto_heal: !svc.auto_heal })}
                      disabled={updating === svc.id}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] transition-colors ${svc.auto_heal ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}
                    >
                      <Zap className="w-2.5 h-2.5" />
                      {svc.auto_heal ? 'مفعّل' : 'معطّل'}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => triggerCheck(svc.id)}
                      disabled={updating === svc.id}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors disabled:opacity-50"
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
        <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-blue-400" />
          صفحة الحالة العامة متاحة للجميع على <a href="/status" className="text-blue-400 hover:underline">/status</a>
        </p>
      </div>
    </div>
  );
}
