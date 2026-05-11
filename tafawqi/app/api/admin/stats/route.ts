import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const [users, students, questions, quizzes, attempts, sections, certificates] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "student" } }),
    prisma.question.count(),
    prisma.quiz.count(),
    prisma.attempt.count({ where: { finishedAt: { not: null } } }),
    prisma.section.findMany({
      include: { _count: { select: { questions: true } } },
    }),
    prisma.certificate.count(),
  ]);

  // متوسط النتائج
  const attemptAgg = await prisma.attempt.aggregate({
    where: { finishedAt: { not: null }, total: { gt: 0 } },
    _sum: { score: true, total: true },
  });
  const avgPct = attemptAgg._sum.total
    ? Math.round((100 * (attemptAgg._sum.score ?? 0)) / attemptAgg._sum.total)
    : 0;

  // أصعب الأقسام (أقل نسبة نجاح)
  const sectionsWithStats = await Promise.all(
    sections.map(async (s) => {
      const ans = await prisma.attemptAnswer.findMany({
        where: { question: { sectionId: s.id } },
        select: { isCorrect: true },
      });
      const total = ans.length;
      const correct = ans.filter((a) => a.isCorrect).length;
      const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
      return { sectionId: s.id, title: s.title, slug: s.slug, totalAnswers: total, correctPct: pct };
    })
  );
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
