import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST: Register/update user presence in a chat room
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { roomId } = await request.json();

    if (!roomId) {
      return NextResponse.json({ error: "roomId مطلوب" }, { status: 400 });
    }

    // Upsert presence record
    await prisma.chatPresence.upsert({
      where: {
        userId_roomId: { userId, roomId },
      },
      update: {
        lastSeen: new Date(),
      },
      create: {
        userId,
        roomId,
        lastSeen: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "فشل في تحديث الحضور" }, { status: 500 });
  }
}

// GET: Get users who recently entered a chat room (with their entry_effect inventory)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");
    const sinceStr = searchParams.get("since"); // ISO timestamp

    if (!roomId) {
      return NextResponse.json({ error: "roomId مطلوب" }, { status: 400 });
    }

    // Default: users seen in last 10 seconds (for polling detection)
    const since = sinceStr ? new Date(sinceStr) : new Date(Date.now() - 10000);

    const presences = await prisma.chatPresence.findMany({
      where: {
        roomId,
        lastSeen: { gte: since },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Get entry_effect inventory for these users
    const userIds = presences.map((p) => p.userId);
    const entryEffects = await prisma.userInventory.findMany({
      where: {
        userId: { in: userIds },
        status: "active",
        item: { type: "entry_effect" },
      },
      include: { item: true },
    });

    // Build map of userId -> entry_effect data
    const effectMap: Record<string, {
      previewData: string;
      icon: string;
      color: string;
      nameAr: string;
      rarity: string;
      videoUrl?: string;
      soundUrl?: string;
      effectDuration: number;
    }> = {};

    for (const inv of entryEffects) {
      // Auto-expire check
      if (!inv.isPermanent && inv.expiresAt && new Date(inv.expiresAt) < new Date()) {
        await prisma.userInventory.update({ where: { id: inv.id }, data: { status: "expired" } });
        continue;
      }
      effectMap[inv.userId] = {
        previewData: inv.item.previewData,
        icon: inv.item.icon,
        color: inv.item.color,
        nameAr: inv.item.nameAr,
        rarity: inv.item.rarity,
        videoUrl: inv.item.videoUrl || undefined,
        soundUrl: inv.item.soundUrl || undefined,
        effectDuration: inv.item.effectDuration || 5,
      };
    }

    // Return presences with entry_effect data (only users who have entry effects)
    const result = presences
      .filter((p) => effectMap[p.userId])
      .map((p) => ({
        userId: p.userId,
        userName: p.user.name,
        lastSeen: p.lastSeen.toISOString(),
        entryEffect: effectMap[p.userId],
      }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "فشل في جلب الحضور" }, { status: 500 });
  }
}
