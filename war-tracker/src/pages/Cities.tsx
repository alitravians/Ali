import { useParams, Link } from 'react-router-dom';
import { cities } from '../data/staticConfig';
import { useLiveData } from '../context/LiveDataContext';
import { riskLevelColor, riskLevelTextAr, scoreColor, scoreTextColor, timeAgo } from '../utils/helpers';
import EventCard from '../components/shared/EventCard';
import LiveMap from '../components/map/LiveMap';
import { Building2, Clock, ArrowRight, Activity, Plane, Users } from 'lucide-react';

export default function Cities() {
  const { events } = useLiveData();
  const { cityId } = useParams();
  const selectedCity = cityId ? cities.find(c => c.id === cityId) : null;

  // Get live events for city
  const getCityEvents = (cId: string) => {
    const cityEvents = events.filter(e => e.relatedCities.includes(cId));
    return cityEvents.slice(0, 10);
  };

  if (selectedCity) {
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
            <span className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${riskLevelColor(selectedCity.riskLevel)}`}>
              مستوى الخطر: {riskLevelTextAr(selectedCity.riskLevel)}
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
                <span className={`text-xl font-black ${scoreTextColor(selectedCity.indicators.military)}`}>
                  {selectedCity.indicators.military}
                </span>
                <span className="text-[10px] text-gray-500 mb-0.5">/100</span>
              </div>
              <div className="h-1 bg-gray-800 rounded-full mt-2 overflow-hidden">
                <div className={`h-full rounded-full ${scoreColor(selectedCity.indicators.military)}`} style={{ width: `${selectedCity.indicators.military}%` }} />
              </div>
            </div>
            <div className="rounded-lg bg-[#0a0a0f] p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Plane className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-[11px] text-gray-400">مخاطر الأجواء</span>
              </div>
              <div className="flex items-end gap-1">
                <span className={`text-xl font-black ${scoreTextColor(selectedCity.indicators.airspace)}`}>
                  {selectedCity.indicators.airspace}
                </span>
                <span className="text-[10px] text-gray-500 mb-0.5">/100</span>
              </div>
              <div className="h-1 bg-gray-800 rounded-full mt-2 overflow-hidden">
                <div className={`h-full rounded-full ${scoreColor(selectedCity.indicators.airspace)}`} style={{ width: `${selectedCity.indicators.airspace}%` }} />
              </div>
            </div>
            <div className="rounded-lg bg-[#0a0a0f] p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[11px] text-gray-400">مخاطر المدنيين</span>
              </div>
              <div className="flex items-end gap-1">
                <span className={`text-xl font-black ${scoreTextColor(selectedCity.indicators.civilian)}`}>
                  {selectedCity.indicators.civilian}
                </span>
                <span className="text-[10px] text-gray-500 mb-0.5">/100</span>
              </div>
              <div className="h-1 bg-gray-800 rounded-full mt-2 overflow-hidden">
                <div className={`h-full rounded-full ${scoreColor(selectedCity.indicators.civilian)}`} style={{ width: `${selectedCity.indicators.civilian}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Map + Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-sm font-bold text-white mb-3">موقع المدينة</h2>
            <LiveMap events={getCityEvents(selectedCity.id)} height="350px" showControls={false} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white mb-3">
              آخر الأحداث ({getCityEvents(selectedCity.id).length})
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
        {cities.map(city => (
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
              <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold ${riskLevelColor(city.riskLevel)}`}>
                {riskLevelTextAr(city.riskLevel)}
              </span>
            </div>

            {/* Mini indicators */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-500">عسكري</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${scoreColor(city.indicators.military)}`} style={{ width: `${city.indicators.military}%` }} />
                  </div>
                  <span className={`font-bold w-6 text-left ${scoreTextColor(city.indicators.military)}`}>{city.indicators.military}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-500">أجواء</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${scoreColor(city.indicators.airspace)}`} style={{ width: `${city.indicators.airspace}%` }} />
                  </div>
                  <span className={`font-bold w-6 text-left ${scoreTextColor(city.indicators.airspace)}`}>{city.indicators.airspace}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-500">مدنيين</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${scoreColor(city.indicators.civilian)}`} style={{ width: `${city.indicators.civilian}%` }} />
                  </div>
                  <span className={`font-bold w-6 text-left ${scoreTextColor(city.indicators.civilian)}`}>{city.indicators.civilian}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-500 border-t border-gray-800 pt-2">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeAgo(city.lastUpdate)}
              </span>
              <span>{events.filter(e => e.relatedCities.includes(city.id)).length} أحداث</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
