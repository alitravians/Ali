import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import { recordAudit } from "@/lib/audit";
import { safeJson } from "@/lib/sanitize";
import { generateTotpSecret, buildOtpAuthUrl, verifyTotp } from "@/lib/totp";

export const dynamic = "force-dynamic";

// F18 / S4 — Admin 2FA management.
//
// POST { action: "begin" }    → returns new secret + provisioning URL (NOT yet enabled).
// POST { action: "verify", secret, code } → verifies the secret + code, stores it, marks enabled.
// POST { action: "disable", code } → requires current code, clears secret + enabled flag.
//
// We never store the secret server-side until the admin has proven she can
// generate codes from it (verify step). This avoids broken-2FA lockouts.

const beginSchema = z.object({ action: z.literal("begin") });
const verifySchema = z.object({
  action: z.literal("verify"),
  secret: z.string().min(16).max(64),
  code: z.string().min(6).max(8),
});
const disableSchema = z.object({ action: z.literal("disable"), code: z.string().min(6).max(8) });
const schema = z.discriminatedUnion("action", [beginSchema, verifySchema, disableSchema]);

export async function POST(req: Request) {
  const csrf = requireSameOrigin(req);
  if (!csrf.ok) return NextResponse.json({ error: csrf.reason }, { status: 403 });
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const parsed = await safeJson<unknown>(req);
  if (!parsed.ok) return NextResponse.json({ error: parsed.reason }, { status: 400 });
  let body;
  try {
    body = schema.parse(parsed.data);
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  if (body.action === "begin") {
    if (user.totpEnabledAt) {
      return NextResponse.json(
        { error: "التحقّق الثنائي مفعّل أصلاً. عطّليه أولاً لإعادة الضبط." },
        { status: 400 }
      );
    }
    const secret = generateTotpSecret();
    const otpAuthUrl = buildOtpAuthUrl(secret, user.email, "تفوّقي");
    return NextResponse.json({ ok: true, secret, otpAuthUrl });
  }

  if (body.action === "verify") {
    if (user.totpEnabledAt) {
      return NextResponse.json({ error: "مفعّل أصلاً." }, { status: 400 });
    }
    if (!verifyTotp(body.secret, body.code)) {
      return NextResponse.json({ error: "الرمز غير صحيح. تحقّقي من تطبيق المصادقة." }, { status: 400 });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { totpSecret: body.secret, totpEnabledAt: new Date() },
    });
    await recordAudit({
      adminId: user.id,
      action: "2fa_enable",
      targetType: "user",
      targetId: user.id,
      req,
    });
    return NextResponse.json({ ok: true });
  }

  // disable
  if (!user.totpEnabledAt || !user.totpSecret) {
    return NextResponse.json({ error: "غير مفعّل." }, { status: 400 });
  }
  if (!verifyTotp(user.totpSecret, body.code)) {
    return NextResponse.json({ error: "الرمز غير صحيح." }, { status: 400 });
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { totpSecret: null, totpEnabledAt: null },
  });
  await recordAudit({
    adminId: user.id,
    action: "2fa_disable",
    targetType: "user",
    targetId: user.id,
    req,
  });
  return NextResponse.json({ ok: true });
}
