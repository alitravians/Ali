import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import { recordAudit } from "@/lib/audit";
import { safeJson } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

// F20 — Admin contact message management.
// GET    /api/admin/contact?status=all|pending|resolved
// POST   /api/admin/contact { action: "resolve"|"reopen"|"delete", id }

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "all";
  const where =
    status === "pending"
      ? { resolvedAt: null }
      : status === "resolved"
      ? { resolvedAt: { not: null } }
      : {};
  const rows = await prisma.contactMessage.findMany({
    where,
    orderBy: [{ resolvedAt: { sort: "asc", nulls: "first" } }, { createdAt: "desc" }],
    take: 200,
    select: {
      id: true,
      name: true,
      email: true,
      subject: true,
      message: true,
      ip: true,
      createdAt: true,
      resolvedAt: true,
      resolvedBy: { select: { name: true } },
    },
  });
  return NextResponse.json({ messages: rows });
}

const actionSchema = z.object({
  action: z.enum(["resolve", "reopen", "delete"]),
  id: z.string().min(1),
});

export async function POST(req: Request) {
  const csrf = requireSameOrigin(req);
  if (!csrf.ok) return NextResponse.json({ error: csrf.reason }, { status: 403 });
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const parsed = await safeJson<unknown>(req);
  if (!parsed.ok) return NextResponse.json({ error: parsed.reason }, { status: 400 });

  let body: z.infer<typeof actionSchema>;
  try {
    body = actionSchema.parse(parsed.data);
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  const existing = await prisma.contactMessage.findUnique({ where: { id: body.id } });
  if (!existing) {
    return NextResponse.json({ error: "الرسالة غير موجودة" }, { status: 404 });
  }

  if (body.action === "resolve") {
    await prisma.contactMessage.update({
      where: { id: body.id },
      data: { resolvedAt: new Date(), resolvedById: user.id },
    });
    await recordAudit({
      adminId: user.id,
      action: "contact_resolve",
      targetType: "contact_message",
      targetId: body.id,
      req,
    });
  } else if (body.action === "reopen") {
    await prisma.contactMessage.update({
      where: { id: body.id },
      data: { resolvedAt: null, resolvedById: null },
    });
    await recordAudit({
      adminId: user.id,
      action: "contact_resolve",
      targetType: "contact_message",
      targetId: body.id,
      details: { reopened: true },
      req,
    });
  } else {
    await prisma.contactMessage.delete({ where: { id: body.id } });
    await recordAudit({
      adminId: user.id,
      action: "contact_delete",
      targetType: "contact_message",
      targetId: body.id,
      req,
    });
  }

  return NextResponse.json({ ok: true });
}
