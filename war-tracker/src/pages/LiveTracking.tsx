import { useState } from 'react';
import { mapLayers } from '../data/staticConfig';
import { useLiveData } from '../context/LiveDataContext';
import LiveMap from '../components/map/LiveMap';
import Timeline from '../components/timeline/Timeline';
import EventCard from '../components/shared/EventCard';
import IndicatorCard from '../components/shared/IndicatorCard';
import { Filter, Clock, List, LayoutGrid, Radio } from 'lucide-react';
import type { EventCategory, TrustLevel } from '../types';

export default function LiveTracking() {
  const { events, indicators, newEventCount, lastUpdate, clearNewCount } = useLiveData();
  const [categoryFilter, setCategoryFilter] = useState<EventCategory | 'all'>('all');
  const [trustFilter, setTrustFilter] = useState<TrustLevel | 'all'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'timeline'>('cards');

  const filteredEvents = events.filter(e => {
    if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
    if (trustFilter !== 'all' && e.trustLevel !== trustFilter) return false;
    return true;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <div className="max-w-[1920px] mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-red-400" />
            التتبع المباشر
          </h1>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 border border-red-500/30 rounded-full">
            <span className="w-2 h-2 rounded-full bg-red-500 pulse-dot" />
            <span className="text-[10px] font-bold text-red-400">LIVE</span>
          </div>
          {newEventCount > 0 && (
            <button
              onClick={clearNewCount}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 border border-green-500/30 rounded-full animate-pulse"
            >
              <span className="text-[10px] font-bold text-green-400">+{newEventCount} جديد</span>
            </button>
          )}
        </div>
        <div className="text-[11px] text-gray-500 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          آخر تحديث: {lastUpdate.toLocaleString('ar-SA')}
        </div>
      </div>

      {/* Indicators Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
        {indicators.map(ind => (
          <IndicatorCard key={ind.id} indicator={ind} />
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map - takes 2/3 */}
        <div className="lg:col-span-2">
          <LiveMap events={filteredEvents} height="550px" showControls={true} />
        </div>

        {/* Events Panel - takes 1/3 */}
        <div className="flex flex-col h-[550px]">
          {/* Filters */}
          <div className="bg-[#12121a] rounded-xl border border-gray-800 p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" />
                الفلاتر
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 rounded-lg ${viewMode === 'cards' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('timeline')}
                  className={`p-1.5 rounded-lg ${viewMode === 'timeline' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Category filter */}
            <div className="flex flex-wrap gap-1 mb-2">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                  categoryFilter === 'all'
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    : 'text-gray-500 border-gray-700 hover:text-gray-300'
                }`}
              >
                الكل
              </button>
              {mapLayers.map(layer => (
                <button
                  key={layer.id}
                  onClick={() => setCategoryFilter(layer.id)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                    categoryFilter === layer.id
                      ? 'border-opacity-50 bg-opacity-20'
                      : 'text-gray-500 border-gray-700 hover:text-gray-300'
                  }`}
                  style={
                    categoryFilter === layer.id
                      ? { color: layer.color, backgroundColor: `${layer.color}20`, borderColor: `${layer.color}50` }
                      : {}
                  }
                >
                  {layer.nameAr}
                </button>
              ))}
            </div>

            {/* Trust filter */}
            <div className="flex flex-wrap gap-1">
              {(['all', 'confirmed', 'high', 'medium', 'low'] as const).map(level => (
                <button
                  key={level}
                  onClick={() => setTrustFilter(level)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                    trustFilter === level
                      ? 'bg-white/10 text-white border-white/20'
                      : 'text-gray-500 border-gray-700 hover:text-gray-300'
                  }`}
                >
                  {level === 'all' ? 'كل المستويات' : level === 'confirmed' ? 'مؤكد' : level === 'high' ? 'مرجّح' : level === 'medium' ? 'قيد التحقق' : 'غير مؤكد'}
                </button>
              ))}
            </div>
          </div>

          {/* Events list */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            <div className="text-[11px] text-gray-500 mb-2">
              {sortedEvents.length} حدث
            </div>
            {viewMode === 'cards' ? (
              sortedEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))
            ) : (
              <Timeline events={sortedEvents} />
            )}
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-bold text-white">الخط الزمني - آخر 24 ساعة</h2>
        </div>
        <div className="bg-[#12121a] rounded-xl border border-gray-800 p-4">
          <Timeline events={events} />
        </div>
      </div>
    </div>
  );
}
