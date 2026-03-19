import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as { id: string }).id : "";
    const { searchParams } = new URL(req.url);
    const placement = searchParams.get("placement");

    const where: Record<string, unknown> = {
      status: "published",
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    };
    if (placement) where.placement = placement;

    const announcements = await prisma.announcement.findMany({
      where,
      orderBy: [{ isPinned: "desc" }, { importance: "desc" }, { createdAt: "desc" }],
      take: 20,
    });

    // Filter by target and mark reads
    const filtered = [];
    for (const a of announcements) {
      if (a.targetType === "moderators" && userId) {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { chatRank: true, role: true } });
        if (user?.role !== "admin" && user?.chatRank !== "moderator" && user?.chatRank !== "admin") continue;
      }
      if (a.showOnce && userId) {
        const read = await prisma.announcementRead.findUnique({
          where: { announcementId_userId: { announcementId: a.id, userId } },
        });
        if (read) continue;
      }
      filtered.push(a);
    }

    return NextResponse.json(filtered);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as { id: string }).id;
    const body = await req.json();
    const { announcementId } = body;

    if (!announcementId) return NextResponse.json({ error: "ID required" }, { status: 400 });

    // Mark as read
    await prisma.announcementRead.upsert({
      where: { announcementId_userId: { announcementId, userId } },
      update: { readAt: new Date() },
      create: { announcementId, userId },
    });
    await prisma.announcement.update({
      where: { id: announcementId },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
