import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import sharp from "sharp";

const BADGE_IMAGE_SIZE = 64; // 64x64 pixels for badge icons
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// GET - List badges and assignments
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role: string }).role !== "admin") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const section = searchParams.get("section") || "list";

    if (section === "list") {
      const badges = await prisma.badge.findMany({
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        include: {
          _count: { select: { assignments: true } },
        },
      });
      return NextResponse.json({ badges });
    }

    if (section === "assignments") {
      const badgeId = searchParams.get("badgeId");
      if (!badgeId) {
        return NextResponse.json({ error: "معرف الشارة مطلوب" }, { status: 400 });
      }
      const assignments = await prisma.badgeAssignment.findMany({
        where: { badgeId },
        orderBy: { createdAt: "desc" },
        include: {
          badge: { select: { name: true, nameAr: true, icon: true, imageUrl: true, color: true } },
        },
      });

      // Get user info for each assignment
      const userIds = assignments.map((a) => a.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true, avatar: true },
      });
      const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

      const enriched = assignments.map((a) => ({
        ...a,
        user: userMap[a.userId] || { id: a.userId, name: "Unknown", email: "", avatar: "" },
      }));

      return NextResponse.json({ assignments: enriched });
    }

    if (section === "users") {
      const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true, avatar: true },
        orderBy: { name: "asc" },
      });
      return NextResponse.json({ users });
    }

    return NextResponse.json({ error: "قسم غير معروف" }, { status: 400 });
  } catch (error) {
    console.error("Admin badges GET error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}

// POST - Create, update, delete badges and assignments
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role: string }).role !== "admin") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const adminId = (session.user as { id: string }).id;
    const contentType = req.headers.get("content-type") || "";

    // Handle multipart form data (image upload for badge)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const action = formData.get("action") as string;
      const file = formData.get("image") as File | null;

      if (action === "create" || action === "update") {
        const name = formData.get("name") as string;
        const nameAr = formData.get("nameAr") as string;
        const description = (formData.get("description") as string) || "";
        const descriptionAr = (formData.get("descriptionAr") as string) || "";
        const icon = (formData.get("icon") as string) || "⭐";
        const color = (formData.get("color") as string) || "#f59e0b";
        const category = (formData.get("category") as string) || "general";
        const order = parseInt((formData.get("order") as string) || "0") || 0;
        const badgeId = formData.get("badgeId") as string | null;

        if (!name || !nameAr) {
          return NextResponse.json({ error: "الاسم مطلوب بالعربي والإنجليزي" }, { status: 400 });
        }

        let imageUrl = "";

        // Process uploaded image - auto-resize to standard badge size
        if (file && file.size > 0) {
          if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: "حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت" }, { status: 400 });
          }

          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // Auto-resize any image to 64x64 badge icon size
          const processedImage = await sharp(buffer)
            .resize(BADGE_IMAGE_SIZE, BADGE_IMAGE_SIZE, {
              fit: "cover",
              position: "center",
            })
            .png({ quality: 90 })
            .toBuffer();

          imageUrl = `data:image/png;base64,${processedImage.toString("base64")}`;
        }

        if (action === "update" && badgeId) {
          const data: Record<string, unknown> = {
            name, nameAr, description, descriptionAr, icon, color, category, order,
          };
          if (imageUrl) data.imageUrl = imageUrl;

          const badge = await prisma.badge.update({
            where: { id: badgeId },
            data,
          });
          return NextResponse.json(badge);
        } else {
          const badge = await prisma.badge.create({
            data: {
              name, nameAr, description, descriptionAr, icon, imageUrl, color, category, order,
            },
          });
          return NextResponse.json(badge);
        }
      }

      return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
    }

    // Handle JSON body (non-image actions)
    const body = await req.json();
    const { action } = body;

    // === Create Badge (without image - emoji only) ===
    if (action === "create") {
      const { name, nameAr, description, descriptionAr, icon, color, category, order } = body;
      if (!name || !nameAr) {
        return NextResponse.json({ error: "الاسم مطلوب بالعربي والإنجليزي" }, { status: 400 });
      }

      const badge = await prisma.badge.create({
        data: {
          name,
          nameAr,
          description: description || "",
          descriptionAr: descriptionAr || "",
          icon: icon || "⭐",
          color: color || "#f59e0b",
          category: category || "general",
          order: order || 0,
        },
      });

      return NextResponse.json(badge);
    }

    // === Update Badge (without image) ===
    if (action === "update") {
      const { badgeId, name, nameAr, description, descriptionAr, icon, color, category, isActive, order } = body;
      if (!badgeId) {
        return NextResponse.json({ error: "معرف الشارة مطلوب" }, { status: 400 });
      }

      const data: Record<string, unknown> = {};
      if (name !== undefined) data.name = name;
      if (nameAr !== undefined) data.nameAr = nameAr;
      if (description !== undefined) data.description = description;
      if (descriptionAr !== undefined) data.descriptionAr = descriptionAr;
      if (icon !== undefined) data.icon = icon;
      if (color !== undefined) data.color = color;
      if (category !== undefined) data.category = category;
      if (isActive !== undefined) data.isActive = isActive;
      if (order !== undefined) data.order = order;

      const badge = await prisma.badge.update({
        where: { id: badgeId },
        data,
      });

      return NextResponse.json(badge);
    }

    // === Remove badge image (revert to emoji) ===
    if (action === "removeImage") {
      const { badgeId } = body;
      if (!badgeId) {
        return NextResponse.json({ error: "معرف الشارة مطلوب" }, { status: 400 });
      }

      const badge = await prisma.badge.update({
        where: { id: badgeId },
        data: { imageUrl: "" },
      });

      return NextResponse.json(badge);
    }

    // === Delete Badge ===
    if (action === "delete") {
      const { badgeId } = body;
      if (!badgeId) {
        return NextResponse.json({ error: "معرف الشارة مطلوب" }, { status: 400 });
      }

      await prisma.badge.delete({ where: { id: badgeId } });
      return NextResponse.json({ success: true });
    }

    // === Assign Badge to User ===
    if (action === "assign") {
      const { badgeId, userId, note } = body;
      if (!badgeId || !userId) {
        return NextResponse.json({ error: "معرف الشارة والمستخدم مطلوبان" }, { status: 400 });
      }

      // Check if already assigned
      const existing = await prisma.badgeAssignment.findUnique({
        where: { badgeId_userId: { badgeId, userId } },
      });
      if (existing) {
        return NextResponse.json({ error: "الشارة معينة بالفعل لهذا المستخدم" }, { status: 400 });
      }

      const assignment = await prisma.badgeAssignment.create({
        data: {
          badgeId,
          userId,
          assignedBy: adminId,
          note: note || "",
        },
      });

      // Get badge info for notification
      const badge = await prisma.badge.findUnique({ where: { id: badgeId } });

      // Send notification to user
      if (badge) {
        await prisma.notification.create({
          data: {
            userId,
            title: "حصلت على شارة جديدة!",
            titleAr: "حصلت على شارة جديدة!",
            message: `You earned the badge: ${badge.name}`,
            messageAr: `تهانينا! حصلت على شارة "${badge.nameAr}" ${badge.imageUrl ? '🏅' : badge.icon}. ${badge.descriptionAr || badge.description}`,
            type: "achievement",
            category: "general",
            icon: "trophy",
            link: "/profile",
            priority: "normal",
          },
        });
      }

      return NextResponse.json(assignment);
    }

    // === Remove Badge from User ===
    if (action === "unassign") {
      const { badgeId, userId } = body;
      if (!badgeId || !userId) {
        return NextResponse.json({ error: "معرف الشارة والمستخدم مطلوبان" }, { status: 400 });
      }

      await prisma.badgeAssignment.delete({
        where: { badgeId_userId: { badgeId, userId } },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
  } catch (error) {
    console.error("Admin badges POST error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
