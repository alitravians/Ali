import { useLiveData } from '../../context/LiveDataContext';
import { useState } from 'react';
import { Shield, AlertTriangle, Anchor, Ship, ChevronDown, ChevronUp, Crosshair, Gauge, Clock, Newspaper } from 'lucide-react';
import { decodeHtmlEntities } from '../../utils/helpers';

const THREAT_CONFIG = {
  low: {
    color: '#22c55e',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    label: 'منخفض',
    icon: '🟢',
    pulse: false,
  },
  medium: {
    color: '#f59e0b',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    label: 'متوسط',
    icon: '🟡',
    pulse: false,
  },
  high: {
    color: '#f97316',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    label: 'عالي',
    icon: '🟠',
    pulse: true,
  },
  critical: {
    color: '#ef4444',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    label: 'حرج',
    icon: '🔴',
    pulse: true,
  },
};

function timeAgo(ts: string | undefined): string {
  if (!ts) return '';
  const now = Date.now();
  const then = new Date(ts).getTime();
  if (isNaN(then)) return '';
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return 'الآن';
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) {
    if (mins === 1) return 'منذ دقيقة';
    if (mins === 2) return 'منذ دقيقتين';
    if (mins <= 10) return `منذ ${mins} دقائق`;
    return `منذ ${mins} دقيقة`;
  }
  const hrs = Math.floor(mins / 60);
  if (hrs === 1) return 'منذ ساعة';
  if (hrs === 2) return 'منذ ساعتين';
  if (hrs <= 10) return `منذ ${hrs} ساعات`;
  return `منذ ${hrs} ساعة`;
}

export default function HormuzBlockadeMonitor() {
  const { hormuzBlockade } = useLiveData();
  const [expanded, setExpanded] = useState(false);
  const [showMilitary, setShowMilitary] = useState(false);

  if (!hormuzBlockade) {
    return (
      <div className="rounded-xl border border-gray-800 bg-[#12121a] p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">مراقب حصار هرمز</h3>
            <span className="text-[10px] text-gray-400">جاري تحميل البيانات...</span>
          </div>
        </div>
      </div>
    );
  }

  const threat = THREAT_CONFIG[hormuzBlockade.threatLevel] || THREAT_CONFIG.low;
  const isEstimated = hormuzBlockade.dataSource === 'estimated';

  return (
    <div className="rounded-xl border border-gray-800 bg-[#12121a] overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center relative"
              style={{ backgroundColor: `${threat.color}15`, border: `1px solid ${threat.color}40` }}
            >
              <Shield className="w-5 h-5" style={{ color: threat.color }} />
              {threat.pulse && !isEstimated && (
                <span
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse"
                  style={{ backgroundColor: threat.color }}
                />
              )}
            </div>
            <div className="text-right">
              <h3 className="text-sm font-bold text-white">مراقب حصار هرمز</h3>
              <span className="text-[10px] text-gray-400">المواجهة الأمريكية-الإيرانية — مضيق هرمز</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isEstimated && (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/40"
                title="بث AIS المباشر غير متوفر — التقييم تقديري"
              >
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] font-bold text-amber-400">
                  {hormuzBlockade.dataSourceAr || 'تقديري'}
                </span>
              </div>
            )}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${threat.bg} border ${threat.border}`}>
              <span className="text-xs">{threat.icon}</span>
              <span className="text-[10px] font-bold" style={{ color: threat.color }}>
                {threat.label}
              </span>
            </div>
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </div>
        </div>

        {/* Estimated-data disclaimer — shown only when backend is on fallback */}
        {isEstimated && (
          <div className="mt-3 text-right text-[11px] font-medium px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300">
            تنبيه: بث AIS المباشر غير متوفر حالياً. البيانات المعروضة تقديرية
            مبنية على أنماط حركة ملاحية معتادة، وليست تحديثات استخباراتية في الوقت الفعلي.
          </div>
        )}

        {/* Status message — always visible */}
        <div
          className="mt-3 text-right text-[11px] font-medium px-3 py-2 rounded-lg"
          style={{ backgroundColor: `${threat.color}10`, color: threat.color }}
        >
          {hormuzBlockade.statusMessage}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-800 p-4 space-y-4">
          {/* Quick stats grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-[#0a0a0f] p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Ship className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-lg font-black text-cyan-400">{hormuzBlockade.totalVesselsInZone}</span>
              </div>
              <span className="text-[9px] text-gray-500">سفينة في المضيق</span>
            </div>
            <div className="rounded-lg bg-[#0a0a0f] p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Crosshair className="w-3.5 h-3.5 text-red-400" />
                <span className="text-lg font-black text-red-400">{hormuzBlockade.militaryVesselCount}</span>
              </div>
              <span className="text-[9px] text-gray-500">سفينة عسكرية</span>
            </div>
            <div className="rounded-lg bg-[#0a0a0f] p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Anchor className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-lg font-black text-yellow-400">{hormuzBlockade.blockedTankers}</span>
              </div>
              <span className="text-[9px] text-gray-500">ناقلات محتجزة</span>
            </div>
          </div>

          {/* US vs Iran naval presence */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-[#0a0a0f] p-3 border border-blue-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">🇺🇸</span>
                <span className="text-lg font-black text-blue-400">{hormuzBlockade.usNavyCount}</span>
              </div>
              <span className="text-[9px] text-gray-500">البحرية الأمريكية</span>
              <div className="mt-1.5 w-full h-1 rounded-full bg-gray-800">
                <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${Math.min(100, hormuzBlockade.usNavyCount * 25)}%` }} />
              </div>
            </div>
            <div className="rounded-lg bg-[#0a0a0f] p-3 border border-emerald-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">🇮🇷</span>
                <span className="text-lg font-black text-emerald-400">{hormuzBlockade.iranNavyCount || 0}</span>
              </div>
              <span className="text-[9px] text-gray-500">البحرية الإيرانية / الحرس الثوري</span>
              <div className="mt-1.5 w-full h-1 rounded-full bg-gray-800">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.min(100, (hormuzBlockade.iranNavyCount || 0) * 25)}%` }} />
              </div>
            </div>
          </div>

          {/* Tanker traffic info */}
          <div className="rounded-lg bg-[#0a0a0f] p-3 space-y-2">
            <h4 className="text-[11px] font-bold text-white flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-orange-400" />
              حركة الناقلات
            </h4>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-400">إجمالي الناقلات</span>
              <span className="font-bold text-orange-400">{hormuzBlockade.tankerCount}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-400">ناقلات محتجزة / راسية</span>
              <span className="font-bold text-yellow-400">{hormuzBlockade.blockedTankers}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-400">متوسط سرعة العبور</span>
              <span className="font-bold text-cyan-400">{hormuzBlockade.avgTransitSpeed} عقدة</span>
            </div>
            {hormuzBlockade.tankerCount > 0 && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                  <span>نسبة الاحتجاز</span>
                  <span>{Math.round((hormuzBlockade.blockedTankers / hormuzBlockade.tankerCount) * 100)}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.round((hormuzBlockade.blockedTankers / hormuzBlockade.tankerCount) * 100)}%`,
                      backgroundColor: hormuzBlockade.blockedTankers / hormuzBlockade.tankerCount > 0.5 ? '#ef4444' : '#f59e0b',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Military vessels detail */}
          {hormuzBlockade.militaryVessels.length > 0 && (
            <div>
              <button
                onClick={(e) => { e.stopPropagation(); setShowMilitary(!showMilitary); }}
                className="w-full flex items-center justify-between text-[11px] font-bold text-white mb-2"
              >
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  القطع العسكرية المرصودة ({hormuzBlockade.militaryVessels.length})
                </span>
                {showMilitary ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />}
              </button>
              {showMilitary && (
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                  {hormuzBlockade.militaryVessels.map((mv) => (
                    <div
                      key={mv.mmsi}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${
                        mv.isUS
                          ? 'bg-blue-500/5 border-blue-500/20'
                          : mv.isIran
                          ? 'bg-emerald-500/5 border-emerald-500/20'
                          : mv.isAllied
                          ? 'bg-orange-500/5 border-orange-500/20'
                          : 'bg-gray-800/50 border-gray-800'
                      }`}
                    >
                      <span className="text-sm">{mv.flag || '⚓'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-white truncate">{mv.name}</span>
                          {mv.isUS && <span className="text-[8px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">US NAVY</span>}
                          {mv.isIran && <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">إيران</span>}
                          {mv.isAllied && !mv.isUS && <span className="text-[8px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-bold">NATO</span>}
                        </div>
                        <div className="flex items-center gap-2 text-[9px] text-gray-500 mt-0.5">
                          <span>{mv.statusAr}</span>
                          {mv.speed !== null && <span>• {mv.speed.toFixed(1)} عقدة</span>}
                          <span>• {timeAgo(mv.lastSeen)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Related news */}
          {hormuzBlockade.relatedNews.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold text-white flex items-center gap-1.5 mb-2">
                <Newspaper className="w-3.5 h-3.5 text-blue-400" />
                أخبار ذات صلة بالحصار
              </h4>
              <div className="space-y-1.5">
                {hormuzBlockade.relatedNews.map((news) => (
                  <div key={news.id} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[#0a0a0f] border border-gray-800/50">
                    <span className="text-[10px] mt-0.5">📰</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-gray-300 leading-relaxed line-clamp-2">{decodeHtmlEntities(news.title)}</p>
                      <div className="flex items-center gap-2 mt-1 text-[9px] text-gray-600">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{timeAgo(news.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Last update */}
          {hormuzBlockade.lastUpdate && (
            <div className="flex items-center justify-center gap-1.5 text-[9px] text-gray-600 pt-2 border-t border-gray-800">
              <Clock className="w-3 h-3" />
              <span>آخر تحديث: {timeAgo(hormuzBlockade.lastUpdate)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
