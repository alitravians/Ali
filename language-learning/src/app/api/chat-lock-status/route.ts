import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public endpoint - no auth required (not under /api/admin/)
export async function GET() {
  try {
    const settings = await prisma.siteSettings.findFirst({ where: { id: "settings" } });
    return NextResponse.json({
      chatLocked: settings?.chatLocked || false,
      chatLockType: settings?.chatLockType || "full",
      chatLockReason: settings?.chatLockReason || "",
    });
  } catch {
    return NextResponse.json({ chatLocked: false });
  }
}
