import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rule = await prisma.grammarRule.create({ data: body });
    return NextResponse.json(rule, { status: 201 });
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
