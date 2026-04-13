import {
  Database, FileSearch, Bell, Brain, Activity, BarChart3,
  Zap, Server, Wifi, HardDrive,
} from 'lucide-react';
import { sources } from '../../data/staticConfig';
import { StatCard, InfoCard, QuickAction } from './AdminUI';
import type { TrackerEvent, Alert } from '../../types';

type AdminSection = 'overview' | 'sources' | 'events' | 'service-status' | 'bug-reports' | 'system';

interface OverviewProps {
  events: TrackerEvent[];
  alerts: Alert[];
  backendHealthy: boolean | null;
  backendLatency: number | null;
  connectionStatus: string;
  pendingReviewEvents: TrackerEvent[];
  unreadAlerts: number;
  setActiveSection: (s: AdminSection) => void;
}

export default function OverviewSection({
  events, alerts, backendHealthy, backendLatency, connectionStatus,
  pendingReviewEvents, unreadAlerts, setActiveSection,
}: OverviewProps) {
  return (
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
          <QuickAction label="محرك التحليل" icon={Brain} onClick={() => setActiveSection('system')} />
        </div>
      </div>
    </div>
  );
}
