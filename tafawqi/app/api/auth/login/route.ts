import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { safeJson, normalizeEmail } from "@/lib/sanitize";

const schema = z.object({
  email: z.string({ error: "البريد الإلكتروني مطلوب" }).email("بريد إلكتروني غير صالح").max(200),
  password: z
    .string({ error: "كلمة المرور مطلوبة" })
    .min(1, "كلمة المرور مطلوبة")
    .max(200),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);

  const parsed = await safeJson<unknown>(req);
  if (!parsed.ok) return NextResponse.json({ error: parsed.reason }, { status: 400 });

  let data: z.infer<typeof schema>;
  try {
    data = schema.parse(parsed.data);
  } catch (e: any) {
    const msg = e?.issues?.[0]?.message || "بيانات غير صالحة";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const email = normalizeEmail(data.email).trim();

  // Two layers of rate limiting:
  // - per IP: 30/minute (protects against scanning)
  // - per email: 10/minute (protects against targeted brute-force on one account)
  const rlIp = rateLimit(`login:ip:${ip}`, 30, 60);
  const rlEmail = rateLimit(`login:email:${email || "anon"}`, 10, 60);
  if (!rlIp.ok || !rlEmail.ok) {
    const wait = Math.max(rlIp.retryAfterSec, rlEmail.retryAfterSec);
    return NextResponse.json(
      { error: `محاولات كثيرة. حاولي بعد ${wait} ثانية.` },
      { status: 429, headers: { "Retry-After": String(wait) } }
    );
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "بيانات تسجيل الدخول غير صحيحة" }, { status: 401 });
    if (user.isBlocked) return NextResponse.json({ error: "تم إيقاف الحساب. تواصلي مع الإدارة." }, { status: 403 });
    const ok = await verifyPassword(data.password, user.passwordHash);
    if (!ok) return NextResponse.json({ error: "بيانات تسجيل الدخول غير صحيحة" }, { status: 401 });
    await setSessionCookie({ uid: user.id, role: user.role as any });
    return NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch {
    return NextResponse.json({ error: "تعذّر تسجيل الدخول، حاولي مجدداً." }, { status: 500 });
  }
}
