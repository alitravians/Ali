import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { cities } from '../data/staticConfig';
import { useLiveData } from '../context/LiveDataContext';
import { riskLevelColor, riskLevelTextAr, scoreColor, scoreTextColor, timeAgo } from '../utils/helpers';
import EventCard from '../components/shared/EventCard';
import LiveMap from '../components/map/LiveMap';
import { Building2, Clock, ArrowRight, Activity, Plane, Users } from 'lucide-react';
import type { TrackerEvent, RiskLevel } from '../types';

// Map country names (Arabic & English) to all city IDs within that country
const COUNTRY_TO_CITIES: Record<string, string[]> = {
  'إيران': ['tehran', 'isfahan'],
  'Iran': ['tehran', 'isfahan'],
  'إسرائيل': ['telaviv', 'haifa', 'jerusalem'],
  'Israel': ['telaviv', 'haifa', 'jerusalem'],
  'سوريا': ['damascus'],
  'Syria': ['damascus'],
  'لبنان': ['beirut'],
  'Lebanon': ['beirut'],
  'العراق': ['baghdad'],
  'Iraq': ['baghdad'],
  'اليمن': ['sanaa'],
  'Yemen': ['sanaa'],
  'فلسطين': ['gaza', 'jerusalem'],
  'Palestine': ['gaza', 'jerusalem'],
  'البحرين': ['bahrain'],
  'Bahrain': ['bahrain'],
  'الكويت': ['kuwait'],
  'Kuwait': ['kuwait'],
  'قطر': ['doha'],
  'Qatar': ['doha'],
  'الإمارات': ['abudhabi'],
  'UAE': ['abudhabi'],
  'السعودية': ['riyadh'],
  'Saudi Arabia': ['riyadh'],
  'الأردن': ['amman'],
  'Jordan': ['amman'],
};

// Check if an event is related to a specific city
function isEventRelatedToCity(event: TrackerEvent, cityId: string, cityName: string, cityNameAr: string): boolean {
  // Direct match: event's relatedCities contains the city name
  if (event.relatedCities.includes(cityNameAr) || event.relatedCities.includes(cityName)) {
    return true;
  }
  // Country-level match: event mentions a country that contains this city
  for (const relCity of event.relatedCities) {
    const citiesInCountry = COUNTRY_TO_CITIES[relCity];
    if (citiesInCountry && citiesInCountry.includes(cityId)) {
      return true;
    }
  }
  return false;
}

// Compute dynamic indicators from events
function computeIndicators(cityEvents: TrackerEvent[]): { military: number; airspace: number; civilian: number } {
  if (cityEvents.length === 0) return { military: 0, airspace: 0, civilian: 0 };

  let militaryCount = 0;
  let airspaceCount = 0;
  let civilianCount = 0;

  for (const e of cityEvents) {
    switch (e.category) {
      case 'military':
      case 'fire':
        militaryCount++;
        break;
      case 'airspace':
        airspaceCount++;
        break;
      case 'humanitarian':
        civilianCount++;
        break;
      case 'alert':
        militaryCount++;
        civilianCount++;
        break;
      case 'maritime':
        militaryCount++;
        break;
      case 'official':
        // Official statements contribute lightly
        militaryCount += 0.5;
        break;
    }
  }

  // Scale: each event contributes ~15 points, capped at 100
  const scale = (count: number) => Math.min(100, Math.round(count * 15));
  return {
    military: scale(militaryCount),
    airspace: scale(airspaceCount),
    civilian: scale(civilianCount),
  };
}

// Compute dynamic risk level from event count and categories
function computeRiskLevel(cityEvents: TrackerEvent[]): RiskLevel {
  const count = cityEvents.length;
  const hasBreaking = cityEvents.some(e => e.isBreaking);
  const hasMilitary = cityEvents.some(e => e.category === 'military' || e.category === 'fire');

  if (count >= 10 || (count >= 5 && hasBreaking)) return 'critical';
  if (count >= 6 || (count >= 3 && hasMilitary)) return 'high';
  if (count >= 3) return 'elevated';
  if (count >= 1) return 'moderate';
  return 'low';
}

// Get most recent event timestamp for a city
function getLastUpdate(cityEvents: TrackerEvent[]): Date {
  if (cityEvents.length === 0) return new Date();
  const sorted = [...cityEvents].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  return new Date(sorted[0].timestamp);
}

export default function Cities() {
  const { events } = useLiveData();
  const { cityId } = useParams();
  const selectedCity = cityId ? cities.find(c => c.id === cityId) : null;

  // Pre-compute city events map for all cities
  const cityEventsMap = useMemo(() => {
    const map: Record<string, TrackerEvent[]> = {};
    for (const city of cities) {
      map[city.id] = events.filter(e =>
        isEventRelatedToCity(e, city.id, city.name, city.nameAr)
      );
    }
    return map;
  }, [events]);

  const getCityEvents = (cId: string) => {
    return (cityEventsMap[cId] || []).slice(0, 10);
  };

  if (selectedCity) {
    const cityEvents = cityEventsMap[selectedCity.id] || [];
    const indicators = computeIndicators(cityEvents);
    const riskLevel = computeRiskLevel(cityEvents);

    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Back */}
        <Link to="/cities" className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 mb-4">
          <ArrowRight className="w-3.5 h-3.5" />
          العودة لقائمة المدن
        </Link>

        {/* City Header */}
        <div className="rounded-xl border border-gray-800 bg-[#12121a] p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-black text-white mb-1">{selectedCity.nameAr}</h1>
              <span className="text-sm text-gray-400">{selectedCity.countryAr} • {selectedCity.name}</span>
            </div>
            <span className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${riskLevelColor(riskLevel)}`}>
              مستوى الخطر: {riskLevelTextAr(riskLevel)}
            </span>
          </div>

          {/* City indicators */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-[#0a0a0f] p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Activity className="w-3.5 h-3.5 text-red-400" />
                <span className="text-[11px] text-gray-400">النشاط العسكري</span>
              </div>
              <div className="flex items-end gap-1">
                <span className={`text-xl font-black ${scoreTextColor(indicators.military)}`}>
                  {indicators.military}
                </span>
                <span className="text-[10px] text-gray-500 mb-0.5">/100</span>
              </div>
              <div className="h-1 bg-gray-800 rounded-full mt-2 overflow-hidden">
                <div className={`h-full rounded-full ${scoreColor(indicators.military)}`} style={{ width: `${indicators.military}%` }} />
              </div>
            </div>
            <div className="rounded-lg bg-[#0a0a0f] p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Plane className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-[11px] text-gray-400">مخاطر الأجواء</span>
              </div>
              <div className="flex items-end gap-1">
                <span className={`text-xl font-black ${scoreTextColor(indicators.airspace)}`}>
                  {indicators.airspace}
                </span>
                <span className="text-[10px] text-gray-500 mb-0.5">/100</span>
              </div>
              <div className="h-1 bg-gray-800 rounded-full mt-2 overflow-hidden">
                <div className={`h-full rounded-full ${scoreColor(indicators.airspace)}`} style={{ width: `${indicators.airspace}%` }} />
              </div>
            </div>
            <div className="rounded-lg bg-[#0a0a0f] p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[11px] text-gray-400">مخاطر المدنيين</span>
              </div>
              <div className="flex items-end gap-1">
                <span className={`text-xl font-black ${scoreTextColor(indicators.civilian)}`}>
                  {indicators.civilian}
                </span>
                <span className="text-[10px] text-gray-500 mb-0.5">/100</span>
              </div>
              <div className="h-1 bg-gray-800 rounded-full mt-2 overflow-hidden">
                <div className={`h-full rounded-full ${scoreColor(indicators.civilian)}`} style={{ width: `${indicators.civilian}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Map + Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-sm font-bold text-white mb-3">موقع المدينة</h2>
            <LiveMap events={getCityEvents(selectedCity.id)} height="350px" showControls={false} center={[selectedCity.location.lat, selectedCity.location.lng]} zoom={11} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white mb-3">
              آخر الأحداث ({cityEvents.length})
            </h2>
            <div className="space-y-3 max-h-[350px] overflow-y-auto">
              {getCityEvents(selectedCity.id).length > 0 ? (
                getCityEvents(selectedCity.id).map(event => (
                  <EventCard key={event.id} event={event} />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  لا توجد أحداث حالية لهذه المدينة
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Cities list view
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-400" />
          المدن والمناطق المتابعة
        </h1>
        <span className="text-[11px] text-gray-500">{cities.length} مدن</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cities.map(city => {
          const cityEvents = cityEventsMap[city.id] || [];
          const indicators = computeIndicators(cityEvents);
          const riskLevel = computeRiskLevel(cityEvents);
          const lastUpdate = getLastUpdate(cityEvents);

          return (
            <Link
              key={city.id}
              to={`/cities/${city.id}`}
              className="rounded-xl border border-gray-800 bg-[#12121a] p-5 hover:border-gray-600 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                    {city.nameAr}
                  </h3>
                  <span className="text-xs text-gray-500">{city.countryAr} • {city.name}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold ${riskLevelColor(riskLevel)}`}>
                  {riskLevelTextAr(riskLevel)}
                </span>
              </div>

              {/* Mini indicators */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-500">عسكري</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${scoreColor(indicators.military)}`} style={{ width: `${indicators.military}%` }} />
                    </div>
                    <span className={`font-bold w-6 text-left ${scoreTextColor(indicators.military)}`}>{indicators.military}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-500">أجواء</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${scoreColor(indicators.airspace)}`} style={{ width: `${indicators.airspace}%` }} />
                    </div>
                    <span className={`font-bold w-6 text-left ${scoreTextColor(indicators.airspace)}`}>{indicators.airspace}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-500">مدنيين</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${scoreColor(indicators.civilian)}`} style={{ width: `${indicators.civilian}%` }} />
                    </div>
                    <span className={`font-bold w-6 text-left ${scoreTextColor(indicators.civilian)}`}>{indicators.civilian}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-500 border-t border-gray-800 pt-2">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {timeAgo(lastUpdate)}
                </span>
                <span>{cityEvents.length} أحداث</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
