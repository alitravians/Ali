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
  // S2 — when "true", /api/auth/login refuses unverified accounts and the
  // registration flow expects the user to confirm via email link first.
  "email_verification_required",
  // F2 — slug of today's daily quiz (empty string disables the banner).
  "daily_quiz_slug",
  // F2 — bonus points awarded the first time per UTC day a student
  // completes the daily quiz. Default 20.
  "daily_quiz_bonus",
  // F6 — kill-switch for the question-report button.
  "question_reports_enabled",
  // F7 — kill-switch for the share-result widget on /results/:id.
  "social_share_enabled",
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
