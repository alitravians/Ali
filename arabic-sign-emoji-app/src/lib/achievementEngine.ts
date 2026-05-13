import { achievements, type Achievement } from "../data/achievements";
import type { ExtendedStats, TrainingProgress } from "../storage";

export interface AchievementSnapshot {
  unlockedIds: Record<string, { unlockedAt: number }>;
}

export interface AchievementContext {
  extendedStats: ExtendedStats;
  trainingProgress: TrainingProgress;
  favoritesCount: number;
}

/**
 * Returns the IDs of achievements that should be unlocked given the current
 * snapshot and context, but are not yet present in the snapshot. Matches the
 * switch on `type` from the original deployed bundle (recovered/original-
 * bundle.beautified.js around the achievement-check useCallback).
 */
export function findNewlyUnlocked(
  snapshot: AchievementSnapshot,
  context: AchievementContext
): Achievement[] {
  const result: Achievement[] = [];
  for (const a of achievements) {
    if (snapshot.unlockedIds[a.id]) continue;
    if (qualifies(a, context)) result.push(a);
  }
  return result;
}

function qualifies(a: Achievement, ctx: AchievementContext): boolean {
  const { extendedStats: ext, trainingProgress: tp, favoritesCount } = ctx;
  switch (a.type) {
    case "translations":
      return ext.totalTranslations >= a.requirement;
    case "words":
      return ext.totalWords >= a.requirement;
    case "streak":
      return ext.longestStreak >= a.requirement;
    case "quiz":
      if (a.id === "quiz_perfect") return ext.quizCorrectAnswers >= 100;
      return ext.totalQuizzes >= a.requirement;
    case "training":
      if (a.id.includes("beginner")) return tp.beginner >= a.requirement;
      if (a.id.includes("intermediate"))
        return tp.intermediate >= a.requirement;
      if (a.id.includes("advanced")) return tp.advanced >= a.requirement;
      return false;
    case "favorites":
      return favoritesCount >= a.requirement;
    default:
      return false;
  }
}

export function progressFor(
  a: Achievement,
  ctx: AchievementContext
): { current: number; required: number; pct: number } {
  const { extendedStats: ext, trainingProgress: tp, favoritesCount } = ctx;
  let current = 0;
  switch (a.type) {
    case "translations":
      current = ext.totalTranslations;
      break;
    case "words":
      current = ext.totalWords;
      break;
    case "streak":
      current = ext.longestStreak;
      break;
    case "quiz":
      current =
        a.id === "quiz_perfect" ? ext.quizCorrectAnswers : ext.totalQuizzes;
      break;
    case "training":
      if (a.id.includes("beginner")) current = tp.beginner;
      else if (a.id.includes("intermediate")) current = tp.intermediate;
      else if (a.id.includes("advanced")) current = tp.advanced;
      break;
    case "favorites":
      current = favoritesCount;
      break;
  }
  const required = a.requirement;
  const pct = Math.min(100, Math.round((current / required) * 100));
  return { current, required, pct };
}
