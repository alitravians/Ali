import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hash, compare } from "bcryptjs";

// Helper: check if user is a moderator and get their role
async function getModeratorRole(userId: string) {
  return prisma.moderatorRole.findUnique({
    where: { userId },
    include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
  });
}

// Helper: check permission
function hasPermission(permissions: string[], required: string): boolean {
  const perms = permissions;
  return perms.includes(required) || perms.includes("all");
}

// Helper: get default permissions for rank
function getDefaultPermissions(rank: string): string[] {
  const base = ["view_chat", "view_violations", "view_instructions", "submit_report", "send_internal_note"];
  if (rank === "moderator") {
    return [...base, "warn_user", "temp_ban", "review_reports", "view_activity_log", "escalate"];
  }
  if (rank === "head") {
    return [...base, "warn_user", "temp_ban", "review_reports", "view_activity_log", "escalate", "review_escalations", "manage_moderators", "view_stats", "approve_reports"];
  }
  return base; // assistant
}

// GET - Dashboard data, instructions, reports, etc.
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const modRole = await getModeratorRole(userId);
    
    if (!modRole || !modRole.isActive) {
      return NextResponse.json({ error: "ليس لديك صلاحية الوصول" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const section = searchParams.get("section") || "dashboard";
    const permissions: string[] = JSON.parse(modRole.permissions || "[]");

    if (section === "dashboard") {
      const [
        totalReports,
        pendingReports,
        todayViolations,
        unreadInstructions,
        recentActivity,
        recentInstructions,
      ] = await Promise.all([
        prisma.modReport.count({ where: { reportedByModId: modRole.id } }),
        prisma.modReport.count({ where: { status: "pending" } }),
        prisma.modViolationRecord.count({
          where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
        }),
        prisma.modInstructionAck.count({
          where: { moderatorUserId: userId, status: "unread" },
        }),
        prisma.modActivityLog.findMany({
          where: { moderatorId: modRole.id },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        prisma.modInstruction.findMany({
          where: {
            OR: [
              { targetType: "all" },
              { targetType: "rank", targetRank: modRole.rank },
              { targetType: "specific", targetModId: modRole.id },
            ],
          },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            acknowledgments: {
              where: { moderatorUserId: userId },
            },
          },
        }),
      ]);

      const unreadNotifications = await prisma.modNotification.count({
        where: { moderatorId: modRole.id, isRead: false },
      });

      return NextResponse.json({
        moderator: {
          id: modRole.id,
          userId: modRole.userId,
          rank: modRole.rank,
          permissions,
          user: modRole.user,
        },
        stats: {
          totalReports,
          pendingReports,
          todayViolations,
          unreadInstructions,
          unreadNotifications,
        },
        recentActivity,
        recentInstructions,
      });
    }

    if (section === "instructions") {
      const instructions = await prisma.modInstruction.findMany({
        where: {
          OR: [
            { targetType: "all" },
            { targetType: "rank", targetRank: modRole.rank },
            { targetType: "specific", targetModId: modRole.id },
          ],
        },
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        include: {
          acknowledgments: {
            where: { moderatorUserId: userId },
          },
        },
      });

      return NextResponse.json({ instructions });
    }

    if (section === "reports") {
      const filter = searchParams.get("filter") || "all";
      const where: Record<string, unknown> = {};
      
      if (modRole.rank === "assistant") {
        where.reportedByModId = modRole.id;
      }
      if (filter === "pending") where.status = "pending";
      if (filter === "escalated") where.status = "escalated";
      if (filter === "resolved") where.status = "resolved";

      const reports = await prisma.modReport.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          reportedUser: { select: { id: true, name: true, email: true, avatar: true } },
          reporter: { include: { user: { select: { name: true } } } },
        },
      });

      return NextResponse.json({ reports });
    }

    if (section === "violations") {
      const targetUserId = searchParams.get("userId");
      const where: Record<string, unknown> = {};
      if (targetUserId) where.userId = targetUserId;

      const violations = await prisma.modViolationRecord.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
        },
      });

      return NextResponse.json({ violations });
    }

    if (section === "activity") {
      const targetModId = searchParams.get("modId");
      const where: Record<string, unknown> = {};
      
      if (modRole.rank === "assistant") {
        where.moderatorId = modRole.id;
      } else if (targetModId) {
        where.moderatorId = targetModId;
      }

      const activities = await prisma.modActivityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          moderator: { include: { user: { select: { name: true } } } },
        },
      });

      return NextResponse.json({ activities });
    }

    if (section === "notifications") {
      const notifications = await prisma.modNotification.findMany({
        where: { moderatorId: modRole.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      return NextResponse.json({ notifications });
    }

    if (section === "users") {
      const query = searchParams.get("q") || "";
      const users = await prisma.user.findMany({
        where: query ? {
          OR: [
            { name: { contains: query } },
            { email: { contains: query } },
          ],
        } : {},
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          chatRank: true,
          _count: {
            select: {
              modViolations: true,
              chatWarnings: true,
              chatBans: true,
            },
          },
        },
        take: 20,
      });

      return NextResponse.json({ users });
    }

    if (section === "user-profile") {
      const targetUserId = searchParams.get("userId");
      if (!targetUserId) return NextResponse.json({ error: "معرف المستخدم مطلوب" }, { status: 400 });

      const [user, violations, warnings, bans, reports] = await Promise.all([
        prisma.user.findUnique({
          where: { id: targetUserId },
          select: { id: true, name: true, email: true, avatar: true, chatRank: true, createdAt: true },
        }),
        prisma.modViolationRecord.findMany({
          where: { userId: targetUserId },
          orderBy: { createdAt: "desc" },
        }),
        prisma.chatWarning.count({ where: { userId: targetUserId } }),
        prisma.chatBan.count({ where: { userId: targetUserId } }),
        prisma.modReport.count({ where: { reportedUserId: targetUserId } }),
      ]);

      return NextResponse.json({ user, violations, warnings, bans, reports });
    }

    if (section === "sessions") {
      if (!hasPermission(permissions, "manage_moderators") && modRole.rank !== "head") {
        return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
      }
      const sessions = await prisma.moderatorSession.findMany({
        orderBy: { loginAt: "desc" },
        take: 50,
        include: {
          moderator: { include: { user: { select: { name: true } } } },
        },
      });
      return NextResponse.json({ sessions });
    }

    return NextResponse.json({ error: "قسم غير معروف" }, { status: 400 });
  } catch (error) {
    console.error("Moderator GET error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}

// POST - Actions (reports, acks, warnings, bans, etc.)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const modRole = await getModeratorRole(userId);
    
    if (!modRole || !modRole.isActive) {
      return NextResponse.json({ error: "ليس لديك صلاحية الوصول" }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;
    const permissions: string[] = JSON.parse(modRole.permissions || "[]");

    // === Verify PIN ===
    if (action === "verify_pin") {
      const { pin } = body;
      if (!modRole.securityPin) {
        return NextResponse.json({ error: "لم يتم تعيين رمز أمان" }, { status: 400 });
      }
      const valid = await compare(pin, modRole.securityPin);
      if (!valid) {
        return NextResponse.json({ error: "رمز الأمان غير صحيح" }, { status: 401 });
      }

      // Log session
      await prisma.moderatorSession.create({
        data: {
          moderatorId: modRole.id,
          deviceFingerprint: body.fingerprint || "",
          browser: body.browser || "",
          ipAddress: "",
        },
      });

      await prisma.modActivityLog.create({
        data: {
          moderatorId: modRole.id,
          action: "login",
          details: `تسجيل دخول من ${body.browser || "متصفح غير معروف"}`,
        },
      });

      return NextResponse.json({ success: true });
    }

    // === Set PIN ===
    if (action === "set_pin") {
      const { pin } = body;
      if (!pin || pin.length < 4) {
        return NextResponse.json({ error: "الرمز يجب أن يكون 4 أرقام على الأقل" }, { status: 400 });
      }
      const hashedPin = await hash(pin, 10);
      await prisma.moderatorRole.update({
        where: { id: modRole.id },
        data: { securityPin: hashedPin },
      });
      return NextResponse.json({ success: true });
    }

    // === Submit Report ===
    if (action === "submit_report") {
      const { reportedUserId, violationType, severity, description, evidence, suggestedAction } = body;
      if (!reportedUserId || !violationType || !description) {
        return NextResponse.json({ error: "بيانات البلاغ غير مكتملة" }, { status: 400 });
      }

      const report = await prisma.modReport.create({
        data: {
          reportedUserId,
          reportedByModId: modRole.id,
          violationType,
          severity: severity || "medium",
          description,
          evidence: evidence || "",
          suggestedAction: suggestedAction || "",
        },
      });

      // Create violation record
      await prisma.modViolationRecord.create({
        data: {
          userId: reportedUserId,
          violationType,
          severity: severity || "medium",
          description,
          actionBy: userId,
          reportId: report.id,
        },
      });

      // Log activity
      await prisma.modActivityLog.create({
        data: {
          moderatorId: modRole.id,
          action: "report",
          targetUserId: reportedUserId,
          details: `بلاغ: ${violationType} - ${severity || "medium"}`,
        },
      });

      // Notify head moderators
      const headMods = await prisma.moderatorRole.findMany({
        where: { rank: "head", isActive: true },
      });
      for (const head of headMods) {
        await prisma.modNotification.create({
          data: {
            moderatorId: head.id,
            title: "بلاغ جديد",
            message: `تم رفع بلاغ جديد بنوع: ${violationType}`,
            type: "report",
            link: `/moderator?tab=reports`,
          },
        });
      }

      return NextResponse.json(report);
    }

    // === Warn User ===
    if (action === "warn_user") {
      if (!hasPermission(permissions, "warn_user")) {
        return NextResponse.json({ error: "ليس لديك صلاحية التحذير" }, { status: 403 });
      }
      const { targetUserId, reason } = body;
      if (!targetUserId || !reason) {
        return NextResponse.json({ error: "بيانات غير مكتملة" }, { status: 400 });
      }

      await prisma.chatWarning.create({
        data: { userId: targetUserId, reason, issuedBy: userId },
      });

      await prisma.modActivityLog.create({
        data: {
          moderatorId: modRole.id,
          action: "warning",
          targetUserId,
          details: `تحذير: ${reason}`,
        },
      });

      await prisma.modViolationRecord.create({
        data: {
          userId: targetUserId,
          violationType: "warning",
          severity: "minor",
          description: reason,
          action: "warning",
          actionBy: userId,
        },
      });

      return NextResponse.json({ success: true });
    }

    // === Temp Ban ===
    if (action === "temp_ban") {
      if (!hasPermission(permissions, "temp_ban")) {
        return NextResponse.json({ error: "ليس لديك صلاحية الحظر" }, { status: 403 });
      }
      const { targetUserId, reason, duration } = body;
      if (!targetUserId || !reason || !duration) {
        return NextResponse.json({ error: "بيانات غير مكتملة" }, { status: 400 });
      }

      const endsAt = new Date(Date.now() + duration * 60 * 1000);
      await prisma.chatBan.create({
        data: { userId: targetUserId, reason, duration, issuedBy: userId, endsAt },
      });

      await prisma.modActivityLog.create({
        data: {
          moderatorId: modRole.id,
          action: "ban",
          targetUserId,
          details: `حظر مؤقت ${duration} دقيقة: ${reason}`,
        },
      });

      await prisma.modViolationRecord.create({
        data: {
          userId: targetUserId,
          violationType: "ban",
          severity: "serious",
          description: reason,
          action: "temp_ban",
          actionBy: userId,
        },
      });

      return NextResponse.json({ success: true });
    }

    // === Escalate Report ===
    if (action === "escalate_report") {
      if (!hasPermission(permissions, "escalate")) {
        return NextResponse.json({ error: "ليس لديك صلاحية التصعيد" }, { status: 403 });
      }
      const { reportId, escalateTo } = body;
      if (!reportId) {
        return NextResponse.json({ error: "معرف البلاغ مطلوب" }, { status: 400 });
      }

      await prisma.modReport.update({
        where: { id: reportId },
        data: { status: "escalated", escalatedTo: escalateTo || "head" },
      });

      await prisma.modActivityLog.create({
        data: {
          moderatorId: modRole.id,
          action: "escalation",
          details: `تصعيد بلاغ إلى ${escalateTo || "رئيس المشرفين"}`,
        },
      });

      return NextResponse.json({ success: true });
    }

    // === Review Report (head/admin) ===
    if (action === "review_report") {
      if (!hasPermission(permissions, "review_reports") && modRole.rank === "assistant") {
        return NextResponse.json({ error: "ليس لديك صلاحية المراجعة" }, { status: 403 });
      }
      const { reportId, status, adminNote } = body;
      if (!reportId || !status) {
        return NextResponse.json({ error: "بيانات غير مكتملة" }, { status: 400 });
      }

      await prisma.modReport.update({
        where: { id: reportId },
        data: { status, adminNote: adminNote || "", reviewedBy: userId, reviewedAt: new Date() },
      });

      await prisma.modActivityLog.create({
        data: {
          moderatorId: modRole.id,
          action: "review_report",
          details: `مراجعة بلاغ: ${status}`,
        },
      });

      return NextResponse.json({ success: true });
    }

    // === Acknowledge Instruction ===
    if (action === "ack_instruction") {
      const { instructionId, ackStatus } = body;
      if (!instructionId) {
        return NextResponse.json({ error: "معرف التعليمات مطلوب" }, { status: 400 });
      }

      await prisma.modInstructionAck.upsert({
        where: {
          instructionId_moderatorUserId: { instructionId, moderatorUserId: userId },
        },
        create: {
          instructionId,
          moderatorUserId: userId,
          status: ackStatus || "read",
          readAt: new Date(),
          acknowledgedAt: ackStatus === "confirmed" ? new Date() : null,
        },
        update: {
          status: ackStatus || "read",
          readAt: new Date(),
          acknowledgedAt: ackStatus === "confirmed" ? new Date() : undefined,
        },
      });

      await prisma.modActivityLog.create({
        data: {
          moderatorId: modRole.id,
          action: "ack_instruction",
          details: `تأكيد اطلاع على تعليمات`,
        },
      });

      return NextResponse.json({ success: true });
    }

    // === Mark Notification Read ===
    if (action === "mark_notification_read") {
      const { notificationId } = body;
      if (notificationId === "all") {
        await prisma.modNotification.updateMany({
          where: { moderatorId: modRole.id, isRead: false },
          data: { isRead: true },
        });
      } else if (notificationId) {
        await prisma.modNotification.update({
          where: { id: notificationId },
          data: { isRead: true },
        });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
  } catch (error) {
    console.error("Moderator POST error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
