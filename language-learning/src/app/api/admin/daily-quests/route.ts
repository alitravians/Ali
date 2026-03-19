import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeInput } from "@/lib/validation";

export const dynamic = "force-dynamic";

const ALLOWED_QUEST_FIELDS = [
  "title", "titleAr", "description", "descriptionAr", "type",
  "target", "xpReward", "pointsReward", "order", "isActive",
];

export async function GET() {
  try {
    const quests = await prisma.dailyQuest.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] });
    return NextResponse.json(quests);
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
    const safeData: Record<string, unknown> = {};
    for (const key of ALLOWED_QUEST_FIELDS) {
      if (key in body && body[key] !== undefined) {
        if (key === "title" || key === "titleAr" || key === "description" || key === "descriptionAr") {
          safeData[key] = sanitizeInput(String(body[key]));
        } else {
          safeData[key] = body[key];
        }
      }
    }
    const quest = await prisma.dailyQuest.create({ data: safeData as Parameters<typeof prisma.dailyQuest.create>[0]["data"] });
    return NextResponse.json(quest);
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
    const safeData: Record<string, unknown> = {};
    for (const key of ALLOWED_QUEST_FIELDS) {
      if (key in body && body[key] !== undefined) {
        if (key === "title" || key === "titleAr" || key === "description" || key === "descriptionAr") {
          safeData[key] = sanitizeInput(String(body[key]));
        } else {
          safeData[key] = body[key];
        }
      }
    }
    const quest = await prisma.dailyQuest.update({ where: { id }, data: safeData });
    return NextResponse.json(quest);
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
    await prisma.dailyQuest.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
