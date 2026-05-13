import type { TranslationResult } from "./translator";

const KEY_HISTORY = "translationHistory";
const KEY_FAVORITES = "translationFavorites";
const KEY_DARK = "darkMode";
const KEY_AGREED = "privacyAgreed";
const KEY_STATS = "appStats";

export interface AppStats {
  totalTranslations: number;
  totalWords: number;
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

export const loadAgreed = (): boolean => readJson<boolean>(KEY_AGREED, false);
export const saveAgreed = (a: boolean): void => writeJson(KEY_AGREED, a);

export const loadStats = (): AppStats =>
  readJson<AppStats>(KEY_STATS, { totalTranslations: 0, totalWords: 0 });
export const saveStats = (s: AppStats): void => writeJson(KEY_STATS, s);
