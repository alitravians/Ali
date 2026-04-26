import { lazy, Suspense, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Radio, Map, Bell, ArrowLeft, Zap, Eye, Brain, TrendingUp, BarChart3, Download } from 'lucide-react';
import { useLiveData } from '../context/LiveDataContext';
import IndicatorCard from '../components/shared/IndicatorCard';
import EventCard from '../components/shared/EventCard';

// Lazy-load the map — it pulls in Leaflet (152KB) + map tiles
// Deferring it dramatically improves FCP and LCP on the homepage
const LiveMap = lazy(() => import('../components/map/LiveMap'));

// Defer map rendering until after first paint — prevents Leaflet from blocking LCP
function LazyMap({ events }: { events: import('../types').TrackerEvent[] }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // Wait for idle callback or 200ms, whichever comes first
    const id = typeof requestIdleCallback !== 'undefined'
      ? requestIdleCallback(() => setReady(true), { timeout: 200 })
      : setTimeout(() => setReady(true), 100);
    return () => {
      if (typeof cancelIdleCallback !== 'undefined') cancelIdleCallback(id as number);
      else clearTimeout(id as ReturnType<typeof setTimeout>);
    };
  }, []);
  if (!ready) return (
    <div className="w-full rounded-xl bg-gray-900/50 border border-gray-800 flex items-center justify-center" style={{ height: 'min(400px, 50vh)' }}>
      <div className="text-center">
        <Map className="w-8 h-8 text-blue-400/50 mx-auto mb-2 animate-pulse" />
        <span className="text-xs text-gray-400">جاري تحميل الخريطة...</span>
      </div>
    </div>
  );
  return <LiveMap events={events} height="min(400px, 50vh)" showControls={false} />;
}

export default function Home() {
  const { events, indicators, alerts } = useLiveData();
  // Show breaking events first, then fall back to recent events
  const breakingEvents = events.filter(e => e.isBreaking).slice(0, 4);
  const recentEvents = breakingEvents.length > 0
    ? breakingEvents
    : [...events].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 4);
  const unreadAlerts = alerts.filter(a => !a.isRead).length;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-900/10 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_70%)]" />

        <div className="relative max-w-7xl mx-auto px-3 sm:px-4 py-8 sm:py-12 md:py-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full mb-4">
              <span className="w-2 h-2 rounded-full bg-red-500 pulse-dot" />
              <span className="text-xs font-semibold text-red-400">تتبع مباشر • LIVE</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-3 sm:mb-4 leading-tight">
              مركز التتبع المباشر
              <br />
              <span className="bg-gradient-to-l from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                حرب إيران وإسرائيل
              </span>
            </h1>

            <p className="text-xs sm:text-sm md:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed mb-4 sm:mb-6 px-2 sm:px-0">
              منصة تحليل وتتبع مباشر للأحداث لحظة بلحظة، مع خريطة تفاعلية وتحليلات ذكية
              بالذكاء الاصطناعي وتنظيم احترافي للأحداث
            </p>

            <Link
              to="/live"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-l from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-red-500/20 hover:shadow-red-500/40"
            >
              <Radio className="w-4 h-4" />
              ادخل الوضع المباشر
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>

          {/* Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 mb-8 pm-grid-2 overflow-hidden">
            {indicators.map(ind => (
              <div key={ind.id} className="min-w-0">
                <IndicatorCard indicator={ind} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Map Preview + Breaking Events */}
      <section className="max-w-7xl mx-auto px-3 sm:px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pm-grid-single">
          {/* Map */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Map className="w-4 h-4 text-blue-400" />
                الخريطة المباشرة
              </h2>
              <Link to="/live" className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1">
                عرض كامل <ArrowLeft className="w-3 h-3" />
              </Link>
            </div>
            <Suspense fallback={
              <div className="w-full rounded-xl bg-gray-900/50 border border-gray-800 flex items-center justify-center" style={{ height: 'min(400px, 50vh)' }}>
                <div className="text-center">
                  <Map className="w-8 h-8 text-blue-400/50 mx-auto mb-2 animate-pulse" />
                  <span className="text-xs text-gray-400">جاري تحميل الخريطة...</span>
                </div>
              </div>
            }>
              <LazyMap events={events} />
            </Suspense>
          </div>

          {/* Breaking Events */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-red-400" />
                {breakingEvents.length > 0 ? 'أهم الأحداث الآن' : 'آخر الأحداث'}
              </h2>
              {unreadAlerts > 0 && (
                <Link to="/alerts" className="flex items-center gap-1 px-2 py-0.5 bg-red-500/15 border border-red-500/30 rounded-full">
                  <Bell className="w-3 h-3 text-red-400" />
                  <span className="text-[10px] font-bold text-red-400">{unreadAlerts}</span>
                </Link>
              )}
            </div>
            <div className="space-y-3">
              {recentEvents.length > 0 ? (
                recentEvents.map(event => (
                  <EventCard key={event.id} event={event} compact />
                ))
              ) : (
                <div className="text-center py-8 text-gray-400 text-xs">جاري تحميل الأحداث...</div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-3 sm:px-4 pb-12">
        <h2 className="text-base sm:text-lg font-bold text-white text-center mb-6 sm:mb-8">مزايا المنصة</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pm-grid-2">
          {[
            { icon: Radio, title: 'تتبع مباشر', desc: 'تحديثات فورية لحظة بلحظة بدون تحديث الصفحة', color: 'red' },
            { icon: Brain, title: 'تحليلات AI', desc: 'تحليلات ذكية بالذكاء الاصطناعي مع كشف التضارب', color: 'purple' },
            { icon: Eye, title: 'تقييم الثقة', desc: 'تمييز دقيق بين الأخبار المؤكدة وغير المؤكدة', color: 'green' },
            { icon: TrendingUp, title: 'مؤشرات حية', desc: 'مؤشرات ديناميكية لحالة الوضع العام', color: 'blue' },
            { icon: BarChart3, title: 'إحصائيات متقدمة', desc: 'رسوم بيانية وتحليل توزيع الأحداث حسب التصنيف والموقع', color: 'cyan', link: '/analytics' },
            { icon: Download, title: 'تصدير البيانات', desc: 'تصدير الأحداث بصيغة CSV للباحثين والمحللين', color: 'emerald', link: '/analytics' },
          ].map((feat, i) => {
            const Icon = feat.icon;
            const content = (
              <>
                <div className={`w-10 h-10 rounded-xl bg-${feat.color}-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-5 h-5 text-${feat.color}-400`} />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">{feat.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{feat.desc}</p>
              </>
            );
            const cls = "rounded-xl border border-gray-800 bg-[#12121a] p-4 sm:p-5 hover:border-gray-700 transition-all group cursor-pointer block";
            return 'link' in feat && feat.link ? (
              <Link key={i} to={feat.link} className={cls}>{content}</Link>
            ) : (
              <div key={i} className={cls}>{content}</div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
