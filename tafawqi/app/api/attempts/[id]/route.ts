import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const attempt = await prisma.attempt.findUnique({
    where: { id },
    include: {
      quiz: { include: { chapter: true, section: true } },
      answers: { include: { question: { include: { section: true } } } },
    },
  });
  if (!attempt) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  if (attempt.userId !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "غير مسموح" }, { status: 403 });
  }
  const answers = attempt.answers.map((a) => {
    const payload = JSON.parse(a.question.payload || "{}");
    return {
      id: a.id,
      isCorrect: a.isCorrect,
      yourAnswer: JSON.parse(a.answer || "null"),
      question: {
        id: a.question.id,
        prompt: a.question.prompt,
        type: a.question.type,
        explanation: a.question.explanation,
        section: { slug: a.question.section.slug, title: a.question.section.title },
        payload,
      },
    };
  });
  // F7 — let the client decide whether to show the share widget. Admin can
  // disable from the settings panel without redeploying.
  const shareSetting = await prisma.siteSetting.findUnique({
    where: { key: "social_share_enabled" },
  }).catch(() => null);
  const socialShareEnabled = shareSetting?.value !== "false";

  return NextResponse.json({
    attempt: {
      id: attempt.id,
      score: attempt.score,
      total: attempt.total,
      durationSec: attempt.durationSec,
      finishedAt: attempt.finishedAt,
      quiz: {
        slug: attempt.quiz.slug,
        title: attempt.quiz.title,
        chapter: attempt.quiz.chapter ? { slug: attempt.quiz.chapter.slug, title: attempt.quiz.chapter.title, icon: attempt.quiz.chapter.icon } : null,
        section: attempt.quiz.section ? { slug: attempt.quiz.section.slug, title: attempt.quiz.section.title } : null,
      },
      answers,
    },
    socialShareEnabled,
  });
}
