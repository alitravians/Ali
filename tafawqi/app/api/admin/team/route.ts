// Admin endpoint for managing the public team page: departments and members.
//
// Action-based dispatcher (single POST endpoint) keeps the API surface small
// and mirrors the pattern used by the other admin endpoints in this repo.
// All actions are gated by:
//   - requireSameOrigin() CSRF guard
//   - admin role check
//   - Zod-validated payloads
//   - Audit log entry
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { requireSameOrigin } from "@/lib/csrf";
import { safeJson, sanitizeText } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

function isValidHexColor(color: string): boolean {
  return HEX_COLOR_RE.test(color);
}

async function ensureAdmin(): Promise<{ id: string } | null> {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") return null;
  return { id: u.id };
}

// ─────────── GET — admin-view of all departments+members (hidden included) ───────────
export async function GET() {
  if (!(await ensureAdmin()))
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const [departments, users] = await Promise.all([
    prisma.teamDepartment.findMany({
      orderBy: { order: "asc" },
      include: {
        members: {
          orderBy: { order: "asc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                avatarSeed: true,
                role: true,
              },
            },
          },
        },
      },
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, avatar: true, avatarSeed: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return NextResponse.json({ departments, users });
}

// ─────────── POST — action dispatcher ───────────
const actionSchemas = {
  create_department: z.object({
    action: z.literal("create_department"),
    nameAr: z.string().min(1).max(80),
    color: z.string().regex(HEX_COLOR_RE).optional(),
  }),
  update_department: z.object({
    action: z.literal("update_department"),
    id: z.string().min(1),
    nameAr: z.string().min(1).max(80).optional(),
    color: z.string().regex(HEX_COLOR_RE).optional(),
    isVisible: z.boolean().optional(),
    order: z.number().int().optional(),
  }),
  delete_department: z.object({
    action: z.literal("delete_department"),
    id: z.string().min(1),
  }),
  add_member: z.object({
    action: z.literal("add_member"),
    userId: z.string().min(1),
    departmentId: z.string().min(1),
    roleAr: z.string().max(80).optional(),
  }),
  update_member: z.object({
    action: z.literal("update_member"),
    id: z.string().min(1),
    roleAr: z.string().max(80).optional(),
    isVisible: z.boolean().optional(),
    order: z.number().int().optional(),
  }),
  remove_member: z.object({
    action: z.literal("remove_member"),
    id: z.string().min(1),
  }),
} as const;

const ActionSchema = z.discriminatedUnion("action", [
  actionSchemas.create_department,
  actionSchemas.update_department,
  actionSchemas.delete_department,
  actionSchemas.add_member,
  actionSchemas.update_member,
  actionSchemas.remove_member,
]);

export async function POST(req: Request) {
  const csrf = requireSameOrigin(req);
  if (!csrf.ok) return NextResponse.json({ error: csrf.reason }, { status: 403 });

  const admin = await ensureAdmin();
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const parsed = await safeJson<unknown>(req);
  if (!parsed.ok) return NextResponse.json({ error: parsed.reason }, { status: 400 });

  let data: z.infer<typeof ActionSchema>;
  try {
    data = ActionSchema.parse(parsed.data);
  } catch (e) {
    const msg =
      e instanceof z.ZodError ? e.issues[0]?.message ?? "بيانات غير صالحة" : "بيانات غير صالحة";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    switch (data.action) {
      case "create_department": {
        const nameAr = sanitizeText(data.nameAr, 80);
        if (!nameAr) return NextResponse.json({ error: "اسم القسم مطلوب" }, { status: 400 });
        const color = data.color && isValidHexColor(data.color) ? data.color : "#2563eb";
        const max = await prisma.teamDepartment.aggregate({ _max: { order: true } });
        const department = await prisma.teamDepartment.create({
          data: { nameAr, color, order: (max._max.order ?? 0) + 1 },
        });
        await recordAudit({
          adminId: admin.id,
          action: "create_department",
          targetType: "department",
          targetId: department.id,
          details: { nameAr, color },
          req,
        });
        return NextResponse.json({ department });
      }

      case "update_department": {
        const patch: Record<string, unknown> = {};
        if (data.nameAr !== undefined) patch.nameAr = sanitizeText(data.nameAr, 80);
        if (data.color !== undefined) patch.color = data.color;
        if (data.isVisible !== undefined) patch.isVisible = data.isVisible;
        if (data.order !== undefined) patch.order = data.order;
        if (Object.keys(patch).length === 0)
          return NextResponse.json({ error: "لا يوجد تغيير" }, { status: 400 });
        const department = await prisma.teamDepartment.update({
          where: { id: data.id },
          data: patch,
        });
        await recordAudit({
          adminId: admin.id,
          action: "update_department",
          targetType: "department",
          targetId: data.id,
          details: patch,
          req,
        });
        return NextResponse.json({ department });
      }

      case "delete_department": {
        await prisma.teamDepartment.delete({ where: { id: data.id } });
        await recordAudit({
          adminId: admin.id,
          action: "delete_department",
          targetType: "department",
          targetId: data.id,
          req,
        });
        return NextResponse.json({ ok: true, message: "تم حذف القسم" });
      }

      case "add_member": {
        const exists = await prisma.teamMember.findUnique({
          where: {
            userId_departmentId: { userId: data.userId, departmentId: data.departmentId },
          },
        });
        if (exists)
          return NextResponse.json(
            { error: "العضوة موجودة بالفعل في هذا القسم" },
            { status: 400 },
          );
        const max = await prisma.teamMember.aggregate({
          where: { departmentId: data.departmentId },
          _max: { order: true },
        });
        const roleAr = data.roleAr ? sanitizeText(data.roleAr, 80) : "";
        const member = await prisma.teamMember.create({
          data: {
            userId: data.userId,
            departmentId: data.departmentId,
            roleAr,
            order: (max._max.order ?? 0) + 1,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                avatarSeed: true,
                role: true,
              },
            },
          },
        });
        await recordAudit({
          adminId: admin.id,
          action: "add_team_member",
          targetType: "team_member",
          targetId: member.id,
          details: { userId: data.userId, departmentId: data.departmentId, roleAr },
          req,
        });
        return NextResponse.json({ member });
      }

      case "update_member": {
        const patch: Record<string, unknown> = {};
        if (data.roleAr !== undefined) patch.roleAr = sanitizeText(data.roleAr, 80);
        if (data.isVisible !== undefined) patch.isVisible = data.isVisible;
        if (data.order !== undefined) patch.order = data.order;
        if (Object.keys(patch).length === 0)
          return NextResponse.json({ error: "لا يوجد تغيير" }, { status: 400 });
        const member = await prisma.teamMember.update({
          where: { id: data.id },
          data: patch,
        });
        await recordAudit({
          adminId: admin.id,
          action: "update_team_member",
          targetType: "team_member",
          targetId: data.id,
          details: patch,
          req,
        });
        return NextResponse.json({ member });
      }

      case "remove_member": {
        await prisma.teamMember.delete({ where: { id: data.id } });
        await recordAudit({
          adminId: admin.id,
          action: "remove_team_member",
          targetType: "team_member",
          targetId: data.id,
          req,
        });
        return NextResponse.json({ ok: true, message: "تم إزالة العضوة" });
      }
    }
  } catch (e: unknown) {
    const msg =
      typeof e === "object" && e && "code" in e && (e as { code: string }).code === "P2025"
        ? "السجلّ غير موجود"
        : "فشل في تنفيذ العملية";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
