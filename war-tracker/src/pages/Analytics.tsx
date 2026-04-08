import { useState, useMemo } from 'react';
import {
  BarChart3, TrendingUp, Calendar, Filter, Globe2, Crosshair,
  AlertTriangle, Anchor, Plane, Shield, Heart, Flame, ArrowUp,
  ArrowDown, Minus, Clock, MapPin
} from 'lucide-react';
import { useLiveData } from '../context/LiveDataContext';
import type { EventCategory } from '../types';
import { categoryColor, categoryTextAr } from '../utils/helpers';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

type TimeRange = '24h' | '7d' | '30d' | 'all';

const categoryIcons: Record<EventCategory, typeof Shield> = {
  military: Crosshair,
  alert: AlertTriangle,
  official: Shield,
  airspace: Plane,
  maritime: Anchor,
  fire: Flame,
  humanitarian: Heart,
};

function MiniBarChart({ data, maxVal, color }: { data: number[]; maxVal: number; color: string }) {
  if (!data.length) return null;
  const barW = Math.max(2, Math.min(8, 160 / data.length));
  return (
    <div className="flex items-end gap-px h-16">
      {data.map((v, i) => (
        <div
          key={i}
          className="rounded-t-sm transition-all duration-300"
          style={{
            width: `${barW}px`,
            height: `${maxVal > 0 ? Math.max(2, (v / maxVal) * 100) : 2}%`,
            backgroundColor: color,
            opacity: 0.6 + (v / Math.max(maxVal, 1)) * 0.4,
          }}
          title={`${v} حدث`}
        />
      ))}
    </div>
  );
}

function StatCard({ label, value, change, icon: Icon, color }: {
  label: string; value: number | string; change?: number; icon: typeof Shield; color: string;
}) {
  return (
    <div className="bg-[#12121a] border border-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-gray-500">{label}</span>
        <div className={`p-1.5 rounded-lg`} style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <div className="text-2xl font-black text-white mb-1">{value}</div>
      {change !== undefined && (
        <div className={`flex items-center gap-1 text-[10px] font-semibold ${
          change > 0 ? 'text-red-400' : change < 0 ? 'text-green-400' : 'text-gray-500'
        }`}>
          {change > 0 ? <ArrowUp className="w-3 h-3" /> : change < 0 ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          {change > 0 ? `+${change}%` : change < 0 ? `${change}%` : 'مستقر'} مقارنة بالفترة السابقة
        </div>
      )}
    </div>
  );
}

export default function Analytics() {
  const { events } = useLiveData();
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'all'>('all');

  const now = Date.now();
  const rangeMs: Record<TimeRange, number> = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    'all': Infinity,
  };

  const filteredEvents = useMemo(() => {
    let filtered = events.filter(e => now - e.timestamp.getTime() < rangeMs[timeRange]);
    if (selectedCategory !== 'all') filtered = filtered.filter(e => e.category === selectedCategory);
    return filtered;
  }, [events, timeRange, selectedCategory, now]);

  // Previous period for comparison
  const prevPeriodEvents = useMemo(() => {
    if (timeRange === 'all') return [];
    const ms = rangeMs[timeRange];
    return events.filter(e => {
      const age = now - e.timestamp.getTime();
      return age >= ms && age < ms * 2;
    });
  }, [events, timeRange, now]);

  const changePercent = prevPeriodEvents.length > 0
    ? Math.round(((filteredEvents.length - prevPeriodEvents.length) / prevPeriodEvents.length) * 100)
    : undefined;

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const cats: EventCategory[] = ['military', 'alert', 'official', 'airspace', 'maritime', 'fire', 'humanitarian'];
    return cats.map(cat => ({
      category: cat,
      count: filteredEvents.filter(e => e.category === cat).length,
      color: categoryColor(cat),
      label: categoryTextAr(cat),
      Icon: categoryIcons[cat],
    })).sort((a, b) => b.count - a.count);
  }, [filteredEvents]);

  // Daily distribution
  const dailyData = useMemo(() => {
    const days = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 30;
    const unitMs = timeRange === '24h' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const counts = Array(days).fill(0);
    filteredEvents.forEach(e => {
      const idx = Math.floor((now - e.timestamp.getTime()) / unitMs);
      if (idx >= 0 && idx < days) counts[days - 1 - idx]++;
    });
    return counts;
  }, [filteredEvents, timeRange, now]);

  // Top locations
  const topLocations = useMemo(() => {
    const locMap = new Map<string, { name: string; count: number }>();
    filteredEvents.forEach(e => {
      const key = e.location.nameAr;
      const existing = locMap.get(key);
      if (existing) existing.count++;
      else locMap.set(key, { name: key, count: 1 });
    });
    return [...locMap.values()].sort((a, b) => b.count - a.count).slice(0, 8);
  }, [filteredEvents]);

  // Breaking events count
  const breakingCount = filteredEvents.filter(e => e.isBreaking).length;
  const confirmedCount = filteredEvents.filter(e => e.trustLevel === 'confirmed').length;

  const maxDaily = Math.max(...dailyData, 1);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          <h1 className="text-lg font-bold text-white">لوحة الإحصائيات</h1>
          <span className="text-[10px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
            {filteredEvents.length} حدث
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Time range filter */}
          <div className="flex items-center bg-[#12121a] border border-gray-800 rounded-lg p-0.5">
            {(['24h', '7d', '30d', 'all'] as TimeRange[]).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-semibold transition-colors ${
                  timeRange === range
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                {range === '24h' ? '24 ساعة' : range === '7d' ? '7 أيام' : range === '30d' ? '30 يوم' : 'الكل'}
              </button>
            ))}
          </div>
          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value as EventCategory | 'all')}
            className="bg-[#12121a] border border-gray-800 rounded-lg px-3 py-1.5 text-[10px] text-gray-400 focus:outline-none focus:border-blue-500"
          >
            <option value="all">كل الفئات</option>
            <option value="military">عسكري</option>
            <option value="alert">إنذار</option>
            <option value="official">رسمي</option>
            <option value="airspace">أجواء</option>
            <option value="maritime">بحري</option>
            <option value="fire">حراري</option>
            <option value="humanitarian">إنساني</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="إجمالي الأحداث" value={filteredEvents.length} change={changePercent} icon={TrendingUp} color="#3b82f6" />
        <StatCard label="أحداث عاجلة" value={breakingCount} icon={AlertTriangle} color="#ef4444" />
        <StatCard label="أحداث مؤكدة" value={confirmedCount} icon={Shield} color="#22c55e" />
        <StatCard label="مواقع نشطة" value={topLocations.length} icon={MapPin} color="#f59e0b" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Daily Distribution */}
        <div className="lg:col-span-2 bg-[#12121a] border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              توزيع الأحداث {timeRange === '24h' ? 'بالساعات' : 'اليومي'}
            </h3>
            <span className="text-[10px] text-gray-500">{dailyData.length} {timeRange === '24h' ? 'ساعة' : 'يوم'}</span>
          </div>
          <MiniBarChart data={dailyData} maxVal={maxDaily} color="#3b82f6" />
          <div className="flex items-center justify-between mt-2 text-[9px] text-gray-600">
            <span>{timeRange === '24h' ? 'قبل 24 ساعة' : timeRange === '7d' ? 'قبل 7 أيام' : 'قبل 30 يوم'}</span>
            <span>الآن</span>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-[#12121a] border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-purple-400" />
            حسب الفئة
          </h3>
          <div className="space-y-2.5">
            {categoryBreakdown.map(cat => {
              const percent = filteredEvents.length > 0 ? (cat.count / filteredEvents.length) * 100 : 0;
              const CatIcon = cat.Icon;
              return (
                <div key={cat.category}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <CatIcon className="w-3 h-3" style={{ color: cat.color }} />
                      <span className="text-[10px] text-gray-400">{cat.label}</span>
                    </div>
                    <span className="text-[10px] font-bold text-white">{cat.count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Locations */}
      <div className="bg-[#12121a] border border-gray-800 rounded-xl p-4 mb-6">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
          <Globe2 className="w-4 h-4 text-green-400" />
          أكثر المواقع نشاطاً
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {topLocations.map((loc, idx) => (
            <div key={loc.name} className="flex items-center gap-2 p-2.5 bg-gray-800/30 rounded-lg">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                idx === 0 ? 'bg-red-500/20 text-red-400' : idx === 1 ? 'bg-orange-500/20 text-orange-400' : idx === 2 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-700/50 text-gray-400'
              }`}>
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold text-white truncate">{loc.name}</div>
                <div className="text-[9px] text-gray-500">{loc.count} حدث</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Timeline */}
      <div className="bg-[#12121a] border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-orange-400" />
          آخر الأحداث
        </h3>
        <div className="space-y-2">
          {filteredEvents.slice(0, 10).map(event => (
            <div key={event.id} className="flex items-start gap-3 p-2.5 hover:bg-gray-800/30 rounded-lg transition-colors">
              <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: categoryColor(event.category) }} />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold text-white truncate">{event.titleAr}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] text-gray-500">{event.location.nameAr}</span>
                  <span className="text-[9px] text-gray-600">•</span>
                  <span className="text-[9px] text-gray-500">
                    {formatDistanceToNow(event.timestamp, { addSuffix: true, locale: ar })}
                  </span>
                  {event.isBreaking && (
                    <span className="text-[8px] px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded-full font-bold">عاجل</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filteredEvents.length === 0 && (
            <div className="text-center py-8 text-gray-600 text-sm">لا توجد أحداث في هذه الفترة</div>
          )}
        </div>
      </div>
    </div>
  );
}
