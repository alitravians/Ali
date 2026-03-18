import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

function generateTicketCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "TK-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const tickets = await prisma.ticket.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { subject, description, category, priority } = await req.json();

    if (!subject || !description) {
      return NextResponse.json({ error: "العنوان والوصف مطلوبان" }, { status: 400 });
    }

    const ticketCode = generateTicketCode();

    const ticket = await prisma.ticket.create({
      data: {
        ticketCode,
        subject,
        description,
        category: category || "general",
        priority: priority || "medium",
        userId,
        messages: {
          create: {
            content: description,
            isAdmin: false,
            senderName: session.user.name || "مستخدم",
          },
        },
      },
      include: { messages: true },
    });

    // Create notification for user
    await createNotification({
      userId,
      title: "New Ticket Created",
      titleAr: "تم إنشاء تذكرة جديدة",
      message: `Ticket ${ticketCode} has been created`,
      messageAr: `تم إنشاء التذكرة رقم ${ticketCode} بنجاح`,
      type: "info",
      category: "support",
      icon: "ticket",
      link: `/profile/tickets/${ticket.id}`,
      priority: "normal",
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
