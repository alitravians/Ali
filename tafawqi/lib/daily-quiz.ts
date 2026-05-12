// F2 — daily quiz selection and bonus logic.
//
// The admin can set `daily_quiz_slug` from the admin settings panel; if set
// to a non-empty value AND the matching quiz is active, that's today's
// "تحدّي اليوم". Otherwise no daily quiz is exposed (UI hides the banner).
//
// `daily_quiz_bonus` controls the extra points awarded the first time a
// user completes the daily quiz on a given UTC day. Default = 20.

import { prisma } from "@/lib/prisma";

export type DailyQuizInfo = {
  slug: string;
  title: string;
  description: string;
  durationSec: number;
  questionCount: number;
} | null;

export async function getDailyQuiz(): Promise<DailyQuizInfo> {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: "daily_quiz_slug" },
  });
  const slug = (setting?.value ?? "").trim();
  if (!slug) return null;
  const quiz = await prisma.quiz.findFirst({
    where: { slug, isActive: true },
    select: {
      slug: true,
      title: true,
      description: true,
      durationSec: true,
      questionCount: true,
    },
  });
  return quiz ?? null;
}

export async function getDailyQuizBonus(): Promise<number> {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: "daily_quiz_bonus" },
  });
  const n = Number.parseInt((setting?.value ?? "20").trim(), 10);
  if (!Number.isFinite(n) || n < 0 || n > 500) return 20;
  return n;
}

/**
 * Returns true if `userId` has not yet claimed today's daily-quiz bonus.
 * Day boundaries = UTC (matches streak logic).
 */
export async function canClaimDailyBonus(userId: string, now = new Date()): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { dailyQuizClaimedAt: true },
  });
  if (!user?.dailyQuizClaimedAt) return true;
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const last = new Date(Date.UTC(
    user.dailyQuizClaimedAt.getUTCFullYear(),
    user.dailyQuizClaimedAt.getUTCMonth(),
    user.dailyQuizClaimedAt.getUTCDate(),
  ));
  return last.getTime() !== today.getTime();
}

export async function markDailyClaimed(userId: string, now = new Date()): Promise<void> {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  await prisma.user.update({
    where: { id: userId },
    data: { dailyQuizClaimedAt: today },
  });
}
