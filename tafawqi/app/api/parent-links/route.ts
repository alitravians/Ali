import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import { safeJson, sanitizeText } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

function newToken(): string {
  // URL-safe, unguessable, fits comfortably in a QR code.
  return randomBytes(24).toString("base64url");
}

// F17 — Manage a student's parent share-links.
//
// GET    /api/parent-links            list my links
// POST   /api/parent-links            create one
// DELETE /api/parent-links?id=...     revoke one
//
// Only the logged-in owner can manage her own links. Public view at
// /parent/<token> is rendered server-side and never accepts modifications.

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const links = await prisma.parentLink.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, token: true, label: true, revokedAt: true, lastViewedAt: true, createdAt: true },
  });
  return NextResponse.json({ links });
}

const createSchema = z.object({ label: z.string().max(40).optional().default("") });

export async function POST(req: Request) {
  const csrf = requireSameOrigin(req);
  if (!csrf.ok) return NextResponse.json({ error: csrf.reason }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const existingActive = await prisma.parentLink.count({
    where: { userId: user.id, revokedAt: null },
  });
  if (existingActive >= 5) {
    return NextResponse.json(
      { error: "بلغتِ الحدّ الأقصى (٥ روابط نشطة). الغي رابطاً قديماً أوّلاً." },
      { status: 400 }
    );
  }

  const parsed = await safeJson<unknown>(req);
  if (!parsed.ok) return NextResponse.json({ error: parsed.reason }, { status: 400 });
  let label = "";
  try {
    label = sanitizeText(createSchema.parse(parsed.data).label ?? "").slice(0, 40);
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  const link = await prisma.parentLink.create({
    data: { userId: user.id, token: newToken(), label },
    select: { id: true, token: true, label: true, createdAt: true },
  });
  return NextResponse.json({ ok: true, link });
}

export async function DELETE(req: Request) {
  const csrf = requireSameOrigin(req);
  if (!csrf.ok) return NextResponse.json({ error: csrf.reason }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id") ?? "";
  if (!id) return NextResponse.json({ error: "MISSING_ID" }, { status: 400 });
  const link = await prisma.parentLink.findUnique({ where: { id } });
  if (!link || link.userId !== user.id) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  await prisma.parentLink.update({
    where: { id },
    data: { revokedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
