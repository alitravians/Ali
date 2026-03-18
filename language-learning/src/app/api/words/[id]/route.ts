import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const word = await prisma.word.update({ where: { id: params.id }, data: body });
    return NextResponse.json(word);
  } catch (error) {
    console.error("Error updating word:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.word.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "تم الحذف بنجاح" });
  } catch (error) {
    console.error("Error deleting word:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
