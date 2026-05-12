// S6 / F8 — Per-user avatar endpoint.
//
// Reads the base64-encoded avatar bytes from User.avatar (a data URL), decodes
// them, and streams the binary out as image/webp with cache headers. This
// keeps API JSON payloads small (no inline base64) on /api/me, /api/team,
// and /api/admin/team — those endpoints now return only avatarUrl pointers.
//
// Security: public endpoint by design (team page is public, header avatar is
// shown to the owner). Returns 404 for any missing/invalid avatar so we don't
// leak whether a user exists when one happens not to have an avatar.
//
// Caching: 5-minute private cache + 5-minute stale-while-revalidate so the
// header avatar feels instant after navigation but updates within minutes
// of a re-upload. The endpoint URL embeds the userId only; if you re-upload
// you can bust it with ?v=<timestamp> on the consumer.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// matches "data:image/<sub>;base64,<payload>"
const DATA_URL_RE = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/;

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ userId: string }> }
) {
  const { userId } = await ctx.params;
  if (!userId || userId.length > 64) {
    return new NextResponse("not found", { status: 404 });
  }

  let row: { avatar: string } | null = null;
  try {
    row = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });
  } catch {
    return new NextResponse("not found", { status: 404 });
  }

  if (!row || !row.avatar) {
    return new NextResponse("not found", { status: 404 });
  }

  const m = DATA_URL_RE.exec(row.avatar);
  if (!m) {
    return new NextResponse("not found", { status: 404 });
  }
  const mime = m[1];
  const b64 = m[2];

  let body: ArrayBuffer;
  let byteLength: number;
  try {
    const buf = Buffer.from(b64, "base64");
    body = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
    byteLength = buf.byteLength;
  } catch {
    return new NextResponse("not found", { status: 404 });
  }

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": mime,
      "Content-Length": String(byteLength),
      "Cache-Control": "private, max-age=300, stale-while-revalidate=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
