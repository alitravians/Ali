// F6 — POST /api/questions/report: file a report against a specific question
// (typo, wrong answer, confusing wording, other). Authenticated students
// only. Rate-limited per user (5 reports / 10 min) to discourage spam.
// Cross-origin POSTs are rejected by the CSRF guard.

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import { rateLimit } from "@/lib/rate-limit";
import { safeJson, sanitizeText } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

const ALLOWED_REASONS = ["typo", "wrong_answer", "confusing", "other"] as const;
type Reason = (typeof ALLOWED_REASONS)[number];

const schema = z.object({
  questionId: z.string().min(1).max(64),
  reason: z.enum(ALLOWED_REASONS),
  comment: z.string().max(1000).optional(),
});

export async function POST(req: Request) {
  const csrf = requireSameOrigin(req);
  if (!csrf.ok) return NextResponse.json({ error: csrf.reason }, { status: 403 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "يجب تسجيل الدخول للإبلاغ" }, { status: 401 });
  if (user.isBlocked) return NextResponse.json({ error: "تم إيقاف الحساب" }, { status: 403 });

  // Feature toggle (admin can disable from the settings panel).
  try {
    const setting = await prisma.siteSetting.findUnique({ where: { key: "question_reports_enabled" } });
    if (setting?.value === "false") {
      return NextResponse.json({ error: "ميزة الإبلاغ معطّلة حالياً" }, { status: 403 });
    }
  } catch {}

  // Rate-limit: 5 reports per user per 10 minutes.
  const rl = rateLimit(`report:${user.id}`, 5, 600);
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

  // Verify the question exists.
  const question = await prisma.question.findUnique({
    where: { id: data.questionId },
    select: { id: true },
  });
  if (!question) {
    return NextResponse.json({ error: "السؤال غير موجود" }, { status: 404 });
  }

  // Anti-duplicate: reject if the same user already filed a pending report
  // on the same question in the last 24h.
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const duplicate = await prisma.questionReport.findFirst({
    where: {
      userId: user.id,
      questionId: data.questionId,
      status: "pending",
      createdAt: { gt: dayAgo },
    },
  });
  if (duplicate) {
    return NextResponse.json(
      { error: "سبق وأن أبلغتِ عن هذا السؤال. شكراً!" },
      { status: 409 }
    );
  }

  const report = await prisma.questionReport.create({
    data: {
      questionId: data.questionId,
      userId: user.id,
      reason: data.reason as Reason,
      comment: sanitizeText(data.comment ?? "").slice(0, 1000),
      status: "pending",
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, reportId: report.id });
}
