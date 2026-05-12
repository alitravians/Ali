// S2 — Email verification endpoints.
//
// GET  ?token=… → consume the token and mark the user as verified.
// POST          → authenticated user requests a fresh verification email.

import { NextRequest, NextResponse } from "next/server";
import { requireSameOrigin } from "@/lib/csrf";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/auth";
import { consumeVerification, createVerification } from "@/lib/email-verification";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  const ip = getClientIp(req);
  const rl = rateLimit(`verify-email-get:${ip}`, 20, 600);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `محاولات كثيرة. حاولي بعد ${rl.retryAfterSec} ثانية.` },
      { status: 429 },
    );
  }
  const result = await consumeVerification(token);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }
  return NextResponse.json({ ok: true, message: "تم تأكيد البريد الإلكتروني بنجاح" });
}

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (!csrf.ok) return NextResponse.json({ error: csrf.reason }, { status: 403 });

  const ip = getClientIp(req);
  const rl = rateLimit(`verify-email-resend:${ip}`, 5, 600);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `محاولات كثيرة. حاولي بعد ${rl.retryAfterSec} ثانية.` },
      { status: 429 },
    );
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  // Already verified? short-circuit.
  if (user.emailVerifiedAt) {
    return NextResponse.json({ ok: true, message: "البريد مؤكَّد بالفعل" });
  }
  await createVerification({ id: user.id, email: user.email });
  return NextResponse.json({
    ok: true,
    message: "أُرسل رابط التأكيد إلى بريدكِ (إن كان البريد مفعّلاً).",
  });
}
