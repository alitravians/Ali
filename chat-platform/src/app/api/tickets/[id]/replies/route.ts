import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST /api/tickets/[id]/replies - Add reply to ticket
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const user = session.user as any;
  const isAdmin = (user.roleLevel || 0) >= 90;
  const isMod = (user.roleLevel || 0) >= 50;
  const isStaff = isAdmin || isMod;
  const body = await req.json();

  if (!body.content?.trim()) {
    return NextResponse.json({ error: 'محتوى الرد مطلوب' }, { status: 400 });
  }
  if (body.content.trim().length > 5000) {
    return NextResponse.json({ error: 'الرد طويل جداً' }, { status: 400 });
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: params.id } });
  if (!ticket) {
    return NextResponse.json({ error: 'التذكرة غير موجودة' }, { status: 404 });
  }

  // Non-staff can only reply to their own tickets
  if (!isStaff && ticket.userId !== user.id) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
  }

  // Can't reply to closed tickets
  if (ticket.status === 'CLOSED') {
    return NextResponse.json({ error: 'لا يمكن الرد على تذكرة مغلقة' }, { status: 400 });
  }

  const reply = await prisma.ticketReply.create({
    data: {
      ticketId: params.id,
      userId: user.id,
      content: body.content.trim(),
      isStaff,
    },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatar: true } },
    },
  });

  // Update ticket status based on who replied
  const newStatus = isStaff ? 'REPLIED' : 'WAITING_USER';
  await prisma.ticket.update({
    where: { id: params.id },
    data: { status: newStatus as any },
  });

  // Create notification for the other party
  if (isStaff) {
    await prisma.notification.create({
      data: {
        userId: ticket.userId,
        type: 'SYSTEM',
        title: 'رد جديد على تذكرتك',
        content: `تم الرد على تذكرة "${ticket.title}"`,
        metadata: { ticketId: ticket.id },
      },
    });
  }

  return NextResponse.json(reply, { status: 201 });
}
