import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { safeJson, sanitizeName, normalizeEmail } from "@/lib/sanitize";
import { checkPassword } from "@/lib/password";
import { createVerification, isVerificationRequired } from "@/lib/email-verification";

const schema = z.object({
  name: z.string({ error: "الاسم مطلوب" }).min(2, "الاسم قصير جداً").max(60, "الاسم طويل جداً"),
  email: z.string({ error: "البريد الإلكتروني مطلوب" }).email("بريد إلكتروني غير صالح").max(200),
  password: z.string({ error: "كلمة المرور مطلوبة" }).max(200, "كلمة المرور طويلة جداً"),
  phone: z.string().max(20).optional().or(z.literal("")),
});

export async function POST(req: Request) {
  // Rate limit: 5 registrations per IP per 10 minutes
  const ip = getClientIp(req);
  const rl = rateLimit(`register:${ip}`, 5, 600);
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

  const pw = checkPassword(data.password);
  if (!pw.ok) {
    return NextResponse.json({ error: pw.reason }, { status: 400 });
  }

  const cleanName = sanitizeName(data.name);
  if (cleanName.length < 2) {
    return NextResponse.json({ error: "الاسم غير صالح" }, { status: 400 });
  }
  const email = normalizeEmail(data.email);

  // Check registration_open
  const setting = await prisma.siteSetting.findUnique({ where: { key: "registration_open" } });
  if (setting?.value === "false") {
    return NextResponse.json({ error: "التسجيل مغلق حالياً" }, { status: 403 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "هذا البريد مسجّل مسبقاً" }, { status: 409 });
  }

  try {
    const passwordHash = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: {
        email,
        name: cleanName,
        passwordHash,
        phone: data.phone ? data.phone.trim() : null,
        role: "student",
      },
    });
    // S2 — issue a verification token. Until SMTP is wired in, the link is
    // logged server-side. The user is logged in immediately unless the admin
    // has flipped email_verification_required on (in which case we don't set
    // the cookie so they're forced through /verify-email first).
    await createVerification({ id: user.id, email: user.email });
    const required = await isVerificationRequired();
    if (!required) {
      await setSessionCookie({ uid: user.id, role: "student" });
    }
    return NextResponse.json({
      ok: true,
      verificationRequired: required,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch {
    // P2002 unique constraint failure (rare race condition)
    return NextResponse.json({ error: "تعذّر إنشاء الحساب، حاولي مجدداً." }, { status: 500 });
  }
}
