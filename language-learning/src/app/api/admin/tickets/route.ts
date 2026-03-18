import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (status && status !== "all") where.status = status;
    if (category && category !== "all") where.category = category;
    if (priority && priority !== "all") where.priority = priority;
    if (search) {
      where.OR = [
        { subject: { contains: search } },
        { ticketCode: { contains: search } },
        { user: { name: { contains: search } } },
      ];
    }

    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Error fetching admin tickets:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
