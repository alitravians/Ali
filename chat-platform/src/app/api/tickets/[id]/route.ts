import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/tickets/[id] - Get ticket details
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const user = session.user as any;
  const isAdmin = (user.roleLevel || 0) >= 90;
  const isMod = (user.roleLevel || 0) >= 50;

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatar: true } },
      assignee: { select: { id: true, username: true, displayName: true } },
      replies: {
        include: {
          user: { select: { id: true, username: true, displayName: true, avatar: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!ticket) {
    return NextResponse.json({ error: 'التذكرة غير موجودة' }, { status: 404 });
  }

  // Non-admin can only see their own tickets
  if (!isAdmin && !isMod && ticket.userId !== user.id) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
  }

  return NextResponse.json(ticket);
}

// PATCH /api/tickets/[id] - Update ticket (admin: status, assign; user: close)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const user = session.user as any;
  const isAdmin = (user.roleLevel || 0) >= 90;
  const isMod = (user.roleLevel || 0) >= 50;
  const body = await req.json();

  const ticket = await prisma.ticket.findUnique({ where: { id: params.id } });
  if (!ticket) {
    return NextResponse.json({ error: 'التذكرة غير موجودة' }, { status: 404 });
  }

  // Regular user can only close their own ticket
  if (!isAdmin && !isMod) {
    if (ticket.userId !== user.id) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }
    if (body.status !== 'CLOSED') {
      return NextResponse.json({ error: 'يمكنك فقط إغلاق تذكرتك' }, { status: 403 });
    }
  }

  const updateData: any = {};
  const validStatuses = ['OPEN', 'REVIEWING', 'REPLIED', 'WAITING_USER', 'CLOSED', 'ESCALATED'];

  if (body.status && validStatuses.includes(body.status)) {
    updateData.status = body.status;
    if (body.status === 'CLOSED') {
      updateData.closedAt = new Date();
    }
  }

  if ((isAdmin || isMod) && body.assignedTo !== undefined) {
    updateData.assignedTo = body.assignedTo || null;
  }

  if ((isAdmin || isMod) && body.priority) {
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    if (validPriorities.includes(body.priority)) {
      updateData.priority = body.priority;
    }
  }

  const updated = await prisma.ticket.update({
    where: { id: params.id },
    data: updateData,
    include: {
      user: { select: { id: true, username: true, displayName: true } },
      assignee: { select: { id: true, username: true, displayName: true } },
    },
  });

  return NextResponse.json(updated);
}
