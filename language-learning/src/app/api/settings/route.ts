import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    let settings = await prisma.siteSettings.findUnique({ where: { id: "settings" } });
    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: { id: "settings" },
      });
    }
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const settings = await prisma.siteSettings.upsert({
      where: { id: "settings" },
      update: body,
      create: { id: "settings", ...body },
    });
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
