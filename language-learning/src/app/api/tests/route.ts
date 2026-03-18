import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const levelId = searchParams.get("levelId");
    const tests = await prisma.test.findMany({
      where: levelId ? { levelId } : {},
      include: {
        level: { include: { language: true, lessons: { include: { questions: true } } } },
        _count: { select: { results: true } },
      },
    });
    return NextResponse.json(tests);
  } catch (error) {
    console.error("Error fetching tests:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const test = await prisma.test.create({
      data: {
        title: body.title,
        titleAr: body.titleAr || "",
        type: body.type || "level",
        passingScore: body.passingScore || 70,
        levelId: body.levelId,
      },
    });
    return NextResponse.json(test, { status: 201 });
  } catch (error) {
    console.error("Error creating test:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
