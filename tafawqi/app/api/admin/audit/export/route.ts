// F14 — Audit log CSV export for compliance/long-term archival.
//
// Format: UTF-8 with BOM (Excel-friendly), comma-separated, RFC 4180 quoting.
// Columns: createdAt (ISO), admin name, admin email, action, targetType,
// targetId, ip, details (JSON-encoded).
//
// Optional query params:
//   - days: limit to last N days (1..365, default 90)
//   - max:  cap on number of rows (1..5000, default 2000)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

function csvCell(value: unknown): string {
  const s = value == null ? "" : String(value);
  // RFC 4180: wrap in double quotes if it contains comma, quote, or newline.
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function csvRow(values: unknown[]): string {
  return values.map(csvCell).join(",");
}

export async function GET(req: Request) {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const url = new URL(req.url);
  const daysRaw = Number(url.searchParams.get("days") ?? "90");
  const maxRaw = Number(url.searchParams.get("max") ?? "2000");
  const days = Number.isFinite(daysRaw) ? Math.min(Math.max(Math.floor(daysRaw), 1), 365) : 90;
  const max = Number.isFinite(maxRaw) ? Math.min(Math.max(Math.floor(maxRaw), 1), 5000) : 2000;

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const entries = await prisma.adminAuditLog.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: max,
    include: { admin: { select: { name: true, email: true } } },
  });

  const header = [
    "createdAt",
    "adminName",
    "adminEmail",
    "action",
    "targetType",
    "targetId",
    "ip",
    "details",
  ];
  const lines = [csvRow(header)];
  for (const e of entries) {
    lines.push(
      csvRow([
        e.createdAt.toISOString(),
        e.admin?.name ?? "",
        e.admin?.email ?? "",
        e.action,
        e.targetType,
        e.targetId ?? "",
        e.ip ?? "",
        e.details ?? "",
      ]),
    );
  }

  // UTF-8 BOM so Excel opens Arabic correctly.
  const body = "\uFEFF" + lines.join("\r\n") + "\r\n";
  const filename = `tafawqi-audit-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
