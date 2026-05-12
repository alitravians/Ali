import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Read-only feed of recent admin actions for visibility in the admin panel.
// Capped to last 200 entries so the response stays small.
export async function GET() {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const entries = await prisma.adminAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { admin: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({
    entries: entries.map((e) => ({
      id: e.id,
      action: e.action,
      targetType: e.targetType,
      targetId: e.targetId,
      details: e.details ? safeParse(e.details) : null,
      ip: e.ip,
      createdAt: e.createdAt,
      admin: e.admin,
    })),
  });
}

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}
