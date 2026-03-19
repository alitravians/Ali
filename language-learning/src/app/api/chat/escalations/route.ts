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

    const escalations = await prisma.chatEscalation.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true, chatRank: true } },
        reporter: { select: { id: true, name: true, chatRank: true } },
      },
    });

    return NextResponse.json(escalations);
  } catch {
    return NextResponse.json({ error: "فشل في جلب التصعيدات" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const reporterId = (session.user as { id: string }).id;
    const userRole = (session.user as { role?: string }).role;

    // Only admin/moderator can escalate
    const reporter = await prisma.user.findUnique({
      where: { id: reporterId },
      select: { chatRank: true },
    });
    const isStaff = userRole === "admin" || reporter?.chatRank === "moderator" || reporter?.chatRank === "admin";
    if (!isStaff) {
      return NextResponse.json({ error: "غير مصرح - فقط المشرفين والإداريين" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, reason } = body;

    if (!userId || !reason) {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
    }

    const escalation = await prisma.chatEscalation.create({
      data: {
        userId,
        reportedBy: reporterId,
        reason: reason.slice(0, 500),
      },
    });

    // Log admin action
    await prisma.chatAdminLog.create({
      data: {
        action: "escalation",
        targetUserId: userId,
        adminId: reporterId,
        details: `تصعيد للإدارة: ${reason.slice(0, 200)}`,
      },
    });

    // Notify admins
    const admins = await prisma.user.findMany({
      where: { role: "admin" },
      select: { id: true },
    });

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          title: "تصعيد إداري جديد",
          titleAr: "تصعيد إداري جديد",
          message: `تم تصعيد المستخدم ${targetUser?.name || ""} للمراجعة الإدارية. السبب: ${reason.slice(0, 200)}`,
          messageAr: `تم تصعيد المستخدم ${targetUser?.name || ""} للمراجعة الإدارية. السبب: ${reason.slice(0, 200)}`,
          type: "warning",
          category: "admin",
          icon: "alert",
          priority: "important",
          link: "/admin/chat",
          userId: admin.id,
        },
      });
    }

    return NextResponse.json(escalation);
  } catch {
    return NextResponse.json({ error: "فشل في إنشاء التصعيد" }, { status: 500 });
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
    const { escalationId, status, adminNote } = body;

    if (!escalationId || !status) {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
    }

    const escalation = await prisma.chatEscalation.update({
      where: { id: escalationId },
      data: {
        status,
        adminNote: adminNote?.slice(0, 500) || "",
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json(escalation);
  } catch {
    return NextResponse.json({ error: "فشل في تحديث التصعيد" }, { status: 500 });
  }
}
