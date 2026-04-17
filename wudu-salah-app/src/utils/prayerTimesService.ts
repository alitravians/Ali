// Prayer Times Service
// Fetches real prayer times based on user's geolocation using Aladhan API

import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { LocalNotifications } from '@capacitor/local-notifications';

// Prayer notification IDs (2001-2005 to avoid collision with other notification IDs)
const PRAYER_NOTIFICATION_IDS = {
  Fajr: 2001,
  Dhuhr: 2002,
  Asr: 2003,
  Maghrib: 2004,
  Isha: 2005,
};

const PRAYER_NAMES_AR: Record<string, string> = {
  Fajr: 'الفجر',
  Dhuhr: 'الظهر',
  Asr: 'العصر',
  Maghrib: 'المغرب',
  Isha: 'العشاء',
};

export interface PrayerTimes {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  Sunrise: string;
  Sunset: string;
}

export interface PrayerTimesSettings {
  enabled: boolean;
  latitude: number | null;
  longitude: number | null;
  lastFetchDate: string | null;
  cachedTimes: PrayerTimes | null;
  notifyBeforeMinutes: number;
}

const DEFAULT_PRAYER_SETTINGS: PrayerTimesSettings = {
  enabled: false,
  latitude: null,
  longitude: null,
  lastFetchDate: null,
  cachedTimes: null,
  notifyBeforeMinutes: 10,
};

const PRAYER_STORAGE_KEY = 'wudu-salah-prayer-settings';

// ============ Settings ============

export function loadPrayerSettings(): PrayerTimesSettings {
  const saved = localStorage.getItem(PRAYER_STORAGE_KEY);
  if (saved) {
    return { ...DEFAULT_PRAYER_SETTINGS, ...JSON.parse(saved) };
  }
  return { ...DEFAULT_PRAYER_SETTINGS };
}

export function savePrayerSettings(settings: PrayerTimesSettings): void {
  localStorage.setItem(PRAYER_STORAGE_KEY, JSON.stringify(settings));
}

// ============ Geolocation ============

export async function getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
  try {
    if (!Capacitor.isNativePlatform()) {
      // Browser fallback
      return new Promise((resolve) => {
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => resolve(null),
            { timeout: 10000 }
          );
        } else {
          resolve(null);
        }
      });
    }

    const permStatus = await Geolocation.checkPermissions();
    if (permStatus.location === 'denied') {
      const reqResult = await Geolocation.requestPermissions();
      if (reqResult.location === 'denied') {
        console.log('[PrayerTimes] Location permission denied');
        return null;
      }
    }

    const position = await Geolocation.getCurrentPosition({ timeout: 10000 });
    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };
  } catch (error) {
    console.error('[PrayerTimes] Geolocation error:', error);
    return null;
  }
}

// ============ API ============

export async function fetchPrayerTimes(lat: number, lng: number): Promise<PrayerTimes | null> {
  try {
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

    // Method 4 = Umm Al-Qura (Saudi Arabia / Gulf region)
    const url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=4`;

    const response = await fetch(url);
    if (!response.ok) {
      console.error('[PrayerTimes] API error:', response.status);
      return null;
    }

    const data = await response.json();
    const timings = data.data.timings;

    return {
      Fajr: timings.Fajr,
      Dhuhr: timings.Dhuhr,
      Asr: timings.Asr,
      Maghrib: timings.Maghrib,
      Isha: timings.Isha,
      Sunrise: timings.Sunrise,
      Sunset: timings.Sunset,
    };
  } catch (error) {
    console.error('[PrayerTimes] Fetch error:', error);
    return null;
  }
}

// ============ Notification Scheduling ============

function parseTime(timeStr: string): { hour: number; minute: number } {
  const [h, m] = timeStr.split(':').map(Number);
  return { hour: h, minute: m };
}

export async function schedulePrayerNotifications(settings: PrayerTimesSettings): Promise<void> {
  if (!Capacitor.isNativePlatform() || !settings.enabled || !settings.cachedTimes) {
    return;
  }

  // Cancel existing prayer notifications
  const existingIds = Object.values(PRAYER_NOTIFICATION_IDS);
  try {
    await LocalNotifications.cancel({
      notifications: existingIds.map((id) => ({ id })),
    });
  } catch {
    // Ignore cancel errors
  }

  const notifications = [];
  const prayerKeys = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;

  for (const prayer of prayerKeys) {
    const timeStr = settings.cachedTimes[prayer];
    if (!timeStr) continue;

    const { hour, minute } = parseTime(timeStr);

    // Schedule notification X minutes before prayer time
    let notifMinute = minute - settings.notifyBeforeMinutes;
    let notifHour = hour;
    if (notifMinute < 0) {
      notifMinute += 60;
      notifHour -= 1;
      if (notifHour < 0) notifHour = 23;
    }

    const scheduleDate = new Date();
    scheduleDate.setHours(notifHour, notifMinute, 0, 0);

    // If time already passed today, schedule for tomorrow
    if (scheduleDate <= new Date()) {
      scheduleDate.setDate(scheduleDate.getDate() + 1);
    }

    const prayerNameAr = PRAYER_NAMES_AR[prayer];
    notifications.push({
      id: PRAYER_NOTIFICATION_IDS[prayer],
      title: `حان وقت صلاة ${prayerNameAr} 🕌`,
      body: `صلاة ${prayerNameAr} الساعة ${timeStr} - لا تنسَ الصلاة في وقتها`,
      schedule: {
        at: scheduleDate,
        repeats: true,
        every: 'day' as const,
      },
      smallIcon: 'ic_launcher',
      largeIcon: 'ic_launcher',
      sound: 'default',
    });
  }

  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications });
    console.log('[PrayerTimes] Scheduled', notifications.length, 'prayer notifications');
  }
}

// ============ Initialization ============

export async function initPrayerTimes(): Promise<PrayerTimesSettings> {
  const settings = loadPrayerSettings();

  if (!settings.enabled) return settings;

  // Check if we need to re-fetch (daily)
  const today = new Date().toISOString().split('T')[0];
  if (settings.lastFetchDate === today && settings.cachedTimes) {
    // Already fetched today, just reschedule
    await schedulePrayerNotifications(settings);
    return settings;
  }

  // Get location
  let lat = settings.latitude;
  let lng = settings.longitude;

  if (lat === null || lng === null) {
    const loc = await getCurrentLocation();
    if (loc) {
      lat = loc.lat;
      lng = loc.lng;
    }
  }

  if (lat === null || lng === null) {
    console.log('[PrayerTimes] No location available');
    return settings;
  }

  // Fetch new times
  const times = await fetchPrayerTimes(lat, lng);
  if (times) {
    settings.latitude = lat;
    settings.longitude = lng;
    settings.lastFetchDate = today;
    settings.cachedTimes = times;
    savePrayerSettings(settings);
    await schedulePrayerNotifications(settings);
    console.log('[PrayerTimes] Updated prayer times:', times);
  }

  return settings;
}

// ============ Enable/Disable ============

export async function enablePrayerTimes(): Promise<PrayerTimesSettings> {
  const loc = await getCurrentLocation();
  if (!loc) {
    throw new Error('LOCATION_DENIED');
  }

  const times = await fetchPrayerTimes(loc.lat, loc.lng);
  if (!times) {
    throw new Error('FETCH_FAILED');
  }

  const today = new Date().toISOString().split('T')[0];
  const settings: PrayerTimesSettings = {
    enabled: true,
    latitude: loc.lat,
    longitude: loc.lng,
    lastFetchDate: today,
    cachedTimes: times,
    notifyBeforeMinutes: 10,
  };

  savePrayerSettings(settings);
  await schedulePrayerNotifications(settings);
  return settings;
}

export async function disablePrayerTimes(): Promise<void> {
  const settings = loadPrayerSettings();
  settings.enabled = false;
  savePrayerSettings(settings);

  // Cancel prayer notifications
  if (Capacitor.isNativePlatform()) {
    const existingIds = Object.values(PRAYER_NOTIFICATION_IDS);
    try {
      await LocalNotifications.cancel({
        notifications: existingIds.map((id) => ({ id })),
      });
    } catch {
      // Ignore
    }
  }
}
