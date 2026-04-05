import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";

const prisma = new PrismaClient();

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const AVATAR_SIZE = 150;

// GET - Get current user's avatar
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: (session.user as { id: string }).id },
      select: { avatar: true },
    });

    return NextResponse.json({ avatar: user?.avatar || "" });
  } catch {
    return NextResponse.json({ error: "فشل في جلب الصورة" }, { status: 500 });
  }
}

// POST - Upload/update avatar
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return NextResponse.json({ error: "لم يتم إرسال صورة" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "نوع الملف غير مدعوم. الأنواع المدعومة: JPG, JPEG, PNG, WEBP" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت" },
        { status: 400 }
      );
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Resize and crop to 150x150 square using sharp
    const processedImage = await sharp(buffer)
      .resize(AVATAR_SIZE, AVATAR_SIZE, {
        fit: "cover",
        position: "center",
      })
      .webp({ quality: 85 })
      .toBuffer();

    // Convert to base64 data URL
    const base64 = `data:image/webp;base64,${processedImage.toString("base64")}`;

    // Update user avatar in database
    await prisma.user.update({
      where: { id: (session.user as { id: string }).id },
      data: { avatar: base64 },
    });

    return NextResponse.json({ avatar: base64, message: "تم تحديث الصورة بنجاح" });
  } catch {
    return NextResponse.json({ error: "فشل في رفع الصورة" }, { status: 500 });
  }
}

// DELETE - Remove avatar (reset to default)
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: (session.user as { id: string }).id },
      data: { avatar: "" },
    });

    return NextResponse.json({ message: "تم حذف الصورة بنجاح" });
  } catch {
    return NextResponse.json({ error: "فشل في حذف الصورة" }, { status: 500 });
  }
}
