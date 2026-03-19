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

    // === Sync badge assignments to inventory ===
    // Find badges assigned to user that don't have corresponding inventory entries
    const badgeAssignments = await prisma.badgeAssignment.findMany({
      where: { userId },
      include: { badge: true },
    });

    for (const ba of badgeAssignments) {
      // Skip expired temporary badges
      if (!ba.isPermanent && ba.expiresAt && new Date(ba.expiresAt) < new Date()) continue;

      const inventoryItemId = `badge-${ba.badge.id}`;

      // Ensure InventoryItem exists for this badge
      const existingItem = await prisma.inventoryItem.findUnique({ where: { id: inventoryItemId } });
      if (!existingItem) {
        await prisma.inventoryItem.create({
          data: {
            id: inventoryItemId,
            name: ba.badge.name,
            nameAr: ba.badge.nameAr,
            description: ba.badge.description,
            descriptionAr: ba.badge.descriptionAr,
            type: "badge",
            icon: ba.badge.icon,
            imageUrl: ba.badge.imageUrl,
            color: ba.badge.color,
            category: ba.badge.category,
            previewData: JSON.stringify({ badgeId: ba.badge.id }),
            rarity: ba.badge.category === "special" ? "epic" : ba.badge.category === "event" ? "rare" : "common",
          },
        });
      }

      // Ensure UserInventory entry exists
      const existingInv = await prisma.userInventory.findUnique({
        where: { userId_itemId: { userId, itemId: inventoryItemId } },
      });
      if (!existingInv) {
        await prisma.userInventory.create({
          data: {
            userId,
            itemId: inventoryItemId,
            status: "active",
            isPermanent: ba.isPermanent,
            durationDays: ba.durationDays,
            expiresAt: ba.expiresAt,
            grantedBy: ba.assignedBy,
            adminNote: ba.note,
          },
        });
      } else if (existingInv.status === "revoked" || existingInv.status === "expired") {
        // Badge is still assigned but inventory entry was revoked - re-sync
        await prisma.userInventory.update({
          where: { id: existingInv.id },
          data: {
            status: "active",
            isPermanent: ba.isPermanent,
            durationDays: ba.durationDays,
            expiresAt: ba.expiresAt,
            revokedAt: null,
            revokedBy: "",
            revokeReason: "",
          },
        });
      }
    }

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
