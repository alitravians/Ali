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

    // Support both preset durations and custom minutes
    let durationMinutes: number;
    if (typeof duration === "number") {
      // Custom minutes input from inline chat ban
      durationMinutes = Math.max(1, Math.min(duration, 525600)); // 1 min to 1 year
    } else {
      const preset = BAN_DURATIONS[duration];
      if (preset === undefined) {
        return NextResponse.json({ error: "مدة الحظر غير صالحة" }, { status: 400 });
      }
      durationMinutes = preset;
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

    // Get admin name for detailed logging
    const adminUser = await prisma.user.findUnique({ where: { id: adminId }, select: { name: true } });
    const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });

    // Format duration label
    const durationLabel = durationMinutes === 0 ? "دائم" :
      durationMinutes < 60 ? `${durationMinutes} دقيقة` :
      durationMinutes < 1440 ? `${Math.floor(durationMinutes / 60)} ساعة` :
      `${Math.floor(durationMinutes / 1440)} يوم`;

    // Format dates for Arabic display
    const startDateStr = now.toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });
    const startTimeStr = now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
    const endDateStr = endsAt.toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });
    const endTimeStr = endsAt.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });

    // Log admin action with full details
    await prisma.chatAdminLog.create({
      data: {
        action: "ban",
        targetUserId: userId,
        adminId,
        details: JSON.stringify({
          userName: targetUser?.name || "",
          adminName: adminUser?.name || "",
          reason: reason.slice(0, 200),
          duration: durationMinutes,
          durationLabel,
          startedAt: now.toISOString(),
          endsAt: endsAt.toISOString(),
          status: "active",
        }),
      },
    });

    // Send detailed notification to user with ban info + appeal option
    const notifMessage = [
      `تم حظرك من الدردشة بواسطة الإدارة.`,
      ``,
      `سبب الحظر: ${reason}`,
      `مدة الحظر: ${durationLabel}`,
      `تاريخ الحظر: ${startDateStr}`,
      `وقت بداية الحظر: ${startTimeStr}`,
      `تاريخ انتهاء الحظر: ${endDateStr}`,
      `وقت انتهاء الحظر: ${endTimeStr}`,
      ``,
      `إذا كنت ترى أن هذا الحظر غير عادل، يمكنك تقديم تظلم من خلال صفحة الدردشة.`,
    ].join("\n");

    await prisma.notification.create({
      data: {
        title: "تم حظرك من الدردشة",
        titleAr: "تم حظرك من الدردشة",
        message: notifMessage,
        messageAr: notifMessage,
        type: "warning",
        category: "admin",
        icon: "alert",
        priority: "urgent",
        link: "/chat",
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

    // Log admin action with status
    const adminUser = await prisma.user.findUnique({ where: { id: adminId }, select: { name: true } });
    const targetUser = await prisma.user.findUnique({ where: { id: ban.userId }, select: { name: true } });
    await prisma.chatAdminLog.create({
      data: {
        action: "unban",
        targetUserId: ban.userId,
        adminId,
        details: JSON.stringify({
          userName: targetUser?.name || "",
          adminName: adminUser?.name || "",
          reason: "رفع يدوي",
          liftedAt: new Date().toISOString(),
          originalEndsAt: ban.endsAt.toISOString(),
          status: "manually_lifted",
        }),
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
