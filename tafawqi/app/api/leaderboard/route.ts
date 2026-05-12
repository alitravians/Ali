import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { levelForPoints } from "@/lib/levels";

export const dynamic = "force-dynamic";

export async function GET() {
  const [top, me] = await Promise.all([
    prisma.user.findMany({
      where: { role: "student", isBlocked: false },
      orderBy: { points: "desc" },
      take: 50,
      select: { id: true, name: true, points: true, createdAt: true, avatarSeed: true, avatar: true },
    }),
    getCurrentUser(),
  ]);

  const rows = top.map((u, i) => ({
    rank: i + 1,
    id: u.id,
    name: u.name,
    points: u.points,
    level: levelForPoints(u.points).current,
    avatarSeed: u.avatarSeed,
    // S6/F8 — point to the avatar endpoint instead of inlining base64.
    avatarUrl: u.avatar ? `/api/avatar/${u.id}` : null,
  }));

  // F3 — when the viewer is a student, compute their personal rank even if
  // they're not in the top 50. Rank = (# of students with strictly more
  // points) + 1. Returns null for guests and admins.
  let viewer: {
    id: string;
    name: string;
    points: number;
    rank: number;
    level: ReturnType<typeof levelForPoints>["current"];
    avatarSeed: string;
    avatarUrl: string | null;
    inTop: boolean;
  } | null = null;

  if (me && me.role === "student" && !me.isBlocked) {
    const above = await prisma.user.count({
      where: { role: "student", isBlocked: false, points: { gt: me.points } },
    });
    const rank = above + 1;
    viewer = {
      id: me.id,
      name: me.name,
      points: me.points,
      rank,
      level: levelForPoints(me.points).current,
      avatarSeed: me.avatarSeed,
      avatarUrl: me.avatar ? `/api/avatar/${me.id}` : null,
      inTop: rows.some((r) => r.id === me.id),
    };
  }

  return NextResponse.json({ leaderboard: rows, viewer });
}
