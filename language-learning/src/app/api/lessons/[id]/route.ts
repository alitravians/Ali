import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: params.id },
      include: {
        words: true,
        grammarRules: true,
        questions: true,
        level: { include: { language: true } },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "الدرس غير موجود" }, { status: 404 });
    }

    return NextResponse.json(lesson);
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const lesson = await prisma.lesson.update({
      where: { id: params.id },
      data: body,
    });
    return NextResponse.json(lesson);
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.lesson.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "تم الحذف بنجاح" });
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
