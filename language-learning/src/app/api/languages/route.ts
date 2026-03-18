import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(languages);
  } catch (error) {
    console.error("Error fetching languages:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
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
  } catch (error) {
    console.error("Error creating language:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
