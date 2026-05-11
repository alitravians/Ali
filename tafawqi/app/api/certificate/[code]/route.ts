import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const cert = await prisma.certificate.findUnique({
    where: { code },
    include: { user: { select: { name: true } } },
  });
  if (!cert) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  return NextResponse.json({
    certificate: {
      code: cert.code,
      title: cert.title,
      kind: cert.kind,
      issuedAt: cert.issuedAt,
      studentName: cert.user.name,
    },
  });
}
