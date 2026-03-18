import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const BAN_DURATIONS: Record<string, number> = {
  "10m": 10,
  "30m": 30,
  "1h": 60,
  "6h": 360,
  "24h": 1440,
  "3d": 4320,
  "7d": 10080,
  "permanent": 0,
};

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const activeOnly = searchParams.get("active") === "true";
    const userRole = (session.user as { role?: string }).role;
    const currentUserId = (session.user as { id: string }).id;

    if (userRole !== "admin" && userId !== currentUserId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (activeOnly) {
      where.isActive = true;
      where.endsAt = { gt: new Date() };
    }

    const bans = await prisma.chatBan.findMany({
      where,
      orderBy: { startedAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        appeals: true,
      },
    });

    return NextResponse.json(bans);
  } catch {
    return NextResponse.json({ error: "فشل في جلب الحظر" }, { status: 500 });
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
    const { userId, reason, duration } = body;

    if (!userId || !reason || !duration) {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
    }

    const durationMinutes = BAN_DURATIONS[duration];
    if (durationMinutes === undefined) {
      return NextResponse.json({ error: "مدة الحظر غير صالحة" }, { status: 400 });
    }

    // Deactivate any existing active bans
    await prisma.chatBan.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    const now = new Date();
    const endsAt = durationMinutes === 0
      ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) // 1 year for "permanent"
      : new Date(now.getTime() + durationMinutes * 60 * 1000);

    const ban = await prisma.chatBan.create({
      data: {
        userId,
        reason: reason.slice(0, 500),
        duration: durationMinutes,
        issuedBy: adminId,
        endsAt,
      },
    });

    // Log admin action
    await prisma.chatAdminLog.create({
      data: {
        action: "ban",
        targetUserId: userId,
        adminId,
        details: `حظر لمدة ${duration}: ${reason.slice(0, 200)}`,
      },
    });

    // Notify user
    await prisma.notification.create({
      data: {
        title: "تم حظرك من الدردشة",
        titleAr: "تم حظرك من الدردشة",
        message: `السبب: ${reason}. المدة: ${duration === "permanent" ? "دائم" : duration}`,
        messageAr: `السبب: ${reason}. المدة: ${duration === "permanent" ? "دائم" : duration}`,
        type: "warning",
        category: "admin",
        icon: "alert",
        userId,
      },
    });

    return NextResponse.json(ban);
  } catch {
    return NextResponse.json({ error: "فشل في حظر المستخدم" }, { status: 500 });
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
    const { banId } = body;

    if (!banId) {
      return NextResponse.json({ error: "معرف الحظر مطلوب" }, { status: 400 });
    }

    const ban = await prisma.chatBan.update({
      where: { id: banId },
      data: { isActive: false },
    });

    // Log admin action
    await prisma.chatAdminLog.create({
      data: {
        action: "unban",
        targetUserId: ban.userId,
        adminId,
        details: `رفع الحظر عن المستخدم`,
      },
    });

    // Notify user
    await prisma.notification.create({
      data: {
        title: "تم رفع الحظر",
        titleAr: "تم رفع الحظر",
        message: "تم رفع الحظر عن حسابك في الدردشة",
        messageAr: "تم رفع الحظر عن حسابك في الدردشة",
        type: "success",
        category: "admin",
        icon: "check",
        userId: ban.userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "فشل في رفع الحظر" }, { status: 500 });
  }
}
