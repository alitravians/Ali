import type { TrackerEvent } from '../../types';
import { timeAgo, categoryColor, categoryTextAr } from '../../utils/helpers';
import TrustBadge from '../shared/TrustBadge';
import { Clock, MapPin } from 'lucide-react';

interface TimelineProps {
  events: TrackerEvent[];
}

export default function Timeline({ events }: TimelineProps) {
  const sortedEvents = [...events].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-500 via-blue-500 to-gray-700" />

      <div className="space-y-4">
        {sortedEvents.map((event) => (
          <div key={event.id} className="relative pr-10">
            {/* Timeline dot */}
            <div
              className={`absolute right-[11px] w-3 h-3 rounded-full border-2 z-10 ${
                event.isBreaking ? 'pulse-dot' : ''
              }`}
              style={{
                backgroundColor: categoryColor(event.category),
                borderColor: '#0a0a0f',
              }}
            />

            {/* Time label */}
            <div className="absolute right-[-4px] top-5 w-8 text-center">
              <span className="text-[9px] text-gray-500 font-mono">
                {event.timestamp.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Card */}
            <div
              className={`rounded-xl border p-3 transition-all hover:border-gray-600 ${
                event.isBreaking
                  ? 'border-red-500/30 bg-red-500/5'
                  : 'border-gray-800 bg-[#12121a]'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {event.isBreaking && (
                    <span className="text-[9px] font-bold text-red-400 bg-red-500/15 px-1.5 py-0.5 rounded-full">
                      عاجل
                    </span>
                  )}
                  <span
                    className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{
                      color: categoryColor(event.category),
                      backgroundColor: `${categoryColor(event.category)}15`,
                    }}
                  >
                    {categoryTextAr(event.category)}
                  </span>
                </div>
                <TrustBadge level={event.trustLevel} />
              </div>

              <h4 className="text-xs font-bold text-white mb-1">{event.titleAr}</h4>

              <div className="flex items-center gap-3 text-[10px] text-gray-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {event.location.nameAr}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {timeAgo(event.timestamp)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
