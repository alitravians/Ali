import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { safeJson } from "@/lib/sanitize";

const schema = z.object({
  token: z.string({ error: "الرمز مطلوب" }).min(16, "الرمز غير صالح").max(128),
  password: z
    .string({ error: "كلمة المرور مطلوبة" })
    .min(6, "كلمة المرور يجب أن لا تقل عن ٦ أحرف")
    .max(200, "كلمة المرور طويلة جداً"),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit(`reset-confirm:${ip}`, 20, 600);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `محاولات كثيرة. حاولي بعد ${rl.retryAfterSec} ثانية.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const parsed = await safeJson<unknown>(req);
  if (!parsed.ok) return NextResponse.json({ error: parsed.reason }, { status: 400 });

  let data: z.infer<typeof schema>;
  try {
    data = schema.parse(parsed.data);
  } catch (e: any) {
    const msg = e?.issues?.[0]?.message || "بيانات غير صالحة";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const reset = await prisma.passwordReset.findUnique({ where: { token: data.token } });
  if (!reset || reset.expiresAt < new Date()) {
    return NextResponse.json({ error: "الرمز غير صالح أو منتهي الصلاحية" }, { status: 400 });
  }

  try {
    const passwordHash = await hashPassword(data.password);
    await prisma.user.update({ where: { id: reset.userId }, data: { passwordHash } });
    await prisma.passwordReset.delete({ where: { token: data.token } });
    // Invalidate all other pending tokens for this user (defense-in-depth)
    await prisma.passwordReset.deleteMany({ where: { userId: reset.userId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "تعذّر تحديث كلمة المرور، حاولي مجدداً." }, { status: 500 });
  }
}
