import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: { role: { not: "admin" } },
      select: {
        id: true,
        name: true,
        avatar: true,
        level: true,
        xp: true,
        totalXpEarned: true,
        points: true,
        chatRank: true,
      },
      orderBy: [{ level: "desc" }, { totalXpEarned: "desc" }],
      take: 50,
    });

    const leaderboard = users.map((u, i) => ({
      rank: i + 1,
      ...u,
      xpNeeded: u.level * 100,
      progressPercent: Math.min(100, Math.round((u.xp / (u.level * 100)) * 100)),
    }));

    return NextResponse.json(leaderboard);
  } catch {
    return NextResponse.json([]);
  }
}
