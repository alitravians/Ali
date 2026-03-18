import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
      },
      orderBy: { order: "asc" },
    });
    return NextResponse.json(lessons);
  } catch (error) {
    console.error("Error fetching lessons:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
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
  } catch (error) {
    console.error("Error creating lesson:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
