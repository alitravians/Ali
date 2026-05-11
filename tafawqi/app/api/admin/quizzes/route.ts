import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { requireSameOrigin } from "@/lib/csrf";
import { z } from "zod";

export const dynamic = "force-dynamic";

async function ensureAdmin(): Promise<{ id: string } | null> {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") return null;
  return { id: u.id };
}

export async function GET() {
  if (!(await ensureAdmin())) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const items = await prisma.quiz.findMany({
    include: {
      chapter: true,
      section: true,
      _count: { select: { items: true, attempts: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ quizzes: items });
}

const createSchema = z.object({
  slug: z.string().min(2).max(200).regex(/^[a-z0-9-]+$/, "الـ slug يجب أن يحتوي حروف صغيرة وأرقام و - فقط"),
  title: z.string().min(2).max(200),
  description: z.string().max(2000).default(""),
  chapterId: z.string().max(64).nullable().optional(),
  sectionId: z.string().max(64).nullable().optional(),
  kind: z.enum(["short", "medium", "endOfUnit", "review", "daily"]).default("short"),
  durationSec: z.number().int().min(30).max(6 * 60 * 60).default(120),
  questionCount: z.number().int().min(1).max(200).default(5),
  isActive: z.boolean().default(true),
  questionIds: z.array(z.string().max(64)).max(200).optional(),
});

export async function POST(req: Request) {
  const csrf = requireSameOrigin(req);
  if (!csrf.ok) return NextResponse.json({ error: csrf.reason }, { status: 403 });
  const admin = await ensureAdmin();
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  try {
    const data = createSchema.parse(await req.json());
    const q = await prisma.quiz.create({
      data: {
        slug: data.slug,
        title: data.title,
        description: data.description,
        chapterId: data.chapterId || null,
        sectionId: data.sectionId || null,
        kind: data.kind,
        durationSec: data.durationSec,
        questionCount: data.questionCount,
        isActive: data.isActive,
        items: data.questionIds
          ? { create: data.questionIds.map((qid, i) => ({ questionId: qid, order: i })) }
          : undefined,
      },
    });
    await recordAudit({
      adminId: admin.id,
      action: "create_quiz",
      targetType: "quiz",
      targetId: q.id,
      details: { slug: data.slug, kind: data.kind },
      req,
    });
    return NextResponse.json({ ok: true, quiz: q });
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.issues[0]?.message ?? "بيانات غير صالحة" : "تعذّر إنشاء الاختبار";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

const patchSchema = createSchema.partial().extend({
  id: z.string().min(1).max(64),
  questionIds: z.array(z.string().max(64)).max(200).optional(),
});

export async function PATCH(req: Request) {
  const csrf = requireSameOrigin(req);
  if (!csrf.ok) return NextResponse.json({ error: csrf.reason }, { status: 403 });
  const admin = await ensureAdmin();
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  try {
    const data = patchSchema.parse(await req.json());
    const { id, questionIds, ...rest } = data;
    const update: Record<string, unknown> = { ...rest };
    if ("chapterId" in update && !update.chapterId) update.chapterId = null;
    if ("sectionId" in update && !update.sectionId) update.sectionId = null;
    const q = await prisma.quiz.update({ where: { id }, data: update });
    if (questionIds && Array.isArray(questionIds)) {
      await prisma.quizQuestion.deleteMany({ where: { quizId: id } });
      if (questionIds.length > 0) {
        await prisma.quizQuestion.createMany({
          data: questionIds.map((qid, i) => ({ quizId: id, questionId: qid, order: i })),
          skipDuplicates: true,
        });
      }
    }
    await recordAudit({
      adminId: admin.id,
      action: "update_quiz",
      targetType: "quiz",
      targetId: id,
      req,
    });
    return NextResponse.json({ ok: true, quiz: q });
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.issues[0]?.message ?? "بيانات غير صالحة" : "تعذّر التحديث";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

const deleteSchema = z.object({ id: z.string().min(1).max(64) });

export async function DELETE(req: Request) {
  const csrf = requireSameOrigin(req);
  if (!csrf.ok) return NextResponse.json({ error: csrf.reason }, { status: 403 });
  const admin = await ensureAdmin();
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  try {
    const { id } = deleteSchema.parse(await req.json());
    await prisma.quiz.delete({ where: { id } });
    await recordAudit({
      adminId: admin.id,
      action: "delete_quiz",
      targetType: "quiz",
      targetId: id,
      req,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.issues[0]?.message ?? "معرّف غير صالح" : "تعذّر الحذف";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
