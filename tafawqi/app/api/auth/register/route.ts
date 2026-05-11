import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, setSessionCookie } from "@/lib/auth";

const schema = z.object({
  name: z.string({ error: "الاسم مطلوب" }).min(2, "الاسم قصير جداً").max(60),
  email: z.string({ error: "البريد الإلكتروني مطلوب" }).email("بريد إلكتروني غير صالح"),
  password: z.string({ error: "كلمة المرور مطلوبة" }).min(6, "كلمة المرور يجب أن لا تقل عن ٦ أحرف"),
  phone: z.string().optional().or(z.literal("")),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    // Check registration_open
    const setting = await prisma.siteSetting.findUnique({ where: { key: "registration_open" } });
    if (setting?.value === "false") {
      return NextResponse.json({ error: "التسجيل مغلق حالياً" }, { status: 403 });
    }

    const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "هذا البريد مسجّل مسبقاً" }, { status: 409 });
    }

    const passwordHash = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        name: data.name.trim(),
        passwordHash,
        phone: data.phone || null,
        role: "student",
      },
    });

    await setSessionCookie({ uid: user.id, role: "student" });
    return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e: any) {
    if (e?.issues) return NextResponse.json({ error: e.issues[0]?.message || "بيانات غير صالحة" }, { status: 400 });
    return NextResponse.json({ error: "حدث خطأ غير متوقع" }, { status: 500 });
  }
}
