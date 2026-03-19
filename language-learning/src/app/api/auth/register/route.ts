import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import prisma from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { isValidEmail, validateLength, sanitizeInput } from "@/lib/validation";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Rate limiting: 3 registrations per hour per IP
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(`register:${ip}`, RATE_LIMITS.REGISTER);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "تم تجاوز الحد المسموح من المحاولات. حاول مرة أخرى لاحقاً" },
        { status: 429 }
      );
    }

    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "جميع الحقول مطلوبة" },
        { status: 400 }
      );
    }

    const nameError = validateLength(name, "الاسم", 2, 50);
    if (nameError) {
      return NextResponse.json(
        { error: nameError },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "البريد الإلكتروني غير صالح" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" },
        { status: 400 }
      );
    }

    // Password complexity: require at least one letter and one number
    if (!/[a-zA-Z\u0600-\u06FF]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: "كلمة المرور يجب أن تحتوي على أحرف وأرقام" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "البريد الإلكتروني مسجل مسبقاً" },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: sanitizeInput(name.trim()),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
      },
    });

    // Create welcome notification
    await createNotification({
      userId: user.id,
      title: "Welcome to LinguaMaster!",
      titleAr: "مرحباً بك في LinguaMaster!",
      message: "Start your language learning journey today.",
      messageAr: "ابدأ رحلة تعلم اللغات اليوم.",
      type: "success",
      category: "account",
      icon: "rocket",
      link: "/languages",
      priority: "normal",
    });

    return NextResponse.json(
      { message: "تم إنشاء الحساب بنجاح", userId: user.id },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء الحساب" },
      { status: 500 }
    );
  }
}
