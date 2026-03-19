import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as { id: string }).id;
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId") || userId;

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, points: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const recentLogs = await prisma.pointLog.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    const totalEarned = await prisma.pointLog.aggregate({
      where: { userId: targetUserId, amount: { gt: 0 } },
      _sum: { amount: true },
    });
    const totalSpent = await prisma.pointLog.aggregate({
      where: { userId: targetUserId, amount: { lt: 0 } },
      _sum: { amount: true },
    });

    return NextResponse.json({
      points: user.points,
      totalEarned: totalEarned._sum.amount || 0,
      totalSpent: Math.abs(totalSpent._sum.amount || 0),
      recentLogs,
    });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
