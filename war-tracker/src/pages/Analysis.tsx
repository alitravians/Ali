import { useState, useEffect, useRef } from 'react';
import { useLiveData } from '../context/LiveDataContext';
import IndicatorCard from '../components/shared/IndicatorCard';
import { BarChart3, TrendingUp, Clock, AlertTriangle, ShieldCheck, Activity, Brain, RefreshCw, WifiOff, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, PieChart, Pie } from 'recharts';
import { categoryTextAr } from '../utils/helpers';
import type { AISummary } from '../types';

import { BACKEND_API_URL } from '../config/api';

/** Fetch with AbortController timeout. Chains caller-provided signals so manual aborts still work. */
function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const callerSignal = options.signal;
  if (callerSignal) {
    if (callerSignal.aborted) {
      controller.abort();
    } else {
      callerSignal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

export default function Analysis() {
  const { events, indicators } = useLiveData();
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [fetchingInitial, setFetchingInitial] = useState(true);
  const triggerAbort = useRef<AbortController | null>(null);

  // Fetch AI analysis from backend
  useEffect(() => {
    async function fetchAnalysis() {
      try {
        const resp = await fetchWithTimeout(`${BACKEND_API_URL}/api/analysis`, {}, 15000);
        if (resp.ok) {
          const data = await resp.json();
          if (data.summaries && data.summaries.length > 0) {
            const s = data.summaries[0];
            setAiSummary({
              ...s,
              timestamp: new Date(s.timestamp),
            });
          }
        }
      } catch {
        // Initial fetch failed — not critical, user can trigger manually
      }
      setFetchingInitial(false);
    }
    fetchAnalysis();
  }, []);

  const triggerAnalysis = async () => {
    // Cancel any in-flight trigger
    if (triggerAbort.current) triggerAbort.current.abort();
    triggerAbort.current = new AbortController();

    setLoadingAi(true);
    setAiError(null);
    try {
      const token = sessionStorage.getItem('warscope_admin_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const resp = await fetchWithTimeout(
        `${BACKEND_API_URL}/api/analysis/trigger`,
        { method: 'POST', headers, signal: triggerAbort.current.signal },
        30000,
      );
      if (resp.ok) {
        const data = await resp.json();
        if (data && !data.error) {
          setAiSummary({
            ...data,
            timestamp: new Date(data.timestamp),
          });
          setAiError(null);
        } else {
          setAiError(data?.error || 'لا توجد أحداث كافية للتحليل');
        }
      } else if (resp.status === 429) {
        const errData = await resp.json().catch(() => null);
        setAiError(errData?.detail || 'يرجى الانتظار قبل طلب تحليل جديد');
      } else if (resp.status === 401) {
        setAiError('يتطلب تسجيل دخول المسؤول لتشغيل التحليل');
      } else {
        setAiError('فشل الاتصال بخادم التحليل — حاول مرة أخرى');
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // Request was cancelled by user clicking again — ignore
      } else {
        setAiError('تعذر الاتصال بالخادم — تحقق من اتصال الإنترنت وحاول مرة أخرى');
      }
    }
    setLoadingAi(false);
  };

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

  // Hourly activity from real events
  const hourlyData: { hour: string; count: number }[] = [];
  const now = new Date();
  for (let h = 0; h < 24; h += 2) {
    const hourLabel = `${String(h).padStart(2, '0')}:00`;
    const count = events.filter(e => {
      const diff = (now.getTime() - e.timestamp.getTime()) / 3600000;
      return diff >= (23 - h) && diff < (25 - h);
    }).length;
    hourlyData.push({ hour: hourLabel, count });
  }

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
        <div className="text-[11px] text-gray-400 flex items-center gap-1">
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
          <span className="text-2xl font-black text-orange-400">
            {breakingCount > 5 ? 'حرج' : breakingCount > 2 ? 'مرتفع' : breakingCount > 0 ? 'متوسط' : 'منخفض'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* AI Summary — Real from backend */}
        <div className="rounded-xl border border-gray-800 bg-[#12121a] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              تحليل الذكاء الاصطناعي
            </h3>
            <button
              onClick={triggerAnalysis}
              disabled={loadingAi}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/15 border border-purple-500/30 rounded-lg text-[11px] text-purple-400 hover:bg-purple-500/25 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingAi ? 'animate-spin' : ''}`} />
              {loadingAi ? 'جاري التحليل...' : 'تحليل جديد'}
            </button>
          </div>

          {/* Error banner */}
          {aiError && (
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
              {aiError.includes('الاتصال') || aiError.includes('الخادم') ? (
                <WifiOff className="w-4 h-4 text-red-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <p className="text-[11px] text-red-300">{aiError}</p>
            </div>
          )}

          {/* Loading state for initial fetch */}
          {fetchingInitial && !aiSummary ? (
            <div className="text-center py-8 text-gray-400">
              <RefreshCw className="w-8 h-8 mx-auto mb-3 opacity-30 animate-spin" />
              <p className="text-xs">جاري تحميل آخر تحليل...</p>
            </div>
          ) : aiSummary ? (
            <div className="space-y-3">
              {aiSummary.whatHappenedAr && (
                <div>
                  <h4 className="text-[11px] font-semibold text-blue-400 mb-1">ماذا حدث؟</h4>
                  <p className="text-xs text-gray-300 leading-relaxed">{aiSummary.whatHappenedAr}</p>
                </div>
              )}
              {aiSummary.whatsNewAr && (
                <div>
                  <h4 className="text-[11px] font-semibold text-green-400 mb-1">ما الجديد؟</h4>
                  <p className="text-xs text-gray-300 leading-relaxed">{aiSummary.whatsNewAr}</p>
                </div>
              )}
              {aiSummary.isEscalation && aiSummary.escalationDetailsAr && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <h4 className="text-[11px] font-semibold text-red-400 mb-1">تصعيد مرصود</h4>
                  <p className="text-xs text-red-300 leading-relaxed">{aiSummary.escalationDetailsAr}</p>
                </div>
              )}
              {aiSummary.hotspotsAr && aiSummary.hotspotsAr.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold text-orange-400 mb-1">المناطق الساخنة</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {aiSummary.hotspotsAr.map((h: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded-full text-[10px] text-orange-300">{h}</span>
                    ))}
                  </div>
                </div>
              )}
              {aiSummary.confirmedOnlyAr && aiSummary.confirmedOnlyAr.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold text-green-400 mb-1">أحداث مؤكدة فقط</h4>
                  <ul className="space-y-1">
                    {aiSummary.confirmedOnlyAr.map((c: string, i: number) => (
                      <li key={i} className="text-[11px] text-gray-400 flex items-start gap-1.5">
                        <ShieldCheck className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Brain className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-xs">لا يوجد تحليل ذكاء اصطناعي حالياً</p>
              <p className="text-[10px] mt-1 text-gray-600">اضغط "تحليل جديد" لإنشاء تحليل من الأحداث الحالية</p>
            </div>
          )}
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
              {events.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
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
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                  جاري تحميل البيانات...
                </div>
              )}
            </div>
          </div>

          {/* Category & Trust Distribution */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-gray-800 bg-[#12121a] p-4">
              <h3 className="text-[11px] font-bold text-white mb-2">توزيع الأحداث حسب النوع</h3>
              <div className="h-[160px]">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
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
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-[10px]">لا توجد بيانات</div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-gray-800 bg-[#12121a] p-4">
              <h3 className="text-[11px] font-bold text-white mb-2">توزيع مستوى الثقة</h3>
              <div className="h-[160px]">
                {events.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
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
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-[10px]">لا توجد بيانات</div>
                )}
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
        {indicators.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {indicators.map(ind => (
              <div key={ind.id} className="min-w-0">
                <IndicatorCard indicator={ind} size="lg" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 text-xs">
            جاري تحميل المؤشرات من الخادم...
          </div>
        )}
      </div>
    </div>
  );
}
