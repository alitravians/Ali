import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { safeJson, normalizeEmail } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

async function ensureAdmin() {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") return null;
  return u;
}

// List all pending (non-expired) reset tokens
export async function GET() {
  if (!(await ensureAdmin())) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const now = new Date();
  const items = await prisma.passwordReset.findMany({
    where: { expiresAt: { gt: now } },
    include: { user: { select: { id: true, email: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({
    resets: items.map((r) => ({
      id: r.id,
      token: r.token,
      resetUrl: `/forgot/confirm?token=${r.token}`,
      expiresAt: r.expiresAt,
      createdAt: r.createdAt,
      user: r.user,
    })),
  });
}

const postSchema = z.object({ email: z.string().email() });

// Admin can manually generate a reset link for a user (when email is not configured)
export async function POST(req: Request) {
  if (!(await ensureAdmin())) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const parsed = await safeJson<unknown>(req);
  if (!parsed.ok) return NextResponse.json({ error: parsed.reason }, { status: 400 });
  let data: z.infer<typeof postSchema>;
  try { data = postSchema.parse(parsed.data); }
  catch (e: any) {
    return NextResponse.json({ error: e?.issues?.[0]?.message || "بيانات غير صالحة" }, { status: 400 });
  }
  const email = normalizeEmail(data.email);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: "المستخدِم غير موجود" }, { status: 404 });
  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour for admin-generated
  await prisma.passwordReset.create({ data: { userId: user.id, token, expiresAt } });
  return NextResponse.json({
    ok: true,
    token,
    resetUrl: `/forgot/confirm?token=${token}`,
    expiresAt,
    user: { id: user.id, email: user.email, name: user.name },
  });
}
