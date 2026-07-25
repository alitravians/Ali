import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rooms = await prisma.chatRoom.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      include: {
        _count: { select: { messages: true } },
      },
    });
    return NextResponse.json(rooms);
  } catch {
    return NextResponse.json({ error: "فشل في جلب الغرف" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, nameAr, description, type } = body;

    if (!name || !nameAr) {
      return NextResponse.json({ error: "الاسم مطلوب" }, { status: 400 });
    }

    const room = await prisma.chatRoom.create({
      data: {
        name: name.slice(0, 100),
        nameAr: nameAr.slice(0, 100),
        description: (description || "").slice(0, 500),
        type: type || "public",
      },
    });

    return NextResponse.json(room);
  } catch {
    return NextResponse.json({ error: "فشل في إنشاء الغرفة" }, { status: 500 });
  }
}
