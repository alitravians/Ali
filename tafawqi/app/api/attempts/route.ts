import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { gradeAnswer } from "@/lib/grader";
import { pointsForResult } from "@/lib/levels";
import { rateLimit } from "@/lib/rate-limit";
import { safeJson } from "@/lib/sanitize";
import { requireSameOrigin } from "@/lib/csrf";
import { updateStreak } from "@/lib/streak";
import { getDailyQuiz, getDailyQuizBonus, canClaimDailyBonus, markDailyClaimed } from "@/lib/daily-quiz";

const MAX_DURATION_SEC = 6 * 60 * 60; // 6 hours hard cap (INT4-safe)
const MAX_ANSWERS = 200; // hard cap to prevent abuse
const ATTEMPT_COOLDOWN_SEC = 5; // min seconds between submissions of the same quiz by same user

const schema = z.object({
  quizSlug: z.string().min(1).max(200),
  durationSec: z.number().int().min(0).max(MAX_DURATION_SEC),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1).max(64),
        answer: z.any(),
        timeMs: z.number().int().min(0).max(MAX_DURATION_SEC * 1000).optional(),
      })
    )
    .max(MAX_ANSWERS),
});

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // CSRF: reject cross-origin POSTs *before* doing any auth/DB work so a
  // malicious page can't piggy-back on the student's session cookies.
  const csrf = requireSameOrigin(req);
  if (!csrf.ok) return NextResponse.json({ error: csrf.reason }, { status: 403 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "يجب تسجيل الدخول لتسجيل النتيجة" }, { status: 401 });
  if (user.isBlocked) return NextResponse.json({ error: "تم إيقاف الحساب" }, { status: 403 });

  // Rate limit: 30 attempts per user per minute (covers all quizzes)
  const rl = rateLimit(`attempts:${user.id}`, 30, 60);
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

  // Resolve quiz + verify it's active
  const quiz = await prisma.quiz.findUnique({ where: { slug: data.quizSlug } });
  if (!quiz) return NextResponse.json({ error: "الاختبار غير موجود" }, { status: 404 });
  if (!quiz.isActive) return NextResponse.json({ error: "الاختبار غير متاح" }, { status: 403 });

  // De-duplicate questionIds (defense-in-depth: someone could send same question 100 times)
  const seenIds = new Set<string>();
  const uniqueAnswers: typeof data.answers = [];
  for (const a of data.answers) {
    if (seenIds.has(a.questionId)) continue;
    seenIds.add(a.questionId);
    uniqueAnswers.push(a);
  }

  if (uniqueAnswers.length === 0) {
    return NextResponse.json({ error: "لا توجد إجابات لحفظها" }, { status: 400 });
  }

  // Verify all submitted questions actually belong to this quiz
  const allowedQuestions = await prisma.question.findMany({
    where: {
      id: { in: uniqueAnswers.map((a) => a.questionId) },
      quizItems: { some: { quizId: quiz.id } },
    },
    include: { section: true },
  });
  const allowedIds = new Set(allowedQuestions.map((q) => q.id));
  const filteredAnswers = uniqueAnswers.filter((a) => allowedIds.has(a.questionId));
  if (filteredAnswers.length === 0) {
    return NextResponse.json({ error: "الإجابات لا تنتمي لهذا الاختبار" }, { status: 400 });
  }
  const qMap = new Map(allowedQuestions.map((q) => [q.id, q]));

  // Cooldown: prevent rapid same-quiz replays
  const recent = await prisma.attempt.findFirst({
    where: {
      userId: user.id,
      quizId: quiz.id,
      finishedAt: { gt: new Date(Date.now() - ATTEMPT_COOLDOWN_SEC * 1000) },
    },
    orderBy: { finishedAt: "desc" },
  });
  if (recent) {
    return NextResponse.json(
      { error: `يرجى الانتظار قبل إعادة الاختبار (${ATTEMPT_COOLDOWN_SEC} ثوان).` },
      { status: 429 }
    );
  }

  // Grade
  let correct = 0;
  const answerRows: { questionId: string; answer: string; isCorrect: boolean; timeMs: number }[] = [];
  const sectionWrong = new Map<string, number>();
  const sectionTotal = new Map<string, number>();

  for (const a of filteredAnswers) {
    const q = qMap.get(a.questionId);
    if (!q) continue;
    let payload: any = {};
    try { payload = JSON.parse(q.payload || "{}"); } catch { payload = {}; }
    const isCorrect = gradeAnswer(q.type, payload, a.answer);
    if (isCorrect) correct++;
    else sectionWrong.set(q.sectionId, (sectionWrong.get(q.sectionId) || 0) + 1);
    sectionTotal.set(q.sectionId, (sectionTotal.get(q.sectionId) || 0) + 1);
    // Serialize answer safely (cap to 8KB per answer to prevent abuse)
    let serialized = "";
    try {
      serialized = JSON.stringify(a.answer ?? null).slice(0, 8192);
    } catch { serialized = "null"; }
    answerRows.push({
      questionId: q.id,
      answer: serialized,
      isCorrect,
      timeMs: a.timeMs ?? 0,
    });
  }

  const total = filteredAnswers.length;
  const earned = pointsForResult(correct, total, data.durationSec);

  let attempt;
  try {
    attempt = await prisma.attempt.create({
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
  } catch {
    return NextResponse.json({ error: "تعذّر حفظ المحاولة، حاولي مجدداً." }, { status: 500 });
  }

  // F2 — daily-quiz bonus. If today's daily quiz is this quiz AND the user
  // hasn't already claimed today, add the configured bonus on top of the
  // normal earned points. We resolve and mark *before* writing points so
  // the increment is atomic from the user-facing perspective.
  let dailyBonus = 0;
  let isDailyQuiz = false;
  try {
    const daily = await getDailyQuiz();
    if (daily && daily.slug === quiz.slug) {
      isDailyQuiz = true;
      if (await canClaimDailyBonus(user.id)) {
        dailyBonus = await getDailyQuizBonus();
      }
    }
  } catch {
    // Settings missing or DB hiccup — ignore bonus; never block scoring.
    dailyBonus = 0;
  }

  // Award points (regular + optional daily bonus).
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { points: { increment: earned + dailyBonus } },
  });

  if (dailyBonus > 0) {
    try {
      await markDailyClaimed(user.id);
    } catch {}
  }

  // F2 — advance the streak. Failures here MUST NOT block scoring.
  let streak = { current: 0, best: 0, advanced: false, lastDate: null as string | null };
  try {
    streak = await updateStreak(user.id);
  } catch {}

  // Smart suggestions: if ≥60% wrong in a section, suggest extra practice
  const suggestions: { sectionId: string; sectionTitle: string; quizSlug: string | null }[] = [];
  for (const [sectionId, wrongCount] of sectionWrong.entries()) {
    const secTotal = sectionTotal.get(sectionId) || 0;
    if (secTotal === 0) continue;
    if (wrongCount / secTotal >= 0.6) {
      const section = await prisma.section.findUnique({ where: { id: sectionId } });
      if (!section) continue;
      const extraQuiz = await prisma.quiz.findFirst({
        where: { sectionId, isActive: true, NOT: { slug: quiz.slug } },
      });
      suggestions.push({
        sectionId,
        sectionTitle: section.title,
        quizSlug: extraQuiz?.slug ?? null,
      });
    }
  }

  // Notifications
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
  // F2 — streak milestones (3 / 7 / 30 days). Only fire on the advance.
  if (streak.advanced && [3, 7, 14, 30, 60, 100].includes(streak.current)) {
    await prisma.notification.create({
      data: {
        userId: user.id,
        kind: "success",
        title: `🔥 ${streak.current} أيام متتالية!`,
        body: `حافظتِ على تفوّقِك لـ ${streak.current} يوماً. تابعي!`,
      },
    });
  }
  if (dailyBonus > 0) {
    await prisma.notification.create({
      data: {
        userId: user.id,
        kind: "success",
        title: `✨ حصلتِ على ${dailyBonus} نقطة إضافية`,
        body: `مكافأة تحدّي اليوم على إتمام ${quiz.title}.`,
      },
    });
  }

  await checkAndAwardBadges(user.id);
  if (quiz.sectionId) await checkSectionCertificate(user.id, quiz.sectionId);
  if (quiz.chapterId) await checkChapterCertificate(user.id, quiz.chapterId);

  return NextResponse.json({
    ok: true,
    attemptId: attempt.id,
    score: correct,
    total,
    pointsEarned: earned,
    dailyBonus,
    isDailyQuiz,
    streak,
    newTotalPoints: updated.points,
    suggestions,
  });
}

async function checkAndAwardBadges(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;
  const attemptsCount = await prisma.attempt.count({ where: { userId, finishedAt: { not: null } } });
  // perfect score detection: fetch latest 50 finished attempts and check score===total locally
  const recentAttempts = await prisma.attempt.findMany({
    where: { userId, finishedAt: { not: null }, total: { gt: 0 } },
    orderBy: { finishedAt: "desc" },
    take: 50,
    select: { score: true, total: true },
  });
  const perfectExists = recentAttempts.some((a) => a.total > 0 && a.score === a.total);

  const candidates: string[] = [];
  if (attemptsCount >= 1) candidates.push("first-quiz");
  if (attemptsCount >= 10) candidates.push("ten-quizzes");
  if (attemptsCount >= 50) candidates.push("fifty-quizzes");
  if (user.points >= 100) candidates.push("100-points");
  if (user.points >= 500) candidates.push("500-points");
  if (user.points >= 1000) candidates.push("1000-points");
  if (user.points >= 2000) candidates.push("2000-points");
  if (perfectExists) candidates.push("perfect-score");

  // streak-3: 3 consecutive ≥80%
  const last3 = await prisma.attempt.findMany({
    where: { userId, finishedAt: { not: null }, total: { gt: 0 } },
    orderBy: { finishedAt: "desc" },
    take: 3,
  });
  if (last3.length === 3 && last3.every((a) => a.total > 0 && a.score / a.total >= 0.8)) {
    candidates.push("streak-3");
  }

  for (const slug of candidates) {
    const badge = await prisma.badge.findUnique({ where: { slug } });
    if (!badge) continue;
    const exists = await prisma.userBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId: badge.id } },
    });
    if (exists) continue;
    await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
    await prisma.notification.create({
      data: {
        userId,
        kind: "success",
        title: `حصلتِ على شارة جديدة: ${badge.title} 🎉`,
        body: badge.description,
      },
    });
  }
}

async function checkSectionCertificate(userId: string, sectionId: string) {
  const attempts = await prisma.attempt.findMany({
    where: { userId, quiz: { sectionId }, finishedAt: { not: null } },
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
  const existing = await prisma.certificate.findFirst({
    where: { userId, kind: "section", refId: sectionId },
  });
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
    where: { userId, quiz: { chapterId }, finishedAt: { not: null } },
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
  const existing = await prisma.certificate.findFirst({
    where: { userId, kind: "chapter", refId: chapterId },
  });
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
