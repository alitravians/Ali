import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { levelForPoints } from "@/lib/levels";

export const dynamic = "force-dynamic";

export async function GET() {
  const top = await prisma.user.findMany({
    where: { role: "student", isBlocked: false },
    orderBy: { points: "desc" },
    take: 50,
    select: { id: true, name: true, points: true, createdAt: true, avatarSeed: true },
  });
  const rows = top.map((u, i) => ({
    rank: i + 1,
    id: u.id,
    name: u.name,
    points: u.points,
    level: levelForPoints(u.points).current,
    avatarSeed: u.avatarSeed,
  }));
  return NextResponse.json({ leaderboard: rows });
}
