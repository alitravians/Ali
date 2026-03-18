import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status"); // read | unread
    const limit = parseInt(searchParams.get("limit") || "50");
    const countOnly = searchParams.get("countOnly");

    const where: Record<string, unknown> = {
      userId: session.user.id,
      isDeleted: false,
    };

    if (category && category !== "all") {
      where.category = category;
    }
    if (status === "read") {
      where.isRead = true;
    } else if (status === "unread") {
      where.isRead = false;
    }

    if (countOnly === "true") {
      const count = await prisma.notification.count({
        where: { userId: session.user.id, isRead: false, isDeleted: false },
      });
      return NextResponse.json({ unreadCount: count });
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { id, action } = await req.json();

    if (action === "markAllRead") {
      await prisma.notification.updateMany({
        where: { userId: session.user.id, isRead: false, isDeleted: false },
        data: { isRead: true },
      });
      return NextResponse.json({ message: "تم تحديد الكل كمقروء" });
    }

    if (id) {
      const notification = await prisma.notification.findUnique({ where: { id } });
      if (!notification || notification.userId !== session.user.id) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
      }
      await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ message: "تم التحديث" });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { id } = await req.json();

    if (id) {
      const notification = await prisma.notification.findUnique({ where: { id } });
      if (!notification || notification.userId !== session.user.id) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
      }
      await prisma.notification.update({
        where: { id },
        data: { isDeleted: true },
      });
    }

    return NextResponse.json({ message: "تم حذف الإشعار" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
