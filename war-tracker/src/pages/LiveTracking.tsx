import { useState } from 'react';
import { mapLayers } from '../data/staticConfig';
import { useLiveData } from '../context/LiveDataContext';
import LiveMap from '../components/map/LiveMap';
import Timeline from '../components/timeline/Timeline';
import EventCard from '../components/shared/EventCard';
import MaritimePanel from '../components/maritime/MaritimePanel';
import EventDetailModal from '../components/shared/EventDetailModal';
import AISummaryModal from '../components/ai/AISummaryModal';
import AlertToast from '../components/shared/AlertToast';
import { Filter, Clock, List, LayoutGrid, Radio, Brain, Ship, ChevronDown, ChevronUp, Bell, Activity, AlertTriangle, ShieldCheck, Maximize2, Minimize2, Share2 } from 'lucide-react';
import type { EventCategory, TrustLevel, TrackerEvent } from '../types';

export default function LiveTracking() {
  const { events, alerts, newEventCount, lastUpdate, clearNewCount, vessels, connectionStatus } = useLiveData();
  const [categoryFilter, setCategoryFilter] = useState<EventCategory | 'all'>('all');
  const [trustFilter, setTrustFilter] = useState<TrustLevel | 'all'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'timeline'>('cards');

  // Modal states
  const [selectedEvent, setSelectedEvent] = useState<TrackerEvent | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);

  // Collapsible panels
  const [showMaritime, setShowMaritime] = useState(true);
  const [showTimeline, setShowTimeline] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [shareToast, setShareToast] = useState('');

  // Quick stats
  const confirmedCount = events.filter(e => e.trustLevel === 'confirmed').length;
  const breakingCount = events.filter(e => e.isBreaking).length;

  const filteredEvents = events.filter(e => {
    if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
    if (trustFilter !== 'all' && e.trustLevel !== trustFilter) return false;
    return true;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const handleShareEvent = (event: TrackerEvent) => {
    const url = `https://dist-mu-taupe-70.vercel.app/live?event=${event.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareToast('تم نسخ الرابط!');
      setTimeout(() => setShareToast(''), 2000);
    }).catch(() => {
      setShareToast('فشل نسخ الرابط');
      setTimeout(() => setShareToast(''), 2000);
    });
  };

  return (
    <div className="max-w-[1920px] mx-auto px-3 py-3">
      {/* Alert Toast Notifications */}
      <AlertToast alerts={alerts} />

      {/* Share toast */}
      {shareToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-green-500/90 text-white text-xs font-bold rounded-lg shadow-lg">
          {shareToast}
        </div>
      )}

      {/* Fullscreen Map Mode */}
      {isFullscreen ? (
        <div className="fixed inset-0 z-50 bg-[#0a0a0f]">
          <div className="relative w-full h-full">
            <LiveMap events={filteredEvents} height="100vh" showControls={true} />
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 left-4 z-[1000] flex items-center gap-1.5 px-3 py-2 bg-[#12121a]/90 backdrop-blur-sm border border-gray-700 rounded-lg text-xs text-white hover:bg-gray-700 transition-colors"
            >
              <Minimize2 className="w-4 h-4" />
              خروج ملء الشاشة
            </button>
          </div>
        </div>
      ) : (
      <>

      {/* Header Bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-red-400" />
            التتبع المباشر
          </h1>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 border border-red-500/30 rounded-full">
            <span className="w-2 h-2 rounded-full bg-red-500 pulse-dot" />
            <span className="text-[10px] font-bold text-red-400">LIVE</span>
          </div>
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
            connectionStatus === 'connected' ? 'bg-green-500/10 text-green-400 border border-green-500/30' :
            connectionStatus === 'connecting' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30' :
            'bg-red-500/10 text-red-400 border border-red-500/30'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-400' :
              connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
              'bg-red-400'
            }`} />
            {connectionStatus === 'connected' ? 'متصل' : connectionStatus === 'connecting' ? 'جاري الاتصال...' : 'غير متصل'}
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
        <div className="flex items-center gap-3">
          {/* AI Analysis Button */}
          <button
            onClick={() => setShowAIModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-lg text-[11px] text-purple-400 hover:bg-purple-500/20 transition-colors"
          >
            <Brain className="w-3.5 h-3.5" />
            تحليل AI
          </button>
          <div className="text-[10px] text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {lastUpdate.toLocaleString('ar-SA')}
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-5 gap-2 mb-3">
        <div className="rounded-lg border border-gray-800 bg-[#12121a] px-3 py-2 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          <div>
            <span className="text-lg font-black text-white">{events.length}</span>
            <span className="text-[9px] text-gray-500 block">إجمالي الأحداث</span>
          </div>
        </div>
        <div className="rounded-lg border border-gray-800 bg-[#12121a] px-3 py-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <div>
            <span className="text-lg font-black text-red-400">{breakingCount}</span>
            <span className="text-[9px] text-gray-500 block">عاجل</span>
          </div>
        </div>
        <div className="rounded-lg border border-gray-800 bg-[#12121a] px-3 py-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-green-400" />
          <div>
            <span className="text-lg font-black text-green-400">{confirmedCount}</span>
            <span className="text-[9px] text-gray-500 block">مؤكد</span>
          </div>
        </div>
        <div className="rounded-lg border border-gray-800 bg-[#12121a] px-3 py-2 flex items-center gap-2">
          <Ship className="w-4 h-4 text-cyan-400" />
          <div>
            <span className="text-lg font-black text-cyan-400">{vessels.length}</span>
            <span className="text-[9px] text-gray-500 block">سفينة مرصودة</span>
          </div>
        </div>
        <div className="rounded-lg border border-gray-800 bg-[#12121a] px-3 py-2 flex items-center gap-2">
          <Bell className="w-4 h-4 text-yellow-400" />
          <div>
            <span className="text-lg font-black text-yellow-400">{alerts.filter(a => !a.isRead).length}</span>
            <span className="text-[9px] text-gray-500 block">تنبيهات</span>
          </div>
        </div>
      </div>

      {/* ═══ MAIN DASHBOARD LAYOUT ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">

        {/* ── LEFT: Map (8 cols) ── */}
        <div className="lg:col-span-8">
          <div className="rounded-xl border border-gray-800 overflow-hidden relative">
            <LiveMap events={filteredEvents} height="calc(100vh - 280px)" showControls={true} />
            <button
              onClick={() => setIsFullscreen(true)}
              className="absolute top-3 left-3 z-[1000] flex items-center gap-1.5 px-2.5 py-1.5 bg-[#12121a]/80 backdrop-blur-sm border border-gray-700 rounded-lg text-[11px] text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              ملء الشاشة
            </button>
          </div>

          {/* Maritime Panel (collapsible below map) */}
          <div className="mt-3">
            <button
              onClick={() => setShowMaritime(!showMaritime)}
              className="w-full flex items-center justify-between bg-[#12121a] rounded-xl border border-gray-800 px-4 py-3 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Ship className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-bold text-white">البث المباشر البحري</span>
                {vessels.length > 0 && (
                  <span className="text-[10px] font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/30">
                    {vessels.length} سفينة
                  </span>
                )}
              </div>
              {showMaritime ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </button>
            {showMaritime && (
              <div className="bg-[#12121a] rounded-b-xl border border-t-0 border-gray-800 p-4 animate-slideUp">
                <MaritimePanel />
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Events Panel (4 cols) ── */}
        <div className="lg:col-span-4 flex flex-col" style={{ height: 'calc(100vh - 280px)' }}>
          {/* Filters */}
          <div className="bg-[#12121a] rounded-xl border border-gray-800 p-3 mb-2 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1.5">
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
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
            <div className="text-[11px] text-gray-500 mb-1">
              {sortedEvents.length} حدث
            </div>
            {viewMode === 'cards' ? (
              sortedEvents.map(event => (
                <div key={event.id} className="relative group">
                  <div onClick={() => setSelectedEvent(event)} className="cursor-pointer">
                    <EventCard event={event} />
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleShareEvent(event); }}
                    className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 p-1.5 bg-gray-800/80 backdrop-blur-sm rounded-lg text-gray-400 hover:text-white transition-all z-10"
                    title="مشاركة الحدث"
                  >
                    <Share2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            ) : (
              <Timeline events={sortedEvents} />
            )}
          </div>

          {/* Timeline toggle at bottom */}
          <div className="mt-2 flex-shrink-0">
            <button
              onClick={() => setShowTimeline(!showTimeline)}
              className="w-full flex items-center justify-between bg-[#12121a] rounded-xl border border-gray-800 px-3 py-2 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[11px] font-bold text-white">الخط الزمني - آخر 24 ساعة</span>
              </div>
              {showTimeline ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />}
            </button>
            {showTimeline && (
              <div className="bg-[#12121a] rounded-b-xl border border-t-0 border-gray-800 p-3 max-h-[300px] overflow-y-auto animate-slideUp">
                <Timeline events={events} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ MODALS ═══ */}
      <EventDetailModal
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
      <AISummaryModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
      />

      </>
      )}
    </div>
  );
}
