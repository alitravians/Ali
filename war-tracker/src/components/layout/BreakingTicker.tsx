import { AlertTriangle } from 'lucide-react';
import { useLiveData } from '../../context/LiveDataContext';

export default function BreakingTicker() {
  const { events } = useLiveData();
  const breakingEvents = events.filter(e => e.isBreaking).slice(0, 10);

  return (
    <div className="fixed top-0 right-0 left-0 z-50 h-7 sm:h-8 bg-gradient-to-l from-red-900/90 to-red-800/90 backdrop-blur-sm border-b border-red-700/50 overflow-hidden pm-ticker">
      <div className="flex items-center h-full">
        <div className="flex-shrink-0 flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 bg-red-600 h-full">
          <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
          <span className="text-[10px] sm:text-[11px] font-bold text-white whitespace-nowrap">عاجل</span>
        </div>
        <div className="overflow-hidden flex-1">
          <div className="ticker-scroll whitespace-nowrap flex items-center h-full gap-6 sm:gap-8">
            {breakingEvents.map(event => (
              <span key={event.id} className="text-[11px] sm:text-[12px] text-red-100 inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 pulse-dot flex-shrink-0" />
                {event.titleAr}
              </span>
            ))}
            {breakingEvents.map(event => (
              <span key={`dup-${event.id}`} className="text-[11px] sm:text-[12px] text-red-100 inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 pulse-dot flex-shrink-0" />
                {event.titleAr}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
