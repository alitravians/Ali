import { aiSummary } from '../data/mockData';
import { useLiveData } from '../context/LiveDataContext';
import AISummaryComponent from '../components/ai/AISummary';
import IndicatorCard from '../components/shared/IndicatorCard';
import { BarChart3, TrendingUp, Clock, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, PieChart, Pie } from 'recharts';
import { categoryTextAr } from '../utils/helpers';

export default function Analysis() {
  const { events, indicators } = useLiveData();

  // Category distribution data
  const categoryCount: Record<string, number> = {};
  events.forEach(e => {
    const label = categoryTextAr(e.category);
    categoryCount[label] = (categoryCount[label] || 0) + 1;
  });
  const categoryData = Object.entries(categoryCount).map(([name, value]) => ({ name, value }));

  // Trust level distribution
  const trustCount: Record<string, number> = { 'مؤكد': 0, 'مرجّح': 0, 'قيد التحقق': 0, 'غير مؤكد': 0 };
  events.forEach(e => {
    if (e.trustLevel === 'confirmed') trustCount['مؤكد']++;
    else if (e.trustLevel === 'high') trustCount['مرجّح']++;
    else if (e.trustLevel === 'medium') trustCount['قيد التحقق']++;
    else trustCount['غير مؤكد']++;
  });
  const trustData = Object.entries(trustCount).map(([name, value]) => ({ name, value }));
  const trustColors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];

  // Hourly activity (mock)
  const hourlyData = [
    { hour: '00:00', count: 2 }, { hour: '02:00', count: 1 }, { hour: '04:00', count: 3 },
    { hour: '06:00', count: 5 }, { hour: '08:00', count: 8 }, { hour: '10:00', count: 12 },
    { hour: '12:00', count: 15 }, { hour: '14:00', count: 18 }, { hour: '16:00', count: 22 },
    { hour: '18:00', count: 28 }, { hour: '20:00', count: 35 }, { hour: '22:00', count: 30 },
  ];

  const confirmedCount = events.filter(e => e.trustLevel === 'confirmed').length;
  const breakingCount = events.filter(e => e.isBreaking).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          التحليلات والتقييمات
        </h1>
        <div className="text-[11px] text-gray-500 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          آخر تحديث: {new Date().toLocaleString('ar-SA')}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl border border-gray-800 bg-[#12121a] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-400">إجمالي الأحداث</span>
          </div>
          <span className="text-2xl font-black text-white">{events.length}</span>
        </div>
        <div className="rounded-xl border border-gray-800 bg-[#12121a] p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-xs text-gray-400">أحداث عاجلة</span>
          </div>
          <span className="text-2xl font-black text-red-400">{breakingCount}</span>
        </div>
        <div className="rounded-xl border border-gray-800 bg-[#12121a] p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400">أحداث مؤكدة</span>
          </div>
          <span className="text-2xl font-black text-green-400">{confirmedCount}</span>
        </div>
        <div className="rounded-xl border border-gray-800 bg-[#12121a] p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-gray-400">مستوى التصعيد</span>
          </div>
          <span className="text-2xl font-black text-orange-400">مرتفع</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* AI Summary */}
        <div className="rounded-xl border border-gray-800 bg-[#12121a] p-5">
          <AISummaryComponent summary={aiSummary} />
        </div>

        {/* Charts */}
        <div className="space-y-4">
          {/* Hourly Activity */}
          <div className="rounded-xl border border-gray-800 bg-[#12121a] p-4">
            <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-400" />
              النشاط خلال 24 ساعة
            </h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData}>
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a25', border: '1px solid #30303d', borderRadius: '8px', fontSize: '11px' }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {hourlyData.map((entry, index) => (
                      <Cell key={index} fill={entry.count > 20 ? '#ef4444' : entry.count > 10 ? '#f59e0b' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category & Trust Distribution */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-gray-800 bg-[#12121a] p-4">
              <h3 className="text-[11px] font-bold text-white mb-2">توزيع الأحداث حسب النوع</h3>
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={55}
                      dataKey="value"
                      label={({ name }) => name}
                      fontSize={9}
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={index} fill={['#ef4444', '#f59e0b', '#3b82f6', '#f97316', '#a855f7', '#22c55e', '#dc2626'][index % 7]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a25', border: '1px solid #30303d', borderRadius: '8px', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-gray-800 bg-[#12121a] p-4">
              <h3 className="text-[11px] font-bold text-white mb-2">توزيع مستوى الثقة</h3>
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={trustData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={55}
                      dataKey="value"
                      label={({ name }) => name}
                      fontSize={9}
                    >
                      {trustData.map((_, index) => (
                        <Cell key={index} fill={trustColors[index]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a25', border: '1px solid #30303d', borderRadius: '8px', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Indicators detailed */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          المؤشرات التفصيلية
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {indicators.map(ind => (
            <IndicatorCard key={ind.id} indicator={ind} size="lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
