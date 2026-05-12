// Authenticated user avatar upload / fetch / delete.
//
// Stored as a data URL (data:image/webp;base64,...) directly on the User row.
// The server resizes incoming images to 150x150 WebP with sharp so users
// cannot blow up the DB by uploading a 30MB original.
//
// Security:
//   - requireSameOrigin() blocks cross-origin POST/DELETE (CSRF defense).
//   - File type whitelist + size cap (5MB raw) before sharp ever touches it.
//   - sharp will reject malformed files with a thrown error.
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB raw
const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const AVATAR_SIZE = 150;

function avatarUrlFor(userId: string, hasAvatar: boolean): string | null {
  return hasAvatar ? `/api/avatar/${userId}?v=${Date.now()}` : null;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  return NextResponse.json({
    avatarUrl: avatarUrlFor(user.id, Boolean(user.avatar)),
  });
}

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (!csrf.ok) return NextResponse.json({ error: csrf.reason }, { status: 403 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "صيغة البيانات غير صحيحة" }, { status: 400 });
  }
  const file = formData.get("avatar");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "لم يتم إرسال صورة" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "نوع الملف غير مدعوم. الأنواع المدعومة: JPG، PNG، WEBP" },
      { status: 400 },
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "حجم الملف كبير جداً. الحدّ الأقصى ٥ ميجابايت" },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let processed: Buffer;
  try {
    processed = await sharp(buffer)
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover", position: "center" })
      .webp({ quality: 85 })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: "تعذّر قراءة الصورة" }, { status: 400 });
  }

  const dataUrl = `data:image/webp;base64,${processed.toString("base64")}`;

  await prisma.user.update({
    where: { id: user.id },
    data: { avatar: dataUrl },
  });

  return NextResponse.json({
    avatarUrl: avatarUrlFor(user.id, true),
    message: "تم تحديث الصورة بنجاح",
  });
}

export async function DELETE(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (!csrf.ok) return NextResponse.json({ error: csrf.reason }, { status: 403 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });

  await prisma.user.update({
    where: { id: user.id },
    data: { avatar: "" },
  });

  return NextResponse.json({ avatarUrl: null, message: "تم حذف الصورة" });
}
