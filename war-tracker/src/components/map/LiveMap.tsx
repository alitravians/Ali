import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { useState } from 'react';
import type { TrackerEvent } from '../../types';
import { categoryColor, categoryTextAr, trustLevelText } from '../../utils/helpers';
import TrustBadge from '../shared/TrustBadge';
import { mapLayers } from '../../data/mockData';
import { Layers, Eye, EyeOff } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface LiveMapProps {
  events: TrackerEvent[];
  height?: string;
  showControls?: boolean;
}

function MapEvents({ events, activeLayers }: { events: TrackerEvent[]; activeLayers: string[] }) {
  const filteredEvents = events.filter(e => activeLayers.includes(e.category));

  return (
    <>
      {filteredEvents.map(event => (
        <CircleMarker
          key={event.id}
          center={[event.location.lat, event.location.lng]}
          radius={event.isBreaking ? 14 : 10}
          pathOptions={{
            color: '#ffffff',
            fillColor: categoryColor(event.category),
            fillOpacity: event.isBreaking ? 0.8 : 0.6,
            weight: event.isBreaking ? 3 : 2,
          }}
        >
          <Popup>
            <div className="text-right min-w-[220px] font-[Cairo]" dir="rtl">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    color: categoryColor(event.category),
                    backgroundColor: `${categoryColor(event.category)}20`,
                  }}
                >
                  {categoryTextAr(event.category)}
                </span>
                <TrustBadge level={event.trustLevel} />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">{event.titleAr}</h3>
              <p className="text-[11px] text-gray-600 mb-2">{event.descriptionAr}</p>
              <div className="text-[10px] text-gray-500">
                {event.sources.length} مصادر • {trustLevelText(event.trustLevel)}
              </div>
              {event.whyItMattersAr && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-[10px] text-blue-700">
                  {event.whyItMattersAr}
                </div>
              )}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
}

export default function LiveMap({ events, height = '500px', showControls = true }: LiveMapProps) {
  const [activeLayers, setActiveLayers] = useState<string[]>(mapLayers.map(l => l.id));
  const [showLayerPanel, setShowLayerPanel] = useState(false);

  const toggleLayer = (layerId: string) => {
    setActiveLayers(prev =>
      prev.includes(layerId) ? prev.filter(l => l !== layerId) : [...prev, layerId]
    );
  };

  return (
    <div className="relative rounded-xl overflow-hidden border border-gray-800" style={{ height }}>
      <MapContainer
        center={[31.5, 40]}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        <TileLayer
          attribution=''
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
        />
        <MapEvents events={events} activeLayers={activeLayers} />
      </MapContainer>

      {/* Layer controls */}
      {showControls && (
        <div className="absolute top-3 left-3 z-[1000]">
          <button
            onClick={() => setShowLayerPanel(!showLayerPanel)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#12121a]/90 backdrop-blur border border-gray-700 rounded-lg text-xs text-gray-300 hover:text-white transition-colors"
          >
            <Layers className="w-4 h-4" />
            الطبقات
          </button>

          {showLayerPanel && (
            <div className="mt-2 bg-[#12121a]/95 backdrop-blur border border-gray-700 rounded-xl p-3 min-w-[200px]">
              <h4 className="text-[11px] font-semibold text-gray-400 mb-2">طبقات الخريطة</h4>
              <div className="space-y-1.5">
                {mapLayers.map(layer => (
                  <button
                    key={layer.id}
                    onClick={() => toggleLayer(layer.id)}
                    className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-[11px] transition-colors ${
                      activeLayers.includes(layer.id)
                        ? 'bg-white/5 text-white'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {activeLayers.includes(layer.id) ? (
                      <Eye className="w-3.5 h-3.5" style={{ color: layer.color }} />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5" />
                    )}
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: layer.color, opacity: activeLayers.includes(layer.id) ? 1 : 0.3 }}
                    />
                    {layer.nameAr}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Live indicator */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 px-2.5 py-1 bg-red-500/20 backdrop-blur border border-red-500/30 rounded-full">
        <span className="w-2 h-2 rounded-full bg-red-500 pulse-dot" />
        <span className="text-[10px] font-bold text-red-400">مباشر</span>
      </div>
    </div>
  );
}
