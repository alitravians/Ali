import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lessonId = searchParams.get("lessonId");
    const words = await prisma.word.findMany({
      where: lessonId ? { lessonId } : {},
      include: { lesson: true },
    });
    return NextResponse.json(words);
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const word = await prisma.word.create({ data: body });
    return NextResponse.json(word, { status: 201 });
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
