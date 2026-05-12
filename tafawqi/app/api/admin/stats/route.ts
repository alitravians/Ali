import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const [users, students, questions, quizzes, attempts, sections, certificates, attemptAgg, allAnswers] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "student" } }),
      prisma.question.count(),
      prisma.quiz.count(),
      prisma.attempt.count({ where: { finishedAt: { not: null } } }),
      prisma.section.findMany({ select: { id: true, title: true, slug: true } }),
      prisma.certificate.count(),
      prisma.attempt.aggregate({
        where: { finishedAt: { not: null }, total: { gt: 0 } },
        _sum: { score: true, total: true },
      }),
      // Single denormalized read — aggregate per section in memory instead of
      // running findMany once per section (previously O(N) DB round-trips).
      prisma.attemptAnswer.findMany({
        select: { isCorrect: true, question: { select: { sectionId: true } } },
      }),
    ]);

  const totalScore = attemptAgg._sum.score ?? 0;
  const totalQuestionsAnswered = attemptAgg._sum.total ?? 0;
  const avgPct = totalQuestionsAnswered
    ? Math.round((100 * totalScore) / totalQuestionsAnswered)
    : 0;

  type Counts = { total: number; correct: number };
  const perSection = new Map<string, Counts>();
  for (const a of allAnswers) {
    const sid = a.question.sectionId;
    const cur = perSection.get(sid) ?? { total: 0, correct: 0 };
    cur.total++;
    if (a.isCorrect) cur.correct++;
    perSection.set(sid, cur);
  }

  const sectionsWithStats = sections.map((s) => {
    const c = perSection.get(s.id) ?? { total: 0, correct: 0 };
    return {
      sectionId: s.id,
      title: s.title,
      slug: s.slug,
      totalAnswers: c.total,
      correctPct: c.total > 0 ? Math.round((c.correct / c.total) * 100) : 0,
    };
  });
  sectionsWithStats.sort((a, b) => {
    if (a.totalAnswers === 0 && b.totalAnswers === 0) return 0;
    if (a.totalAnswers === 0) return 1;
    if (b.totalAnswers === 0) return -1;
    return a.correctPct - b.correctPct;
  });

  return NextResponse.json({
    counts: { users, students, questions, quizzes, attempts, certificates },
    avgPct,
    hardestSections: sectionsWithStats.slice(0, 5),
  });
}
