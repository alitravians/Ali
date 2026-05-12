// F11 — Bulk import of questions from JSON (and CSV via client-side conversion).
//
// Endpoint accepts an array of rows; each row can identify its target section
// either by `sectionId` or by `sectionSlug` for friendlier authoring. Payload
// is JSON (CSV is converted client-side because CSV rows can't represent the
// nested `payload` object cleanly without escape hell).
//
// Validation is per-row: errors are collected and returned with the row index
// so the admin can fix and re-submit. The whole batch runs in a transaction so
// either every valid row is created or none (we still return per-row errors).
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { requireSameOrigin } from "@/lib/csrf";
import { safeJson } from "@/lib/sanitize";
import { z } from "zod";

export const dynamic = "force-dynamic";

const MAX_ROWS = 500;

const rowSchema = z
  .object({
    sectionId: z.string().min(1).max(64).optional(),
    sectionSlug: z.string().min(1).max(120).optional(),
    type: z.enum(["mcq", "tf", "fill", "match", "order"]),
    prompt: z.string().min(2).max(2000),
    payload: z.unknown(),
    explanation: z.string().max(4000).default(""),
    difficulty: z.number().int().min(1).max(3).default(1),
  })
  .refine((r) => r.sectionId || r.sectionSlug, {
    message: "يجب تحديد sectionId أو sectionSlug",
  });

const bodySchema = z.object({
  rows: z.array(rowSchema).min(1).max(MAX_ROWS),
  // Optional: when true, no rows are created if there are any errors. Defaults
  // to false so partial imports succeed for the valid rows.
  allOrNothing: z.boolean().optional().default(false),
});

function safeStringify(value: unknown, maxBytes = 64 * 1024): string {
  const s = JSON.stringify(value ?? {});
  if (s.length > maxBytes) throw new Error("PAYLOAD_TOO_LARGE");
  return s;
}

type RowError = { row: number; error: string };

export async function POST(req: Request) {
  const csrf = requireSameOrigin(req);
  if (!csrf.ok) return NextResponse.json({ error: csrf.reason }, { status: 403 });

  const u = await getCurrentUser();
  if (!u || u.role !== "admin") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const parsed = await safeJson<unknown>(req, 1024 * 1024); // 1 MB cap
  if (!parsed.ok) return NextResponse.json({ error: parsed.reason }, { status: 400 });

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(parsed.data);
  } catch (e) {
    const msg =
      e instanceof z.ZodError ? e.issues[0]?.message ?? "بيانات غير صالحة" : "بيانات غير صالحة";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Resolve all referenced section slugs/ids up front to avoid N round-trips.
  const slugs = Array.from(
    new Set(body.rows.map((r) => r.sectionSlug).filter((x): x is string => !!x)),
  );
  const ids = Array.from(
    new Set(body.rows.map((r) => r.sectionId).filter((x): x is string => !!x)),
  );
  const [bySlug, byId] = await Promise.all([
    slugs.length
      ? prisma.section.findMany({ where: { slug: { in: slugs } }, select: { id: true, slug: true } })
      : Promise.resolve([] as { id: string; slug: string }[]),
    ids.length
      ? prisma.section.findMany({ where: { id: { in: ids } }, select: { id: true } })
      : Promise.resolve([] as { id: string }[]),
  ]);
  const slugMap = new Map(bySlug.map((s) => [s.slug, s.id]));
  const idSet = new Set(byId.map((s) => s.id));

  const errors: RowError[] = [];
  const prepared: {
    row: number;
    sectionId: string;
    type: "mcq" | "tf" | "fill" | "match" | "order";
    prompt: string;
    payload: string;
    explanation: string;
    difficulty: number;
  }[] = [];

  body.rows.forEach((r, idx) => {
    const row = idx + 1;
    const sectionId = r.sectionId
      ? idSet.has(r.sectionId)
        ? r.sectionId
        : null
      : r.sectionSlug
        ? slugMap.get(r.sectionSlug) ?? null
        : null;
    if (!sectionId) {
      errors.push({ row, error: `القسم غير موجود (${r.sectionId ?? r.sectionSlug})` });
      return;
    }
    let payloadStr = "";
    try {
      payloadStr = safeStringify(r.payload);
    } catch {
      errors.push({ row, error: "حجم محتوى السؤال كبير جداً" });
      return;
    }
    // Basic per-type payload validation so we fail fast before DB write.
    const validation = validatePayload(r.type, r.payload);
    if (!validation.ok) {
      errors.push({ row, error: validation.reason });
      return;
    }
    prepared.push({
      row,
      sectionId,
      type: r.type,
      prompt: r.prompt,
      payload: payloadStr,
      explanation: r.explanation,
      difficulty: r.difficulty,
    });
  });

  if (body.allOrNothing && errors.length > 0) {
    return NextResponse.json({
      ok: false,
      created: 0,
      attempted: body.rows.length,
      errors,
    });
  }

  // Single transaction for atomicity of valid rows. Postgres handles 500-row
  // creates well within timeout.
  let createdCount = 0;
  if (prepared.length > 0) {
    try {
      const result = await prisma.question.createMany({
        data: prepared.map((p) => ({
          sectionId: p.sectionId,
          type: p.type,
          prompt: p.prompt,
          payload: p.payload,
          explanation: p.explanation,
          difficulty: p.difficulty,
        })),
      });
      createdCount = result.count;
    } catch {
      return NextResponse.json({ error: "تعذّر إنشاء الأسئلة دفعة واحدة" }, { status: 500 });
    }
  }

  await recordAudit({
    adminId: u.id,
    action: "create_question",
    targetType: "question",
    details: { bulkImport: true, created: createdCount, errors: errors.length },
    req,
  });

  return NextResponse.json({
    ok: true,
    created: createdCount,
    attempted: body.rows.length,
    errors,
  });
}

function validatePayload(
  type: "mcq" | "tf" | "fill" | "match" | "order",
  payload: unknown,
): { ok: true } | { ok: false; reason: string } {
  if (payload == null || typeof payload !== "object") {
    return { ok: false, reason: "محتوى السؤال غير صالح" };
  }
  const p = payload as Record<string, unknown>;
  if (type === "mcq") {
    if (!Array.isArray(p.options) || p.options.length < 2) {
      return { ok: false, reason: "اختيار من متعدد يحتاج خيارَين على الأقل" };
    }
    if (typeof p.answer !== "number" || p.answer < 0 || p.answer >= p.options.length) {
      return { ok: false, reason: "رقم الإجابة الصحيحة خارج النطاق" };
    }
  } else if (type === "tf") {
    if (typeof p.answer !== "boolean") {
      return { ok: false, reason: "صح/خطأ يحتاج answer قيمة منطقيّة" };
    }
  } else if (type === "fill") {
    if (!Array.isArray(p.answers) || p.answers.length === 0) {
      return { ok: false, reason: "أكمل الفراغ يحتاج إجابة واحدة على الأقل" };
    }
  } else if (type === "match") {
    if (
      !Array.isArray(p.left) ||
      !Array.isArray(p.right) ||
      !Array.isArray(p.pairs) ||
      p.left.length !== p.pairs.length
    ) {
      return { ok: false, reason: "مطابقة تحتاج قوائم left/right/pairs متّسقة" };
    }
  } else if (type === "order") {
    if (!Array.isArray(p.items) || !Array.isArray(p.correct) || p.items.length !== p.correct.length) {
      return { ok: false, reason: "ترتيب يحتاج قائمتَي items/correct بنفس الطول" };
    }
  }
  return { ok: true };
}
