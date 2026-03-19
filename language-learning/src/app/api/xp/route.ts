import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// XP required for each level: level * 100 (level 1->2 = 100xp, level 2->3 = 200xp, etc.)
function xpForLevel(level: number): number {
  return level * 100;
}

function totalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) total += xpForLevel(i);
  return total;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as { id: string }).id;
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId") || userId;

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, xp: true, level: true, totalXpEarned: true, points: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const xpNeeded = xpForLevel(user.level);
    const progressPercent = Math.min(100, Math.round((user.xp / xpNeeded) * 100));

    // Recent XP log
    const recentXp = await prisma.xpLog.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      level: user.level,
      xp: user.xp,
      xpNeeded,
      progressPercent,
      totalXpEarned: user.totalXpEarned,
      points: user.points,
      recentXp,
    });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// Award XP (internal use - called from other APIs)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { userId, amount, source, details } = body;
    const targetUserId = userId || (session.user as { id: string }).id;

    // Only admin can award XP to others
    if (userId && userId !== (session.user as { id: string }).id) {
      if ((session.user as { role?: string }).role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    let newXp = user.xp + amount;
    let newLevel = user.level;
    let leveledUp = false;

    // Check for level up
    while (newXp >= xpForLevel(newLevel)) {
      newXp -= xpForLevel(newLevel);
      newLevel++;
      leveledUp = true;
    }

    await prisma.user.update({
      where: { id: targetUserId },
      data: { xp: newXp, level: newLevel, totalXpEarned: { increment: amount } },
    });

    await prisma.xpLog.create({
      data: { userId: targetUserId, amount, source: source || "admin", details: details || "" },
    });

    // If leveled up, award points and send notification
    if (leveledUp) {
      const settings = await prisma.siteSettings.findFirst({ where: { id: "settings" } });
      const pointsReward = settings?.pointsPerLevelUp || 100;

      await prisma.user.update({
        where: { id: targetUserId },
        data: { points: { increment: pointsReward } },
      });

      await prisma.pointLog.create({
        data: {
          userId: targetUserId,
          amount: pointsReward,
          source: "level_up",
          details: `ترقية للمستوى ${newLevel}`,
          balanceAfter: user.points + pointsReward,
        },
      });

      await prisma.notification.create({
        data: {
          userId: targetUserId,
          title: "🎉 ترقية مستوى!",
          titleAr: "🎉 ترقية مستوى!",
          message: `تهانينا! وصلت للمستوى ${newLevel} وحصلت على ${pointsReward} نقطة`,
          messageAr: `تهانينا! وصلت للمستوى ${newLevel} وحصلت على ${pointsReward} نقطة`,
          type: "achievement",
          category: "general",
          icon: "star",
          priority: "important",
        },
      });
    }

    return NextResponse.json({ success: true, level: newLevel, xp: newXp, leveledUp });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
