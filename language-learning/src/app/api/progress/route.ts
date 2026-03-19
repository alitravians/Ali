import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const progress = await prisma.userProgress.findMany({
      where: { userId: session.user.id },
      include: {
        level: { include: { language: true } },
      },
    });

    return NextResponse.json(progress);
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { levelId, lessonId } = await req.json();

    const existing = await prisma.userProgress.findUnique({
      where: {
        userId_levelId: { userId: session.user.id, levelId },
      },
    });

    if (existing) {
      const completedLessons = JSON.parse(existing.completedLessons || "[]");
      if (!completedLessons.includes(lessonId)) {
        completedLessons.push(lessonId);
      }

      const totalLessons = await prisma.lesson.count({ where: { levelId } });
      const progressPercent = Math.round((completedLessons.length / totalLessons) * 100);

      await prisma.userProgress.update({
        where: { id: existing.id },
        data: {
          completedLessons: JSON.stringify(completedLessons),
          overallProgress: Math.max(existing.overallProgress, progressPercent),
        },
      });
    } else {
      await prisma.userProgress.create({
        data: {
          userId: session.user.id,
          levelId,
          completedLessons: JSON.stringify([lessonId]),
          overallProgress: 0,
        },
      });
    }

    // Award points for lesson completion
    await prisma.user.update({
      where: { id: session.user.id },
      data: { points: { increment: 10 } },
    });

    return NextResponse.json({ message: "تم تحديث التقدم" });
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
