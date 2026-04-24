import { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, MapPin } from 'lucide-react';
import type { TrackerEvent } from '../../types';
import { timeAgo, categoryTextAr } from '../../utils/helpers';

interface EventSearchProps {
  events: TrackerEvent[];
  onSelectEvent?: (event: TrackerEvent) => void;
}

export default function EventSearch({ events, onSelectEvent }: EventSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = query.trim().length >= 2
    ? events.filter(e =>
        e.titleAr.includes(query) ||
        e.descriptionAr.includes(query) ||
        e.title.toLowerCase().includes(query.toLowerCase()) ||
        e.location.nameAr.includes(query) ||
        e.location.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 bg-[#0a0a0f] border border-gray-700 rounded-lg px-3 py-1.5 focus-within:border-blue-500 transition-colors">
        <Search className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder="بحث في الأحداث..."
          className="bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none w-24 sm:w-32 md:w-48"
        />
        {query && (
          <button onClick={() => { setQuery(''); setIsOpen(false); }} className="text-gray-500 hover:text-white">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && query.trim().length >= 2 && (
        <div className="absolute top-full mt-1 left-0 right-0 w-[calc(100vw-2rem)] sm:w-80 bg-[#12121a] border border-gray-700 rounded-xl shadow-2xl z-50 max-h-[60vh] sm:max-h-[400px] overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-500">لا توجد نتائج لـ "{query}"</div>
          ) : (
            <div className="p-1">
              <div className="px-3 py-1.5 text-[10px] text-gray-400">{results.length} نتيجة</div>
              {results.map(event => (
                <button
                  key={event.id}
                  onClick={() => { onSelectEvent?.(event); setIsOpen(false); setQuery(''); }}
                  className="w-full text-right p-2.5 hover:bg-white/5 rounded-lg transition-colors block"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-800 rounded-full text-gray-400">
                      {categoryTextAr(event.category)}
                    </span>
                    {event.isBreaking && (
                      <span className="text-[10px] text-red-400 font-bold">عاجل</span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-white mb-1 line-clamp-1">{event.titleAr}</p>
                  <div className="flex items-center gap-3 text-[10px] text-gray-400">
                    <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{event.location.nameAr}</span>
                    <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{timeAgo(event.timestamp)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
