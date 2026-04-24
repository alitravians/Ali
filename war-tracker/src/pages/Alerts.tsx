import { useState } from 'react';
import { useLiveData } from '../context/LiveDataContext';
import { timeAgo, severityColor } from '../utils/helpers';
import { Bell, AlertTriangle, TrendingUp, Info, Filter, Clock, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import type { AlertSeverity } from '../types';

export default function Alerts() {
  const { alerts } = useLiveData();
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = alerts.filter(a => {
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    if (typeFilter !== 'all' && a.type !== typeFilter) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const unreadCount = alerts.filter(a => !a.isRead).length;
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;

  const typeIcons: Record<string, typeof Bell> = {
    urgent: AlertTriangle,
    escalation: TrendingUp,
    change: Bell,
    info: Info,
  };
  const typeLabels: Record<string, string> = {
    urgent: 'عاجل',
    escalation: 'تصعيد',
    change: 'تغيير',
    info: 'معلومات',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <Bell className="w-5 h-5 text-yellow-400" />
          التنبيهات
        </h1>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-red-500/15 border border-red-500/30 rounded-full text-[10px] font-bold text-red-400">
              {unreadCount} غير مقروءة
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl border border-gray-800 bg-[#12121a] p-4">
          <div className="text-xs text-gray-400 mb-1">إجمالي التنبيهات</div>
          <div className="text-2xl font-black text-white">{alerts.length}</div>
        </div>
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
          <div className="text-xs text-gray-400 mb-1">تنبيهات حرجة</div>
          <div className="text-2xl font-black text-red-400">{criticalCount}</div>
        </div>
        <div className="rounded-xl border border-gray-800 bg-[#12121a] p-4">
          <div className="text-xs text-gray-400 mb-1">غير مقروءة</div>
          <div className="text-2xl font-black text-yellow-400">{unreadCount}</div>
        </div>
        <div className="rounded-xl border border-gray-800 bg-[#12121a] p-4">
          <div className="text-xs text-gray-400 mb-1">تنبيهات تصعيد</div>
          <div className="text-2xl font-black text-orange-400">{alerts.filter(a => a.type === 'escalation').length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6 bg-[#12121a] rounded-xl border border-gray-800 p-3">
        <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5" />
          فلترة:
        </span>
        <div className="flex flex-wrap gap-1">
          {(['all', 'critical', 'high', 'medium', 'low'] as const).map(sev => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${
                severityFilter === sev
                  ? 'bg-white/10 text-white border-white/20'
                  : 'text-gray-400 border-gray-700 hover:text-gray-300'
              }`}
            >
              {sev === 'all' ? 'كل الأولويات' : sev === 'critical' ? 'حرج' : sev === 'high' ? 'عالي' : sev === 'medium' ? 'متوسط' : 'منخفض'}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {['all', 'urgent', 'escalation', 'change', 'info'].map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${
                typeFilter === type
                  ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                  : 'text-gray-400 border-gray-700 hover:text-gray-300'
              }`}
            >
              {type === 'all' ? 'كل الأنواع' : typeLabels[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Alert list */}
      <div className="space-y-3">
        {sorted.map(alert => {
          const Icon = typeIcons[alert.type] || Bell;
          const isExpanded = expandedId === alert.id;

          return (
            <div
              key={alert.id}
              className={`rounded-xl border-r-4 border ${severityColor(alert.severity)} transition-all ${
                !alert.isRead ? 'ring-1 ring-white/5' : ''
              }`}
            >
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : alert.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      alert.severity === 'critical' ? 'bg-red-500/20' :
                      alert.severity === 'high' ? 'bg-orange-500/20' :
                      alert.severity === 'medium' ? 'bg-yellow-500/20' : 'bg-blue-500/20'
                    }`}>
                      <Icon className={`w-4 h-4 ${
                        alert.severity === 'critical' ? 'text-red-400' :
                        alert.severity === 'high' ? 'text-orange-400' :
                        alert.severity === 'medium' ? 'text-yellow-400' : 'text-blue-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {!alert.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          alert.severity === 'critical' ? 'text-red-400 bg-red-500/15' :
                          alert.severity === 'high' ? 'text-orange-400 bg-orange-500/15' :
                          alert.severity === 'medium' ? 'text-yellow-400 bg-yellow-500/15' : 'text-blue-400 bg-blue-500/15'
                        }`}>
                          {alert.severity === 'critical' ? 'حرج' : alert.severity === 'high' ? 'عالي' : alert.severity === 'medium' ? 'متوسط' : 'منخفض'}
                        </span>
                        <span className="text-[10px] text-gray-400 px-2 py-0.5 bg-gray-800 rounded-full">
                          {typeLabels[alert.type]}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white mb-1">{alert.titleAr}</h3>
                      <p className="text-xs text-gray-400">{alert.descriptionAr}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(alert.timestamp)}
                    </span>
                    {alert.cityAr && (
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {alert.cityAr}
                      </span>
                    )}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-800 p-4">
                  <div className="text-xs text-gray-400 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">الأحداث المرتبطة:</span>
                      <span className="text-white">{alert.relatedEventIds.length} حدث</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">الحالة:</span>
                      <span className={alert.isRead ? 'text-gray-400' : 'text-blue-400'}>
                        {alert.isRead ? 'مقروء' : 'غير مقروء'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
