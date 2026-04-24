import { useState, useMemo } from 'react';
import { useLiveData } from '../context/LiveDataContext';
import { BarChart3, TrendingUp, Clock, MapPin, Shield, Zap, Download, Calendar, PieChart, Activity } from 'lucide-react';
import { categoryTextAr, categoryColor } from '../utils/helpers';
import type { EventCategory } from '../types';

type TimeRange = '24h' | '7d' | '30d' | 'all';

export default function Analytics() {
  const { events, alerts } = useLiveData();
  const [timeRange, setTimeRange] = useState<TimeRange>('all');

  const filteredEvents = useMemo(() => {
    const now = Date.now();
    const cutoff = timeRange === '24h' ? 24 * 60 * 60 * 1000
      : timeRange === '7d' ? 7 * 24 * 60 * 60 * 1000
      : timeRange === '30d' ? 30 * 24 * 60 * 60 * 1000
      : Infinity;
    return events.filter(e => now - e.timestamp.getTime() < cutoff);
  }, [events, timeRange]);

  // Category breakdown
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredEvents.forEach(e => {
      counts[e.category] = (counts[e.category] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([cat, count]) => ({
        category: cat as EventCategory,
        count,
        percent: filteredEvents.length > 0 ? Math.round((count / filteredEvents.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredEvents]);

  // Trust level breakdown
  const trustStats = useMemo(() => {
    const counts: Record<string, number> = { confirmed: 0, high: 0, medium: 0, low: 0 };
    filteredEvents.forEach(e => { counts[e.trustLevel] = (counts[e.trustLevel] || 0) + 1; });
    return counts;
  }, [filteredEvents]);

  // Location hotspots
  const locationStats = useMemo(() => {
    const counts: Record<string, { nameAr: string; count: number }> = {};
    filteredEvents.forEach(e => {
      const key = e.location.nameAr || e.location.name;
      if (!counts[key]) counts[key] = { nameAr: key, count: 0 };
      counts[key].count++;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [filteredEvents]);

  // Hourly distribution (for 24h/7d)
  const hourlyDist = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
    filteredEvents.forEach(e => {
      const h = e.timestamp.getHours();
      hours[h].count++;
    });
    const max = Math.max(...hours.map(h => h.count), 1);
    return hours.map(h => ({ ...h, percent: Math.round((h.count / max) * 100) }));
  }, [filteredEvents]);

  // Breaking events count
  const breakingCount = filteredEvents.filter(e => e.isBreaking).length;
  const confirmedCount = trustStats.confirmed;

  // Source breakdown
  const sourceStats = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredEvents.forEach(e => {
      e.sources.forEach(s => {
        const name = s.sourceNameAr || s.sourceName;
        counts[name] = (counts[name] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filteredEvents]);

  // Export CSV — proper escaping and error handling
  const handleExportCSV = () => {
    let url: string | null = null;
    try {
      const escapeField = (val: string) => {
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      };
      const headers = ['التاريخ', 'العنوان', 'التصنيف', 'مستوى الثقة', 'الموقع', 'عاجل', 'المصادر'];
      const rows = filteredEvents.map(e => [
        e.timestamp.toISOString(),
        escapeField(e.titleAr),
        escapeField(categoryTextAr(e.category)),
        e.trustLevel,
        escapeField(e.location.nameAr),
        e.isBreaking ? 'نعم' : 'لا',
        escapeField(e.sources.map(s => s.sourceNameAr || s.sourceName).join(' | ')),
      ]);
      const bom = '\uFEFF';
      const csv = bom + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `warscope-events-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    } catch (err) {
      console.error('[CSV Export] Failed:', err);
    } finally {
      if (url) URL.revokeObjectURL(url);
    }
  };

  const timeRangeLabel = timeRange === '24h' ? 'آخر 24 ساعة' : timeRange === '7d' ? 'آخر 7 أيام' : timeRange === '30d' ? 'آخر 30 يوم' : 'كل الأحداث';

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            التحليلات والإحصائيات
          </h1>
          <p className="text-xs text-gray-500 mt-1">{timeRangeLabel} — {filteredEvents.length} حدث</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Time range selector */}
          <div className="flex items-center bg-[#12121a] border border-gray-800 rounded-lg p-0.5">
            {([['24h', '24 ساعة'], ['7d', '7 أيام'], ['30d', '30 يوم'], ['all', 'الكل']] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTimeRange(key)}
                className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition-colors ${
                  timeRange === key ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {/* Export button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-[11px] text-green-400 hover:bg-green-500/20 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            تصدير CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-[#12121a] rounded-xl border border-gray-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{filteredEvents.length}</div>
          <div className="text-[10px] text-gray-400">إجمالي الأحداث</div>
        </div>

        <div className="bg-[#12121a] rounded-xl border border-gray-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-red-400" />
            </div>
          </div>
          <div className="text-2xl font-black text-red-400">{breakingCount}</div>
          <div className="text-[10px] text-gray-400">أحداث عاجلة</div>
        </div>

        <div className="bg-[#12121a] rounded-xl border border-gray-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-green-400" />
            </div>
          </div>
          <div className="text-2xl font-black text-green-400">{confirmedCount}</div>
          <div className="text-[10px] text-gray-400">أحداث مؤكدة</div>
        </div>

        <div className="bg-[#12121a] rounded-xl border border-gray-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-yellow-400" />
            </div>
          </div>
          <div className="text-2xl font-black text-yellow-400">{alerts.length}</div>
          <div className="text-[10px] text-gray-400">تنبيهات</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Category Breakdown */}
        <div className="bg-[#12121a] rounded-xl border border-gray-800 p-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-purple-400" />
            توزيع الأحداث حسب التصنيف
          </h3>
          <div className="space-y-3">
            {categoryStats.map(stat => (
              <div key={stat.category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-300">{categoryTextAr(stat.category)}</span>
                  <span className="text-xs font-bold text-white">{stat.count} <span className="text-gray-500 font-normal">({stat.percent}%)</span></span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${stat.percent}%`, backgroundColor: categoryColor(stat.category) }}
                  />
                </div>
              </div>
            ))}
            {categoryStats.length === 0 && (
              <div className="text-center text-xs text-gray-500 py-4">لا توجد أحداث في هذه الفترة</div>
            )}
          </div>
        </div>

        {/* Trust Level Breakdown */}
        <div className="bg-[#12121a] rounded-xl border border-gray-800 p-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-green-400" />
            توزيع مستوى الثقة
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {([
              { key: 'confirmed', label: 'مؤكد', color: 'green', icon: '✓' },
              { key: 'high', label: 'مرجّح', color: 'blue', icon: '↑' },
              { key: 'medium', label: 'قيد التحقق', color: 'yellow', icon: '?' },
              { key: 'low', label: 'غير مؤكد', color: 'red', icon: '!' },
            ] as const).map(item => {
              const count = trustStats[item.key] || 0;
              const pct = filteredEvents.length > 0 ? Math.round((count / filteredEvents.length) * 100) : 0;
              return (
                <div key={item.key} className={`rounded-lg border border-${item.color}-500/20 bg-${item.color}-500/5 p-3`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-semibold text-${item.color}-400`}>{item.label}</span>
                    <span className={`text-lg font-black text-${item.color}-400`}>{count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full bg-${item.color}-500 rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">{pct}% من الإجمالي</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Hourly Distribution */}
        <div className="bg-[#12121a] rounded-xl border border-gray-800 p-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-cyan-400" />
            توزيع الأحداث حسب الساعة
          </h3>
          <div className="flex items-end gap-[3px] h-32">
            {hourlyDist.map(h => (
              <div key={h.hour} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t-sm transition-all duration-300 min-h-[2px]"
                  style={{ height: `${Math.max(h.percent, 2)}%` }}
                  title={`${h.hour}:00 — ${h.count} حدث`}
                />
                {h.hour % 4 === 0 && (
                  <span className="text-[8px] text-gray-600">{h.hour}</span>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-gray-600">00:00</span>
            <span className="text-[9px] text-gray-600">23:00</span>
          </div>
        </div>

        {/* Top Locations */}
        <div className="bg-[#12121a] rounded-xl border border-gray-800 p-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-orange-400" />
            أكثر المواقع نشاطاً
          </h3>
          <div className="space-y-2">
            {locationStats.map((loc, i) => (
              <div key={loc.nameAr} className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-gray-500 w-5 text-center">{i + 1}</span>
                <span className="text-xs text-gray-300 flex-1">{loc.nameAr}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-l from-orange-500 to-red-500 rounded-full"
                      style={{ width: `${Math.round((loc.count / (locationStats[0]?.count || 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-white w-6 text-left">{loc.count}</span>
                </div>
              </div>
            ))}
            {locationStats.length === 0 && (
              <div className="text-center text-xs text-gray-500 py-4">لا توجد بيانات</div>
            )}
          </div>
        </div>
      </div>

      {/* Source Breakdown */}
      <div className="bg-[#12121a] rounded-xl border border-gray-800 p-4 mb-6">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          مصادر الأحداث
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {sourceStats.map(src => (
            <div key={src.name} className="bg-gray-800/30 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1 line-clamp-1">{src.name}</div>
              <div className="text-lg font-black text-white">{src.count}</div>
              <div className="text-[10px] text-gray-400">حدث</div>
            </div>
          ))}
          {sourceStats.length === 0 && (
            <div className="col-span-4 text-center text-xs text-gray-500 py-4">لا توجد بيانات</div>
          )}
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-[#12121a] rounded-xl border border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-green-400" />
              تصدير البيانات
            </h3>
            <p className="text-[11px] text-gray-500 mt-1">تصدير {filteredEvents.length} حدث بصيغة CSV — متوافق مع Excel</p>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-400 hover:bg-green-500/20 transition-colors font-semibold"
          >
            <Download className="w-4 h-4" />
            تحميل CSV
          </button>
        </div>
      </div>
    </div>
  );
}
