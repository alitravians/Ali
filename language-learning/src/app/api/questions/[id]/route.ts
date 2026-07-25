import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    if (body.options && Array.isArray(body.options)) {
      body.options = JSON.stringify(body.options);
    }
    const question = await prisma.question.update({ where: { id: params.id }, data: body });
    return NextResponse.json(question);
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.question.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "تم الحذف بنجاح" });
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
