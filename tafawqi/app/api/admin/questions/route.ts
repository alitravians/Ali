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

export async function GET(req: Request) {
  if (!(await ensureAdmin())) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const url = new URL(req.url);
  const sectionId = url.searchParams.get("sectionId");
  const where = sectionId ? { sectionId } : {};
  const items = await prisma.question.findMany({
    where,
    include: { section: { include: { chapter: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    questions: items.map((q) => ({
      ...q,
      payload: JSON.parse(q.payload || "{}"),
    })),
  });
}

const createSchema = z.object({
  sectionId: z.string(),
  type: z.enum(["mcq", "tf", "fill", "match", "order"]),
  prompt: z.string().min(2),
  payload: z.any(),
  explanation: z.string().default(""),
  difficulty: z.number().int().min(1).max(3).default(1),
});

export async function POST(req: Request) {
  if (!(await ensureAdmin())) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  try {
    const data = createSchema.parse(await req.json());
    const q = await prisma.question.create({
      data: {
        sectionId: data.sectionId,
        type: data.type,
        prompt: data.prompt,
        payload: JSON.stringify(data.payload),
        explanation: data.explanation,
        difficulty: data.difficulty,
      },
    });
    return NextResponse.json({ ok: true, question: q });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "خطأ" }, { status: 400 });
  }
}

const updateSchema = createSchema.partial().extend({ id: z.string() });

export async function PATCH(req: Request) {
  if (!(await ensureAdmin())) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  try {
    const data = updateSchema.parse(await req.json());
    const update: any = {};
    if (data.sectionId) update.sectionId = data.sectionId;
    if (data.type) update.type = data.type;
    if (data.prompt) update.prompt = data.prompt;
    if (data.payload !== undefined) update.payload = JSON.stringify(data.payload);
    if (data.explanation !== undefined) update.explanation = data.explanation;
    if (data.difficulty !== undefined) update.difficulty = data.difficulty;
    const q = await prisma.question.update({ where: { id: data.id }, data: update });
    return NextResponse.json({ ok: true, question: q });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "خطأ" }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  if (!(await ensureAdmin())) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const { id } = await req.json();
  await prisma.question.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
