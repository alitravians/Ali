import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let settings = await prisma.siteSettings.findUnique({ where: { id: "settings" } });
    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: { id: "settings" },
      });
    }
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

// Whitelist of allowed settings fields to prevent mass assignment
const ALLOWED_SETTINGS_FIELDS = [
  "siteName", "siteDescription", "logoText", "logoColor1", "logoColor2",
  "maintenanceMode", "maintenanceMessage",
  "stampTopText", "stampBottomText", "stampCenterText",
  "stampVerifyBottomText", "stampVerifyCenterText",
  "stampColor", "stampStars", "stampShowDots",
  "chatEnabled", "chatPrivateEnabled", "chatFileUpload",
  "chatBannedWords", "chatAutoFilter",
  "chatLocked", "chatLockType", "chatLockReason", "chatLockedBy", "chatLockedAt",
  "xpPerMessage", "xpMsgCooldown", "xpDailyMessageCap", "xpMinMsgLength",
  "pointsPerMessage", "pointsDailyMsgCap", "pointsPerLevelUp",
];

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const body = await req.json();

    // Only allow whitelisted fields to prevent mass assignment attacks
    const sanitizedData: Record<string, unknown> = {};
    for (const key of ALLOWED_SETTINGS_FIELDS) {
      if (key in body) {
        sanitizedData[key] = body[key];
      }
    }

    const settings = await prisma.siteSettings.upsert({
      where: { id: "settings" },
      update: sanitizedData,
      create: { id: "settings", ...sanitizedData },
    });
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
