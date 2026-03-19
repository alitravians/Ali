import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    let settings = await prisma.notificationSettings.findUnique({
      where: { userId: session.user.id },
    });

    if (!settings) {
      settings = await prisma.notificationSettings.create({
        data: { userId: session.user.id },
      });
    }

    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const data = await req.json();

    const settings = await prisma.notificationSettings.upsert({
      where: { userId: session.user.id },
      update: {
        inAppEnabled: data.inAppEnabled,
        emailEnabled: data.emailEnabled,
        educationalEnabled: data.educationalEnabled,
        certificatesEnabled: data.certificatesEnabled,
        supportEnabled: data.supportEnabled,
        accountEnabled: data.accountEnabled,
        adminEnabled: data.adminEnabled,
      },
      create: {
        userId: session.user.id,
        inAppEnabled: data.inAppEnabled ?? true,
        emailEnabled: data.emailEnabled ?? false,
        educationalEnabled: data.educationalEnabled ?? true,
        certificatesEnabled: data.certificatesEnabled ?? true,
        supportEnabled: data.supportEnabled ?? true,
        accountEnabled: data.accountEnabled ?? true,
        adminEnabled: data.adminEnabled ?? true,
      },
    });

    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
