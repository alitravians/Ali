import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as { id: string }).id;
    const today = getToday();

    const quests = await prisma.dailyQuest.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }],
    });

    const questsWithProgress = await Promise.all(
      quests.map(async (quest) => {
        let progress = await prisma.dailyQuestProgress.findUnique({
          where: { userId_questId_date: { userId, questId: quest.id, date: today } },
        });
        if (!progress) {
          progress = await prisma.dailyQuestProgress.create({
            data: { userId, questId: quest.id, date: today, progress: 0 },
          });
        }
        return {
          ...quest,
          userProgress: progress.progress,
          isCompleted: progress.isCompleted,
          isRewarded: progress.isRewarded,
          progressPercent: Math.min(100, Math.round((progress.progress / quest.target) * 100)),
        };
      })
    );

    return NextResponse.json(questsWithProgress);
  } catch {
    return NextResponse.json([]);
  }
}

// Claim reward
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as { id: string }).id;
    const body = await req.json();
    const { questId } = body;
    const today = getToday();

    const progress = await prisma.dailyQuestProgress.findUnique({
      where: { userId_questId_date: { userId, questId, date: today } },
    });
    if (!progress || !progress.isCompleted || progress.isRewarded) {
      return NextResponse.json({ error: "لا يمكن استلام المكافأة" }, { status: 400 });
    }

    const quest = await prisma.dailyQuest.findUnique({ where: { id: questId } });
    if (!quest) return NextResponse.json({ error: "المهمة غير موجودة" }, { status: 404 });

    // Mark as rewarded
    await prisma.dailyQuestProgress.update({
      where: { userId_questId_date: { userId, questId, date: today } },
      data: { isRewarded: true },
    });

    // Award XP
    if (quest.xpReward > 0) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        let newXp = user.xp + quest.xpReward;
        let newLevel = user.level;
        while (newXp >= newLevel * 100) {
          newXp -= newLevel * 100;
          newLevel++;
        }
        await prisma.user.update({
          where: { id: userId },
          data: { xp: newXp, level: newLevel, totalXpEarned: { increment: quest.xpReward } },
        });
        await prisma.xpLog.create({
          data: { userId, amount: quest.xpReward, source: "quest", details: quest.nameAr },
        });
      }
    }

    // Award Points
    if (quest.pointsReward > 0) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        await prisma.user.update({
          where: { id: userId },
          data: { points: { increment: quest.pointsReward } },
        });
        await prisma.pointLog.create({
          data: {
            userId,
            amount: quest.pointsReward,
            source: "quest",
            details: quest.nameAr,
            balanceAfter: user.points + quest.pointsReward,
          },
        });
      }
    }

    // Send notification
    await prisma.notification.create({
      data: {
        userId,
        title: "🎯 مكافأة المهمة!",
        titleAr: "🎯 مكافأة المهمة!",
        message: `حصلت على ${quest.xpReward} XP و ${quest.pointsReward} نقطة من "${quest.nameAr}"`,
        messageAr: `حصلت على ${quest.xpReward} XP و ${quest.pointsReward} نقطة من "${quest.nameAr}"`,
        type: "success",
        category: "general",
        icon: "star",
      },
    });

    return NextResponse.json({ success: true, xpReward: quest.xpReward, pointsReward: quest.pointsReward });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
