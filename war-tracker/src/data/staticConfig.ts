import type { MapLayer, Source, CityData } from '../types';

/**
 * Static configuration data — NOT mock data.
 * These are UI configuration items (layer definitions, source metadata, city definitions)
 * that define the structure of the app, not fake events.
 */

export const mapLayers: MapLayer[] = [
  { id: 'military', name: 'Military Events', nameAr: 'أحداث عسكرية', color: '#ef4444', icon: '🔴', isActive: true },
  { id: 'alert', name: 'Alerts', nameAr: 'إنذارات', color: '#f59e0b', icon: '🟡', isActive: true },
  { id: 'official', name: 'Official Statements', nameAr: 'تصريحات رسمية', color: '#3b82f6', icon: '🔵', isActive: true },
  { id: 'airspace', name: 'Airspace Disruptions', nameAr: 'اضطرابات أجواء', color: '#f97316', icon: '🟠', isActive: true },
  { id: 'maritime', name: 'Maritime Risks', nameAr: 'مخاطر بحرية', color: '#a855f7', icon: '🟣', isActive: true },
  { id: 'fire', name: 'Thermal / Fire Points', nameAr: 'نقاط حرارية / حرائق', color: '#dc2626', icon: '🔥', isActive: true },
  { id: 'humanitarian', name: 'Humanitarian Updates', nameAr: 'تحديثات إنسانية', color: '#22c55e', icon: '🟢', isActive: true },
];

export const sources: Source[] = [
  { id: 'gdelt', name: 'GDELT Project', nameAr: 'مشروع GDELT', type: 'technical', trustLevel: 'confirmed', url: 'https://gdeltproject.org', lastUpdate: new Date(), isActive: true, eventCount: 0 },
  { id: 'newsapi', name: 'NewsAPI (Reuters, BBC, Al Jazeera)', nameAr: 'NewsAPI (رويترز، بي بي سي، الجزيرة)', type: 'media', trustLevel: 'high', url: 'https://newsapi.org', lastUpdate: new Date(), isActive: true, eventCount: 0 },
  { id: 'opensky', name: 'OpenSky Network', nameAr: 'شبكة OpenSky', type: 'technical', trustLevel: 'confirmed', url: 'https://opensky-network.org', lastUpdate: new Date(), isActive: true, eventCount: 0 },
  { id: 'gemini', name: 'Google Gemini AI', nameAr: 'جوجل جيميناي', type: 'technical', trustLevel: 'high', url: 'https://ai.google.dev', lastUpdate: new Date(), isActive: true, eventCount: 0 },
];

export const cities: CityData[] = [
  {
    id: 'tehran',
    name: 'Tehran',
    nameAr: 'طهران',
    country: 'Iran',
    countryAr: 'إيران',
    location: { lat: 35.6892, lng: 51.3890, name: 'Tehran', nameAr: 'طهران' },
    riskLevel: 'elevated',
    lastUpdate: new Date(),
    recentEvents: [],
    indicators: { military: 0, airspace: 0, civilian: 0 },
  },
  {
    id: 'telaviv',
    name: 'Tel Aviv',
    nameAr: 'تل أبيب',
    country: 'Israel',
    countryAr: 'إسرائيل',
    location: { lat: 32.0853, lng: 34.7818, name: 'Tel Aviv', nameAr: 'تل أبيب' },
    riskLevel: 'elevated',
    lastUpdate: new Date(),
    recentEvents: [],
    indicators: { military: 0, airspace: 0, civilian: 0 },
  },
  {
    id: 'haifa',
    name: 'Haifa',
    nameAr: 'حيفا',
    country: 'Israel',
    countryAr: 'إسرائيل',
    location: { lat: 32.7940, lng: 34.9896, name: 'Haifa', nameAr: 'حيفا' },
    riskLevel: 'moderate',
    lastUpdate: new Date(),
    recentEvents: [],
    indicators: { military: 0, airspace: 0, civilian: 0 },
  },
  {
    id: 'damascus',
    name: 'Damascus',
    nameAr: 'دمشق',
    country: 'Syria',
    countryAr: 'سوريا',
    location: { lat: 33.5138, lng: 36.2765, name: 'Damascus', nameAr: 'دمشق' },
    riskLevel: 'moderate',
    lastUpdate: new Date(),
    recentEvents: [],
    indicators: { military: 0, airspace: 0, civilian: 0 },
  },
  {
    id: 'beirut',
    name: 'Beirut',
    nameAr: 'بيروت',
    country: 'Lebanon',
    countryAr: 'لبنان',
    location: { lat: 33.8938, lng: 35.5018, name: 'Beirut', nameAr: 'بيروت' },
    riskLevel: 'moderate',
    lastUpdate: new Date(),
    recentEvents: [],
    indicators: { military: 0, airspace: 0, civilian: 0 },
  },
  {
    id: 'bahrain',
    name: 'Bahrain',
    nameAr: 'البحرين',
    country: 'Bahrain',
    countryAr: 'مملكة البحرين',
    location: { lat: 26.0667, lng: 50.5577, name: 'Bahrain', nameAr: 'البحرين' },
    riskLevel: 'moderate',
    lastUpdate: new Date(),
    recentEvents: [],
    indicators: { military: 0, airspace: 0, civilian: 0 },
  },
  {
    id: 'isfahan',
    name: 'Isfahan',
    nameAr: 'أصفهان',
    country: 'Iran',
    countryAr: 'إيران',
    location: { lat: 32.6546, lng: 51.6680, name: 'Isfahan', nameAr: 'أصفهان' },
    riskLevel: 'moderate',
    lastUpdate: new Date(),
    recentEvents: [],
    indicators: { military: 0, airspace: 0, civilian: 0 },
  },
];
