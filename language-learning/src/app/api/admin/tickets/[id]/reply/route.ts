import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { content } = await req.json();

    if (!content) {
      return NextResponse.json({ error: "محتوى الرد مطلوب" }, { status: 400 });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
    });

    if (!ticket) {
      return NextResponse.json({ error: "التذكرة غير موجودة" }, { status: 404 });
    }

    const message = await prisma.ticketMessage.create({
      data: {
        content,
        isAdmin: true,
        senderName: "الإدارة",
        ticketId: params.id,
      },
    });

    await prisma.ticket.update({
      where: { id: params.id },
      data: { status: "replied" },
    });

    // Notify user
    await createNotification({
      userId: ticket.userId,
      title: "Ticket Reply",
      titleAr: "رد على تذكرتك",
      message: `Your ticket ${ticket.ticketCode} has been replied to`,
      messageAr: `تم الرد على تذكرتك رقم ${ticket.ticketCode}`,
      type: "info",
      category: "support",
      icon: "ticket",
      link: `/profile/tickets/${ticket.id}`,
      priority: "normal",
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Error replying to ticket:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
