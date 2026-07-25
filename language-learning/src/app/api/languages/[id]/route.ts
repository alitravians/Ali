import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const language = await prisma.language.findUnique({
      where: { id: params.id },
      include: {
        levels: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
              include: {
                _count: { select: { words: true, questions: true } },
              },
            },
            _count: { select: { lessons: true, tests: true } },
          },
        },
      },
    });

    if (!language) {
      return NextResponse.json({ error: "اللغة غير موجودة" }, { status: 404 });
    }

    return NextResponse.json(language);
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
    const language = await prisma.language.update({
      where: { id: params.id },
      data: body,
    });
    return NextResponse.json(language);
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.language.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "تم الحذف بنجاح" });
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
