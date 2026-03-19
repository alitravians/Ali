import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const settings = await prisma.siteSettings.findFirst({ where: { id: "settings" } });
    return NextResponse.json({
      chatLocked: settings?.chatLocked || false,
      chatLockType: settings?.chatLockType || "full",
      chatLockReason: settings?.chatLockReason || "",
      chatLockedBy: settings?.chatLockedBy || "",
      chatLockedAt: settings?.chatLockedAt || null,
    });
  } catch {
    return NextResponse.json({ chatLocked: false });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const body = await req.json();
    const { action, lockType, reason } = body;
    const adminId = (session.user as { id: string }).id;
    const adminName = session.user.name || "Admin";

    if (action === "lock") {
      await prisma.siteSettings.upsert({
        where: { id: "settings" },
        update: {
          chatLocked: true,
          chatLockType: lockType || "full",
          chatLockReason: reason || "",
          chatLockedBy: adminName,
          chatLockedAt: new Date(),
        },
        create: { id: "settings", chatLocked: true, chatLockType: lockType || "full", chatLockReason: reason || "", chatLockedBy: adminName, chatLockedAt: new Date() },
      });
      await prisma.chatLockLog.create({
        data: { action: "lock", lockType: lockType || "full", reason: reason || "", adminId, adminName },
      });
    } else {
      await prisma.siteSettings.upsert({
        where: { id: "settings" },
        update: { chatLocked: false, chatLockReason: "", chatLockedBy: "", chatLockedAt: null },
        create: { id: "settings" },
      });
      await prisma.chatLockLog.create({
        data: { action: "unlock", lockType: "full", reason: reason || "", adminId, adminName },
      });
    }

    const logs = await prisma.chatLockLog.findMany({ orderBy: { createdAt: "desc" }, take: 20 });
    return NextResponse.json({ success: true, logs });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
