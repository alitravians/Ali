import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import sharp from "sharp";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const section = searchParams.get("section") || "items";

    if (section === "items") {
      const items = await prisma.inventoryItem.findMany({
        orderBy: [{ type: "asc" }, { order: "asc" }, { createdAt: "desc" }],
        include: { _count: { select: { userItems: true } } },
      });
      return NextResponse.json(items);
    }

    if (section === "users") {
      const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, avatar: true },
        orderBy: { name: "asc" },
      });
      return NextResponse.json(users);
    }

    if (section === "user_items") {
      const userId = searchParams.get("userId");
      if (!userId) return NextResponse.json({ error: "userId مطلوب" }, { status: 400 });
      const items = await prisma.userInventory.findMany({
        where: { userId },
        include: { item: true },
        orderBy: { grantedAt: "desc" },
      });
      return NextResponse.json(items);
    }

    if (section === "logs") {
      const userId = searchParams.get("userId");
      const logs = await prisma.inventoryLog.findMany({
        where: userId ? { userId } : {},
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return NextResponse.json(logs);
    }

    return NextResponse.json([]);
  } catch {
    return NextResponse.json({ error: "فشل في جلب البيانات" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const adminId = (session.user as { id: string }).id;
    const contentType = request.headers.get("content-type") || "";

    // Handle multipart form data (with image/video/sound upload)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const action = formData.get("action") as string;
      const image = formData.get("image") as File | null;
      const video = formData.get("video") as File | null;
      const sound = formData.get("sound") as File | null;

      let imageUrl = "";
      if (image && image.size > 0) {
        const buffer = Buffer.from(await image.arrayBuffer());
        const resized = await sharp(buffer).resize(64, 64, { fit: "cover" }).png().toBuffer();
        imageUrl = `data:image/png;base64,${resized.toString("base64")}`;
      }

      // Save video file to public/effects/
      let videoUrl = "";
      if (video && video.size > 0) {
        const effectsDir = path.join(process.cwd(), "public", "effects");
        await mkdir(effectsDir, { recursive: true });
        const ext = video.name.split(".").pop() || "mp4";
        const filename = `video_${Date.now()}.${ext}`;
        const buffer = Buffer.from(await video.arrayBuffer());
        await writeFile(path.join(effectsDir, filename), buffer);
        videoUrl = `/effects/${filename}`;
      }

      // Save sound file to public/effects/
      let soundUrl = "";
      if (sound && sound.size > 0) {
        const effectsDir = path.join(process.cwd(), "public", "effects");
        await mkdir(effectsDir, { recursive: true });
        const ext = sound.name.split(".").pop() || "mp3";
        const filename = `sound_${Date.now()}.${ext}`;
        const buffer = Buffer.from(await sound.arrayBuffer());
        await writeFile(path.join(effectsDir, filename), buffer);
        soundUrl = `/effects/${filename}`;
      }

      if (action === "create") {
        const nameAr = formData.get("nameAr") as string;
        const type = formData.get("type") as string;
        if (!nameAr || !type) {
          return NextResponse.json({ error: "الاسم والنوع مطلوبان" }, { status: 400 });
        }

        const effectDurationStr = formData.get("effectDuration") as string;
        const item = await prisma.inventoryItem.create({
          data: {
            name: (formData.get("name") as string) || nameAr,
            nameAr,
            description: (formData.get("description") as string) || "",
            descriptionAr: (formData.get("descriptionAr") as string) || "",
            type,
            icon: (formData.get("icon") as string) || "✨",
            imageUrl,
            color: (formData.get("color") as string) || "#6366f1",
            previewData: (formData.get("previewData") as string) || "{}",
            videoUrl,
            soundUrl,
            effectDuration: effectDurationStr ? parseInt(effectDurationStr) : 5,
            category: (formData.get("category") as string) || "general",
            rarity: (formData.get("rarity") as string) || "common",
            order: parseInt((formData.get("order") as string) || "0"),
          },
        });
        return NextResponse.json(item);
      }

      if (action === "update") {
        const itemId = formData.get("itemId") as string;
        if (!itemId) return NextResponse.json({ error: "معرف العنصر مطلوب" }, { status: 400 });

        const data: Record<string, unknown> = {};
        const nameAr = formData.get("nameAr") as string;
        if (nameAr) { data.nameAr = nameAr; data.name = (formData.get("name") as string) || nameAr; }
        const descriptionAr = formData.get("descriptionAr") as string;
        if (descriptionAr !== null) data.descriptionAr = descriptionAr || "";
        const type = formData.get("type") as string;
        if (type) data.type = type;
        const icon = formData.get("icon") as string;
        if (icon) data.icon = icon;
        if (imageUrl) data.imageUrl = imageUrl;
        const color = formData.get("color") as string;
        if (color) data.color = color;
        const previewData = formData.get("previewData") as string;
        if (previewData) data.previewData = previewData;
        if (videoUrl) data.videoUrl = videoUrl;
        if (soundUrl) data.soundUrl = soundUrl;
        const effectDurationStr = formData.get("effectDuration") as string;
        if (effectDurationStr) data.effectDuration = parseInt(effectDurationStr);
        const category = formData.get("category") as string;
        if (category) data.category = category;
        const rarity = formData.get("rarity") as string;
        if (rarity) data.rarity = rarity;
        const order = formData.get("order") as string;
        if (order) data.order = parseInt(order);

        const item = await prisma.inventoryItem.update({ where: { id: itemId }, data });
        return NextResponse.json(item);
      }

      return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
    }

    // Handle JSON requests
    const body = await request.json();
    const { action } = body;

    // Create item without image
    if (action === "create") {
      const { nameAr, type } = body;
      if (!nameAr || !type) {
        return NextResponse.json({ error: "الاسم والنوع مطلوبان" }, { status: 400 });
      }

      const item = await prisma.inventoryItem.create({
        data: {
          name: body.name || nameAr,
          nameAr,
          description: body.description || "",
          descriptionAr: body.descriptionAr || "",
          type,
          icon: body.icon || "✨",
          color: body.color || "#6366f1",
          previewData: body.previewData || "{}",
          effectDuration: body.effectDuration ? parseInt(body.effectDuration) : 5,
          category: body.category || "general",
          rarity: body.rarity || "common",
          order: body.order || 0,
        },
      });
      return NextResponse.json(item);
    }

    // Update item
    if (action === "update") {
      const { itemId, ...data } = body;
      if (!itemId) return NextResponse.json({ error: "معرف العنصر مطلوب" }, { status: 400 });
      delete data.action;
      if (data.nameAr && !data.name) data.name = data.nameAr;
      const item = await prisma.inventoryItem.update({ where: { id: itemId }, data });
      return NextResponse.json(item);
    }

    // Delete item
    if (action === "delete") {
      const { itemId } = body;
      if (!itemId) return NextResponse.json({ error: "معرف العنصر مطلوب" }, { status: 400 });
      await prisma.inventoryItem.delete({ where: { id: itemId } });
      return NextResponse.json({ success: true });
    }

    // Toggle active
    if (action === "toggle") {
      const { itemId } = body;
      if (!itemId) return NextResponse.json({ error: "معرف العنصر مطلوب" }, { status: 400 });
      const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
      if (!item) return NextResponse.json({ error: "العنصر غير موجود" }, { status: 404 });
      const updated = await prisma.inventoryItem.update({ where: { id: itemId }, data: { isActive: !item.isActive } });
      return NextResponse.json(updated);
    }

    // Grant item to user
    if (action === "grant") {
      const { userId, itemId, isPermanent, durationDays, adminNote } = body;
      if (!userId || !itemId) {
        return NextResponse.json({ error: "المستخدم والعنصر مطلوبان" }, { status: 400 });
      }

      // Check if user already has this item
      const existing = await prisma.userInventory.findUnique({
        where: { userId_itemId: { userId, itemId } },
      });
      if (existing && existing.status !== "expired" && existing.status !== "revoked") {
        return NextResponse.json({ error: "المستخدم يمتلك هذا العنصر بالفعل" }, { status: 400 });
      }

      const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
      if (!item) return NextResponse.json({ error: "العنصر غير موجود" }, { status: 404 });

      const permanent = isPermanent !== false;
      const days = parseInt(durationDays) || 0;
      const expiresAt = !permanent && days > 0
        ? new Date(Date.now() + days * 24 * 60 * 60 * 1000)
        : null;

      // Upsert (in case it was expired/revoked before)
      const userItem = existing
        ? await prisma.userInventory.update({
            where: { id: existing.id },
            data: {
              status: "inactive",
              isPermanent: permanent,
              durationDays: days,
              grantedAt: new Date(),
              expiresAt,
              activatedAt: null,
              revokedAt: null,
              revokedBy: "",
              revokeReason: "",
              grantedBy: adminId,
              adminNote: adminNote || "",
            },
          })
        : await prisma.userInventory.create({
            data: {
              userId,
              itemId,
              status: "inactive",
              isPermanent: permanent,
              durationDays: days,
              expiresAt,
              grantedBy: adminId,
              adminNote: adminNote || "",
            },
          });

      // Log the action
      await prisma.inventoryLog.create({
        data: {
          userId,
          itemId,
          action: "granted",
          details: `منح ${item.nameAr} - ${permanent ? "دائم" : `${days} يوم`}`,
          performedBy: adminId,
        },
      });

      // Send notification to user
      await prisma.notification.create({
        data: {
          userId,
          title: "عنصر جديد في حقيبتك!",
          titleAr: "عنصر جديد في حقيبتك!",
          message: `تم منحك "${item.nameAr}" ${!permanent ? `لمدة ${days} يوم` : "(دائم)"}`,
          messageAr: `تم منحك "${item.nameAr}" ${!permanent ? `لمدة ${days} يوم` : "(دائم)"}`,
          type: "success",
          category: "account",
          icon: "star",
          link: "/inventory",
          priority: "important",
        },
      });

      return NextResponse.json(userItem);
    }

    // Revoke item from user
    if (action === "revoke") {
      const { userId, itemId, reason } = body;
      if (!userId || !itemId) {
        return NextResponse.json({ error: "المستخدم والعنصر مطلوبان" }, { status: 400 });
      }

      const userItem = await prisma.userInventory.findUnique({
        where: { userId_itemId: { userId, itemId } },
        include: { item: true },
      });
      if (!userItem) return NextResponse.json({ error: "العنصر غير موجود" }, { status: 404 });

      await prisma.userInventory.update({
        where: { id: userItem.id },
        data: {
          status: "revoked",
          revokedAt: new Date(),
          revokedBy: adminId,
          revokeReason: reason || "",
        },
      });

      // Log
      await prisma.inventoryLog.create({
        data: {
          userId,
          itemId,
          action: "revoked",
          details: `سحب ${userItem.item.nameAr} - ${reason || "بدون سبب"}`,
          performedBy: adminId,
        },
      });

      // Notify user
      await prisma.notification.create({
        data: {
          userId,
          title: "تم سحب عنصر من حقيبتك",
          titleAr: "تم سحب عنصر من حقيبتك",
          message: `تم سحب "${userItem.item.nameAr}" من حقيبتك${reason ? ` - السبب: ${reason}` : ""}`,
          messageAr: `تم سحب "${userItem.item.nameAr}" من حقيبتك${reason ? ` - السبب: ${reason}` : ""}`,
          type: "warning",
          category: "account",
          icon: "alert",
          link: "/inventory",
        },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
  } catch (err) {
    console.error("Inventory API error:", err);
    return NextResponse.json({ error: "فشل في العملية" }, { status: 500 });
  }
}
