import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSameOrigin } from "@/lib/csrf";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { safeJson, sanitizeText, normalizeEmail } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

// F20 — Public contact form.
//
// POST /api/contact  { name, email, subject, message }
// Authentication: NOT required (public).
// Protection layers:
//   - CSRF via requireSameOrigin
//   - per-IP rate limit (5 per 10 min)
//   - per-email rate limit (3 per 10 min)
//   - input sanitization + length caps via sanitizeText
//   - feature flag "contact_form_enabled" can hard-disable the endpoint
//
// On success we store the message in ContactMessage so admins can review it
// from /admin → 📬 رسائل التواصل tab. We never send emails — keeps the
// platform free of external dependencies.

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  subject: z.string().min(1).max(160),
  message: z.string().min(5).max(4000),
});

async function isEnabled(): Promise<boolean> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: "contact_form_enabled" } });
    if (!row) return true; // default ON
    return row.value !== "false";
  } catch {
    return true;
  }
}

export async function POST(req: Request) {
  const csrf = requireSameOrigin(req);
  if (!csrf.ok) return NextResponse.json({ error: csrf.reason }, { status: 403 });

  if (!(await isEnabled())) {
    return NextResponse.json(
      { error: "نموذج التواصل معطّل حالياً." },
      { status: 503 },
    );
  }

  const ip = getClientIp(req);
  const rlIp = rateLimit(`contact:ip:${ip}`, 5, 600);
  if (!rlIp.ok) {
    return NextResponse.json(
      { error: `محاولات كثيرة. حاولي بعد ${rlIp.retryAfterSec} ثانية.` },
      { status: 429, headers: { "Retry-After": String(rlIp.retryAfterSec) } },
    );
  }

  const parsed = await safeJson<unknown>(req);
  if (!parsed.ok) return NextResponse.json({ error: parsed.reason }, { status: 400 });

  let data: z.infer<typeof schema>;
  try {
    data = schema.parse(parsed.data);
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  const email = normalizeEmail(data.email);
  const rlEmail = rateLimit(`contact:email:${email}`, 3, 600);
  if (!rlEmail.ok) {
    return NextResponse.json(
      { error: `محاولات كثيرة من هذا البريد. حاولي بعد ${rlEmail.retryAfterSec} ثانية.` },
      { status: 429, headers: { "Retry-After": String(rlEmail.retryAfterSec) } },
    );
  }

  try {
    await prisma.contactMessage.create({
      data: {
        name: sanitizeText(data.name, 120),
        email,
        subject: sanitizeText(data.subject, 160),
        message: sanitizeText(data.message, 4000),
        ip,
        userAgent: (req.headers.get("user-agent") || "").slice(0, 300),
      },
    });
    return NextResponse.json({
      ok: true,
      message: "تمّ إرسال رسالتكِ. سنتواصل معكِ قريباً إن شاء الله.",
    });
  } catch {
    return NextResponse.json({ error: "تعذّر إرسال الرسالة، حاولي مجدداً." }, { status: 500 });
  }
}
