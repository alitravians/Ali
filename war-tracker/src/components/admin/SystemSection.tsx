import {
  Server, Wifi, Shield, Globe, HardDrive, TrendingUp, Brain,
} from 'lucide-react';
import { sources } from '../../data/staticConfig';
import { InfoCard, SectionHeader } from './AdminUI';
import type { TrackerEvent, Alert } from '../../types';

export default function SystemSection({ backendHealthy, backendLatency, connectionStatus, events, alerts }: {
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
        description="تفاصيل تقنية عن الخادم والاتصالات والبيانات ومحرك التحليل"
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
          icon={Brain}
          iconColor="text-purple-400"
          title="محرك التحليل"
          rows={[
            { label: 'الحالة', value: 'نشط', valueColor: 'text-green-400' },
            { label: 'المحرك', value: 'Groq Llama 3.3' },
            { label: 'المسار', value: 'تحليلات → Groq → إحصائي' },
            { label: 'الأحداث المحملة', value: events.length, valueColor: 'text-white font-bold' },
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
