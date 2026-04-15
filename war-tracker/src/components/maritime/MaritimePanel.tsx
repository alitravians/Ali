import { useLiveData } from '../../context/LiveDataContext';
import { Ship, Anchor, Navigation, Gauge, ChevronDown, ChevronUp, Waves, Clock } from 'lucide-react';
import { useState } from 'react';

/** Format a timestamp to relative Arabic time (e.g. "منذ 2 دقيقة") */
function timeAgo(ts: string | Date | undefined): string {
  if (!ts) return '';
  const now = Date.now();
  const then = typeof ts === 'string' ? new Date(ts).getTime() : ts.getTime();
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
import type { VesselPosition, MaritimeZoneStats } from '../../types';

const ZONE_COLORS: Record<string, string> = {
  hormuz: '#f59e0b',
  red_sea: '#ef4444',
  suez: '#3b82f6',
};

const ZONE_ICONS: Record<string, string> = {
  hormuz: '🟡',
  red_sea: '🔴',
  suez: '🔵',
};

function ShipTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'tanker':
      return <span className="text-orange-400">🛢️</span>;
    case 'cargo':
      return <span className="text-blue-400">📦</span>;
    case 'military':
      return <span className="text-red-400">⚓</span>;
    case 'passenger':
      return <span className="text-green-400">🚢</span>;
    case 'fishing':
      return <span className="text-cyan-400">🎣</span>;
    default:
      return <span className="text-gray-400">🚢</span>;
  }
}

function ZoneCard({ zone }: { zone: MaritimeZoneStats }) {
  const [expanded, setExpanded] = useState(false);
  const color = ZONE_COLORS[zone.id] || '#6b7280';
  const icon = ZONE_ICONS[zone.id] || '⚪';

  return (
    <div className="rounded-xl border border-gray-800 bg-[#12121a] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
            style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
          >
            {icon}
          </div>
          <div className="text-right">
            <h3 className="text-sm font-bold text-white">{zone.nameAr}</h3>
            <span className="text-[10px] text-gray-500">{zone.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-left">
            <span className="text-lg font-black" style={{ color }}>{zone.vesselCount}</span>
            <span className="text-[10px] text-gray-500 block">سفينة</span>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-800 p-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-[#0a0a0f] p-2.5 text-center">
              <span className="text-orange-400 text-sm font-bold">{zone.tankerCount}</span>
              <span className="text-[9px] text-gray-500 block mt-0.5">ناقلات</span>
            </div>
            <div className="rounded-lg bg-[#0a0a0f] p-2.5 text-center">
              <span className="text-blue-400 text-sm font-bold">{zone.cargoCount}</span>
              <span className="text-[9px] text-gray-500 block mt-0.5">شحن</span>
            </div>
            <div className="rounded-lg bg-[#0a0a0f] p-2.5 text-center">
              <span className="text-red-400 text-sm font-bold">{zone.militaryCount}</span>
              <span className="text-[9px] text-gray-500 block mt-0.5">عسكري</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span className="flex items-center gap-1">
              <Gauge className="w-3 h-3" />
              متوسط السرعة
            </span>
            <span className="font-bold text-white">{zone.avgSpeed} عقدة</span>
          </div>
        </div>
      )}
    </div>
  );
}

function VesselRow({ vessel }: { vessel: VesselPosition }) {
  const lastSeen = timeAgo(vessel.timestamp);
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors border border-gray-800/50">
      <ShipTypeIcon type={vessel.shipType} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white truncate">{vessel.name || `MMSI: ${vessel.mmsi}`}</span>
          {vessel.flag && <span className="text-[10px] text-gray-500">{vessel.flag}</span>}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
          <span>{vessel.shipTypeAr}</span>
          <span>•</span>
          <span>{vessel.statusAr}</span>
          {vessel.destination && (
            <>
              <span>•</span>
              <span className="flex items-center gap-0.5">
                <Navigation className="w-2.5 h-2.5" />
                {vessel.destination}
              </span>
            </>
          )}
          {lastSeen && (
            <>
              <span>•</span>
              <span className="flex items-center gap-0.5 text-gray-600">
                <Clock className="w-2.5 h-2.5" />
                {lastSeen}
              </span>
            </>
          )}
        </div>
      </div>
      <div className="text-left flex-shrink-0">
        {vessel.speed !== undefined && vessel.speed !== null && (
          <span className="text-[11px] font-bold text-cyan-400">{vessel.speed.toFixed(1)} kn</span>
        )}
      </div>
    </div>
  );
}

export default function MaritimePanel() {
  const { vessels, maritimeZones } = useLiveData();
  const [showAllVessels, setShowAllVessels] = useState(false);

  const totalVessels = vessels.length;
  const displayVessels = showAllVessels ? vessels.slice(0, 50) : vessels.slice(0, 10);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Ship className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">البث المباشر البحري</h3>
            <span className="text-[10px] text-gray-500">تتبع السفن في الممرات المائية الحرجة</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {totalVessels > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full">
              <Waves className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-semibold text-cyan-400">{totalVessels} سفينة</span>
            </div>
          )}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
            totalVessels > 0
              ? 'bg-green-500/10 border border-green-500/30'
              : 'bg-yellow-500/10 border border-yellow-500/30'
          }`}>
            <span className={`w-2 h-2 rounded-full animate-pulse ${totalVessels > 0 ? 'bg-green-400' : 'bg-yellow-400'}`} />
            <span className={`text-[10px] font-semibold ${totalVessels > 0 ? 'text-green-400' : 'text-yellow-400'}`}>
              {totalVessels > 0 ? 'AIS مباشر' : 'جاري الاتصال...'}
            </span>
          </div>
        </div>
      </div>

      {/* Last update indicator */}
      {maritimeZones.length > 0 && (() => {
        const latestZone = maritimeZones.reduce((latest, z) => {
          if (!z.lastUpdate) return latest;
          const t = typeof z.lastUpdate === 'string' ? new Date(z.lastUpdate).getTime() : z.lastUpdate.getTime();
          return t > (latest || 0) ? t : latest;
        }, 0 as number);
        const ago = latestZone ? timeAgo(new Date(latestZone)) : '';
        return ago ? (
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <Clock className="w-3 h-3" />
            <span>آخر تحديث: {ago}</span>
          </div>
        ) : null;
      })()}

      {/* Zone Stats */}
      <div className="space-y-2">
        {maritimeZones.map(zone => (
          <ZoneCard key={zone.id} zone={zone} />
        ))}
      </div>

      {/* No data message */}
      {totalVessels === 0 && (
        <div className="rounded-xl border border-gray-800 bg-[#12121a] p-6 text-center">
          <Anchor className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-400">جاري الاتصال بنظام AIS...</p>
          <p className="text-[10px] text-gray-600 mt-1">بيانات السفن الحقيقية ستظهر قريباً</p>
        </div>
      )}

      {/* Vessel List */}
      {totalVessels > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Anchor className="w-3.5 h-3.5 text-cyan-400" />
              السفن المرصودة
            </h4>
            <span className="text-[10px] text-gray-500">{totalVessels} سفينة</span>
          </div>
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {displayVessels.map(vessel => (
              <VesselRow key={vessel.mmsi} vessel={vessel} />
            ))}
          </div>
          {totalVessels > 10 && (
            <button
              onClick={() => setShowAllVessels(!showAllVessels)}
              className="w-full mt-2 py-2 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              {showAllVessels ? 'عرض أقل' : `عرض الكل (${totalVessels})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
