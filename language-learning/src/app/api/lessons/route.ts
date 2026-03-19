import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const levelId = searchParams.get("levelId");

    const lessons = await prisma.lesson.findMany({
      where: levelId ? { levelId } : {},
      include: {
        words: true,
        grammarRules: true,
        questions: true,
        level: { include: { language: true } },
        _count: { select: { words: true, grammarRules: true, questions: true } },
      },
      orderBy: { order: "asc" },
    });
    return NextResponse.json(lessons);
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const lesson = await prisma.lesson.create({
      data: {
        title: body.title,
        titleAr: body.titleAr,
        order: body.order,
        content: body.content || "",
        levelId: body.levelId,
      },
    });
    return NextResponse.json(lesson, { status: 201 });
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
