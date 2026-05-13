import type { TranslationResult } from "./translator";

const KEY_HISTORY = "translationHistory";
const KEY_FAVORITES = "translationFavorites";
const KEY_DARK = "darkMode";
const KEY_AGREED = "hasAgreedToTerms";
const KEY_AGREED_LEGACY = "privacyAgreed";
const KEY_STATS = "appStats";
const KEY_EXTENDED_STATS = "extendedStats";
const KEY_SEEN_TUTORIAL = "hasSeenTutorial";
const KEY_DAILY_WORD = "dailyWord";
const KEY_USER_ACHIEVEMENTS = "userAchievements";
const KEY_TRAINING_PROGRESS = "trainingProgress";
const KEY_TRAINING_LEVEL = "trainingLevel";
const KEY_TRAINING_STREAK = "trainingStreak";
const KEY_LAST_TRAINING_DATE = "lastTrainingDate";
const KEY_FEEDBACK_HISTORY = "feedbackHistory";
const KEY_DEVICE_ID = "deviceId";
const KEY_DONT_SHOW_LAUNCH_MESSAGE = "dontShowLaunchMessage";
const KEY_LAST_SEEN_NOTIFICATION = "lastSeenNotification";
const KEY_NOTIFICATIONS_ENABLED = "notificationsEnabled";

export interface AppStats {
  totalTranslations: number;
  totalWords: number;
}

export interface ExtendedStats {
  totalTranslations: number;
  totalWords: number;
  currentStreak: number;
  longestStreak: number;
  totalQuizzes: number;
  quizCorrectAnswers: number;
  weeklyActivity: number[];
  lastActiveDate: string | null;
}

export interface TrainingProgress {
  beginner: number;
  intermediate: number;
  advanced: number;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded — ignore */
  }
}

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* quota exceeded — ignore */
  }
}

export const loadHistory = (): TranslationResult[] =>
  readJson<TranslationResult[]>(KEY_HISTORY, []);
export const saveHistory = (h: TranslationResult[]): void =>
  writeJson(KEY_HISTORY, h.slice(0, 200));

export const loadFavorites = (): TranslationResult[] =>
  readJson<TranslationResult[]>(KEY_FAVORITES, []);
export const saveFavorites = (f: TranslationResult[]): void =>
  writeJson(KEY_FAVORITES, f);

export const loadDarkMode = (): boolean => readJson<boolean>(KEY_DARK, false);
export const saveDarkMode = (d: boolean): void => writeJson(KEY_DARK, d);

export const loadAgreed = (): boolean => {
  if (readRaw(KEY_AGREED) === "true") return true;
  return readJson<boolean>(KEY_AGREED_LEGACY, false);
};
export const saveAgreed = (a: boolean): void => {
  writeRaw(KEY_AGREED, a ? "true" : "false");
};

export const loadStats = (): AppStats =>
  readJson<AppStats>(KEY_STATS, { totalTranslations: 0, totalWords: 0 });
export const saveStats = (s: AppStats): void => writeJson(KEY_STATS, s);

export const loadSeenTutorial = (): boolean =>
  readRaw(KEY_SEEN_TUTORIAL) === "true";
export const saveSeenTutorial = (v: boolean): void =>
  writeRaw(KEY_SEEN_TUTORIAL, v ? "true" : "false");

const defaultExtended: ExtendedStats = {
  totalTranslations: 0,
  totalWords: 0,
  currentStreak: 0,
  longestStreak: 0,
  totalQuizzes: 0,
  quizCorrectAnswers: 0,
  weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
  lastActiveDate: null,
};

export const loadExtendedStats = (): ExtendedStats =>
  readJson<ExtendedStats>(KEY_EXTENDED_STATS, defaultExtended);
export const saveExtendedStats = (s: ExtendedStats): void =>
  writeJson(KEY_EXTENDED_STATS, s);

export interface DailyWordEntry {
  word: string;
  emoji: string;
  date: string;
}

export const loadDailyWord = (): DailyWordEntry | null =>
  readJson<DailyWordEntry | null>(KEY_DAILY_WORD, null);
export const saveDailyWord = (w: DailyWordEntry): void =>
  writeJson(KEY_DAILY_WORD, w);

export const loadAchievements = (): Record<string, { unlockedAt: number }> =>
  readJson(KEY_USER_ACHIEVEMENTS, {});
export const saveAchievements = (
  v: Record<string, { unlockedAt: number }>
): void => writeJson(KEY_USER_ACHIEVEMENTS, v);

const defaultTraining: TrainingProgress = {
  beginner: 0,
  intermediate: 0,
  advanced: 0,
};

export const loadTrainingProgress = (): TrainingProgress =>
  readJson<TrainingProgress>(KEY_TRAINING_PROGRESS, defaultTraining);
export const saveTrainingProgress = (v: TrainingProgress): void =>
  writeJson(KEY_TRAINING_PROGRESS, v);

export const loadTrainingLevel = (): string =>
  readRaw(KEY_TRAINING_LEVEL) || "beginner";
export const saveTrainingLevel = (v: string): void =>
  writeRaw(KEY_TRAINING_LEVEL, v);

export const loadTrainingStreak = (): number =>
  parseInt(readRaw(KEY_TRAINING_STREAK) || "0", 10);
export const saveTrainingStreak = (v: number): void =>
  writeRaw(KEY_TRAINING_STREAK, String(v));

export const loadLastTrainingDate = (): string | null =>
  readRaw(KEY_LAST_TRAINING_DATE);
export const saveLastTrainingDate = (v: string): void =>
  writeRaw(KEY_LAST_TRAINING_DATE, v);

export interface FeedbackItem {
  id: string;
  type: "suggestion" | "bug" | "praise" | "other";
  message: string;
  rating?: number;
  timestamp: number;
}

export const loadFeedbackHistory = (): FeedbackItem[] =>
  readJson<FeedbackItem[]>(KEY_FEEDBACK_HISTORY, []);
export const saveFeedbackHistory = (v: FeedbackItem[]): void =>
  writeJson(KEY_FEEDBACK_HISTORY, v);

export const loadDeviceId = (): string => {
  const existing = readRaw(KEY_DEVICE_ID);
  if (existing) return existing;
  const generated = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  writeRaw(KEY_DEVICE_ID, generated);
  return generated;
};

export const loadDontShowLaunchMessage = (): boolean =>
  readRaw(KEY_DONT_SHOW_LAUNCH_MESSAGE) === "true";
export const saveDontShowLaunchMessage = (v: boolean): void =>
  writeRaw(KEY_DONT_SHOW_LAUNCH_MESSAGE, v ? "true" : "false");

export const loadLastSeenNotification = (): string | null =>
  readRaw(KEY_LAST_SEEN_NOTIFICATION);
export const saveLastSeenNotification = (v: string): void =>
  writeRaw(KEY_LAST_SEEN_NOTIFICATION, v);

export const loadNotificationsEnabled = (): boolean => {
  const raw = readRaw(KEY_NOTIFICATIONS_ENABLED);
  return raw === null ? true : raw === "true";
};
export const saveNotificationsEnabled = (v: boolean): void =>
  writeRaw(KEY_NOTIFICATIONS_ENABLED, v ? "true" : "false");
