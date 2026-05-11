import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function ensureAdmin() {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") return null;
  return u;
}

export async function GET() {
  const settings = await prisma.siteSetting.findMany();
  return NextResponse.json({ settings });
}

export async function POST(req: Request) {
  if (!(await ensureAdmin())) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const body = await req.json();
  const { key, value } = body as { key: string; value: string };
  if (!key) return NextResponse.json({ error: "key required" }, { status: 400 });
  await prisma.siteSetting.upsert({
    where: { key },
    update: { value: String(value) },
    create: { key, value: String(value) },
  });
  return NextResponse.json({ ok: true });
}
