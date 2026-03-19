import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { testId, answers, scores } = await req.json();

    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        level: { include: { language: true, lessons: { include: { questions: true } } } },
      },
    });

    if (!test) {
      return NextResponse.json({ error: "الاختبار غير موجود" }, { status: 404 });
    }

    const allQuestions = test.level.lessons.flatMap((l) => l.questions);
    const totalPoints = allQuestions.reduce((sum, q) => sum + q.points, 0);
    const earnedPoints = scores?.total || 0;
    const scorePercentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = scorePercentage >= test.passingScore;

    // Save test result
    const result = await prisma.testResult.create({
      data: {
        score: scorePercentage,
        totalPoints,
        passed,
        answers: JSON.stringify(answers || []),
        userId: session.user.id,
        testId,
      },
    });

    // Update user progress
    const existingProgress = await prisma.userProgress.findUnique({
      where: {
        userId_levelId: {
          userId: session.user.id,
          levelId: test.levelId,
        },
      },
    });

    const readingScore = scores?.reading || 0;
    const writingScore = scores?.writing || 0;
    const listeningScore = scores?.listening || 0;
    const speakingScore = scores?.speaking || 0;

    if (existingProgress) {
      await prisma.userProgress.update({
        where: { id: existingProgress.id },
        data: {
          overallProgress: Math.max(existingProgress.overallProgress, scorePercentage),
          readingScore: Math.max(existingProgress.readingScore, readingScore),
          writingScore: Math.max(existingProgress.writingScore, writingScore),
          listeningScore: Math.max(existingProgress.listeningScore, listeningScore),
          speakingScore: Math.max(existingProgress.speakingScore, speakingScore),
          isCompleted: passed || existingProgress.isCompleted,
        },
      });
    } else {
      await prisma.userProgress.create({
        data: {
          userId: session.user.id,
          levelId: test.levelId,
          overallProgress: scorePercentage,
          readingScore,
          writingScore,
          listeningScore,
          speakingScore,
          isCompleted: passed,
        },
      });
    }

    // Award points
    const pointsEarned = passed ? 100 : Math.floor(scorePercentage / 2);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { points: { increment: pointsEarned } },
    });

    // Create notification
    if (passed) {
      await createNotification({
        userId: session.user.id,
        title: "Congratulations!",
        titleAr: "تهانينا!",
        message: `You passed the ${test.level.name} test with ${scorePercentage}%!`,
        messageAr: `لقد اجتزت اختبار ${test.level.nameAr} بنسبة ${scorePercentage}%!`,
        type: "success",
        category: "educational",
        icon: "trophy",
        link: `/learn/${test.levelId}`,
        priority: "important",
      });

      // Award badge for first test pass
      const badgeCount = await prisma.userBadge.count({ where: { userId: session.user.id } });
      if (badgeCount === 0) {
        await prisma.userBadge.create({
          data: {
            name: "First Victory",
            nameAr: "الانتصار الأول",
            description: "Passed your first test",
            icon: "trophy",
            userId: session.user.id,
          },
        });
      }
    } else {
      // Fail notification
      await createNotification({
        userId: session.user.id,
        title: "Keep trying!",
        titleAr: "حاول مرة أخرى!",
        message: `You scored ${scorePercentage}% on the ${test.level.name} test. Try again!`,
        messageAr: `حصلت على ${scorePercentage}% في اختبار ${test.level.nameAr}. حاول مرة أخرى!`,
        type: "warning",
        category: "educational",
        icon: "alert",
        link: `/learn/${test.levelId}`,
        priority: "normal",
      });
    }

    // Determine grade
    let grade = "Good";
    let gradeAr = "جيد";
    if (scorePercentage >= 90) { grade = "Excellent"; gradeAr = "ممتاز"; }
    else if (scorePercentage >= 80) { grade = "Very Good"; gradeAr = "جيد جداً"; }
    else if (scorePercentage >= 70) { grade = "Good"; gradeAr = "جيد"; }

    return NextResponse.json({
      result,
      scorePercentage,
      passed,
      pointsEarned,
      grade,
      gradeAr,
      totalPoints,
      earnedPoints,
    });
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
