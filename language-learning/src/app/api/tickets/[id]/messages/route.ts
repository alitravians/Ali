import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sanitizeInput, validateLength } from "@/lib/validation";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { content } = await req.json();

    if (!content) {
      return NextResponse.json({ error: "محتوى الرسالة مطلوب" }, { status: 400 });
    }

    // Validate content length
    const contentError = validateLength(content, "الرسالة", 1, 5000);
    if (contentError) {
      return NextResponse.json({ error: contentError }, { status: 400 });
    }

    const ticket = await prisma.ticket.findFirst({
      where: { id: params.id, userId },
    });

    if (!ticket) {
      return NextResponse.json({ error: "التذكرة غير موجودة" }, { status: 404 });
    }

    if (ticket.status === "closed") {
      return NextResponse.json({ error: "التذكرة مغلقة" }, { status: 400 });
    }

    const message = await prisma.ticketMessage.create({
      data: {
        content: sanitizeInput(content.trim()),
        isAdmin: false,
        senderName: session.user.name || "مستخدم",
        ticketId: params.id,
      },
    });

    await prisma.ticket.update({
      where: { id: params.id },
      data: { status: ticket.status === "replied" ? "open" : ticket.status },
    });

    return NextResponse.json(message, { status: 201 });
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
