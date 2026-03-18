import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const languageId = searchParams.get("languageId");

    const levels = await prisma.level.findMany({
      where: languageId ? { languageId } : {},
      include: {
        language: true,
        lessons: { orderBy: { order: "asc" } },
        _count: { select: { lessons: true, tests: true } },
      },
      orderBy: { order: "asc" },
    });
    return NextResponse.json(levels);
  } catch (error) {
    console.error("Error fetching levels:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const level = await prisma.level.create({
      data: {
        name: body.name,
        nameAr: body.nameAr,
        order: body.order,
        description: body.description || "",
        languageId: body.languageId,
      },
    });
    return NextResponse.json(level, { status: 201 });
  } catch (error) {
    console.error("Error creating level:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
