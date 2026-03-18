import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_ROOMS = [
  { name: "general", nameAr: "الدردشة العامة", description: "غرفة الدردشة العامة لجميع المستخدمين", type: "public", order: 1 },
  { name: "support", nameAr: "الدعم والمساعدة", description: "اطرح أسئلتك واحصل على المساعدة", type: "support", order: 2 },
  { name: "learning", nameAr: "تعلم اللغات", description: "ناقش دروس وتمارين اللغات", type: "educational", order: 3 },
  { name: "announcements", nameAr: "الإعلانات", description: "إعلانات الإدارة والتحديثات", type: "admin", order: 4 },
];

export async function POST() {
  try {
    const existing = await prisma.chatRoom.count();
    if (existing > 0) {
      return NextResponse.json({ message: "الغرف موجودة بالفعل", count: existing });
    }

    for (const room of DEFAULT_ROOMS) {
      await prisma.chatRoom.create({ data: room });
    }

    return NextResponse.json({ message: "تم إنشاء الغرف الافتراضية", count: DEFAULT_ROOMS.length });
  } catch {
    return NextResponse.json({ error: "فشل في إنشاء الغرف" }, { status: 500 });
  }
}
