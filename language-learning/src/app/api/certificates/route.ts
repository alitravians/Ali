import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

function generateCertCode(langCode: string, levelOrder: number): string {
  const year = new Date().getFullYear();
  const levelCodes = ["B1", "I1", "A1"];
  const levelCode = levelCodes[levelOrder - 1] || `L${levelOrder}`;
  const random = Math.floor(Math.random() * 99999).toString().padStart(5, "0");
  return `LM-${langCode.toUpperCase()}-${levelCode}-${year}-${random}`;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || session?.user?.id;
    const all = searchParams.get("all");

    if (all === "true") {
      if (!session?.user) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
      }
      const adminUser = await prisma.user.findUnique({ where: { id: session.user.id } });
      if (!adminUser || adminUser.role !== "admin") {
        return NextResponse.json({ error: "غير مصرح - صلاحيات الإدارة مطلوبة" }, { status: 403 });
      }
      const certificates = await prisma.certificate.findMany({
        include: {
          user: { select: { name: true, email: true } },
          level: { include: { language: true } },
        },
        orderBy: { issueDate: "desc" },
      });
      return NextResponse.json(certificates);
    }

    if (!userId) {
      return NextResponse.json([]);
    }

    const certificates = await prisma.certificate.findMany({
      where: { userId },
      include: {
        user: { select: { name: true } },
        level: { include: { language: true } },
      },
      orderBy: { issueDate: "desc" },
    });
    return NextResponse.json(certificates);
  } catch (error) {
    console.error("Error fetching certificates:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { levelId } = await req.json();

    const level = await prisma.level.findUnique({
      where: { id: levelId },
      include: { language: true },
    });

    if (!level) {
      return NextResponse.json({ error: "المستوى غير موجود" }, { status: 404 });
    }

    // Check if user already has certificate for this level
    const existing = await prisma.certificate.findFirst({
      where: { userId: session.user.id, levelId },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    // Verify user passed the test
    const progress = await prisma.userProgress.findUnique({
      where: {
        userId_levelId: { userId: session.user.id, levelId },
      },
    });

    if (!progress?.isCompleted) {
      return NextResponse.json(
        { error: "يجب اجتياز الاختبار أولاً" },
        { status: 400 }
      );
    }

    const certCode = generateCertCode(level.language.code, level.order);

    // Calculate grade from progress scores
    const avgScore = Math.round(
      (progress.readingScore + progress.writingScore + progress.listeningScore + progress.speakingScore) / 4
    );
    let grade = "good";
    let gradeAr = "\u062c\u064a\u062f";
    if (avgScore >= 90) { grade = "excellent"; gradeAr = "\u0645\u0645\u062a\u0627\u0632"; }
    else if (avgScore >= 75) { grade = "very_good"; gradeAr = "\u062c\u064a\u062f \u062c\u062f\u0627\u064b"; }

    const certificate = await prisma.certificate.create({
      data: {
        certificateCode: certCode,
        userName: session.user.name,
        languageName: level.language.name,
        levelName: level.name,
        score: avgScore,
        grade,
        gradeAr,
        readingScore: progress.readingScore,
        writingScore: progress.writingScore,
        listeningScore: progress.listeningScore,
        speakingScore: progress.speakingScore,
        userId: session.user.id,
        levelId,
      },
    });

    // Notification
    await createNotification({
      userId: session.user.id,
      title: "Certificate Earned!",
      titleAr: "حصلت على شهادة!",
      message: `You earned a certificate for ${level.name} in ${level.language.name}!`,
      messageAr: `حصلت على شهادة ${level.nameAr} في ${level.language.nameAr}!`,
      type: "achievement",
      category: "certificates",
      icon: "award",
      link: "/profile/certificates",
      priority: "important",
    });

    // Award certificate badge
    await prisma.userBadge.create({
      data: {
        name: "Certificate Holder",
        nameAr: "حامل شهادة",
        description: `Earned certificate for ${level.language.name} - ${level.name}`,
        icon: "award",
        userId: session.user.id,
      },
    });

    return NextResponse.json(certificate, { status: 201 });
  } catch (error) {
    console.error("Error creating certificate:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
