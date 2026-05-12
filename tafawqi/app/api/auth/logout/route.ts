import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";

export async function POST(req: Request) {
  // CSRF: prevent forced log-out via cross-origin form/image POST.
  const csrf = requireSameOrigin(req);
  if (!csrf.ok) return NextResponse.json({ error: csrf.reason }, { status: 403 });
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
