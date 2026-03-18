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

    const userRole = (session.user as { role?: string }).role;
    const currentUserId = (session.user as { id: string }).id;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (userRole !== "admin") {
      where.userId = currentUserId;
    }
    if (status) {
      where.status = status;
    }

    const appeals = await prisma.banAppeal.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        ban: true,
      },
    });

    return NextResponse.json(appeals);
  } catch {
    return NextResponse.json({ error: "فشل في جلب الاعتراضات" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const body = await request.json();
    const { banId, reason } = body;

    if (!banId || !reason) {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
    }

    // Check ban exists and belongs to user
    const ban = await prisma.chatBan.findFirst({
      where: { id: banId, userId, isActive: true },
    });

    if (!ban) {
      return NextResponse.json({ error: "الحظر غير موجود أو غير نشط" }, { status: 404 });
    }

    // Check if already has pending appeal
    const existingAppeal = await prisma.banAppeal.findFirst({
      where: { banId, status: "pending" },
    });

    if (existingAppeal) {
      return NextResponse.json({ error: "لديك اعتراض قيد المراجعة بالفعل" }, { status: 400 });
    }

    const appeal = await prisma.banAppeal.create({
      data: {
        banId,
        userId,
        reason: reason.slice(0, 1000),
      },
    });

    return NextResponse.json(appeal);
  } catch {
    return NextResponse.json({ error: "فشل في إنشاء الاعتراض" }, { status: 500 });
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
    const { appealId, status, adminNote } = body;

    if (!appealId || !status) {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
    }

    if (!["accepted", "rejected", "reduced"].includes(status)) {
      return NextResponse.json({ error: "الحالة غير صالحة" }, { status: 400 });
    }

    const appeal = await prisma.banAppeal.update({
      where: { id: appealId },
      data: {
        status,
        adminNote: (adminNote || "").slice(0, 500),
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
      include: { ban: true },
    });

    // If accepted, lift the ban
    if (status === "accepted") {
      await prisma.chatBan.update({
        where: { id: appeal.banId },
        data: { isActive: false },
      });
    }

    // If reduced, cut remaining time in half
    if (status === "reduced" && appeal.ban) {
      const now = new Date();
      const remaining = appeal.ban.endsAt.getTime() - now.getTime();
      const newEndsAt = new Date(now.getTime() + remaining / 2);
      await prisma.chatBan.update({
        where: { id: appeal.banId },
        data: { endsAt: newEndsAt },
      });
    }

    // Log admin action
    await prisma.chatAdminLog.create({
      data: {
        action: "appeal_review",
        targetUserId: appeal.userId,
        adminId,
        details: `مراجعة اعتراض: ${status}${adminNote ? ` - ${adminNote}` : ""}`,
      },
    });

    // Notify user
    const statusText = status === "accepted" ? "تم قبول اعتراضك ورفع الحظر" : status === "reduced" ? "تم تخفيف مدة الحظر" : "تم رفض اعتراضك";
    await prisma.notification.create({
      data: {
        title: "نتيجة الاعتراض على الحظر",
        titleAr: "نتيجة الاعتراض على الحظر",
        message: statusText,
        messageAr: statusText,
        type: status === "accepted" ? "success" : status === "reduced" ? "info" : "warning",
        category: "admin",
        icon: status === "accepted" ? "check" : "alert",
        userId: appeal.userId,
      },
    });

    return NextResponse.json(appeal);
  } catch {
    return NextResponse.json({ error: "فشل في مراجعة الاعتراض" }, { status: 500 });
  }
}
