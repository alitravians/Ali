import { MapContainer, TileLayer, Circle, useMap } from 'react-leaflet';
import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import type { TrackerEvent, VesselPosition } from '../../types';
import { categoryColor, categoryTextAr, trustLevelText, escapeHtml } from '../../utils/helpers';
import { mapLayers } from '../../data/staticConfig';
import { useLiveData } from '../../context/LiveDataContext';
import { Layers, Eye, EyeOff, Ship } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface LiveMapProps {
  events: TrackerEvent[];
  height?: string;
  showControls?: boolean;
}

// Animated pulsing marker using Leaflet DivIcon
function PulsingMarker({ event }: { event: TrackerEvent }) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    const color = categoryColor(event.category);
    const size = event.isBreaking ? 28 : 20;
    const isStrike = event.category === 'military' || event.category === 'fire';

    const pulseClass = isStrike ? 'strike-marker' : 'event-marker';

    const icon = L.divIcon({
      className: 'custom-marker-container',
      html: `
        <div class="${pulseClass}" style="--marker-color: ${color}; --marker-size: ${size}px;">
          <div class="marker-core"></div>
          <div class="marker-ring ring-1"></div>
          <div class="marker-ring ring-2"></div>
          ${isStrike ? '<div class="marker-ring ring-3"></div>' : ''}
          ${event.isBreaking ? '<div class="marker-breaking-glow"></div>' : ''}
        </div>
      `,
      iconSize: [size * 3, size * 3],
      iconAnchor: [size * 1.5, size * 1.5],
    });

    const marker = L.marker([event.location.lat, event.location.lng], { icon });

    const popupContent = `
      <div class="event-popup" dir="rtl">
        <div class="popup-header">
          <span class="popup-category" style="color: ${color}; background: ${color}20;">
            ${escapeHtml(categoryTextAr(event.category))}
          </span>
          ${event.isBreaking ? '<span class="popup-breaking">عاجل</span>' : ''}
        </div>
        <h3 class="popup-title">${escapeHtml(event.titleAr)}</h3>
        <p class="popup-desc">${escapeHtml(event.descriptionAr)}</p>
        <div class="popup-meta">
          <span>${event.sources.length} مصادر</span>
          <span>•</span>
          <span>${escapeHtml(trustLevelText(event.trustLevel))}</span>
        </div>
        <div class="popup-location">📍 ${escapeHtml(event.location.nameAr)}</div>
        ${event.whyItMattersAr ? `<div class="popup-importance">⚡ ${escapeHtml(event.whyItMattersAr)}</div>` : ''}
      </div>
    `;

    marker.bindPopup(popupContent, {
      maxWidth: 300,
      className: 'custom-popup',
    });

    marker.addTo(map);
    markerRef.current = marker;

    return () => {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
      }
    };
  }, [map, event]);

  return null;
}

// Danger zone circles for high-risk areas
function DangerZones({ events }: { events: TrackerEvent[] }) {
  const militaryEvents = events.filter(
    e => (e.category === 'military' || e.category === 'fire') && e.isBreaking
  );

  return (
    <>
      {militaryEvents.map(event => (
        <Circle
          key={`danger-${event.id}`}
          center={[event.location.lat, event.location.lng]}
          radius={50000}
          pathOptions={{
            color: '#ef4444',
            fillColor: '#ef4444',
            fillOpacity: 0.08,
            weight: 1,
            dashArray: '8 4',
          }}
        />
      ))}
    </>
  );
}

// Alert zone circles
function AlertZones({ events }: { events: TrackerEvent[] }) {
  const alertEvents = events.filter(e => e.category === 'alert');

  return (
    <>
      {alertEvents.map(event => (
        <Circle
          key={`alert-zone-${event.id}`}
          center={[event.location.lat, event.location.lng]}
          radius={35000}
          pathOptions={{
            color: '#f59e0b',
            fillColor: '#f59e0b',
            fillOpacity: 0.06,
            weight: 1,
            dashArray: '4 6',
          }}
        />
      ))}
    </>
  );
}

// 3D ship marker for vessels
function VesselMarker({ vessel }: { vessel: VesselPosition }) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    const rotation = vessel.heading ?? vessel.course ?? 0;
    const typeColors: Record<string, string> = {
      tanker: '#f59e0b',
      cargo: '#3b82f6',
      military: '#ef4444',
      passenger: '#22c55e',
      fishing: '#06b6d4',
      other: '#8b5cf6',
    };
    const color = typeColors[vessel.shipType] || '#8b5cf6';
    const size = vessel.shipType === 'military' ? 18 : vessel.shipType === 'tanker' ? 16 : 14;

    const icon = L.divIcon({
      className: 'vessel-marker-container',
      html: `
        <div class="vessel-marker-3d" style="--vessel-color: ${color}; --vessel-rotation: ${rotation}deg; --vessel-size: ${size}px;">
          <div class="vessel-body">
            <svg viewBox="0 0 24 32" width="${size}" height="${Math.round(size * 1.33)}" style="transform: rotate(${rotation}deg); filter: drop-shadow(0 0 4px ${color}80);">
              <path d="M12 1 L20 12 L18 28 L12 32 L6 28 L4 12 Z" fill="${color}" stroke="${color}" stroke-width="0.5" opacity="0.9"/>
              <path d="M12 1 L20 12 L12 8 Z" fill="white" opacity="0.3"/>
              <path d="M12 1 L4 12 L12 8 Z" fill="white" opacity="0.15"/>
              <circle cx="12" cy="16" r="2" fill="white" opacity="0.6"/>
            </svg>
          </div>
          <div class="vessel-wake" style="--vessel-color: ${color};"></div>
        </div>
      `,
      iconSize: [size * 2, size * 2],
      iconAnchor: [size, size],
    });

    const speedText = vessel.speed !== undefined && vessel.speed !== null ? `${vessel.speed.toFixed(1)} عقدة` : 'غير متوفر';
    const courseText = vessel.course !== undefined && vessel.course !== null ? `${vessel.course.toFixed(0)}°` : '-';

    const popupContent = `
      <div class="vessel-popup" dir="rtl">
        <div class="vessel-popup-header" style="border-bottom-color: ${color}40;">
          <span class="vessel-type-badge" style="color: ${color}; background: ${color}20; border: 1px solid ${color}40;">
            ${escapeHtml(vessel.shipTypeAr)}
          </span>
          <span class="vessel-status-badge">${escapeHtml(vessel.statusAr)}</span>
        </div>
        <h3 class="vessel-name">${escapeHtml(vessel.name || 'MMSI: ' + vessel.mmsi)}</h3>
        <div class="vessel-info-grid">
          <div class="vessel-info-item">
            <span class="vessel-info-label">السرعة</span>
            <span class="vessel-info-value">${speedText}</span>
          </div>
          <div class="vessel-info-item">
            <span class="vessel-info-label">الاتجاه</span>
            <span class="vessel-info-value">${courseText}</span>
          </div>
          <div class="vessel-info-item">
            <span class="vessel-info-label">المنطقة</span>
            <span class="vessel-info-value">${escapeHtml(vessel.zoneAr)}</span>
          </div>
          ${vessel.destination ? `
          <div class="vessel-info-item">
            <span class="vessel-info-label">الوجهة</span>
            <span class="vessel-info-value">${escapeHtml(vessel.destination)}</span>
          </div>` : ''}
          ${vessel.length ? `
          <div class="vessel-info-item">
            <span class="vessel-info-label">الطول</span>
            <span class="vessel-info-value">${vessel.length}م</span>
          </div>` : ''}
          ${vessel.flag ? `
          <div class="vessel-info-item">
            <span class="vessel-info-label">العلم</span>
            <span class="vessel-info-value">${escapeHtml(vessel.flag)}</span>
          </div>` : ''}
        </div>
        <div class="vessel-mmsi">MMSI: ${escapeHtml(vessel.mmsi)}</div>
      </div>
    `;

    const marker = L.marker([vessel.lat, vessel.lng], { icon });
    marker.bindPopup(popupContent, {
      maxWidth: 280,
      className: 'vessel-custom-popup',
    });

    marker.addTo(map);
    markerRef.current = marker;

    return () => {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
      }
    };
  }, [map, vessel]);

  return null;
}

function MapEvents({ events, activeLayers }: { events: TrackerEvent[]; activeLayers: string[] }) {
  const filteredEvents = events.filter(e => activeLayers.includes(e.category));
  const { vessels } = useLiveData();
  const showVessels = activeLayers.includes('maritime');

  return (
    <>
      <DangerZones events={filteredEvents} />
      <AlertZones events={filteredEvents} />
      {filteredEvents.map(event => (
        <PulsingMarker key={event.id} event={event} />
      ))}
      {showVessels && vessels.map(vessel => (
        <VesselMarker key={vessel.mmsi} vessel={vessel} />
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
    <div className="relative rounded-xl overflow-hidden border border-gray-800 map-container-wrapper" style={{ height }}>
      <MapContainer
        center={[31.5, 40]}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        {/* Satellite imagery base */}
        <TileLayer
          attribution='Tiles &copy; Esri'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        {/* Labels and borders overlay */}
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
            className="flex items-center gap-1.5 px-3 py-2 bg-black/70 backdrop-blur-md border border-white/20 rounded-lg text-xs text-white hover:bg-black/80 transition-colors shadow-lg"
          >
            <Layers className="w-4 h-4" />
            الطبقات
          </button>

          {showLayerPanel && (
            <div className="mt-2 bg-black/80 backdrop-blur-md border border-white/20 rounded-xl p-3 min-w-[200px] shadow-xl">
              <h4 className="text-[11px] font-semibold text-gray-300 mb-2">طبقات الخريطة</h4>
              <div className="space-y-1.5">
                {mapLayers.map(layer => (
                  <button
                    key={layer.id}
                    onClick={() => toggleLayer(layer.id)}
                    className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-[11px] transition-colors ${
                      activeLayers.includes(layer.id)
                        ? 'bg-white/10 text-white'
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
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 px-3 py-1.5 bg-red-600/80 backdrop-blur-md border border-red-500/50 rounded-full shadow-lg shadow-red-500/20">
        <span className="w-2.5 h-2.5 rounded-full bg-white pulse-dot" />
        <span className="text-[11px] font-bold text-white">مباشر</span>
      </div>

      {/* Map legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-black/70 backdrop-blur-md border border-white/20 rounded-lg px-3 py-2 shadow-lg">
        <div className="flex items-center gap-3 text-[9px]">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-300">ضربات</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-orange-300">إنذارات</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-blue-300">رسمي</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-green-300">إنساني</span>
          </div>
          <div className="flex items-center gap-1">
            <Ship className="w-2.5 h-2.5 text-cyan-400" />
            <span className="text-cyan-300">سفن</span>
          </div>
        </div>
      </div>
    </div>
  );
}
