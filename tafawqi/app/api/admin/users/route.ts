import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { requireSameOrigin } from "@/lib/csrf";
import { z } from "zod";

export const dynamic = "force-dynamic";

type AdminUser = { id: string; role: string };

async function ensureAdmin(): Promise<AdminUser | null> {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") return null;
  return { id: u.id, role: u.role };
}

export async function GET() {
  if (!(await ensureAdmin())) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      points: true,
      isBlocked: true,
      lockedUntil: true,
      createdAt: true,
      _count: { select: { attempts: true, badges: true, certificates: true } },
    },
  });
  return NextResponse.json({ users });
}

const patchSchema = z.object({
  id: z.string().min(1).max(64),
  isBlocked: z.boolean().optional(),
  role: z.enum(["student", "admin"]).optional(),
  resetPoints: z.boolean().optional(),
  unlock: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  const csrf = requireSameOrigin(req);
  if (!csrf.ok) return NextResponse.json({ error: csrf.reason }, { status: 403 });

  const admin = await ensureAdmin();
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  let data: z.infer<typeof patchSchema>;
  try {
    data = patchSchema.parse(await req.json());
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.issues[0]?.message ?? "بيانات غير صالحة" : "بيانات غير صالحة";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Self-protection: an admin cannot demote or block themselves. This avoids
  // accidental platform lockout if there is only one admin account.
  if (data.id === admin.id) {
    if (data.role && data.role !== "admin") {
      return NextResponse.json(
        { error: "لا يمكن تخفيض دور حسابكِ بنفسكِ" },
        { status: 400 }
      );
    }
    if (data.isBlocked === true) {
      return NextResponse.json({ error: "لا يمكنكِ إيقاف حسابكِ" }, { status: 400 });
    }
  }

  // If demoting/blocking another admin, ensure at least one active admin remains.
  if (data.role === "student" || data.isBlocked === true) {
    const target = await prisma.user.findUnique({ where: { id: data.id }, select: { role: true } });
    if (target?.role === "admin") {
      const otherActiveAdmins = await prisma.user.count({
        where: { id: { not: data.id }, role: "admin", isBlocked: false },
      });
      if (otherActiveAdmins === 0) {
        return NextResponse.json(
          { error: "يجب الإبقاء على مشرفة فعّالة واحدة على الأقل" },
          { status: 400 }
        );
      }
    }
  }

  const update: {
    isBlocked?: boolean;
    role?: "student" | "admin";
    points?: number;
    failedLoginCount?: number;
    lockedUntil?: Date | null;
  } = {};
  if (data.isBlocked !== undefined) update.isBlocked = data.isBlocked;
  if (data.role) update.role = data.role;
  if (data.resetPoints) update.points = 0;
  if (data.unlock) {
    update.failedLoginCount = 0;
    update.lockedUntil = null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "لا يوجد تغيير" }, { status: 400 });
  }

  try {
    const updated = await prisma.user.update({ where: { id: data.id }, data: update });

    // Record one audit entry per logical action so the trail stays granular.
    const auditActions: Array<Parameters<typeof recordAudit>[0]["action"]> = [];
    if (data.isBlocked === true) auditActions.push("block_user");
    if (data.isBlocked === false) auditActions.push("unblock_user");
    if (data.role) auditActions.push("change_role");
    if (data.resetPoints) auditActions.push("reset_points");
    for (const action of auditActions) {
      await recordAudit({
        adminId: admin.id,
        action,
        targetType: "user",
        targetId: data.id,
        details: { role: data.role, isBlocked: data.isBlocked, resetPoints: data.resetPoints },
        req,
      });
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        isBlocked: updated.isBlocked,
        points: updated.points,
      },
    });
  } catch {
    return NextResponse.json({ error: "تعذّر تحديث الحساب" }, { status: 500 });
  }
}
