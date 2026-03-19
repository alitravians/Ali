import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== "admin") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        chatRank: true,
        chatBadgeColor: true,
        createdAt: true,
        _count: {
          select: {
            chatMessages: true,
            chatWarnings: true,
            chatBans: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: "فشل في جلب المستخدمين" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== "admin") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const adminId = (session.user as { id: string }).id;
    const body = await request.json();
    const { userId, chatRank, chatBadgeColor } = body;

    if (!userId) {
      return NextResponse.json({ error: "معرف المستخدم مطلوب" }, { status: 400 });
    }

    const updateData: Record<string, string> = {};
    if (chatRank) updateData.chatRank = chatRank;
    if (chatBadgeColor) updateData.chatBadgeColor = chatBadgeColor;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        chatRank: true,
        chatBadgeColor: true,
      },
    });

    // Log admin action
    await prisma.chatAdminLog.create({
      data: {
        action: "rank_change",
        targetUserId: userId,
        adminId,
        details: `تغيير الرتبة إلى: ${chatRank || "لا تغيير"}`,
      },
    });

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "فشل في تحديث المستخدم" }, { status: 500 });
  }
}
