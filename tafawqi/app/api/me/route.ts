import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { levelForPoints } from "@/lib/levels";
import { readStreak } from "@/lib/streak";
import { getDailyQuiz, canClaimDailyBonus } from "@/lib/daily-quiz";

export const dynamic = "force-dynamic";

async function getRegistrationOpen(): Promise<boolean> {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: "registration_open" },
    });
    return setting?.value !== "false";
  } catch {
    return true;
  }
}

export async function GET() {
  const user = await getCurrentUser();
  const registrationOpen = await getRegistrationOpen();
  if (!user) {
    // F2 — even guests see the daily-quiz banner (it links to /login).
    const dailyQuiz = await getDailyQuiz();
    return NextResponse.json({ user: null, registrationOpen, dailyQuiz });
  }

  // Run independent queries in parallel.
  const [badges, attempts, certificates, unreadNotifs, streak, dailyQuiz, canClaim, rank] = await Promise.all([
    prisma.userBadge.findMany({ where: { userId: user.id }, include: { badge: true } }),
    prisma.attempt.count({ where: { userId: user.id, finishedAt: { not: null } } }),
    prisma.certificate.count({ where: { userId: user.id } }),
    // F1 — unread notification count for the header bell badge.
    prisma.notification.count({ where: { userId: user.id, isRead: false } }),
    // F2 — current streak (read-only; advance happens in /api/attempts).
    readStreak(user.id),
    // F2 — today's daily quiz (null if admin hasn't set one).
    getDailyQuiz(),
    canClaimDailyBonus(user.id),
    // F3 — your-rank: how many active students have strictly more points.
    user.role === "student"
      ? prisma.user.count({ where: { role: "student", isBlocked: false, points: { gt: user.points } } })
      : Promise.resolve(0),
  ]);

  const level = levelForPoints(user.points);
  const avatarUrl = user.avatar ? `/api/avatar/${user.id}` : null;

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      points: user.points,
      avatarSeed: user.avatarSeed,
      avatarUrl,
      level,
      badgeCount: badges.length,
      attemptCount: attempts,
      certificateCount: certificates,
      unreadNotificationCount: unreadNotifs,
      streak,
      // F3 — only meaningful for students; admins get null.
      leaderboardRank: user.role === "student" ? rank + 1 : null,
    },
    registrationOpen,
    dailyQuiz,
    // F2 — true if the student hasn't already claimed today's daily bonus.
    canClaimDailyBonus: user.role === "student" ? canClaim : false,
  });
}
