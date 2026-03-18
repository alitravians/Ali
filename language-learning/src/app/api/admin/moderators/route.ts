import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";

// Helper: get default permissions for rank
function getDefaultPermissions(rank: string): string[] {
  const base = ["view_chat", "view_violations", "view_instructions", "submit_report", "send_internal_note"];
  if (rank === "moderator") {
    return [...base, "warn_user", "temp_ban", "review_reports", "view_activity_log", "escalate"];
  }
  if (rank === "head") {
    return [...base, "warn_user", "temp_ban", "review_reports", "view_activity_log", "escalate", "review_escalations", "manage_moderators", "view_stats", "approve_reports"];
  }
  return base;
}

// GET - List moderators and related admin data
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role: string }).role !== "admin") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const section = searchParams.get("section") || "list";

    if (section === "list") {
      const moderators = await prisma.moderatorRole.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
          _count: {
            select: {
              reports: true,
              activityLogs: true,
              sessions: true,
            },
          },
        },
      });

      const users = await prisma.user.findMany({
        where: {
          moderatorRole: null,
          role: { not: "admin" },
        },
        select: { id: true, name: true, email: true, avatar: true },
        orderBy: { name: "asc" },
      });

      return NextResponse.json({ moderators, availableUsers: users });
    }

    if (section === "instructions") {
      const instructions = await prisma.modInstruction.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          acknowledgments: true,
        },
      });
      return NextResponse.json({ instructions });
    }

    if (section === "reports") {
      const reports = await prisma.modReport.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          reportedUser: { select: { id: true, name: true, email: true, avatar: true } },
          reporter: { include: { user: { select: { name: true } } } },
        },
      });
      return NextResponse.json({ reports });
    }

    if (section === "activity") {
      const activities = await prisma.modActivityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
        include: {
          moderator: { include: { user: { select: { name: true } } } },
        },
      });
      return NextResponse.json({ activities });
    }

    if (section === "sessions") {
      const sessions = await prisma.moderatorSession.findMany({
        orderBy: { loginAt: "desc" },
        take: 100,
        include: {
          moderator: { include: { user: { select: { name: true } } } },
        },
      });
      return NextResponse.json({ sessions });
    }

    return NextResponse.json({ error: "قسم غير معروف" }, { status: 400 });
  } catch (error) {
    console.error("Admin moderators GET error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}

// POST - Manage moderators
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role: string }).role !== "admin") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const adminId = (session.user as { id: string }).id;
    const body = await req.json();
    const { action } = body;

    // === Assign Moderator ===
    if (action === "assign") {
      const { userId, rank, pin } = body;
      if (!userId || !rank) {
        return NextResponse.json({ error: "بيانات غير مكتملة" }, { status: 400 });
      }

      const existing = await prisma.moderatorRole.findUnique({ where: { userId } });
      if (existing) {
        return NextResponse.json({ error: "المستخدم مشرف بالفعل" }, { status: 400 });
      }

      const permissions = getDefaultPermissions(rank);
      const hashedPin = pin ? await hash(pin, 10) : "";

      const modRole = await prisma.moderatorRole.create({
        data: {
          userId,
          rank,
          permissions: JSON.stringify(permissions),
          assignedBy: adminId,
          securityPin: hashedPin,
        },
        include: { user: { select: { id: true, name: true, email: true } } },
      });

      // Update user role
      await prisma.user.update({
        where: { id: userId },
        data: { role: "moderator", chatRank: rank === "head" ? "moderator" : "moderator" },
      });

      return NextResponse.json(modRole);
    }

    // === Update Moderator ===
    if (action === "update") {
      const { modId, rank, permissions, isActive } = body;
      if (!modId) {
        return NextResponse.json({ error: "معرف المشرف مطلوب" }, { status: 400 });
      }

      const data: Record<string, unknown> = {};
      if (rank !== undefined) {
        data.rank = rank;
        if (!permissions) {
          data.permissions = JSON.stringify(getDefaultPermissions(rank));
        }
      }
      if (permissions !== undefined) data.permissions = JSON.stringify(permissions);
      if (isActive !== undefined) data.isActive = isActive;

      const updated = await prisma.moderatorRole.update({
        where: { id: modId },
        data,
        include: { user: { select: { id: true, name: true, email: true } } },
      });

      return NextResponse.json(updated);
    }

    // === Remove Moderator ===
    if (action === "remove") {
      const { modId } = body;
      if (!modId) {
        return NextResponse.json({ error: "معرف المشرف مطلوب" }, { status: 400 });
      }

      const mod = await prisma.moderatorRole.findUnique({ where: { id: modId } });
      if (mod) {
        await prisma.user.update({
          where: { id: mod.userId },
          data: { role: "user", chatRank: "member" },
        });
        await prisma.moderatorRole.delete({ where: { id: modId } });
      }

      return NextResponse.json({ success: true });
    }

    // === Reset PIN ===
    if (action === "reset_pin") {
      const { modId, newPin } = body;
      if (!modId || !newPin) {
        return NextResponse.json({ error: "بيانات غير مكتملة" }, { status: 400 });
      }

      const hashedPin = await hash(newPin, 10);
      await prisma.moderatorRole.update({
        where: { id: modId },
        data: { securityPin: hashedPin },
      });

      return NextResponse.json({ success: true });
    }

    // === Send Instruction ===
    if (action === "send_instruction") {
      const { title, content, priority, targetType, targetRank, targetModId } = body;
      if (!title || !content) {
        return NextResponse.json({ error: "العنوان والمحتوى مطلوبان" }, { status: 400 });
      }

      const instruction = await prisma.modInstruction.create({
        data: {
          title,
          content,
          priority: priority || "normal",
          targetType: targetType || "all",
          targetRank: targetRank || "",
          targetModId: targetModId || "",
          sentBy: adminId,
        },
      });

      // Create unread acks for target moderators
      let targetMods;
      if (targetType === "specific" && targetModId) {
        const mod = await prisma.moderatorRole.findUnique({ where: { id: targetModId } });
        targetMods = mod ? [mod] : [];
      } else if (targetType === "rank" && targetRank) {
        targetMods = await prisma.moderatorRole.findMany({ where: { rank: targetRank, isActive: true } });
      } else {
        targetMods = await prisma.moderatorRole.findMany({ where: { isActive: true } });
      }

      for (const mod of targetMods) {
        await prisma.modInstructionAck.create({
          data: {
            instructionId: instruction.id,
            moderatorUserId: mod.userId,
            status: "unread",
          },
        });

        await prisma.modNotification.create({
          data: {
            moderatorId: mod.id,
            title: "تعليمات جديدة من الإدارة",
            message: title,
            type: "instruction",
            link: "/moderator?tab=instructions",
          },
        });
      }

      return NextResponse.json(instruction);
    }

    // === Review Escalated Report ===
    if (action === "review_escalation") {
      const { reportId, status, adminNote } = body;
      if (!reportId) {
        return NextResponse.json({ error: "معرف البلاغ مطلوب" }, { status: 400 });
      }

      await prisma.modReport.update({
        where: { id: reportId },
        data: { status: status || "resolved", adminNote: adminNote || "", reviewedBy: adminId, reviewedAt: new Date() },
      });

      return NextResponse.json({ success: true });
    }

    // === Update Permissions ===
    if (action === "update_permissions") {
      const { modId, permissions } = body;
      if (!modId || !permissions) {
        return NextResponse.json({ error: "بيانات غير مكتملة" }, { status: 400 });
      }

      await prisma.moderatorRole.update({
        where: { id: modId },
        data: { permissions: JSON.stringify(permissions) },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
  } catch (error) {
    console.error("Admin moderators POST error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
