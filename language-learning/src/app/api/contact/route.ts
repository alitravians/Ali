import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function sanitizeInput(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
    }

    if (typeof name !== "string" || name.trim().length > 100) {
      return NextResponse.json({ error: "الاسم يجب أن لا يتجاوز 100 حرف" }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "البريد الإلكتروني غير صالح" }, { status: 400 });
    }

    if (typeof subject !== "string" || subject.trim().length > 200) {
      return NextResponse.json({ error: "الموضوع يجب أن لا يتجاوز 200 حرف" }, { status: 400 });
    }

    if (typeof message !== "string" || message.trim().length > 2000) {
      return NextResponse.json({ error: "الرسالة يجب أن لا تتجاوز 2000 حرف" }, { status: 400 });
    }

    await prisma.contactMessage.create({
      data: {
        name: sanitizeInput(name.trim()),
        email: email.trim(),
        subject: sanitizeInput(subject.trim()),
        message: sanitizeInput(message.trim()),
      },
    });

    return NextResponse.json({ message: "تم إرسال رسالتك بنجاح. سنتواصل معك قريباً." });
  } catch (error) {
    console.error("Error processing contact form:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
