import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { levelForPoints } from "@/lib/levels";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null });
  const [badges, attempts, certificates] = await Promise.all([
    prisma.userBadge.findMany({ where: { userId: user.id }, include: { badge: true } }),
    prisma.attempt.count({ where: { userId: user.id, finishedAt: { not: null } } }),
    prisma.certificate.count({ where: { userId: user.id } }),
  ]);
  const level = levelForPoints(user.points);
  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      points: user.points,
      avatarSeed: user.avatarSeed,
      level,
      badgeCount: badges.length,
      attemptCount: attempts,
      certificateCount: certificates,
    },
  });
}
