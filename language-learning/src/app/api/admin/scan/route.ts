import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { runSystemScan } from "@/lib/system-scanner";

export const dynamic = "force-dynamic";

// GET - Get scan history or specific scan results
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(request.url);
    const scanId = searchParams.get("scanId");
    const issueId = searchParams.get("issueId");

    // Get specific issue details
    if (issueId) {
      const issue = await prisma.systemIssue.findUnique({
        where: { id: issueId },
        include: { scan: { select: { id: true, scanType: true, startedAt: true } } },
      });
      if (!issue) {
        return NextResponse.json({ error: "المشكلة غير موجودة" }, { status: 404 });
      }
      return NextResponse.json(issue);
    }

    // Get specific scan with issues
    if (scanId) {
      const scan = await prisma.systemScan.findUnique({
        where: { id: scanId },
        include: {
          issues: {
            orderBy: [
              { severity: "asc" },
              { detectedAt: "desc" },
            ],
          },
        },
      });
      if (!scan) {
        return NextResponse.json({ error: "الفحص غير موجود" }, { status: 404 });
      }
      return NextResponse.json(scan);
    }

    // Get scan history
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const [scans, total] = await Promise.all([
      prisma.systemScan.findMany({
        orderBy: { startedAt: "desc" },
        skip,
        take: limit,
        include: {
          _count: { select: { issues: true } },
        },
      }),
      prisma.systemScan.count(),
    ]);

    return NextResponse.json({ scans, total, page, limit });
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

// POST - Start a new scan
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const body = await request.json().catch(() => ({}));
    const scanType = body.scanType || "full";

    const validTypes = ["full", "pages", "files", "api", "database", "performance", "security", "tickets", "notifications", "certificates", "tests", "chat", "gamification", "inventory", "moderator", "badges", "team"];
    if (!validTypes.includes(scanType)) {
      return NextResponse.json({ error: "نوع الفحص غير صالح" }, { status: 400 });
    }

    // Check if there's already a running scan
    const runningScan = await prisma.systemScan.findFirst({
      where: { status: "running" },
    });
    if (runningScan) {
      return NextResponse.json({ error: "يوجد فحص قيد التنفيذ بالفعل", scanId: runningScan.id }, { status: 409 });
    }

    const email = (auth.session.user as { email?: string }).email || "admin";
    const scanId = await runSystemScan(scanType, email);

    // Fetch the completed scan
    const scan = await prisma.systemScan.findUnique({
      where: { id: scanId },
      include: {
        issues: {
          orderBy: [
            { severity: "asc" },
            { detectedAt: "desc" },
          ],
        },
      },
    });

    // Create admin notifications based on scan results
    if (scan) {
      const totalIssues = scan.criticalCount + scan.highCount + scan.mediumCount + scan.lowCount;

      // Critical issues - urgent notification
      if (scan.criticalCount > 0) {
        const breakdownParts = [];
        if (scan.criticalCount > 0) breakdownParts.push(`${scan.criticalCount} حرجة`);
        if (scan.highCount > 0) breakdownParts.push(`${scan.highCount} عالية`);
        if (scan.mediumCount > 0) breakdownParts.push(`${scan.mediumCount} متوسطة`);
        if (scan.lowCount > 0) breakdownParts.push(`${scan.lowCount} منخفضة`);
        const breakdown = breakdownParts.join(" | ");

        await prisma.adminNotification.create({
          data: {
            title: "Critical System Issues Detected",
            titleAr: "تنبيه عاجل: مشاكل حرجة في النظام",
            message: `System scan found ${totalIssues} issues (${scan.criticalCount} critical). Breakdown: ${breakdown}. Immediate action required.`,
            messageAr: `اكتشف فحص النظام ${totalIssues} مشكلة (${scan.criticalCount} حرجة). التوزيع: ${breakdown}. يتطلب إجراءً فورياً.`,
            category: "admin",
            priority: "urgent",
            link: "/admin/scan",
          },
        });
      }
      // High severity issues - high priority notification
      else if (scan.highCount > 0) {
        await prisma.adminNotification.create({
          data: {
            title: "High Severity Issues Found",
            titleAr: "تم اكتشاف مشاكل عالية الخطورة",
            message: `System scan found ${scan.highCount} high severity issues out of ${totalIssues} total. Review recommended.`,
            messageAr: `اكتشف فحص النظام ${scan.highCount} مشكلة عالية الخطورة من إجمالي ${totalIssues}. يُنصح بالمراجعة.`,
            category: "admin",
            priority: "high",
            link: "/admin/scan",
          },
        });
      }
      // Performance degradation notification
      const perfIssues = scan.issues.filter((i: { type: string }) => i.type === "performance");
      if (perfIssues.length > 0) {
        const perfCritical = perfIssues.filter((i: { severity: string }) => i.severity === "critical" || i.severity === "high").length;
        if (perfCritical > 0) {
          await prisma.adminNotification.create({
            data: {
              title: "Performance Degradation Detected",
              titleAr: "تم اكتشاف تدهور في الأداء",
              message: `${perfCritical} performance issues detected. Response times or database sizes may need attention.`,
              messageAr: `تم اكتشاف ${perfCritical} مشكلة في الأداء. أوقات الاستجابة أو حجم قاعدة البيانات قد تحتاج اهتماماً.`,
              category: "admin",
              priority: "high",
              link: "/admin/scan",
            },
          });
        }
      }
    }

    return NextResponse.json(scan);
  } catch {
    return NextResponse.json({ error: "حدث خطأ أثناء الفحص" }, { status: 500 });
  }
}

// PUT - Update issue status
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const { issueId, status } = body;

    if (!issueId || !status) {
      return NextResponse.json({ error: "معرف المشكلة والحالة مطلوبان" }, { status: 400 });
    }

    const validStatuses = ["new", "in_progress", "fixed", "ignored"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "الحالة غير صالحة" }, { status: 400 });
    }

    const issue = await prisma.systemIssue.update({
      where: { id: issueId },
      data: { status },
    });

    return NextResponse.json(issue);
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

// DELETE - Delete a scan and its issues
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const { scanId } = body;

    if (!scanId) {
      return NextResponse.json({ error: "معرف الفحص مطلوب" }, { status: 400 });
    }

    await prisma.systemScan.delete({
      where: { id: scanId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
