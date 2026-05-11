import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

const schema = z.object({
  token: z.string().min(8),
  password: z.string().min(6, "كلمة المرور قصيرة"),
});

export async function POST(req: Request) {
  try {
    const { token, password } = schema.parse(await req.json());
    const reset = await prisma.passwordReset.findUnique({ where: { token } });
    if (!reset || reset.expiresAt < new Date()) {
      return NextResponse.json({ error: "الرمز غير صالح أو منتهي الصلاحية" }, { status: 400 });
    }
    const passwordHash = await hashPassword(password);
    await prisma.user.update({ where: { id: reset.userId }, data: { passwordHash } });
    await prisma.passwordReset.delete({ where: { token } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.issues) return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "حدث خطأ غير متوقع" }, { status: 500 });
  }
}
