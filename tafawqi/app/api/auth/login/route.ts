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

// Sustained-failure account lockout (separate from per-IP/per-email rate limit).
// After this many consecutive bad-password attempts the account is temporarily
// locked. The lock is auto-released once `lockedUntil` is in the past.
const FAILURE_LOCKOUT_THRESHOLD = 8;
const FAILURE_LOCKOUT_MINUTES = 15;

export async function POST(req: Request) {
  const ip = getClientIp(req);

  const parsed = await safeJson<unknown>(req);
  if (!parsed.ok) return NextResponse.json({ error: parsed.reason }, { status: 400 });

  let data: z.infer<typeof schema>;
  try {
    data = schema.parse(parsed.data);
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.issues[0]?.message ?? "بيانات غير صالحة" : "بيانات غير صالحة";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const email = normalizeEmail(data.email);

  // Two layers of rate limiting (in-process):
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
    if (!user) {
      return NextResponse.json({ error: "بيانات تسجيل الدخول غير صحيحة" }, { status: 401 });
    }
    if (user.isBlocked) {
      return NextResponse.json({ error: "تم إيقاف الحساب. تواصلي مع الإدارة." }, { status: 403 });
    }
    // Sustained-failure lockout (DB-backed, survives restarts).
    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      const secs = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000);
      return NextResponse.json(
        { error: `الحساب مقفل مؤقتاً. حاولي بعد ${secs} ثانية.` },
        { status: 429, headers: { "Retry-After": String(secs) } }
      );
    }
    const ok = await verifyPassword(data.password, user.passwordHash);
    if (!ok) {
      // Increment failure counter; lock after threshold.
      const nextCount = (user.failedLoginCount ?? 0) + 1;
      const shouldLock = nextCount >= FAILURE_LOCKOUT_THRESHOLD;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: nextCount,
          lockedUntil: shouldLock ? new Date(Date.now() + FAILURE_LOCKOUT_MINUTES * 60_000) : user.lockedUntil,
        },
      });
      return NextResponse.json(
        { error: "بيانات تسجيل الدخول غير صحيحة" },
        { status: 401 }
      );
    }
    // Successful login: clear counters and lock if any.
    if (user.failedLoginCount !== 0 || user.lockedUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: 0, lockedUntil: null },
      });
    }
    await setSessionCookie({ uid: user.id, role: user.role === "admin" ? "admin" : "student" });
    return NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch {
    return NextResponse.json({ error: "تعذّر تسجيل الدخول، حاولي مجدداً." }, { status: 500 });
  }
}
