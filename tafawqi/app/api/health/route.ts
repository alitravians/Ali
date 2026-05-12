// F19 — Health endpoint for external uptime monitoring.
// Verifies the API process is alive and can reach the database with a
// trivial query. Returns 200 + JSON when healthy, 503 + JSON otherwise.
// Public on purpose; safe to expose (no secrets, no PII).
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STARTED_AT = Date.now();

export async function GET() {
  const startedAt = new Date(STARTED_AT).toISOString();
  const uptimeSec = Math.floor((Date.now() - STARTED_AT) / 1000);

  let dbOk = false;
  let dbLatencyMs: number | null = null;
  try {
    const t0 = Date.now();
    // Cheapest possible round-trip. SiteSetting always has zero or more rows;
    // count() returns 0 even on empty table without throwing.
    await prisma.siteSetting.count();
    dbLatencyMs = Date.now() - t0;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  const status = dbOk ? "ok" : "degraded";
  const httpStatus = dbOk ? 200 : 503;

  return NextResponse.json(
    {
      status,
      db: dbOk ? "ok" : "down",
      dbLatencyMs,
      uptimeSec,
      startedAt,
      timestamp: new Date().toISOString(),
    },
    {
      status: httpStatus,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
