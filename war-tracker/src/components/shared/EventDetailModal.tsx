import type { TrackerEvent } from '../../types';
import { timeAgo, categoryColor, categoryTextAr } from '../../utils/helpers';
import TrustBadge from './TrustBadge';
import Modal from './Modal';
import { MapPin, Clock, Link2, Lightbulb, ExternalLink, Zap } from 'lucide-react';

interface EventDetailModalProps {
  event: TrackerEvent | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EventDetailModal({ event, isOpen, onClose }: EventDetailModalProps) {
  if (!event) return null;

  const catColor = categoryColor(event.category);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={categoryTextAr(event.category)}
      titleIcon={
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${catColor}20` }}
        >
          <Zap className="w-3.5 h-3.5" style={{ color: catColor }} />
        </div>
      }
      size="lg"
    >
      <div className="space-y-3 sm:space-y-4">
        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {event.isBreaking && (
            <span className="text-[11px] font-bold text-red-400 bg-red-500/15 px-3 py-1 rounded-full border border-red-500/30 animate-pulse">
              عاجل
            </span>
          )}
          <span
            className="text-[11px] font-semibold px-3 py-1 rounded-full border"
            style={{
              color: catColor,
              backgroundColor: `${catColor}15`,
              borderColor: `${catColor}30`,
            }}
          >
            {categoryTextAr(event.category)}
          </span>
          <TrustBadge level={event.trustLevel} reason={event.trustReasonAr} />
          <span className="text-[11px] text-gray-500 flex items-center gap-1 mr-auto">
            <Clock className="w-3.5 h-3.5" />
            {timeAgo(event.timestamp)}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
          {event.titleAr}
        </h3>

        {/* Description */}
        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
          {event.descriptionAr}
        </p>

        {/* Location */}
        <div className="flex items-center gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 bg-blue-500/5 border border-blue-500/20 rounded-xl">
          <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span className="text-xs sm:text-sm text-blue-300 font-semibold">{event.location.nameAr}</span>
          <span className="text-[10px] sm:text-xs text-gray-500">({event.location.name})</span>
        </div>

        {/* Why it matters */}
        {event.whyItMattersAr && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-amber-400 mb-2">
              <Lightbulb className="w-4 h-4" />
              لماذا هذا الحدث مهم الآن؟
            </div>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              {event.whyItMattersAr}
            </p>
          </div>
        )}

        {/* Sources */}
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-white mb-2 sm:mb-3 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-gray-400" />
            المصادر ({event.sources.length})
          </h4>
          <div className="space-y-2">
            {event.sources.map((src, i) => (
              <div key={i} className="flex items-center justify-between bg-[#0a0a0f] rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm text-gray-200 font-medium">{src.sourceNameAr}</span>
                  {src.url && (
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <span className="text-[10px] sm:text-xs text-gray-500">{timeAgo(src.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trust reason */}
        <div className="bg-[#0a0a0f] rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-800">
          <span className="text-[10px] sm:text-xs font-semibold text-gray-400">سبب التقييم: </span>
          <span className="text-[10px] sm:text-xs text-gray-300">{event.trustReasonAr}</span>
        </div>
      </div>
    </Modal>
  );
}
