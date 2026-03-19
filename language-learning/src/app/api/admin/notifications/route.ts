import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { requireAdmin } from "@/lib/admin-auth";
import { sanitizeInput } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // log | stats

    if (type === "stats") {
      const total = await prisma.notification.count();
      const unread = await prisma.notification.count({ where: { isRead: false, isDeleted: false } });
      const read = await prisma.notification.count({ where: { isRead: true, isDeleted: false } });
      const adminSent = await prisma.adminNotification.count();
      return NextResponse.json({ total, unread, read, adminSent });
    }

    const logs = await prisma.adminNotification.findMany({
      orderBy: { sentAt: "desc" },
      take: 50,
    });

    // Update read counts
    for (const log of logs) {
      const readCount = await prisma.notification.count({
        where: {
          titleAr: log.titleAr,
          createdAt: { gte: new Date(log.sentAt.getTime() - 1000), lte: new Date(log.sentAt.getTime() + 60000) },
          isRead: true,
        },
      });
      if (readCount !== log.readCount) {
        await prisma.adminNotification.update({
          where: { id: log.id },
          data: { readCount },
        });
        log.readCount = readCount;
      }
    }

    return NextResponse.json(logs);
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const { category, link, priority, targetType, targetUserIds } = body;
    const title = body.title ? sanitizeInput(body.title) : "";
    const titleAr = body.titleAr ? sanitizeInput(body.titleAr) : "";
    const message = body.message ? sanitizeInput(body.message) : "";
    const messageAr = body.messageAr ? sanitizeInput(body.messageAr) : "";

    if (!title && !titleAr) {
      return NextResponse.json({ error: "العنوان مطلوب" }, { status: 400 });
    }
    if (!message && !messageAr) {
      return NextResponse.json({ error: "المحتوى مطلوب" }, { status: 400 });
    }

    let userIds: string[] = [];

    if (targetType === "specific" && targetUserIds && targetUserIds.length > 0) {
      userIds = targetUserIds;
    } else {
      const users = await prisma.user.findMany({ select: { id: true } });
      userIds = users.map((u) => u.id);
    }

    const iconMap: Record<string, string> = {
      educational: "book",
      certificates: "award",
      support: "ticket",
      account: "user",
      admin: "megaphone",
      general: "bell",
    };

    let sentCount = 0;
    for (const userId of userIds) {
      const result = await createNotification({
        userId,
        title: title || titleAr,
        titleAr: titleAr || title,
        message: message || messageAr,
        messageAr: messageAr || message,
        type: priority === "urgent" ? "warning" : "info",
        category: category || "admin",
        icon: iconMap[category || "admin"] || "megaphone",
        link: link || "",
        priority: priority || "normal",
      });
      if (result) sentCount++;
    }

    // Log admin notification
    await prisma.adminNotification.create({
      data: {
        title: title || titleAr,
        titleAr: titleAr || title,
        message: message || messageAr,
        messageAr: messageAr || message,
        category: category || "admin",
        link: link || "",
        priority: priority || "normal",
        targetType: targetType || "all",
        targetUsers: targetType === "specific" ? userIds.join(",") : "",
        sentCount,
        sentBy: "admin",
      },
    });

    return NextResponse.json({ message: "تم إرسال الإشعارات", sentCount }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
