import { useEffect, useState } from "react";
import { wordDictionary } from "../data/dictionary";
import {
  loadDailyWord,
  saveDailyWord,
  type DailyWordEntry,
} from "../storage";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function pickRandomEntry(): { word: string; emoji: string } {
  const keys = Object.keys(wordDictionary);
  const idx = Math.floor(Math.random() * keys.length);
  const word = keys[idx];
  return { word, emoji: wordDictionary[word] };
}

/**
 * Returns the cached daily word for today, or generates and persists a new one
 * if today's date hasn't been seen yet. Mirrors the original deployed bundle's
 * behaviour (see recovered/original-bundle.beautified.js around the dailyWord
 * useEffect).
 */
export function useDailyWord(): DailyWordEntry {
  const [entry, setEntry] = useState<DailyWordEntry>(() => {
    const stored = loadDailyWord();
    const date = todayIso();
    if (stored && stored.date === date) return stored;
    const { word, emoji } = pickRandomEntry();
    const fresh: DailyWordEntry = { word, emoji, date };
    saveDailyWord(fresh);
    return fresh;
  });

  // Re-roll automatically when the date changes while the app is open.
  useEffect(() => {
    const tick = () => {
      const date = todayIso();
      setEntry((prev) => {
        if (prev.date === date) return prev;
        const { word, emoji } = pickRandomEntry();
        const fresh: DailyWordEntry = { word, emoji, date };
        saveDailyWord(fresh);
        return fresh;
      });
    };
    const interval = window.setInterval(tick, 60 * 1000);
    return () => window.clearInterval(interval);
  }, []);

  return entry;
}
