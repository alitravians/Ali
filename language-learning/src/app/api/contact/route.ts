import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
    }

    await prisma.contactMessage.create({
      data: { name, email, subject, message },
    });

    return NextResponse.json({ message: "تم إرسال رسالتك بنجاح. سنتواصل معك قريباً." });
  } catch (error) {
    console.error("Error processing contact form:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
