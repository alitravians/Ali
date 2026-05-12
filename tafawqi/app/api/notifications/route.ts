import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ notifications: [] });
  const items = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return NextResponse.json({ notifications: items });
}

export async function POST(req: Request) {
  // CSRF: notifications mutate per-user state; require same-origin.
  const csrf = requireSameOrigin(req);
  if (!csrf.ok) return NextResponse.json({ error: csrf.reason }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (body.markAllRead) {
    await prisma.notification.updateMany({ where: { userId: user.id, isRead: false }, data: { isRead: true } });
    return NextResponse.json({ ok: true });
  }
  if (body.id) {
    await prisma.notification.updateMany({
      where: { id: body.id, userId: user.id },
      data: { isRead: true },
    });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false });
}
