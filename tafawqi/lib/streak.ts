// F2 — streak system. Called from POST /api/attempts after a successful
// attempt insert. Returns the resulting streak so the API can include it
// in the response (used for the "🔥 N أيام" toast on /results).
//
// Day boundaries are UTC. We snap every comparison to midnight UTC so a
// student who finishes a quiz at 23:59 UTC and another at 00:01 UTC the
// next day correctly counts as two consecutive days.

import { prisma } from "@/lib/prisma";

export type StreakResult = {
  current: number;
  best: number;
  advanced: boolean;        // true if this call increased streakDays
  lastDate: string | null;  // ISO date (yyyy-mm-dd) of the most recent advance
};

function utcMidnight(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function daysBetween(a: Date, b: Date): number {
  const ms = utcMidnight(b).getTime() - utcMidnight(a).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

/**
 * Update a user's streak based on a fresh activity (i.e. a finished attempt).
 *
 *   - same day as streakLastDate          → no change
 *   - exactly one day after streakLastDate → streakDays += 1
 *   - any other gap (or no prior date)    → streakDays = 1 (fresh start)
 *
 * streakBestDays is bumped whenever streakDays passes it. The function is
 * safe to call multiple times per day — it's idempotent.
 */
export async function updateStreak(userId: string, now = new Date()): Promise<StreakResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { streakDays: true, streakBestDays: true, streakLastDate: true },
  });
  if (!user) {
    return { current: 0, best: 0, advanced: false, lastDate: null };
  }

  const today = utcMidnight(now);
  let nextDays = user.streakDays;
  let advanced = false;

  if (!user.streakLastDate) {
    nextDays = 1;
    advanced = true;
  } else {
    const diff = daysBetween(user.streakLastDate, today);
    if (diff === 0) {
      // already counted today
      advanced = false;
    } else if (diff === 1) {
      nextDays = user.streakDays + 1;
      advanced = true;
    } else {
      nextDays = 1;
      advanced = true;
    }
  }

  const nextBest = Math.max(user.streakBestDays, nextDays);

  if (advanced) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        streakDays: nextDays,
        streakBestDays: nextBest,
        streakLastDate: today,
      },
    });
  }

  return {
    current: nextDays,
    best: nextBest,
    advanced,
    lastDate: today.toISOString().slice(0, 10),
  };
}

/**
 * Returns the user's streak as currently stored — without advancing it.
 * Used by /api/me to render the streak badge without side-effects.
 *
 * Also auto-decays: if the user hasn't been active since 2+ days ago, the
 * displayed "current" is 0 (the DB value isn't reset until they finish a
 * new attempt, but the UI should reflect the fact that the streak is dead).
 */
export async function readStreak(userId: string, now = new Date()): Promise<StreakResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { streakDays: true, streakBestDays: true, streakLastDate: true },
  });
  if (!user) {
    return { current: 0, best: 0, advanced: false, lastDate: null };
  }
  const today = utcMidnight(now);
  let current = user.streakDays;
  if (user.streakLastDate) {
    const diff = daysBetween(user.streakLastDate, today);
    if (diff > 1) current = 0;
  } else {
    current = 0;
  }
  return {
    current,
    best: user.streakBestDays,
    advanced: false,
    lastDate: user.streakLastDate ? user.streakLastDate.toISOString().slice(0, 10) : null,
  };
}
