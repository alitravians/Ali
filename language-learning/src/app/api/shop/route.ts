import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const items = await prisma.shopItem.findMany({
      where: {
        isActive: true,
        OR: [
          { isLimited: false },
          { isLimited: true, limitedUntil: { gt: new Date() } },
        ],
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(items);
  } catch {
    return NextResponse.json([]);
  }
}

// Purchase item
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as { id: string }).id;
    const body = await req.json();
    const { shopItemId } = body;

    if (!shopItemId) return NextResponse.json({ error: "Item ID required" }, { status: 400 });

    const item = await prisma.shopItem.findUnique({ where: { id: shopItemId } });
    if (!item || !item.isActive) return NextResponse.json({ error: "العنصر غير متاح" }, { status: 404 });

    // Check stock
    if (item.stock !== -1 && item.soldCount >= item.stock) {
      return NextResponse.json({ error: "العنصر نفذ من المخزون" }, { status: 400 });
    }

    // Check limited time
    if (item.isLimited && item.limitedUntil && new Date() > item.limitedUntil) {
      return NextResponse.json({ error: "انتهى وقت العرض" }, { status: 400 });
    }

    // Check if already purchased (for permanent items)
    if (item.isPermanent) {
      const existing = await prisma.purchase.findFirst({
        where: { userId, shopItemId, status: "completed" },
      });
      if (existing) return NextResponse.json({ error: "تملك هذا العنصر بالفعل" }, { status: 400 });
    }

    // Check user points
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { points: true } });
    if (!user || user.points < item.price) {
      return NextResponse.json({ error: "رصيد النقاط غير كافٍ" }, { status: 400 });
    }

    // Atomic deduct: only deduct if user still has enough points (prevents race condition / double-spend)
    const updateResult = await prisma.user.updateMany({
      where: { id: userId, points: { gte: item.price } },
      data: { points: { decrement: item.price } },
    });

    if (updateResult.count === 0) {
      return NextResponse.json({ error: "رصيد النقاط غير كافٍ" }, { status: 400 });
    }

    // Re-fetch updated balance
    const updatedUser = await prisma.user.findUnique({ where: { id: userId }, select: { points: true } });

    // Create purchase record
    await prisma.purchase.create({
      data: { userId, shopItemId, price: item.price },
    });

    // Log points deduction
    await prisma.pointLog.create({
      data: {
        userId,
        amount: -item.price,
        source: "purchase",
        details: `شراء: ${item.nameAr}`,
        balanceAfter: updatedUser?.points ?? (user.points - item.price),
      },
    });

    // Update sold count
    await prisma.shopItem.update({
      where: { id: shopItemId },
      data: { soldCount: { increment: 1 } },
    });

    // Add to inventory if linked
    if (item.inventoryItemId) {
      const invItem = await prisma.inventoryItem.findUnique({ where: { id: item.inventoryItemId } });
      if (invItem) {
        await prisma.userInventory.upsert({
          where: { userId_itemId: { userId, itemId: item.inventoryItemId } },
          update: {
            status: "inactive",
            isPermanent: item.isPermanent,
            durationDays: item.durationDays,
            grantedAt: new Date(),
            expiresAt: item.isPermanent ? null : new Date(Date.now() + item.durationDays * 86400000),
            grantedBy: "shop",
          },
          create: {
            userId,
            itemId: item.inventoryItemId,
            status: "inactive",
            isPermanent: item.isPermanent,
            durationDays: item.durationDays,
            expiresAt: item.isPermanent ? null : new Date(Date.now() + item.durationDays * 86400000),
            grantedBy: "shop",
          },
        });
      }
    }

    // Send notification
    await prisma.notification.create({
      data: {
        userId,
        title: "🛒 تم الشراء بنجاح!",
        titleAr: "🛒 تم الشراء بنجاح!",
        message: `حصلت على "${item.nameAr}" من المتجر`,
        messageAr: `حصلت على "${item.nameAr}" من المتجر`,
        type: "success",
        category: "general",
        icon: "check",
      },
    });

    return NextResponse.json({ success: true, newBalance: updatedUser?.points ?? (user.points - item.price) });
  } catch {
    return NextResponse.json({ error: "فشلت عملية الشراء" }, { status: 500 });
  }
}
