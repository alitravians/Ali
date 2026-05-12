// F13 — Time-series stats for the admin dashboard. Returns per-day counts for
// finished attempts, new students, and the average score percentage over a
// rolling window of 7 or 30 days (UTC).
//
// We aggregate in Node from a single pair of `findMany` reads (small windows
// only — bounded by the date range, not by total table size) instead of
// shelling out to raw SQL. This avoids Postgres-specific date functions in
// Prisma and keeps the route portable.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

function dayKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function GET(req: Request) {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const url = new URL(req.url);
  const rangeParam = url.searchParams.get("range") ?? "7";
  const range = rangeParam === "30" ? 30 : 7;

  const now = new Date();
  const today = startOfDayUTC(now);
  const since = new Date(today.getTime() - (range - 1) * 24 * 60 * 60 * 1000);

  const [attempts, students] = await Promise.all([
    prisma.attempt.findMany({
      where: { finishedAt: { gte: since, not: null } },
      select: { finishedAt: true, score: true, total: true },
    }),
    prisma.user.findMany({
      where: { role: "student", createdAt: { gte: since } },
      select: { createdAt: true },
    }),
  ]);

  // Initialise the day buckets so empty days still appear in the output.
  type Bucket = { attempts: number; correct: number; totalQ: number; newStudents: number };
  const buckets = new Map<string, Bucket>();
  for (let i = 0; i < range; i++) {
    const d = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
    buckets.set(dayKey(d), { attempts: 0, correct: 0, totalQ: 0, newStudents: 0 });
  }

  for (const a of attempts) {
    if (!a.finishedAt) continue;
    const key = dayKey(a.finishedAt);
    const b = buckets.get(key);
    if (!b) continue;
    b.attempts++;
    b.correct += a.score ?? 0;
    b.totalQ += a.total ?? 0;
  }
  for (const s of students) {
    const key = dayKey(s.createdAt);
    const b = buckets.get(key);
    if (!b) continue;
    b.newStudents++;
  }

  const days = Array.from(buckets.entries())
    .map(([date, b]) => ({
      date,
      attempts: b.attempts,
      newStudents: b.newStudents,
      avgPct: b.totalQ > 0 ? Math.round((100 * b.correct) / b.totalQ) : 0,
    }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  const totalAttempts = days.reduce((acc, d) => acc + d.attempts, 0);
  const totalNewStudents = days.reduce((acc, d) => acc + d.newStudents, 0);
  const avgPct =
    attempts.length > 0
      ? Math.round(
          (100 *
            attempts.reduce((s, a) => s + (a.score ?? 0), 0)) /
            Math.max(
              1,
              attempts.reduce((s, a) => s + (a.total ?? 0), 0),
            ),
        )
      : 0;

  return NextResponse.json({
    range,
    days,
    totals: { attempts: totalAttempts, newStudents: totalNewStudents, avgPct },
  });
}
