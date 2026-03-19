import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const settings = await prisma.siteSettings.findFirst({ where: { id: "settings" } });
    return NextResponse.json({
      xpPerMessage: settings?.xpPerMessage ?? 5,
      xpPerLogin: settings?.xpPerLogin ?? 20,
      xpPerQuest: settings?.xpPerQuest ?? 50,
      xpDailyMessageCap: settings?.xpDailyMessageCap ?? 100,
      xpMinMsgLength: settings?.xpMinMsgLength ?? 3,
      xpMsgCooldown: settings?.xpMsgCooldown ?? 30,
      pointsPerMessage: settings?.pointsPerMessage ?? 2,
      pointsPerLogin: settings?.pointsPerLogin ?? 10,
      pointsPerQuest: settings?.pointsPerQuest ?? 25,
      pointsPerLevelUp: settings?.pointsPerLevelUp ?? 100,
      pointsDailyMsgCap: settings?.pointsDailyMsgCap ?? 50,
    });
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
    const data: Record<string, number> = {};
    const allowedFields = [
      "xpPerMessage", "xpPerLogin", "xpPerQuest", "xpDailyMessageCap",
      "xpMinMsgLength", "xpMsgCooldown", "pointsPerMessage", "pointsPerLogin",
      "pointsPerQuest", "pointsPerLevelUp", "pointsDailyMsgCap",
    ];
    for (const field of allowedFields) {
      if (body[field] !== undefined) data[field] = parseInt(body[field]) || 0;
    }
    await prisma.siteSettings.upsert({
      where: { id: "settings" },
      update: data,
      create: { id: "settings", ...data },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
