import type { TrackerEvent } from '../../types';
import { timeAgo, categoryColor, categoryTextAr } from '../../utils/helpers';
import TrustBadge from './TrustBadge';
import { MapPin, Clock, Link2, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { useState } from 'react';

interface EventCardProps {
  event: TrackerEvent;
  compact?: boolean;
}

export default function EventCard({ event, compact = false }: EventCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-xl border transition-all duration-200 hover:border-gray-600 ${
        event.isBreaking
          ? 'border-red-500/40 bg-red-500/5'
          : 'border-gray-800 bg-[#12121a]'
      }`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {event.isBreaking && (
              <span className="text-[10px] font-bold text-red-400 bg-red-500/15 px-2 py-0.5 rounded-full border border-red-500/30">
                عاجل
              </span>
            )}
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
              style={{
                color: categoryColor(event.category),
                backgroundColor: `${categoryColor(event.category)}15`,
                borderColor: `${categoryColor(event.category)}30`,
              }}
            >
              {categoryTextAr(event.category)}
            </span>
            <TrustBadge level={event.trustLevel} reason={event.trustReasonAr} />
          </div>
          <div className="flex items-center gap-1 text-[10px] text-gray-400 flex-shrink-0">
            <Clock className="w-3 h-3" />
            {timeAgo(event.timestamp)}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-white mb-2 leading-relaxed line-clamp-3">
          {event.titleAr}
        </h3>

        {!compact && (
          <p className="text-xs text-gray-400 leading-relaxed mb-2">
            {event.descriptionAr}
          </p>
        )}

        {/* Location */}
        <div className="flex items-center gap-1 text-[11px] text-gray-400 mb-2">
          <MapPin className="w-3 h-3" />
          {event.location.nameAr}
        </div>

        {/* Sources count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] text-gray-400">
            <Link2 className="w-3 h-3" />
            {event.sources.length} مصادر
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
          >
            {expanded ? 'إخفاء' : 'تفاصيل'}
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-800 p-3 space-y-3">
          {/* Why it matters */}
          {event.whyItMattersAr && (
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-400 mb-1">
                <Lightbulb className="w-3.5 h-3.5" />
                لماذا هذا الحدث مهم الآن؟
              </div>
              <p className="text-[11px] text-gray-300 leading-relaxed">
                {event.whyItMattersAr}
              </p>
            </div>
          )}

          {/* Sources */}
          <div>
            <h4 className="text-[11px] font-semibold text-gray-400 mb-2">المصادر:</h4>
            <div className="space-y-1.5">
              {event.sources.map((src, i) => (
                <div key={i} className="flex items-center justify-between text-[11px] bg-[#0a0a0f] rounded-lg px-2.5 py-1.5">
                  <span className="text-gray-300">{src.sourceNameAr}</span>
                  <span className="text-gray-400">{timeAgo(src.timestamp)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trust reason */}
          <div className="text-[11px] text-gray-400">
            <span className="font-semibold">سبب التقييم: </span>
            {event.trustReasonAr}
          </div>
        </div>
      )}
    </div>
  );
}
