import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { levelForPoints } from "@/lib/levels";

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
  if (!user) return NextResponse.json({ user: null, registrationOpen });
  const [badges, attempts, certificates] = await Promise.all([
    prisma.userBadge.findMany({ where: { userId: user.id }, include: { badge: true } }),
    prisma.attempt.count({ where: { userId: user.id, finishedAt: { not: null } } }),
    prisma.certificate.count({ where: { userId: user.id } }),
  ]);
  const level = levelForPoints(user.points);
  // S6/F8 — do NOT inline the base64 avatar here. Send only a URL pointing
  // to the dedicated /api/avatar/[userId] endpoint (cacheable, smaller JSON).
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
    },
    registrationOpen,
  });
}
