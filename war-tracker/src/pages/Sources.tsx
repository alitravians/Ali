import { sources } from '../data/mockData';
import { timeAgo, sourceTypeAr } from '../utils/helpers';
import TrustBadge from '../components/shared/TrustBadge';
import { Globe2, Clock, ExternalLink, Wifi, WifiOff, BarChart3, Shield } from 'lucide-react';

export default function Sources() {
  const activeCount = sources.filter(s => s.isActive).length;
  const totalEvents = sources.reduce((sum, s) => sum + s.eventCount, 0);

  const typeGroups = ['official', 'media', 'humanitarian', 'technical', 'social'] as const;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <Globe2 className="w-5 h-5 text-blue-400" />
          المصادر
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl border border-gray-800 bg-[#12121a] p-4">
          <div className="text-xs text-gray-400 mb-1">إجمالي المصادر</div>
          <div className="text-2xl font-black text-white">{sources.length}</div>
        </div>
        <div className="rounded-xl border border-gray-800 bg-[#12121a] p-4">
          <div className="text-xs text-gray-400 mb-1">مصادر نشطة</div>
          <div className="text-2xl font-black text-green-400">{activeCount}</div>
        </div>
        <div className="rounded-xl border border-gray-800 bg-[#12121a] p-4">
          <div className="text-xs text-gray-400 mb-1">إجمالي الأخبار</div>
          <div className="text-2xl font-black text-blue-400">{totalEvents}</div>
        </div>
        <div className="rounded-xl border border-gray-800 bg-[#12121a] p-4">
          <div className="text-xs text-gray-400 mb-1">أنواع المصادر</div>
          <div className="text-2xl font-black text-purple-400">{typeGroups.length}</div>
        </div>
      </div>

      {/* Sources by type */}
      {typeGroups.map(type => {
        const typeSources = sources.filter(s => s.type === type);
        if (typeSources.length === 0) return null;

        return (
          <div key={type} className="mb-6">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              مصادر {sourceTypeAr(type)}
              <span className="text-[10px] text-gray-500 font-normal">({typeSources.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {typeSources.map(source => (
                <div
                  key={source.id}
                  className="rounded-xl border border-gray-800 bg-[#12121a] p-4 hover:border-gray-700 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white mb-0.5">{source.nameAr}</h3>
                      <span className="text-[11px] text-gray-500">{source.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {source.isActive ? (
                        <Wifi className="w-3.5 h-3.5 text-green-400" />
                      ) : (
                        <WifiOff className="w-3.5 h-3.5 text-red-400" />
                      )}
                      <span className={`text-[10px] font-semibold ${source.isActive ? 'text-green-400' : 'text-red-400'}`}>
                        {source.isActive ? 'نشط' : 'متوقف'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-500">مستوى الثقة:</span>
                      <TrustBadge level={source.trustLevel} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-500">النوع:</span>
                      <span className="text-[11px] text-gray-300 px-2 py-0.5 bg-gray-800 rounded-full">
                        {sourceTypeAr(source.type)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-500 flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" />
                        عدد الأخبار:
                      </span>
                      <span className="text-[11px] font-semibold text-white">{source.eventCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        آخر تحديث:
                      </span>
                      <span className="text-[11px] text-gray-400">{timeAgo(source.lastUpdate)}</span>
                    </div>
                  </div>

                  {source.url && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[11px] text-blue-400 hover:bg-blue-500/20 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      زيارة المصدر
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
