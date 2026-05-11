import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { requireSameOrigin } from "@/lib/csrf";
import { safeJson, sanitizeText } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

const ALLOWED_KEYS = new Set([
  "site_name",
  "site_tagline",
  "daily_quiz_enabled",
  "registration_open",
  "support_email",
]);

async function ensureAdmin(): Promise<{ id: string } | null> {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") return null;
  return { id: u.id };
}

export async function GET() {
  if (!(await ensureAdmin())) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const settings = await prisma.siteSetting.findMany();
  return NextResponse.json({ settings });
}

const postSchema = z.object({
  key: z.string().min(1).max(64),
  value: z.string().max(500),
});

export async function POST(req: Request) {
  const csrf = requireSameOrigin(req);
  if (!csrf.ok) return NextResponse.json({ error: csrf.reason }, { status: 403 });
  const admin = await ensureAdmin();
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const parsed = await safeJson<unknown>(req);
  if (!parsed.ok) return NextResponse.json({ error: parsed.reason }, { status: 400 });
  let data: z.infer<typeof postSchema>;
  try {
    data = postSchema.parse(parsed.data);
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.issues[0]?.message ?? "بيانات غير صالحة" : "بيانات غير صالحة";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  if (!ALLOWED_KEYS.has(data.key)) {
    return NextResponse.json({ error: "إعداد غير معروف" }, { status: 400 });
  }
  const value = sanitizeText(data.value, 500);
  await prisma.siteSetting.upsert({
    where: { key: data.key },
    update: { value },
    create: { key: data.key, value },
  });
  await recordAudit({
    adminId: admin.id,
    action: "update_setting",
    targetType: "setting",
    targetId: data.key,
    details: { value: value.slice(0, 200) },
    req,
  });
  return NextResponse.json({ ok: true });
}
