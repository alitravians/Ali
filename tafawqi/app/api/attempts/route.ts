import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { gradeAnswer } from "@/lib/grader";
import { pointsForResult } from "@/lib/levels";

const schema = z.object({
  quizSlug: z.string(),
  durationSec: z.number().int().min(0),
  answers: z.array(
    z.object({
      questionId: z.string(),
      answer: z.any(),
      timeMs: z.number().int().min(0).optional(),
    })
  ),
});

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "يجب تسجيل الدخول لتسجيل النتيجة" }, { status: 401 });
  try {
    const data = schema.parse(await req.json());
    const quiz = await prisma.quiz.findUnique({ where: { slug: data.quizSlug } });
    if (!quiz) return NextResponse.json({ error: "الاختبار غير موجود" }, { status: 404 });

    const questions = await prisma.question.findMany({
      where: { id: { in: data.answers.map((a) => a.questionId) } },
      include: { section: true },
    });
    const qMap = new Map(questions.map((q) => [q.id, q]));

    let correct = 0;
    const answerRows: { questionId: string; answer: string; isCorrect: boolean; timeMs: number }[] = [];
    const sectionWrong = new Map<string, number>(); // sectionId -> wrong count

    for (const a of data.answers) {
      const q = qMap.get(a.questionId);
      if (!q) continue;
      const payload = JSON.parse(q.payload || "{}");
      const isCorrect = gradeAnswer(q.type, payload, a.answer);
      if (isCorrect) correct++;
      else sectionWrong.set(q.sectionId, (sectionWrong.get(q.sectionId) || 0) + 1);
      answerRows.push({
        questionId: q.id,
        answer: JSON.stringify(a.answer),
        isCorrect,
        timeMs: a.timeMs ?? 0,
      });
    }

    const total = data.answers.length;
    const earned = pointsForResult(correct, total, data.durationSec);

    const attempt = await prisma.attempt.create({
      data: {
        userId: user.id,
        quizId: quiz.id,
        score: correct,
        total,
        durationSec: data.durationSec,
        finishedAt: new Date(),
        answers: { create: answerRows },
      },
    });

    // أضِف النقاط
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { points: { increment: earned } },
    });

    // اقتراحات ذكية: إن أخطأت ≥ 60% في قسم معين، اقترحي اختباراً إضافياً
    const suggestions: { sectionId: string; sectionTitle: string; quizSlug: string | null }[] = [];
    for (const [sectionId, wrongCount] of sectionWrong.entries()) {
      const section = await prisma.section.findUnique({ where: { id: sectionId } });
      if (!section) continue;
      const sectionTotal = questions.filter((q) => q.sectionId === sectionId).length;
      if (sectionTotal > 0 && wrongCount / sectionTotal >= 0.6) {
        const extraQuiz = await prisma.quiz.findFirst({
          where: { sectionId, isActive: true, NOT: { slug: quiz.slug } },
        });
        suggestions.push({
          sectionId,
          sectionTitle: section.title,
          quizSlug: extraQuiz?.slug ?? `quiz-${section.slug}-5`,
        });
      }
    }

    // إشعارات
    if (suggestions.length > 0) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          kind: "suggestion",
          title: "يبدو أنكِ بحاجة إلى تدريب إضافي",
          body: `لاحظنا أخطاء في: ${suggestions.map((s) => s.sectionTitle).join("، ")}. جربي اختباراً إضافياً.`,
          link: suggestions[0].quizSlug ? `/quiz/${suggestions[0].quizSlug}` : null,
        },
      });
    }
    if (correct === total && total > 0) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          kind: "success",
          title: "ممتاز! علامة كاملة 💯",
          body: `حصلتِ على ${total}/${total} في ${quiz.title}!`,
        },
      });
    }

    // افتح شارات
    await checkAndAwardBadges(user.id);

    // شهادة قسم: إذا أتمّت ٣ اختبارات في نفس القسم بمعدل ≥ 70%
    if (quiz.sectionId) {
      await checkSectionCertificate(user.id, quiz.sectionId);
    }
    if (quiz.chapterId) {
      await checkChapterCertificate(user.id, quiz.chapterId);
    }

    return NextResponse.json({
      ok: true,
      attemptId: attempt.id,
      score: correct,
      total,
      pointsEarned: earned,
      newTotalPoints: updated.points,
      suggestions,
    });
  } catch (e: any) {
    if (e?.issues) return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "فشل حفظ المحاولة", detail: String(e?.message ?? e) }, { status: 500 });
  }
}

async function checkAndAwardBadges(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;
  const attemptsCount = await prisma.attempt.count({ where: { userId, finishedAt: { not: null } } });
  const perfect = await prisma.attempt.findFirst({ where: { userId, score: { gt: 0 }, AND: [{ score: { gt: 0 } }] } });

  const badges = await prisma.badge.findMany();
  for (const b of badges) {
    let earn = false;
    if (b.kind === "count") earn = attemptsCount >= b.threshold;
    else if (b.kind === "points") earn = user.points >= b.threshold;
    else if (b.kind === "perfect") {
      const perfectAttempt = await prisma.attempt.findFirst({
        where: { userId, score: { gt: 0 } },
        orderBy: { startedAt: "desc" },
      });
      if (perfectAttempt && perfectAttempt.total > 0 && perfectAttempt.score === perfectAttempt.total) {
        earn = true;
      }
    }
    if (earn) {
      const exists = await prisma.userBadge.findUnique({
        where: { userId_badgeId: { userId, badgeId: b.id } },
      });
      if (!exists) {
        await prisma.userBadge.create({ data: { userId, badgeId: b.id } });
        await prisma.notification.create({
          data: {
            userId,
            kind: "success",
            title: `حصلتِ على شارة جديدة: ${b.title} ${b.icon}`,
            body: b.description,
          },
        });
      }
    }
  }
}

async function checkSectionCertificate(userId: string, sectionId: string) {
  const attempts = await prisma.attempt.findMany({
    where: { userId, quiz: { sectionId } },
    select: { score: true, total: true },
  });
  if (attempts.length < 3) return;
  const totalScore = attempts.reduce((s, a) => s + a.score, 0);
  const totalQ = attempts.reduce((s, a) => s + a.total, 0);
  if (totalQ === 0) return;
  const ratio = totalScore / totalQ;
  if (ratio < 0.7) return;

  const section = await prisma.section.findUnique({ where: { id: sectionId } });
  if (!section) return;
  const existing = await prisma.certificate.findFirst({ where: { userId, kind: "section", refId: sectionId } });
  if (existing) return;
  const code = `S-${section.slug}-${userId.slice(0, 6)}-${Date.now().toString(36)}`;
  await prisma.certificate.create({
    data: { userId, title: `إتمام ${section.title}`, kind: "section", refId: sectionId, code },
  });
  await prisma.notification.create({
    data: {
      userId,
      kind: "success",
      title: "شهادة جديدة 🏆",
      body: `حصلتِ على شهادة إتمام: ${section.title}`,
      link: `/certificate/${code}`,
    },
  });
}

async function checkChapterCertificate(userId: string, chapterId: string) {
  const attempts = await prisma.attempt.findMany({
    where: { userId, quiz: { chapterId } },
    select: { score: true, total: true },
  });
  if (attempts.length < 5) return;
  const totalScore = attempts.reduce((s, a) => s + a.score, 0);
  const totalQ = attempts.reduce((s, a) => s + a.total, 0);
  if (totalQ === 0) return;
  const ratio = totalScore / totalQ;
  if (ratio < 0.75) return;

  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
  if (!chapter) return;
  const existing = await prisma.certificate.findFirst({ where: { userId, kind: "chapter", refId: chapterId } });
  if (existing) return;
  const code = `C-${chapter.slug}-${userId.slice(0, 6)}-${Date.now().toString(36)}`;
  await prisma.certificate.create({
    data: { userId, title: `إتمام فصل ${chapter.title}`, kind: "chapter", refId: chapterId, code },
  });
  await prisma.notification.create({
    data: {
      userId,
      kind: "success",
      title: "شهادة فصل دراسي 🎓",
      body: `حصلتِ على شهادة إتمام فصل: ${chapter.title}`,
      link: `/certificate/${code}`,
    },
  });
}
