import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sanitizeInput, isValidEmail, validateLength } from "@/lib/validation";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Rate limiting: 3 submissions per hour per IP
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(`contact:${ip}`, RATE_LIMITS.CONTACT);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "تم تجاوز الحد المسموح من الرسائل. حاول مرة أخرى لاحقاً" },
        { status: 429 }
      );
    }

    const { name, email, subject, message } = await req.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
    }

    const nameError = validateLength(name, "الاسم", 1, 100);
    if (nameError) {
      return NextResponse.json({ error: nameError }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "البريد الإلكتروني غير صالح" }, { status: 400 });
    }

    const subjectError = validateLength(subject, "الموضوع", 1, 200);
    if (subjectError) {
      return NextResponse.json({ error: subjectError }, { status: 400 });
    }

    const messageError = validateLength(message, "الرسالة", 1, 2000);
    if (messageError) {
      return NextResponse.json({ error: messageError }, { status: 400 });
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
