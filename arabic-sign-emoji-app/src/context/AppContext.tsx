import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { translate, type TranslationResult } from "../translator";
import {
  loadAgreed,
  loadDarkMode,
  loadExtendedStats,
  loadFavorites,
  loadHistory,
  loadSeenTutorial,
  loadStats,
  saveAgreed,
  saveDarkMode,
  saveExtendedStats,
  saveFavorites,
  saveHistory,
  saveSeenTutorial,
  saveStats,
  type AppStats,
  type ExtendedStats,
} from "../storage";

interface AppContextValue {
  dark: boolean;
  toggleDark: () => void;

  agreed: boolean;
  acceptAgreement: () => void;

  seenTutorial: boolean;
  markTutorialSeen: () => void;
  restartTutorial: () => void;
  tutorialOpen: boolean;
  openTutorial: () => void;
  closeTutorial: () => void;

  input: string;
  setInput: (v: string) => void;

  result: TranslationResult | null;
  setResult: (r: TranslationResult | null) => void;

  history: TranslationResult[];
  favorites: TranslationResult[];
  favoritesSet: Set<string>;
  stats: AppStats;
  extendedStats: ExtendedStats;

  handleTranslate: (text?: string) => void;
  toggleFavorite: (item: TranslationResult) => void;
  deleteHistory: (input: string) => void;
  clearHistory: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState<boolean>(loadDarkMode());
  const [agreed, setAgreed] = useState<boolean>(loadAgreed());
  const [seenTutorial, setSeenTutorial] = useState<boolean>(loadSeenTutorial());
  const [tutorialOpen, setTutorialOpen] = useState<boolean>(false);
  const [input, setInput] = useState<string>("");
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [history, setHistory] = useState<TranslationResult[]>(loadHistory());
  const [favorites, setFavorites] = useState<TranslationResult[]>(loadFavorites());
  const [stats, setStats] = useState<AppStats>(loadStats());
  const [extendedStats, setExtendedStats] = useState<ExtendedStats>(loadExtendedStats());

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
    saveDarkMode(dark);
  }, [dark]);

  const toggleDark = useCallback(() => setDark((d) => !d), []);

  const acceptAgreement = useCallback(() => {
    saveAgreed(true);
    setAgreed(true);
  }, []);

  const markTutorialSeen = useCallback(() => {
    saveSeenTutorial(true);
    setSeenTutorial(true);
    setTutorialOpen(false);
  }, []);

  const restartTutorial = useCallback(() => {
    setTutorialOpen(true);
  }, []);

  const openTutorial = useCallback(() => setTutorialOpen(true), []);
  const closeTutorial = useCallback(() => {
    setTutorialOpen(false);
    if (!seenTutorial) {
      saveSeenTutorial(true);
      setSeenTutorial(true);
    }
  }, [seenTutorial]);

  const favoritesSet = useMemo(
    () => new Set(favorites.map((f) => f.input)),
    [favorites]
  );

  const persistHistory = useCallback((next: TranslationResult[]) => {
    setHistory(next);
    saveHistory(next);
  }, []);

  const persistFavorites = useCallback((next: TranslationResult[]) => {
    setFavorites(next);
    saveFavorites(next);
  }, []);

  const updateActivity = useCallback((wordCount: number) => {
    setExtendedStats((prev) => {
      const today = new Date();
      const dayIndex = today.getDay();
      const todayIso = today.toISOString().slice(0, 10);
      const weeklyActivity = [...prev.weeklyActivity];
      weeklyActivity[dayIndex] = (weeklyActivity[dayIndex] || 0) + 1;

      let currentStreak = prev.currentStreak;
      if (prev.lastActiveDate !== todayIso) {
        if (prev.lastActiveDate) {
          const last = new Date(prev.lastActiveDate);
          const diff = Math.floor(
            (today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (diff === 1) currentStreak = prev.currentStreak + 1;
          else if (diff > 1) currentStreak = 1;
        } else {
          currentStreak = 1;
        }
      }
      const longestStreak = Math.max(prev.longestStreak, currentStreak);
      const next: ExtendedStats = {
        ...prev,
        totalTranslations: prev.totalTranslations + 1,
        totalWords: prev.totalWords + wordCount,
        currentStreak,
        longestStreak,
        weeklyActivity,
        lastActiveDate: todayIso,
      };
      saveExtendedStats(next);
      return next;
    });
  }, []);

  const handleTranslate = useCallback(
    (text?: string) => {
      const value = (text ?? input).trim();
      if (!value) return;
      const r = translate(value);
      setResult(r);
      setInput(value);
      const filtered = history.filter((h) => h.input !== value);
      persistHistory([r, ...filtered].slice(0, 200));
      const nextStats: AppStats = {
        totalTranslations: stats.totalTranslations + 1,
        totalWords: stats.totalWords + r.tokens.length,
      };
      setStats(nextStats);
      saveStats(nextStats);
      updateActivity(r.tokens.length);
    },
    [input, history, stats, persistHistory, updateActivity]
  );

  const toggleFavorite = useCallback(
    (item: TranslationResult) => {
      const exists = favorites.some((f) => f.input === item.input);
      const next = exists
        ? favorites.filter((f) => f.input !== item.input)
        : [item, ...favorites];
      persistFavorites(next);
    },
    [favorites, persistFavorites]
  );

  const deleteHistory = useCallback(
    (key: string) => {
      persistHistory(history.filter((h) => h.input !== key));
    },
    [history, persistHistory]
  );

  const clearHistory = useCallback(() => {
    persistHistory([]);
  }, [persistHistory]);

  const value = useMemo<AppContextValue>(
    () => ({
      dark,
      toggleDark,
      agreed,
      acceptAgreement,
      seenTutorial,
      markTutorialSeen,
      restartTutorial,
      tutorialOpen,
      openTutorial,
      closeTutorial,
      input,
      setInput,
      result,
      setResult,
      history,
      favorites,
      favoritesSet,
      stats,
      extendedStats,
      handleTranslate,
      toggleFavorite,
      deleteHistory,
      clearHistory,
    }),
    [
      dark,
      toggleDark,
      agreed,
      acceptAgreement,
      seenTutorial,
      markTutorialSeen,
      restartTutorial,
      tutorialOpen,
      openTutorial,
      closeTutorial,
      input,
      result,
      history,
      favorites,
      favoritesSet,
      stats,
      extendedStats,
      handleTranslate,
      toggleFavorite,
      deleteHistory,
      clearHistory,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
