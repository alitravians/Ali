import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: List all name change requests
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== "admin") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const requests = await prisma.nameChangeRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(requests);
  } catch {
    return NextResponse.json({ error: "فشل في جلب طلبات تغيير الاسم" }, { status: 500 });
  }
}

// PUT: Approve or reject a name change request
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== "admin") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const adminId = (session.user as { id: string }).id;
    const body = await request.json();
    const { requestId, action, adminNote } = body;

    if (!requestId || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
    }

    const nameRequest = await prisma.nameChangeRequest.findUnique({
      where: { id: requestId },
      include: { user: { select: { id: true, name: true } } },
    });

    if (!nameRequest) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    if (nameRequest.status !== "pending") {
      return NextResponse.json({ error: "تم مراجعة هذا الطلب مسبقاً" }, { status: 400 });
    }

    if (action === "approve") {
      // Check if name is still available
      const duplicateUser = await prisma.user.findFirst({
        where: { name: nameRequest.requestedName, id: { not: nameRequest.userId } },
      });
      if (duplicateUser) {
        return NextResponse.json({ error: "الاسم المطلوب أصبح مستخدماً من قبل عضو آخر" }, { status: 409 });
      }

      // Update request status
      await prisma.nameChangeRequest.update({
        where: { id: requestId },
        data: {
          status: "approved",
          adminNote: adminNote?.slice(0, 500) || "",
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
      });

      // Update user name
      await prisma.user.update({
        where: { id: nameRequest.userId },
        data: { name: nameRequest.requestedName, lastNameChange: new Date() },
      });

      // Notify user of approval
      await prisma.notification.create({
        data: {
          title: "تمت الموافقة على تغيير الاسم",
          titleAr: "تمت الموافقة على تغيير الاسم",
          message: `تمت الموافقة على طلب تغيير اسمك. تم تحديث اسمك من "${nameRequest.currentName}" إلى "${nameRequest.requestedName}" بنجاح.`,
          messageAr: `تمت الموافقة على طلب تغيير اسمك. تم تحديث اسمك من "${nameRequest.currentName}" إلى "${nameRequest.requestedName}" بنجاح.`,
          type: "success",
          category: "account",
          icon: "check",
          userId: nameRequest.userId,
        },
      });

      return NextResponse.json({ message: "تمت الموافقة على الطلب وتم تغيير الاسم" });
    } else {
      // Reject
      await prisma.nameChangeRequest.update({
        where: { id: requestId },
        data: {
          status: "rejected",
          adminNote: adminNote?.slice(0, 500) || "",
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
      });

      // Notify user of rejection
      const rejectionMessage = adminNote
        ? `تم رفض طلب تغيير اسمك إلى "${nameRequest.requestedName}". السبب: ${adminNote}`
        : `تم رفض طلب تغيير اسمك إلى "${nameRequest.requestedName}".`;

      await prisma.notification.create({
        data: {
          title: "تم رفض طلب تغيير الاسم",
          titleAr: "تم رفض طلب تغيير الاسم",
          message: rejectionMessage,
          messageAr: rejectionMessage,
          type: "warning",
          category: "account",
          icon: "alert",
          userId: nameRequest.userId,
        },
      });

      return NextResponse.json({ message: "تم رفض الطلب" });
    }
  } catch {
    return NextResponse.json({ error: "فشل في مراجعة الطلب" }, { status: 500 });
  }
}
