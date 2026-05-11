import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { safeJson, normalizeEmail } from "@/lib/sanitize";

const schema = z.object({
  email: z.string({ error: "البريد الإلكتروني مطلوب" }).email("بريد إلكتروني غير صالح").max(200),
});

// Security note: in the current MVP we expose the reset token in the response
// only when SHOW_RESET_TOKEN is "true" (development / self-service mode).
// In production this should integrate with email or be administered manually
// by an admin via the admin panel.
const SHOW_TOKEN = (process.env.SHOW_RESET_TOKEN || "").toLowerCase() === "true";

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

  const email = normalizeEmail(data.email);

  // Rate limit: per IP 5/hour, per email 3/hour
  const rlIp = rateLimit(`reset:ip:${ip}`, 5, 3600);
  const rlEmail = rateLimit(`reset:email:${email || "anon"}`, 3, 3600);
  if (!rlIp.ok || !rlEmail.ok) {
    const wait = Math.max(rlIp.retryAfterSec, rlEmail.retryAfterSec);
    return NextResponse.json(
      { error: `محاولات كثيرة. حاولي بعد ${wait} ثانية.` },
      { status: 429, headers: { "Retry-After": String(wait) } }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // Generic response either way (do not reveal whether the account exists).
  const successResp = {
    ok: true,
    message: "إذا كان البريد مسجلاً ستصلكِ تعليمات استعادة كلمة المرور قريباً.",
  };

  if (!user) return NextResponse.json(successResp);

  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 min
  try {
    await prisma.passwordReset.create({ data: { userId: user.id, token, expiresAt } });
  } catch {
    return NextResponse.json(successResp); // soft-fail to avoid leaking info
  }

  // Self-service mode: expose token to caller (e.g. local dev or early MVP)
  if (SHOW_TOKEN) {
    return NextResponse.json({
      ...successResp,
      token,
      resetUrl: `/forgot/confirm?token=${token}`,
    });
  }
  return NextResponse.json(successResp);
}
