import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    // Auto-expire items
    await prisma.userInventory.updateMany({
      where: {
        userId,
        status: { in: ["active", "inactive"] },
        isPermanent: false,
        expiresAt: { lt: new Date() },
      },
      data: { status: "expired" },
    });

    // Get user's inventory items
    const items = await prisma.userInventory.findMany({
      where: { userId },
      include: { item: true },
      orderBy: [{ status: "asc" }, { grantedAt: "desc" }],
    });

    return NextResponse.json(items);
  } catch {
    return NextResponse.json({ error: "فشل في جلب الحقيبة" }, { status: 500 });
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
    const { action, itemId } = body;

    if (!itemId) {
      return NextResponse.json({ error: "معرف العنصر مطلوب" }, { status: 400 });
    }

    const userItem = await prisma.userInventory.findUnique({
      where: { userId_itemId: { userId, itemId } },
      include: { item: true },
    });

    if (!userItem) {
      return NextResponse.json({ error: "العنصر غير موجود في حقيبتك" }, { status: 404 });
    }

    // Check if expired
    if (!userItem.isPermanent && userItem.expiresAt && new Date(userItem.expiresAt) < new Date()) {
      await prisma.userInventory.update({
        where: { id: userItem.id },
        data: { status: "expired" },
      });
      return NextResponse.json({ error: "انتهت صلاحية هذا العنصر" }, { status: 400 });
    }

    if (userItem.status === "expired" || userItem.status === "revoked") {
      return NextResponse.json({ error: "لا يمكن استخدام هذا العنصر" }, { status: 400 });
    }

    // Activate item
    if (action === "activate") {
      // Deactivate other items of the same type first (one active per type)
      const sameTypeItems = await prisma.userInventory.findMany({
        where: {
          userId,
          status: "active",
          item: { type: userItem.item.type },
          id: { not: userItem.id },
        },
        include: { item: true },
      });

      for (const otherItem of sameTypeItems) {
        await prisma.userInventory.update({
          where: { id: otherItem.id },
          data: { status: "inactive" },
        });
        await prisma.inventoryLog.create({
          data: {
            userId,
            itemId: otherItem.itemId,
            action: "deactivated",
            details: `تم تعطيل ${otherItem.item.nameAr} تلقائياً (استبدال)`,
            performedBy: userId,
          },
        });
      }

      // Activate the selected item
      await prisma.userInventory.update({
        where: { id: userItem.id },
        data: { status: "active", activatedAt: new Date() },
      });

      await prisma.inventoryLog.create({
        data: {
          userId,
          itemId,
          action: "activated",
          details: `تفعيل ${userItem.item.nameAr}`,
          performedBy: userId,
        },
      });

      return NextResponse.json({ success: true, message: `تم تفعيل ${userItem.item.nameAr}` });
    }

    // Deactivate item
    if (action === "deactivate") {
      await prisma.userInventory.update({
        where: { id: userItem.id },
        data: { status: "inactive" },
      });

      await prisma.inventoryLog.create({
        data: {
          userId,
          itemId,
          action: "deactivated",
          details: `تعطيل ${userItem.item.nameAr}`,
          performedBy: userId,
        },
      });

      return NextResponse.json({ success: true, message: `تم تعطيل ${userItem.item.nameAr}` });
    }

    return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "فشل في العملية" }, { status: 500 });
  }
}
