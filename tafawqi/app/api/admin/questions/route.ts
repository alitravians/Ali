import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { requireSameOrigin } from "@/lib/csrf";
import { z } from "zod";

export const dynamic = "force-dynamic";

async function ensureAdmin(): Promise<{ id: string } | null> {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") return null;
  return { id: u.id };
}

// F12 — search + pagination. Accepts optional `sectionId`, `type`, `q`
// (free-text contains, case-insensitive against `prompt`), `page`, `pageSize`.
export async function GET(req: Request) {
  if (!(await ensureAdmin())) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const url = new URL(req.url);
  const sectionId = url.searchParams.get("sectionId") ?? undefined;
  const typeParam = url.searchParams.get("type");
  const allowedTypes = ["mcq", "tf", "fill", "match", "order"] as const;
  const type = (allowedTypes as readonly string[]).includes(typeParam ?? "")
    ? (typeParam as (typeof allowedTypes)[number])
    : undefined;
  const qRaw = url.searchParams.get("q")?.trim() ?? "";
  const q = qRaw.length > 0 ? qRaw.slice(0, 200) : undefined;
  const pageRaw = Number(url.searchParams.get("page") ?? "1");
  const sizeRaw = Number(url.searchParams.get("pageSize") ?? "50");
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const pageSize = Number.isFinite(sizeRaw) ? Math.min(Math.max(Math.floor(sizeRaw), 1), 200) : 50;

  const where: {
    sectionId?: string;
    type?: (typeof allowedTypes)[number];
    prompt?: { contains: string; mode: "insensitive" };
  } = {};
  if (sectionId) where.sectionId = sectionId;
  if (type) where.type = type;
  if (q) where.prompt = { contains: q, mode: "insensitive" };

  const [total, items] = await Promise.all([
    prisma.question.count({ where }),
    prisma.question.findMany({
      where,
      include: { section: { include: { chapter: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return NextResponse.json({
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    questions: items.map((qq) => {
      let parsed: unknown = {};
      try {
        parsed = JSON.parse(qq.payload || "{}");
      } catch {
        parsed = {};
      }
      return { ...qq, payload: parsed };
    }),
  });
}

const createSchema = z.object({
  sectionId: z.string().min(1).max(64),
  type: z.enum(["mcq", "tf", "fill", "match", "order"]),
  prompt: z.string().min(2).max(2000),
  payload: z.unknown(),
  explanation: z.string().max(4000).default(""),
  difficulty: z.number().int().min(1).max(3).default(1),
});

function safeStringify(value: unknown, maxBytes = 64 * 1024): string {
  const s = JSON.stringify(value ?? {});
  if (s.length > maxBytes) throw new Error("PAYLOAD_TOO_LARGE");
  return s;
}

export async function POST(req: Request) {
  const csrf = requireSameOrigin(req);
  if (!csrf.ok) return NextResponse.json({ error: csrf.reason }, { status: 403 });
  const admin = await ensureAdmin();
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  try {
    const data = createSchema.parse(await req.json());
    const q = await prisma.question.create({
      data: {
        sectionId: data.sectionId,
        type: data.type,
        prompt: data.prompt,
        payload: safeStringify(data.payload),
        explanation: data.explanation,
        difficulty: data.difficulty,
      },
    });
    await recordAudit({
      adminId: admin.id,
      action: "create_question",
      targetType: "question",
      targetId: q.id,
      details: { type: data.type, sectionId: data.sectionId },
      req,
    });
    return NextResponse.json({ ok: true, question: q });
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.issues[0]?.message ?? "بيانات غير صالحة" : "تعذّر إنشاء السؤال";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

const updateSchema = createSchema.partial().extend({ id: z.string().min(1).max(64) });

export async function PATCH(req: Request) {
  const csrf = requireSameOrigin(req);
  if (!csrf.ok) return NextResponse.json({ error: csrf.reason }, { status: 403 });
  const admin = await ensureAdmin();
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  try {
    const data = updateSchema.parse(await req.json());
    const update: {
      sectionId?: string;
      type?: "mcq" | "tf" | "fill" | "match" | "order";
      prompt?: string;
      payload?: string;
      explanation?: string;
      difficulty?: number;
    } = {};
    if (data.sectionId) update.sectionId = data.sectionId;
    if (data.type) update.type = data.type;
    if (data.prompt) update.prompt = data.prompt;
    if (data.payload !== undefined) update.payload = safeStringify(data.payload);
    if (data.explanation !== undefined) update.explanation = data.explanation;
    if (data.difficulty !== undefined) update.difficulty = data.difficulty;
    const q = await prisma.question.update({ where: { id: data.id }, data: update });
    await recordAudit({
      adminId: admin.id,
      action: "update_question",
      targetType: "question",
      targetId: q.id,
      req,
    });
    return NextResponse.json({ ok: true, question: q });
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.issues[0]?.message ?? "بيانات غير صالحة" : "تعذّر التحديث";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

const deleteSchema = z.object({ id: z.string().min(1).max(64) });

export async function DELETE(req: Request) {
  const csrf = requireSameOrigin(req);
  if (!csrf.ok) return NextResponse.json({ error: csrf.reason }, { status: 403 });
  const admin = await ensureAdmin();
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  try {
    const { id } = deleteSchema.parse(await req.json());
    await prisma.question.delete({ where: { id } });
    await recordAudit({
      adminId: admin.id,
      action: "delete_question",
      targetType: "question",
      targetId: id,
      req,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.issues[0]?.message ?? "معرّف غير صالح" : "تعذّر الحذف";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
