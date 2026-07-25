import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: List all banned words
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

    const words = await prisma.bannedWord.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(words);
  } catch {
    return NextResponse.json({ error: "فشل في جلب الكلمات الممنوعة" }, { status: 500 });
  }
}

// POST: Add a new banned word
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== "admin") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const body = await request.json();
    const { word, category } = body;

    if (!word || typeof word !== "string" || word.trim().length === 0) {
      return NextResponse.json({ error: "الكلمة مطلوبة" }, { status: 400 });
    }

    const trimmedWord = word.trim().toLowerCase();

    // Check if word already exists
    const existing = await prisma.bannedWord.findUnique({
      where: { word: trimmedWord },
    });
    if (existing) {
      return NextResponse.json({ error: "هذه الكلمة موجودة بالفعل" }, { status: 409 });
    }

    const bannedWord = await prisma.bannedWord.create({
      data: {
        word: trimmedWord,
        category: category || "inappropriate",
        addedBy: (session.user as { id: string }).id,
      },
    });

    return NextResponse.json(bannedWord);
  } catch {
    return NextResponse.json({ error: "فشل في إضافة الكلمة" }, { status: 500 });
  }
}

// DELETE: Remove a banned word
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== "admin") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "معرف الكلمة مطلوب" }, { status: 400 });
    }

    await prisma.bannedWord.delete({
      where: { id },
    });

    return NextResponse.json({ message: "تم حذف الكلمة بنجاح" });
  } catch {
    return NextResponse.json({ error: "فشل في حذف الكلمة" }, { status: 500 });
  }
}
