// Local Notifications Service
// Manages daily reminders for Wudu, Salah, and Adhkar

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

// Notification IDs (fixed IDs for scheduled notifications)
const NOTIFICATION_IDS = {
  DAILY_REMINDER: 1001,
  ADHKAR_REMINDER: 1002,
  WEEKLY_MOTIVATION: 1003,
};

export interface NotificationSettings {
  dailyReminderEnabled: boolean;
  dailyReminderHour: number;
  dailyReminderMinute: number;
  adhkarReminderEnabled: boolean;
  adhkarReminderHour: number;
  adhkarReminderMinute: number;
  weeklyMotivationEnabled: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  dailyReminderEnabled: true,
  dailyReminderHour: 8,
  dailyReminderMinute: 0,
  adhkarReminderEnabled: true,
  adhkarReminderHour: 20,
  adhkarReminderMinute: 0,
  weeklyMotivationEnabled: true,
};

const STORAGE_KEY = 'wudu-salah-notification-settings';

// ============ Settings Management ============

export function loadSettings(): NotificationSettings {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: NotificationSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

// ============ Permission Handling ============

async function requestPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    console.log('[LocalNotif] Not native platform, skipping');
    return false;
  }

  const permStatus = await LocalNotifications.checkPermissions();
  if (permStatus.display === 'granted') return true;

  const reqResult = await LocalNotifications.requestPermissions();
  return reqResult.display === 'granted';
}

// ============ Notification Scheduling ============

async function cancelAllScheduled(): Promise<void> {
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel({ notifications: pending.notifications });
    console.log('[LocalNotif] Cancelled', pending.notifications.length, 'notifications');
  }
}

function getNextScheduleDate(hour: number, minute: number): Date {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }
  return target;
}

const DAILY_MESSAGES = [
  'حان وقت مراجعة الوضوء والصلاة 🕌',
  'هل راجعت دروسك اليوم؟ تعلم الوضوء والصلاة بانتظارك 💧',
  'لا تنسَ تعلم شيء جديد اليوم عن الصلاة 📖',
  'ابدأ يومك بمراجعة أحكام الوضوء والصلاة ✨',
  'دقائق من التعلم تُحدث فرقاً كبيراً 🌟',
];

const ADHKAR_MESSAGES = [
  'لا تنسَ أذكار بعد الصلاة 🤲',
  'هل قلت أذكارك اليوم؟ 📿',
  'حافظ على أذكارك بعد كل صلاة 🌙',
  'الأذكار حصن المسلم - راجعها الآن 🛡️',
];

const MOTIVATION_MESSAGES = [
  'أكمل اختبار هذا الأسبوع واحصل على إنجاز جديد! 🏆',
  'تحدَّ نفسك في اختبار الوضوء والصلاة هذا الأسبوع 📝',
  'هل أكملت جميع الدروس؟ اختبر معلوماتك الآن! ⭐',
];

function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

export async function scheduleNotifications(settings: NotificationSettings): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    console.log('[LocalNotif] Not native platform, skipping schedule');
    return;
  }

  const granted = await requestPermission();
  if (!granted) {
    console.log('[LocalNotif] Permission not granted');
    return;
  }

  await cancelAllScheduled();

  const notifications = [];

  // Daily learning reminder
  if (settings.dailyReminderEnabled) {
    const scheduleDate = getNextScheduleDate(settings.dailyReminderHour, settings.dailyReminderMinute);
    notifications.push({
      id: NOTIFICATION_IDS.DAILY_REMINDER,
      title: 'تعلم الوضوء والصلاة',
      body: getRandomMessage(DAILY_MESSAGES),
      schedule: {
        at: scheduleDate,
        repeats: true,
        every: 'day' as const,
      },
      smallIcon: 'ic_launcher',
      largeIcon: 'ic_launcher',
      sound: 'default',
    });
    console.log('[LocalNotif] Daily reminder scheduled at', settings.dailyReminderHour + ':' + String(settings.dailyReminderMinute).padStart(2, '0'));
  }

  // Adhkar reminder
  if (settings.adhkarReminderEnabled) {
    const scheduleDate = getNextScheduleDate(settings.adhkarReminderHour, settings.adhkarReminderMinute);
    notifications.push({
      id: NOTIFICATION_IDS.ADHKAR_REMINDER,
      title: 'أذكار بعد الصلاة',
      body: getRandomMessage(ADHKAR_MESSAGES),
      schedule: {
        at: scheduleDate,
        repeats: true,
        every: 'day' as const,
      },
      smallIcon: 'ic_launcher',
      largeIcon: 'ic_launcher',
      sound: 'default',
    });
    console.log('[LocalNotif] Adhkar reminder scheduled at', settings.adhkarReminderHour + ':' + String(settings.adhkarReminderMinute).padStart(2, '0'));
  }

  // Weekly motivation (every Friday)
  if (settings.weeklyMotivationEnabled) {
    const now = new Date();
    const friday = new Date();
    const currentDay = now.getDay();
    const daysUntilFriday = (5 - currentDay + 7) % 7 || 7;
    friday.setDate(now.getDate() + daysUntilFriday);
    friday.setHours(12, 0, 0, 0);

    notifications.push({
      id: NOTIFICATION_IDS.WEEKLY_MOTIVATION,
      title: 'تحدي الأسبوع 🏆',
      body: getRandomMessage(MOTIVATION_MESSAGES),
      schedule: {
        at: friday,
        repeats: true,
        every: 'week' as const,
      },
      smallIcon: 'ic_launcher',
      largeIcon: 'ic_launcher',
      sound: 'default',
    });
    console.log('[LocalNotif] Weekly motivation scheduled for Fridays at 12:00');
  }

  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications });
    console.log('[LocalNotif] Scheduled', notifications.length, 'notifications');
  }
}

// ============ Initialization ============

export async function initLocalNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // Listen for notification actions
    LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      console.log('[LocalNotif] Action:', action.notification.title);
    });

    // Schedule with saved settings
    const settings = loadSettings();
    await scheduleNotifications(settings);
    console.log('[LocalNotif] Initialized successfully');
  } catch (error) {
    console.error('[LocalNotif] Init error:', error);
  }
}
