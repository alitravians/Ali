import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, setSessionCookie } from "@/lib/auth";

const schema = z.object({
  email: z.string({ error: "البريد الإلكتروني مطلوب" }).email("بريد إلكتروني غير صالح"),
  password: z.string({ error: "كلمة المرور مطلوبة" }).min(1, "كلمة المرور مطلوبة"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (!user) return NextResponse.json({ error: "بيانات تسجيل الدخول غير صحيحة" }, { status: 401 });
    if (user.isBlocked) return NextResponse.json({ error: "تم إيقاف الحساب. تواصلي مع الإدارة." }, { status: 403 });
    const ok = await verifyPassword(data.password, user.passwordHash);
    if (!ok) return NextResponse.json({ error: "بيانات تسجيل الدخول غير صحيحة" }, { status: 401 });
    await setSessionCookie({ uid: user.id, role: user.role as any });
    return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e: any) {
    if (e?.issues) return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "حدث خطأ غير متوقع" }, { status: 500 });
  }
}
