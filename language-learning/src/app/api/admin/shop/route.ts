import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeInput } from "@/lib/validation";

const ALLOWED_SHOP_FIELDS = [
  "name", "nameAr", "description", "descriptionAr", "type", "icon",
  "price", "stock", "soldCount", "rarity", "order", "isActive",
  "isPermanent", "durationDays", "isLimited", "limitedUntil",
  "inventoryItemId", "imageUrl",
];

export async function GET() {
  try {
    const items = await prisma.shopItem.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      include: { _count: { select: { purchases: true } } },
    });
    return NextResponse.json(items);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const body = await req.json();
    // Whitelist allowed fields to prevent mass assignment
    const safeData: Record<string, unknown> = {};
    for (const key of ALLOWED_SHOP_FIELDS) {
      if (key in body && body[key] !== undefined) {
        if (key === "name" || key === "nameAr" || key === "description" || key === "descriptionAr") {
          safeData[key] = sanitizeInput(String(body[key]));
        } else if (key === "limitedUntil" && body[key]) {
          safeData[key] = new Date(body[key]);
        } else {
          safeData[key] = body[key];
        }
      }
    }
    const item = await prisma.shopItem.create({ data: safeData as Parameters<typeof prisma.shopItem.create>[0]["data"] });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const body = await req.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    // Whitelist allowed fields to prevent mass assignment
    const safeData: Record<string, unknown> = {};
    for (const key of ALLOWED_SHOP_FIELDS) {
      if (key in body && body[key] !== undefined) {
        if (key === "name" || key === "nameAr" || key === "description" || key === "descriptionAr") {
          safeData[key] = sanitizeInput(String(body[key]));
        } else if (key === "limitedUntil" && body[key]) {
          safeData[key] = new Date(body[key]);
        } else {
          safeData[key] = body[key];
        }
      }
    }
    const item = await prisma.shopItem.update({ where: { id }, data: safeData });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await prisma.shopItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
