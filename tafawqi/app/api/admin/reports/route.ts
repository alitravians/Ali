// F6 — admin endpoint for question reports.
//   GET  /api/admin/reports                  → list reports (?status=pending|resolved|dismissed|all)
//   POST /api/admin/reports                  → resolve or dismiss one
//
// All admin actions are audit-logged.

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import { safeJson, sanitizeText } from "@/lib/sanitize";
import { recordAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const REASON_LABELS_AR: Record<string, string> = {
  typo: "خطأ إملائيّ",
  wrong_answer: "إجابة خاطئة",
  confusing: "صياغة غير واضحة",
  other: "ملاحظة أخرى",
};

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const url = new URL(req.url);
  const filter = url.searchParams.get("status") || "pending";
  const where = filter === "all" ? {} : { status: filter };

  const rows = await prisma.questionReport.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      question: {
        select: { id: true, prompt: true, type: true, sectionId: true },
      },
      user: { select: { id: true, name: true, email: true } },
      resolvedBy: { select: { id: true, name: true } },
    },
  });

  const reports = rows.map((r) => ({
    id: r.id,
    questionId: r.questionId,
    questionPrompt: r.question?.prompt ?? "",
    questionType: r.question?.type ?? "",
    reporterName: r.user?.name ?? "—",
    reporterEmail: r.user?.email ?? null,
    reason: r.reason,
    reasonLabel: REASON_LABELS_AR[r.reason] ?? r.reason,
    comment: r.comment,
    status: r.status,
    adminNote: r.adminNote,
    resolvedById: r.resolvedById,
    resolvedByName: r.resolvedBy?.name ?? null,
    resolvedAt: r.resolvedAt,
    createdAt: r.createdAt,
  }));

  return NextResponse.json({ reports });
}

const postSchema = z.object({
  action: z.enum(["resolve", "dismiss"]),
  id: z.string().min(1).max(64),
  note: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  const csrf = requireSameOrigin(req);
  if (!csrf.ok) return NextResponse.json({ error: csrf.reason }, { status: 403 });

  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const parsed = await safeJson<unknown>(req);
  if (!parsed.ok) return NextResponse.json({ error: parsed.reason }, { status: 400 });

  let data: z.infer<typeof postSchema>;
  try {
    data = postSchema.parse(parsed.data);
  } catch (e: any) {
    const msg = e?.issues?.[0]?.message || "بيانات غير صالحة";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const existing = await prisma.questionReport.findUnique({ where: { id: data.id } });
  if (!existing) return NextResponse.json({ error: "البلاغ غير موجود" }, { status: 404 });

  const nextStatus = data.action === "resolve" ? "resolved" : "dismissed";
  await prisma.questionReport.update({
    where: { id: data.id },
    data: {
      status: nextStatus,
      resolvedById: admin.id,
      resolvedAt: new Date(),
      adminNote: sanitizeText(data.note ?? "").slice(0, 500),
    },
  });

  await recordAudit({
    adminId: admin.id,
    action: data.action === "resolve" ? "resolve_report" : "dismiss_report",
    targetType: "question_report",
    targetId: data.id,
    details: { questionId: existing.questionId, reason: existing.reason },
    req,
  });

  return NextResponse.json({ ok: true });
}
