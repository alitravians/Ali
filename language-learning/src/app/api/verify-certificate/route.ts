import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "كود الشهادة مطلوب" }, { status: 400 });
    }

    const certificate = await prisma.certificate.findUnique({
      where: { certificateCode: code },
      include: {
        user: { select: { name: true } },
        level: { include: { language: true } },
      },
    });

    if (!certificate) {
      return NextResponse.json({ error: "الشهادة غير موجودة", valid: false }, { status: 404 });
    }

    // Get user progress for skill breakdown
    const progress = await prisma.userProgress.findUnique({
      where: {
        userId_levelId: {
          userId: certificate.userId,
          levelId: certificate.levelId,
        },
      },
    });

    return NextResponse.json({
      valid: true,
      certificate: {
        code: certificate.certificateCode,
        userName: certificate.userName,
        languageName: certificate.languageName,
        levelName: certificate.levelName,
        issueDate: certificate.issueDate,
        score: certificate.score,
        grade: certificate.grade,
        gradeAr: certificate.gradeAr,
        expiresAt: certificate.expiresAt,
        level: certificate.level,
        skills: {
          reading: certificate.readingScore || progress?.readingScore || 0,
          writing: certificate.writingScore || progress?.writingScore || 0,
          listening: certificate.listeningScore || progress?.listeningScore || 0,
          speaking: certificate.speakingScore || progress?.speakingScore || 0,
          overall: certificate.score || progress?.overallProgress || 0,
        },
      },
    });
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
