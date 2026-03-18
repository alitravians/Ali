import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await req.json();

    if (!["open", "in_review", "replied", "closed"].includes(status)) {
      return NextResponse.json({ error: "حالة غير صالحة" }, { status: 400 });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
    });

    if (!ticket) {
      return NextResponse.json({ error: "التذكرة غير موجودة" }, { status: 404 });
    }

    await prisma.ticket.update({
      where: { id: params.id },
      data: { status },
    });

    const statusLabels: Record<string, string> = {
      open: "مفتوحة",
      in_review: "قيد المراجعة",
      replied: "تم الرد",
      closed: "مغلقة",
    };

    await createNotification({
      userId: ticket.userId,
      title: "Ticket Status Updated",
      titleAr: "تحديث حالة التذكرة",
      message: `Ticket ${ticket.ticketCode} status changed to ${status}`,
      messageAr: `تم تغيير حالة التذكرة ${ticket.ticketCode} إلى: ${statusLabels[status] || status}`,
      type: status === "closed" ? "warning" : "info",
      category: "support",
      icon: "ticket",
      link: `/profile/tickets/${ticket.id}`,
      priority: status === "closed" ? "important" : "normal",
    });

    return NextResponse.json({ message: "تم تحديث الحالة" });
  } catch (error) {
    console.error("Error updating ticket status:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
