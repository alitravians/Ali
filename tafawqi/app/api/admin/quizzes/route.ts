import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

async function ensureAdmin() {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") return null;
  return u;
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
  slug: z.string().min(2),
  title: z.string().min(2),
  description: z.string().default(""),
  chapterId: z.string().nullable().optional(),
  sectionId: z.string().nullable().optional(),
  kind: z.enum(["short", "medium", "endOfUnit", "review", "daily"]).default("short"),
  durationSec: z.number().int().min(30).default(120),
  questionCount: z.number().int().min(1).default(5),
  isActive: z.boolean().default(true),
  questionIds: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  if (!(await ensureAdmin())) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
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
    return NextResponse.json({ ok: true, quiz: q });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "خطأ" }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  if (!(await ensureAdmin())) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  try {
    const body = await req.json();
    const { id, questionIds, ...rest } = body;
    const update: any = { ...rest };
    if ("chapterId" in update && !update.chapterId) update.chapterId = null;
    if ("sectionId" in update && !update.sectionId) update.sectionId = null;
    const q = await prisma.quiz.update({ where: { id }, data: update });
    if (questionIds && Array.isArray(questionIds)) {
      await prisma.quizQuestion.deleteMany({ where: { quizId: id } });
      for (let i = 0; i < questionIds.length; i++) {
        await prisma.quizQuestion.create({ data: { quizId: id, questionId: questionIds[i], order: i } });
      }
    }
    return NextResponse.json({ ok: true, quiz: q });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "خطأ" }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  if (!(await ensureAdmin())) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const { id } = await req.json();
  await prisma.quiz.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
