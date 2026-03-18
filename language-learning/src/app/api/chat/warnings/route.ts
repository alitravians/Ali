import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const userRole = (session.user as { role?: string }).role;

    if (userRole !== "admin" && userId !== (session.user as { id: string }).id) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const warnings = await prisma.chatWarning.findMany({
      where: userId ? { userId } : {},
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(warnings);
  } catch {
    return NextResponse.json({ error: "فشل في جلب التحذيرات" }, { status: 500 });
  }
}

export async function POST(request: Request) {
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
    const { userId, reason } = body;

    if (!userId || !reason) {
      return NextResponse.json({ error: "المستخدم والسبب مطلوبان" }, { status: 400 });
    }

    const warning = await prisma.chatWarning.create({
      data: {
        userId,
        reason: reason.slice(0, 500),
        issuedBy: adminId,
      },
    });

    // Log admin action
    await prisma.chatAdminLog.create({
      data: {
        action: "warn",
        targetUserId: userId,
        adminId,
        details: `تحذير: ${reason.slice(0, 200)}`,
      },
    });

    // Create notification for user
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (targetUser) {
      await prisma.notification.create({
        data: {
          title: "تحذير من الإدارة",
          titleAr: "تحذير من الإدارة",
          message: `تم تحذيرك: ${reason}`,
          messageAr: `تم تحذيرك: ${reason}`,
          type: "warning",
          category: "admin",
          icon: "alert",
          userId,
        },
      });
    }

    return NextResponse.json(warning);
  } catch {
    return NextResponse.json({ error: "فشل في إنشاء التحذير" }, { status: 500 });
  }
}
