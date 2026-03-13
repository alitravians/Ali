import { AutoReplyRule, LogEntry, AppSettings, NotificationItem, DEFAULT_SETTINGS } from '../types';

const KEYS = {
  RULES: 'wa_auto_reply_rules',
  LOGS: 'wa_auto_reply_logs',
  SETTINGS: 'wa_auto_reply_settings',
  NOTIFICATIONS: 'wa_auto_reply_notifications',
};

function getItem<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    if (data) return JSON.parse(data);
    return fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

// Rules
export function getRules(): AutoReplyRule[] {
  return getItem<AutoReplyRule[]>(KEYS.RULES, []);
}

export function saveRules(rules: AutoReplyRule[]): void {
  setItem(KEYS.RULES, rules);
}

export function addRule(rule: AutoReplyRule): void {
  const rules = getRules();
  rules.push(rule);
  saveRules(rules);
}

export function updateRule(updated: AutoReplyRule): void {
  const rules = getRules().map(r => r.id === updated.id ? updated : r);
  saveRules(rules);
}

export function deleteRule(id: string): void {
  const rules = getRules().filter(r => r.id !== id);
  saveRules(rules);
}

export function toggleRule(id: string): void {
  const rules = getRules().map(r =>
    r.id === id ? { ...r, isEnabled: !r.isEnabled } : r
  );
  saveRules(rules);
}

// Logs
export function getLogs(): LogEntry[] {
  return getItem<LogEntry[]>(KEYS.LOGS, []);
}

export function saveLogs(logs: LogEntry[]): void {
  setItem(KEYS.LOGS, logs);
}

export function addLog(log: LogEntry): void {
  const logs = getLogs();
  logs.unshift(log);
  if (logs.length > 500) logs.length = 500;
  saveLogs(logs);
}

export function clearLogs(): void {
  saveLogs([]);
}

// Settings
export function getSettings(): AppSettings {
  return getItem<AppSettings>(KEYS.SETTINGS, DEFAULT_SETTINGS);
}

export function saveSettings(settings: AppSettings): void {
  setItem(KEYS.SETTINGS, settings);
}

// Notifications
export function getNotifications(): NotificationItem[] {
  return getItem<NotificationItem[]>(KEYS.NOTIFICATIONS, []);
}

export function saveNotifications(notifications: NotificationItem[]): void {
  setItem(KEYS.NOTIFICATIONS, notifications);
}

export function addNotification(notification: NotificationItem): void {
  const notifications = getNotifications();
  notifications.unshift(notification);
  if (notifications.length > 100) notifications.length = 100;
  saveNotifications(notifications);
}

export function markNotificationRead(id: string): void {
  const notifications = getNotifications().map(n =>
    n.id === id ? { ...n, isRead: true } : n
  );
  saveNotifications(notifications);
}

export function markAllNotificationsRead(): void {
  const notifications = getNotifications().map(n => ({ ...n, isRead: true }));
  saveNotifications(notifications);
}

export function clearNotifications(): void {
  saveNotifications([]);
}

// Demo data for initial showcase
export function loadDemoData(): void {
  const existingRules = getRules();
  if (existingRules.length > 0) return;

  const now = new Date().toISOString();
  const demoRules: AutoReplyRule[] = [
    {
      id: 'demo-1',
      keywords: ['وينك', 'فين', 'هل انت موجود', 'موجود'],
      replies: ['هلا! أنا مشغول حالياً، أرد عليك أول ما أفضى 👋', 'أهلاً، مو موجود حالياً بس أرد عليك بأقرب وقت'],
      matchType: 'fuzzy',
      isEnabled: true,
      delaySeconds: 2,
      scheduleEnabled: false,
      scheduleFrom: '09:00',
      scheduleTo: '22:00',
      createdAt: now,
      updatedAt: now,
      usageCount: 24,
    },
    {
      id: 'demo-2',
      keywords: ['السلام عليكم', 'هلا', 'مرحبا', 'أهلاً'],
      replies: ['وعليكم السلام! أنا مشغول حالياً، أكلمك لاحقاً إن شاء الله 🙏', 'هلا والله! مو فاضي الحين بس أرجعلك بأسرع وقت'],
      matchType: 'fuzzy',
      isEnabled: true,
      delaySeconds: 3,
      scheduleEnabled: false,
      scheduleFrom: '09:00',
      scheduleTo: '22:00',
      createdAt: now,
      updatedAt: now,
      usageCount: 35,
    },
    {
      id: 'demo-3',
      keywords: ['رد علي', 'جاوبني', 'ترد'],
      replies: ['أعذرني، أنا بعيد عن الجوال الحين. أرد عليك بأقرب فرصة ✌️'],
      matchType: 'fuzzy',
      isEnabled: true,
      delaySeconds: 1,
      scheduleEnabled: false,
      scheduleFrom: '09:00',
      scheduleTo: '22:00',
      createdAt: now,
      updatedAt: now,
      usageCount: 12,
    },
    {
      id: 'demo-4',
      keywords: ['نايم', 'تنام', 'نمت'],
      replies: ['هلا، أنا نايم الحين 😴 أرد عليك لما أصحى إن شاء الله'],
      matchType: 'fuzzy',
      isEnabled: false,
      delaySeconds: 5,
      scheduleEnabled: true,
      scheduleFrom: '23:00',
      scheduleTo: '08:00',
      createdAt: now,
      updatedAt: now,
      usageCount: 8,
    },
  ];

  saveRules(demoRules);

  const demoLogs: LogEntry[] = [
    {
      id: 'log-1',
      ruleId: 'demo-1',
      ruleName: 'وينك',
      incomingMessage: 'وينك يا بطل ما ترد؟',
      sentReply: 'هلا! أنا مشغول حالياً، أرد عليك أول ما أفضى 👋',
      senderNumber: '+966501234567',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      status: 'success',
    },
    {
      id: 'log-2',
      ruleId: 'demo-2',
      ruleName: 'السلام عليكم',
      incomingMessage: 'السلام عليكم كيفك؟',
      sentReply: 'وعليكم السلام! أنا مشغول حالياً، أكلمك لاحقاً إن شاء الله 🙏',
      senderNumber: '+966507654321',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      status: 'success',
    },
    {
      id: 'log-3',
      ruleId: 'demo-3',
      ruleName: 'رد علي',
      incomingMessage: 'يا خوي ترد علي ولا لا',
      sentReply: 'أعذرني، أنا بعيد عن الجوال الحين. أرد عليك بأقرب فرصة ✌️',
      senderNumber: '+966509876543',
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      status: 'success',
    },
    {
      id: 'log-4',
      ruleId: 'demo-2',
      ruleName: 'السلام عليكم',
      incomingMessage: 'مرحبا عندك وقت؟',
      sentReply: 'هلا والله! مو فاضي الحين بس أرجعلك بأسرع وقت',
      senderNumber: '+966501112233',
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      status: 'failed',
      errorMessage: 'فشل في إرسال الرد - صلاحية الإشعارات غير مفعلة',
    },
  ];

  saveLogs(demoLogs);
}
