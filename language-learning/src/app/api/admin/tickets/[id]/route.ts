import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { name: true, email: true } },
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "التذكرة غير موجودة" }, { status: 404 });
    }

    return NextResponse.json(ticket);
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
