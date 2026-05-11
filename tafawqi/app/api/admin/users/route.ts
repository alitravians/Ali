import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

async function ensureAdmin() {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") return null;
  return u;
}

export async function GET() {
  if (!(await ensureAdmin())) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, email: true, role: true, points: true, isBlocked: true,
      createdAt: true, _count: { select: { attempts: true, badges: true, certificates: true } },
    },
  });
  return NextResponse.json({ users });
}

const patchSchema = z.object({
  id: z.string(),
  isBlocked: z.boolean().optional(),
  role: z.enum(["student", "admin"]).optional(),
  resetPoints: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  if (!(await ensureAdmin())) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  try {
    const data = patchSchema.parse(await req.json());
    const update: any = {};
    if (data.isBlocked !== undefined) update.isBlocked = data.isBlocked;
    if (data.role) update.role = data.role;
    if (data.resetPoints) update.points = 0;
    const u = await prisma.user.update({ where: { id: data.id }, data: update });
    return NextResponse.json({ ok: true, user: u });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "خطأ" }, { status: 400 });
  }
}
