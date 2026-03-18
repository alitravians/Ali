import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const [totalUsers, totalLanguages, totalLevels, totalLessons, totalQuestions, totalTests, totalCertificates, totalTestResults, totalTickets, openTickets] =
      await Promise.all([
        prisma.user.count(),
        prisma.language.count(),
        prisma.level.count(),
        prisma.lesson.count(),
        prisma.question.count(),
        prisma.test.count(),
        prisma.certificate.count(),
        prisma.testResult.count(),
        prisma.ticket.count(),
        prisma.ticket.count({ where: { status: { not: "closed" } } }),
      ]);

    const recentCertificates = await prisma.certificate.findMany({
      take: 10,
      orderBy: { issueDate: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        level: { select: { nameAr: true, name: true, language: { select: { nameAr: true, flag: true } } } },
      },
    });

    const recentUsers = await prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, points: true, createdAt: true },
    });

    return NextResponse.json({
      totalUsers, totalLanguages, totalLevels, totalLessons, totalQuestions, totalTests, totalCertificates, totalTestResults, totalTickets, openTickets,
      recentCertificates,
      recentUsers,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
