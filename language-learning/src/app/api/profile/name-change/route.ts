import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const COOLDOWN_DAYS = 7;

// Built-in inappropriate words filter (Arabic + English)
const BUILTIN_BANNED_PATTERNS = [
  // Common inappropriate patterns
  /admin/i, /moderator/i, /مشرف/i, /إدار/i, /مدير/i,
];

async function checkBannedWords(name: string): Promise<{ flagged: boolean; reason: string }> {
  // Check built-in patterns
  for (const pattern of BUILTIN_BANNED_PATTERNS) {
    if (pattern.test(name)) {
      return { flagged: true, reason: "الاسم يحتوي على كلمات محجوزة للنظام" };
    }
  }

  // Check database banned words
  const bannedWords = await prisma.bannedWord.findMany();
  const lowerName = name.toLowerCase();
  for (const bw of bannedWords) {
    if (lowerName.includes(bw.word.toLowerCase())) {
      return { flagged: true, reason: `الاسم يحتوي على كلمة غير مسموحة: ${bw.word}` };
    }
  }

  return { flagged: false, reason: "" };
}

// GET: Check current name change status and cooldown
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, lastNameChange: true },
    });

    if (!user) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    // Check for pending request
    const pendingRequest = await prisma.nameChangeRequest.findFirst({
      where: { userId, status: "pending" },
      orderBy: { createdAt: "desc" },
    });

    // Check cooldown
    let canChange = true;
    let cooldownEndsAt: Date | null = null;
    if (user.lastNameChange) {
      const cooldownEnd = new Date(user.lastNameChange);
      cooldownEnd.setDate(cooldownEnd.getDate() + COOLDOWN_DAYS);
      if (new Date() < cooldownEnd) {
        canChange = false;
        cooldownEndsAt = cooldownEnd;
      }
    }

    // Get recent request history
    const recentRequests = await prisma.nameChangeRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      currentName: user.name,
      lastNameChange: user.lastNameChange,
      canChange: canChange && !pendingRequest,
      cooldownEndsAt,
      pendingRequest: pendingRequest ? {
        id: pendingRequest.id,
        requestedName: pendingRequest.requestedName,
        status: pendingRequest.status,
        createdAt: pendingRequest.createdAt,
      } : null,
      recentRequests: recentRequests.map(r => ({
        id: r.id,
        currentName: r.currentName,
        requestedName: r.requestedName,
        status: r.status,
        adminNote: r.adminNote,
        createdAt: r.createdAt,
        reviewedAt: r.reviewedAt,
      })),
    });
  } catch {
    return NextResponse.json({ error: "فشل في جلب بيانات تغيير الاسم" }, { status: 500 });
  }
}

// POST: Submit name change request
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const body = await request.json();
    const { newName } = body;

    if (!newName || typeof newName !== "string") {
      return NextResponse.json({ error: "الاسم الجديد مطلوب" }, { status: 400 });
    }

    const trimmedName = newName.trim();

    // Validate name length
    if (trimmedName.length < 2 || trimmedName.length > 30) {
      return NextResponse.json({ error: "يجب أن يكون الاسم بين 2 و 30 حرفاً" }, { status: 400 });
    }

    // Validate name format (letters, numbers, spaces, Arabic only)
    if (!/^[\u0600-\u06FFa-zA-Z0-9\s_.-]+$/.test(trimmedName)) {
      return NextResponse.json({ error: "الاسم يحتوي على رموز غير مسموحة" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, lastNameChange: true },
    });

    if (!user) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    // Check if name is same as current
    if (trimmedName === user.name) {
      return NextResponse.json({ error: "الاسم الجديد مطابق للاسم الحالي" }, { status: 400 });
    }

    // Server-side cooldown check
    if (user.lastNameChange) {
      const cooldownEnd = new Date(user.lastNameChange);
      cooldownEnd.setDate(cooldownEnd.getDate() + COOLDOWN_DAYS);
      if (new Date() < cooldownEnd) {
        return NextResponse.json({ error: "لا يمكنك تغيير الاسم إلا مرة كل 7 أيام" }, { status: 429 });
      }
    }

    // Check for existing pending request
    const existingPending = await prisma.nameChangeRequest.findFirst({
      where: { userId, status: "pending" },
    });
    if (existingPending) {
      return NextResponse.json({ error: "لديك طلب تغيير اسم قيد المراجعة بالفعل" }, { status: 409 });
    }

    // Check for duplicate names
    const duplicateUser = await prisma.user.findFirst({
      where: { name: trimmedName, id: { not: userId } },
    });
    if (duplicateUser) {
      return NextResponse.json({ error: "هذا الاسم مستخدم بالفعل من قبل عضو آخر" }, { status: 409 });
    }

    // Check banned words
    const { flagged, reason } = await checkBannedWords(trimmedName);

    if (flagged) {
      // Create pending request for admin review
      const nameRequest = await prisma.nameChangeRequest.create({
        data: {
          userId,
          currentName: user.name,
          requestedName: trimmedName,
          status: "pending",
          reason,
        },
      });

      // Notify admins about pending review
      const admins = await prisma.user.findMany({
        where: { role: "admin" },
        select: { id: true },
      });

      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            title: "طلب تغيير اسم للمراجعة",
            titleAr: "طلب تغيير اسم للمراجعة",
            message: `المستخدم "${user.name}" يريد تغيير اسمه إلى "${trimmedName}" - تم تعليقه للمراجعة: ${reason}`,
            messageAr: `المستخدم "${user.name}" يريد تغيير اسمه إلى "${trimmedName}" - تم تعليقه للمراجعة: ${reason}`,
            type: "warning",
            category: "admin",
            icon: "user",
            priority: "important",
            link: "/admin/name-requests",
            userId: admin.id,
          },
        });
      }

      return NextResponse.json({
        status: "pending",
        message: "تم إرسال طلب تغيير الاسم للمراجعة الإدارية",
        request: nameRequest,
      });
    } else {
      // Auto-approve: name is clean
      const nameRequest = await prisma.nameChangeRequest.create({
        data: {
          userId,
          currentName: user.name,
          requestedName: trimmedName,
          status: "auto_approved",
          reviewedAt: new Date(),
        },
      });

      // Update user name and lastNameChange
      await prisma.user.update({
        where: { id: userId },
        data: { name: trimmedName, lastNameChange: new Date() },
      });

      // Notify user
      await prisma.notification.create({
        data: {
          title: "تم تغيير الاسم بنجاح",
          titleAr: "تم تغيير الاسم بنجاح",
          message: `تم تغيير اسمك من "${user.name}" إلى "${trimmedName}" بنجاح.`,
          messageAr: `تم تغيير اسمك من "${user.name}" إلى "${trimmedName}" بنجاح.`,
          type: "success",
          category: "account",
          icon: "check",
          userId,
        },
      });

      return NextResponse.json({
        status: "auto_approved",
        message: "تم تغيير الاسم بنجاح",
        request: nameRequest,
      });
    }
  } catch {
    return NextResponse.json({ error: "فشل في إرسال طلب تغيير الاسم" }, { status: 500 });
  }
}
