import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  try {
    const { email } = schema.parse(await req.json());
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      // لا نكشف وجود الحساب
      return NextResponse.json({ ok: true, message: "إذا كان البريد مسجلاً ستصلكِ تعليمات الاستعادة." });
    }
    const token = crypto.randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 min
    await prisma.passwordReset.create({ data: { userId: user.id, token, expiresAt } });
    // في MVP نُرجع الـ token مباشرة (في الإنتاج يُرسل عبر البريد)
    return NextResponse.json({
      ok: true,
      message: "تم إنشاء رمز استعادة. استخدميه لتعيين كلمة مرور جديدة.",
      token,
      resetUrl: `/forgot/confirm?token=${token}`,
    });
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }
}
