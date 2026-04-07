import { useLiveData } from '../context/LiveDataContext';
import { timeAgo } from '../utils/helpers';
import { Globe2, Clock, Wifi, WifiOff, BarChart3, Shield, AlertTriangle } from 'lucide-react';

const SOURCE_META: Record<string, { nameAr: string; type: string; url?: string }> = {
  gdelt: { nameAr: 'GDELT — رصد الأحداث العالمية', type: 'technical', url: 'https://gdeltproject.org' },
  newsapi: { nameAr: 'NewsAPI — رويترز، بي بي سي، الجزيرة', type: 'media', url: 'https://newsapi.org' },
  opensky: { nameAr: 'OpenSky — تتبع الطائرات', type: 'technical', url: 'https://opensky-network.org' },
  gemini: { nameAr: 'Google Gemini — تحليل ذكي', type: 'technical', url: 'https://ai.google.dev' },
  mediastack: { nameAr: 'MediaStack — مصادر إخبارية', type: 'media', url: 'https://mediastack.com' },
  acled: { nameAr: 'ACLED — بيانات النزاعات', type: 'technical', url: 'https://acleddata.com' },
};

function sourceTypeAr(type: string): string {
  switch (type) {
    case 'official': return 'رسمي';
    case 'media': return 'إعلامي';
    case 'humanitarian': return 'إنساني';
    case 'technical': return 'تقني';
    case 'social': return 'اجتماعي';
    default: return type;
  }
}

export default function Sources() {
  const { sourceStatus, connectionStatus } = useLiveData();

  const sourceEntries = Object.entries(sourceStatus);
  const activeCount = sourceEntries.filter(([, s]) => s.active).length;
  const totalEvents = sourceEntries.reduce((sum, [, s]) => sum + s.eventCount, 0);
  const totalErrors = sourceEntries.reduce((sum, [, s]) => sum + s.errors, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <Globe2 className="w-5 h-5 text-blue-400" />
          المصادر
        </h1>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${
            connectionStatus === 'connected' ? 'bg-green-500/10 border border-green-500/30 text-green-400' :
            connectionStatus === 'connecting' ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400' :
            'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' :
              connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
              'bg-red-500'
            }`} />
            {connectionStatus === 'connected' ? 'متصل بالخادم' :
             connectionStatus === 'connecting' ? 'جاري الاتصال...' :
             'غير متصل'}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl border border-gray-800 bg-[#12121a] p-4">
          <div className="text-xs text-gray-400 mb-1">إجمالي المصادر</div>
          <div className="text-2xl font-black text-white">{sourceEntries.length}</div>
        </div>
        <div className="rounded-xl border border-gray-800 bg-[#12121a] p-4">
          <div className="text-xs text-gray-400 mb-1">مصادر نشطة</div>
          <div className="text-2xl font-black text-green-400">{activeCount}</div>
        </div>
        <div className="rounded-xl border border-gray-800 bg-[#12121a] p-4">
          <div className="text-xs text-gray-400 mb-1">إجمالي الأخبار المجمّعة</div>
          <div className="text-2xl font-black text-blue-400">{totalEvents}</div>
        </div>
        <div className="rounded-xl border border-gray-800 bg-[#12121a] p-4">
          <div className="text-xs text-gray-400 mb-1">أخطاء</div>
          <div className={`text-2xl font-black ${totalErrors > 0 ? 'text-red-400' : 'text-green-400'}`}>{totalErrors}</div>
        </div>
      </div>

      {/* No data state */}
      {sourceEntries.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <Globe2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-sm">جاري تحميل بيانات المصادر من الخادم...</p>
          <p className="text-xs mt-2">يتم جلب البيانات من مصادر حقيقية فقط</p>
        </div>
      )}

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {sourceEntries.map(([key, status]) => {
          const meta = SOURCE_META[key] || { nameAr: key, type: 'technical' };
          return (
            <div
              key={key}
              className="rounded-xl border border-gray-800 bg-[#12121a] p-4 hover:border-gray-700 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-white mb-0.5">{meta.nameAr}</h3>
                  <span className="text-[11px] text-gray-500">{key.toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {status.active ? (
                    <Wifi className="w-3.5 h-3.5 text-green-400" />
                  ) : (
                    <WifiOff className="w-3.5 h-3.5 text-red-400" />
                  )}
                  <span className={`text-[10px] font-semibold ${status.active ? 'text-green-400' : 'text-red-400'}`}>
                    {status.active ? 'نشط' : 'غير مفعّل'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-500">النوع:</span>
                  <span className="text-[11px] text-gray-300 px-2 py-0.5 bg-gray-800 rounded-full">
                    {sourceTypeAr(meta.type)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-500 flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" />
                    أخبار تم جلبها:
                  </span>
                  <span className="text-[11px] font-semibold text-white">{status.eventCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    آخر تحديث:
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {status.lastUpdate ? timeAgo(new Date(status.lastUpdate)) : 'لم يتم التحديث بعد'}
                  </span>
                </div>
                {status.errors > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-red-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      أخطاء:
                    </span>
                    <span className="text-[11px] font-semibold text-red-400">{status.errors}</span>
                  </div>
                )}
              </div>

              {meta.url && (
                <a
                  href={meta.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[11px] text-blue-400 hover:bg-blue-500/20 transition-colors"
                >
                  <Shield className="w-3 h-3" />
                  زيارة المصدر
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
