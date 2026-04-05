import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/tickets - List tickets (user sees own, admin sees all)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const user = session.user as any;
  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const department = url.searchParams.get('department');
  const priority = url.searchParams.get('priority');
  const isAdmin = (user.roleLevel || 0) >= 90;
  const isMod = (user.roleLevel || 0) >= 50;

  const where: any = {};

  // Regular users only see their own tickets
  if (!isAdmin && !isMod) {
    where.userId = user.id;
  }

  if (status) where.status = status;
  if (department) where.department = department;
  if (priority) where.priority = priority;

  const tickets = await prisma.ticket.findMany({
    where,
    include: {
      user: { select: { id: true, username: true, displayName: true, avatar: true } },
      assignee: { select: { id: true, username: true, displayName: true } },
      _count: { select: { replies: true } },
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'desc' },
    ],
    take: 100,
  });

  return NextResponse.json(tickets);
}

// POST /api/tickets - Create a new ticket
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const user = session.user as any;
  const body = await req.json();
  const { title, department, type, priority, description } = body;

  if (!title?.trim() || !department?.trim() || !type?.trim() || !description?.trim()) {
    return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 });
  }

  if (title.trim().length > 200) {
    return NextResponse.json({ error: 'العنوان طويل جداً' }, { status: 400 });
  }
  if (description.trim().length > 5000) {
    return NextResponse.json({ error: 'الوصف طويل جداً' }, { status: 400 });
  }

  const validDepartments = ['technical', 'account', 'chat', 'notifications', 'ranks', 'items', 'suggestions', 'general'];
  const validTypes = ['bug', 'help', 'report', 'inquiry', 'suggestion', 'account_issue', 'feature_issue'];
  const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

  if (!validDepartments.includes(department)) {
    return NextResponse.json({ error: 'القسم غير صالح' }, { status: 400 });
  }
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: 'نوع الشكوى غير صالح' }, { status: 400 });
  }
  if (!validPriorities.includes(priority)) {
    return NextResponse.json({ error: 'الأولوية غير صالحة' }, { status: 400 });
  }

  const ticket = await prisma.ticket.create({
    data: {
      title: title.trim(),
      department,
      type,
      priority: priority as any,
      description: description.trim(),
      userId: user.id,
    },
    include: {
      user: { select: { id: true, username: true, displayName: true } },
    },
  });

  return NextResponse.json(ticket, { status: 201 });
}
