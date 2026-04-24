import { useState } from 'react';
import { Search, Clock, CheckCircle2 } from 'lucide-react';
import { timeAgo } from '../../utils/helpers';
import TrustBadge from '../shared/TrustBadge';
import { SectionHeader } from './AdminUI';
import type { TrackerEvent } from '../../types';

const categoryAr: Record<string, string> = {
  military: 'عسكري', alert: 'تنبيه', official: 'رسمي',
  airspace: 'أجواء', maritime: 'بحري', fire: 'حريق', humanitarian: 'إنساني',
};

export default function EventsSection({ pendingReviewEvents, allEvents }: {
  pendingReviewEvents: TrackerEvent[];
  allEvents: TrackerEvent[];
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  const displayEvents = filter === 'pending' ? pendingReviewEvents : allEvents;
  const filtered = displayEvents.filter(e =>
    !searchQuery ||
    e.titleAr.includes(searchQuery) ||
    e.descriptionAr.includes(searchQuery) ||
    e.location.nameAr.includes(searchQuery)
  );

  return (
    <div>
      <SectionHeader
        title="مراجعة الأحداث"
        description="عرض الأحداث الواردة من المصادر وحالة تصنيفها"
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-[#0a0a0f] rounded-lg border border-gray-800 overflow-hidden">
              <button
                onClick={() => setFilter('pending')}
                className={`px-3 py-1.5 text-[11px] font-medium transition-colors ${filter === 'pending' ? 'bg-yellow-500/15 text-yellow-400' : 'text-gray-400 hover:text-gray-300'}`}
              >
                بانتظار المراجعة ({pendingReviewEvents.length})
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 text-[11px] font-medium transition-colors ${filter === 'all' ? 'bg-blue-500/15 text-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
              >
                الكل ({allEvents.length})
              </button>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="بحث بالعنوان أو الموقع..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-[#0a0a0f] border border-gray-700 rounded-lg pr-8 pl-3 py-1.5 text-xs text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none w-full sm:w-48"
              />
            </div>
          </div>
        }
      />

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-[#12121a] p-12 text-center">
          <CheckCircle2 className="w-10 h-10 text-green-400/30 mx-auto mb-3" />
          <p className="text-sm text-gray-400">
            {filter === 'pending' ? 'لا توجد أحداث بانتظار المراجعة' : 'لا توجد أحداث مطابقة للبحث'}
          </p>
          {filter === 'pending' && (
            <p className="text-[10px] text-gray-600 mt-1">جميع الأحداث تم تصنيفها تلقائياً عبر نظام الثقة</p>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-800 bg-[#12121a] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-800 bg-[#0a0a0f]">
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">الحدث</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium hidden sm:table-cell">التصنيف</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">الثقة</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium hidden md:table-cell">الموقع</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">الوقت</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium hidden lg:table-cell">المصادر</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 50).map(event => (
                  <tr key={event.id} className="border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 max-w-[200px]">
                      <div className="font-semibold text-white truncate">{event.titleAr}</div>
                      <div className="text-[10px] text-gray-600 mt-0.5 truncate">{event.descriptionAr}</div>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <span className="px-2 py-0.5 bg-gray-800 rounded-full text-gray-300">
                        {categoryAr[event.category] || event.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <TrustBadge level={event.trustLevel} />
                    </td>
                    <td className="py-3 px-4 text-gray-400 hidden md:table-cell">
                      {event.location.nameAr}
                    </td>
                    <td className="py-3 px-4 text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeAgo(event.timestamp)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400 hidden lg:table-cell">
                      {event.sources.length} مصدر
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length > 50 && (
            <div className="px-4 py-2 text-center text-[10px] text-gray-600 border-t border-gray-800">
              يعرض أول 50 من {filtered.length} حدث
            </div>
          )}
        </div>
      )}
    </div>
  );
}
