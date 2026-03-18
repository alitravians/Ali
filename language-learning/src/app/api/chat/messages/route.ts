import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");
    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    if (!roomId) {
      return NextResponse.json({ error: "roomId مطلوب" }, { status: 400 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        roomId,
        isDeleted: false,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            chatRank: true,
            chatBadgeColor: true,
          },
        },
      },
    });

    return NextResponse.json(messages.reverse());
  } catch {
    return NextResponse.json({ error: "فشل في جلب الرسائل" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    // Check if user is banned
    const activeBan = await prisma.chatBan.findFirst({
      where: {
        userId,
        isActive: true,
        endsAt: { gt: new Date() },
      },
    });

    if (activeBan) {
      return NextResponse.json({
        error: "أنت محظور من الدردشة",
        ban: {
          reason: activeBan.reason,
          endsAt: activeBan.endsAt,
        },
      }, { status: 403 });
    }

    const body = await request.json();
    const { content, roomId } = body;

    if (!content || !roomId) {
      return NextResponse.json({ error: "المحتوى والغرفة مطلوبان" }, { status: 400 });
    }

    // Word filter
    const settings = await prisma.siteSettings.findFirst();
    let filteredContent = content.slice(0, 1000);

    if (settings?.chatAutoFilter && settings?.chatBannedWords) {
      const bannedWords = settings.chatBannedWords.split(",").map((w: string) => w.trim()).filter(Boolean);
      for (const word of bannedWords) {
        if (word) {
          const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
          filteredContent = filteredContent.replace(regex, "***");
        }
      }
    }

    const message = await prisma.chatMessage.create({
      data: {
        content: filteredContent,
        roomId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            chatRank: true,
            chatBadgeColor: true,
          },
        },
      },
    });

    return NextResponse.json(message);
  } catch {
    return NextResponse.json({ error: "فشل في إرسال الرسالة" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== "admin") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get("id");

    if (!messageId) {
      return NextResponse.json({ error: "معرف الرسالة مطلوب" }, { status: 400 });
    }

    await prisma.chatMessage.update({
      where: { id: messageId },
      data: { isDeleted: true },
    });

    // Log admin action
    await prisma.chatAdminLog.create({
      data: {
        action: "delete_message",
        targetUserId: messageId,
        adminId: (session.user as { id: string }).id,
        details: `حذف رسالة #${messageId}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "فشل في حذف الرسالة" }, { status: 500 });
  }
}
