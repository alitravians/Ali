import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  try {
    const languages = await prisma.language.findMany({
      where: { isActive: true },
      include: {
        levels: {
          orderBy: { order: "asc" },
          include: {
            _count: {
              select: { lessons: true, tests: true },
            },
          },
        },
        _count: { select: { levels: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(languages);
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const language = await prisma.language.create({
      data: {
        name: body.name,
        nameAr: body.nameAr,
        code: body.code,
        flag: body.flag || "",
        description: body.description || "",
        isActive: body.isActive ?? true,
      },
    });
    return NextResponse.json(language, { status: 201 });
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
