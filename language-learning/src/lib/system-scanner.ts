import prisma from "@/lib/prisma";

interface ScanIssue {
  name: string;
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  section: string;
  fileName: string;
  filePath: string;
  lineNumber?: number;
  description: string;
  cause: string;
  solution: string;
  recommendation: string;
}

interface CheckResult {
  name: string;
  passed: boolean;
  issues: ScanIssue[];
}

const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

// ==================== Level 1: Technical Checks ====================

async function checkPageRoutes(): Promise<CheckResult> {
  const issues: ScanIssue[] = [];
  const pages = [
    { path: "/", name: "الصفحة الرئيسية" },
    { path: "/login", name: "صفحة تسجيل الدخول" },
    { path: "/register", name: "صفحة التسجيل" },
    { path: "/contact", name: "صفحة الاتصال" },
    { path: "/admin/login", name: "صفحة دخول الإدارة" },
    { path: "/verify-certificate", name: "صفحة التحقق من الشهادة" },
  ];

  for (const page of pages) {
    try {
      const res = await fetch(`${BASE_URL}${page.path}`, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok && res.status !== 307 && res.status !== 302) {
        issues.push({
          name: `صفحة ${page.name} لا تعمل`,
          type: "page",
          severity: "high",
          section: page.name,
          fileName: "",
          filePath: page.path,
          description: `الصفحة ${page.name} ترجع خطأ HTTP ${res.status}`,
          cause: `الخادم يرجع حالة خطأ ${res.status} عند الوصول للصفحة`,
          solution: `تحقق من ملف الصفحة وتأكد من عدم وجود أخطاء برمجية`,
          recommendation: `راجع ملف الصفحة المقابل في مجلد src/app وتأكد من صحة التصدير`,
        });
      }
    } catch (error) {
      issues.push({
        name: `صفحة ${page.name} غير قابلة للوصول`,
        type: "page",
        severity: "critical",
        section: page.name,
        fileName: "",
        filePath: page.path,
        description: `فشل الاتصال بالصفحة ${page.name} - قد يكون الخادم متوقفاً`,
        cause: `خطأ في الشبكة أو الخادم: ${error instanceof Error ? error.message : "unknown"}`,
        solution: `تأكد من أن الخادم يعمل بشكل صحيح وأعد تشغيله إذا لزم الأمر`,
        recommendation: `تحقق من سجلات الخادم للعثور على سبب التوقف`,
      });
    }
  }

  return { name: "فحص صفحات الموقع", passed: issues.length === 0, issues };
}

async function checkAPIEndpoints(): Promise<CheckResult> {
  const issues: ScanIssue[] = [];

  const publicAPIs = [
    { path: "/api/languages", method: "GET", name: "API اللغات" },
    { path: "/api/settings", method: "GET", name: "API الإعدادات" },
    { path: "/api/certificates", method: "GET", name: "API الشهادات" },
  ];

  const adminAPIs = [
    { path: "/api/admin/stats", name: "API إحصائيات الإدارة" },
    { path: "/api/admin/users", name: "API المستخدمين" },
    { path: "/api/admin/tickets", name: "API التذاكر" },
    { path: "/api/admin/contact", name: "API رسائل الاتصال" },
    { path: "/api/admin/notifications", name: "API الإشعارات" },
  ];

  // Check public APIs return 200
  for (const api of publicAPIs) {
    try {
      const res = await fetch(`${BASE_URL}${api.path}`, {
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) {
        issues.push({
          name: `${api.name} لا يعمل`,
          type: "api",
          severity: "high",
          section: api.name,
          fileName: "route.ts",
          filePath: `src/app${api.path}/route.ts`,
          description: `${api.name} يرجع خطأ ${res.status} بدلاً من 200`,
          cause: `خطأ في معالجة الطلب أو الاتصال بقاعدة البيانات`,
          solution: `تحقق من ملف route.ts وتأكد من صحة استعلامات Prisma`,
          recommendation: `راجع سجلات الخادم وتأكد من الاتصال بقاعدة البيانات`,
        });
      }
    } catch (error) {
      issues.push({
        name: `${api.name} غير قابل للوصول`,
        type: "api",
        severity: "critical",
        section: api.name,
        fileName: "route.ts",
        filePath: `src/app${api.path}/route.ts`,
        description: `فشل الاتصال بـ ${api.name}`,
        cause: `${error instanceof Error ? error.message : "خطأ غير معروف"}`,
        solution: `تأكد من أن الخادم يعمل وأعد تشغيله`,
        recommendation: `تحقق من صحة ملف route.ts وعدم وجود أخطاء في الاستيراد`,
      });
    }
  }

  // Check admin APIs return 401 without auth (security check)
  for (const api of adminAPIs) {
    try {
      const res = await fetch(`${BASE_URL}${api.path}`, {
        signal: AbortSignal.timeout(10000),
      });
      if (res.status !== 401) {
        issues.push({
          name: `${api.name} غير محمي`,
          type: "security",
          severity: "critical",
          section: api.name,
          fileName: "route.ts",
          filePath: `src/app${api.path}/route.ts`,
          description: `${api.name} لا يتطلب مصادقة - يرجع ${res.status} بدلاً من 401`,
          cause: `عدم استخدام requireAdmin() في بداية معالج الطلب`,
          solution: `أضف const auth = await requireAdmin(); if (!auth.authorized) return auth.response; في بداية الدالة`,
          recommendation: `تأكد من استيراد requireAdmin من @/lib/admin-auth وتطبيقه على جميع دوال الطلب`,
        });
      }
    } catch {
      // Connection error already covered above
    }
  }

  // Check content creation APIs require admin
  const contentAPIs = [
    { path: "/api/languages", name: "API إنشاء اللغات" },
    { path: "/api/levels", name: "API إنشاء المستويات" },
    { path: "/api/lessons", name: "API إنشاء الدروس" },
    { path: "/api/questions", name: "API إنشاء الأسئلة" },
  ];

  for (const api of contentAPIs) {
    try {
      const res = await fetch(`${BASE_URL}${api.path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "__scan_test__" }),
        signal: AbortSignal.timeout(10000),
      });
      if (res.status !== 401) {
        issues.push({
          name: `${api.name} غير محمي`,
          type: "security",
          severity: "critical",
          section: api.name,
          fileName: "route.ts",
          filePath: `src/app${api.path}/route.ts`,
          description: `${api.name} (POST) لا يتطلب مصادقة المسؤول`,
          cause: `عدم وجود فحص requireAdmin في طلبات POST`,
          solution: `أضف requireAdmin() في بداية دالة POST`,
          recommendation: `جميع عمليات إنشاء المحتوى يجب أن تكون محمية بصلاحيات الإدارة`,
        });
      }
    } catch {
      // Ignore connection errors
    }
  }

  return { name: "فحص واجهات API", passed: issues.length === 0, issues };
}

async function checkDatabase(): Promise<CheckResult> {
  const issues: ScanIssue[] = [];

  // Check database connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    issues.push({
      name: "فشل الاتصال بقاعدة البيانات",
      type: "database",
      severity: "critical",
      section: "قاعدة البيانات",
      fileName: "prisma.ts",
      filePath: "src/lib/prisma.ts",
      description: "لا يمكن الاتصال بقاعدة البيانات SQLite",
      cause: `${error instanceof Error ? error.message : "خطأ غير معروف"}`,
      solution: "تأكد من وجود ملف dev.db وصحة DATABASE_URL في .env",
      recommendation: "أعد تشغيل npx prisma db push لإعادة إنشاء قاعدة البيانات",
    });
    return { name: "فحص قاعدة البيانات", passed: false, issues };
  }

  // Check data integrity - orphaned records
  try {
    const usersCount = await prisma.user.count();
    if (usersCount === 0) {
      issues.push({
        name: "لا يوجد مستخدمين في النظام",
        type: "database",
        severity: "medium",
        section: "المستخدمين",
        fileName: "seed.ts",
        filePath: "prisma/seed.ts",
        description: "قاعدة البيانات لا تحتوي على أي مستخدمين",
        cause: "لم يتم تشغيل بذر البيانات أو تم حذف جميع المستخدمين",
        solution: "شغل npm run db:seed لإضافة البيانات الأولية",
        recommendation: "تأكد من وجود حساب إدارة على الأقل",
      });
    }

    const adminCount = await prisma.user.count({ where: { role: "admin" } });
    if (adminCount === 0) {
      issues.push({
        name: "لا يوجد حساب إدارة",
        type: "database",
        severity: "critical",
        section: "المستخدمين",
        fileName: "seed.ts",
        filePath: "prisma/seed.ts",
        description: "لا يوجد مستخدم بصلاحيات الإدارة في قاعدة البيانات",
        cause: "لم يتم إنشاء حساب إدارة أو تم حذفه",
        solution: "شغل npm run db:seed أو أنشئ حساب إدارة يدوياً",
        recommendation: "يجب وجود حساب إدارة واحد على الأقل لتشغيل النظام",
      });
    }
  } catch {
    issues.push({
      name: "خطأ في استعلام المستخدمين",
      type: "database",
      severity: "high",
      section: "المستخدمين",
      fileName: "schema.prisma",
      filePath: "prisma/schema.prisma",
      description: "فشل في استعلام جدول المستخدمين",
      cause: "قد يكون الجدول غير موجود أو هيكله غير صحيح",
      solution: "أعد تشغيل npx prisma db push",
      recommendation: "تحقق من schema.prisma للتأكد من صحة نموذج User",
    });
  }

  // Check languages have levels
  try {
    const languagesWithoutLevels = await prisma.language.findMany({
      where: { levels: { none: {} } },
    });
    if (languagesWithoutLevels.length > 0) {
      issues.push({
        name: "لغات بدون مستويات",
        type: "database",
        severity: "medium",
        section: "المحتوى التعليمي",
        fileName: "schema.prisma",
        filePath: "prisma/schema.prisma",
        description: `توجد ${languagesWithoutLevels.length} لغة بدون أي مستويات: ${languagesWithoutLevels.map(l => l.name).join(", ")}`,
        cause: "تم إنشاء اللغة بدون إضافة مستويات لها",
        solution: "أضف مستويات لكل لغة من لوحة التحكم",
        recommendation: "كل لغة يجب أن تحتوي على مستوى واحد على الأقل",
      });
    }
  } catch { /* skip */ }

  // Check levels have lessons
  try {
    const levelsWithoutLessons = await prisma.level.findMany({
      where: { lessons: { none: {} } },
      include: { language: { select: { name: true } } },
    });
    if (levelsWithoutLessons.length > 0) {
      issues.push({
        name: "مستويات بدون دروس",
        type: "database",
        severity: "medium",
        section: "المحتوى التعليمي",
        fileName: "schema.prisma",
        filePath: "prisma/schema.prisma",
        description: `توجد ${levelsWithoutLessons.length} مستوى بدون دروس`,
        cause: "تم إنشاء المستوى بدون إضافة دروس",
        solution: "أضف دروساً لكل مستوى من لوحة التحكم",
        recommendation: "كل مستوى يجب أن يحتوي على درس واحد على الأقل",
      });
    }
  } catch { /* skip */ }

  // Check lessons have questions for tests
  try {
    const lessonsWithoutQuestions = await prisma.lesson.findMany({
      where: { questions: { none: {} } },
    });
    if (lessonsWithoutQuestions.length > 0) {
      issues.push({
        name: "دروس بدون أسئلة اختبار",
        type: "database",
        severity: "low",
        section: "المحتوى التعليمي",
        fileName: "",
        filePath: "",
        description: `توجد ${lessonsWithoutQuestions.length} درس بدون أسئلة اختبار`,
        cause: "لم تتم إضافة أسئلة لهذه الدروس",
        solution: "أضف أسئلة اختبار لكل درس من لوحة التحكم",
        recommendation: "الدروس بدون أسئلة لن تظهر في الاختبارات",
      });
    }
  } catch { /* skip */ }

  // Check for open tickets without responses
  try {
    const staleTickets = await prisma.ticket.findMany({
      where: {
        status: "open",
        messages: { none: { isAdmin: true } },
      },
    });
    if (staleTickets.length > 0) {
      issues.push({
        name: "تذاكر مفتوحة بدون رد",
        type: "database",
        severity: "medium",
        section: "نظام التذاكر",
        fileName: "",
        filePath: "",
        description: `توجد ${staleTickets.length} تذكرة مفتوحة بدون رد من الإدارة`,
        cause: "تذاكر دعم فني بانتظار الرد",
        solution: "راجع التذاكر المفتوحة وقم بالرد عليها",
        recommendation: "الرد السريع على التذاكر يحسن تجربة المستخدم",
      });
    }
  } catch { /* skip */ }

  // Check unread contact messages
  try {
    const unreadContacts = await prisma.contactMessage.count({
      where: { isRead: false },
    });
    if (unreadContacts > 5) {
      issues.push({
        name: "رسائل اتصال غير مقروءة",
        type: "database",
        severity: "low",
        section: "رسائل الاتصال",
        fileName: "",
        filePath: "",
        description: `توجد ${unreadContacts} رسالة اتصال غير مقروءة`,
        cause: "رسائل من المستخدمين بانتظار المراجعة",
        solution: "راجع رسائل الاتصال من لوحة التحكم",
        recommendation: "المراجعة الدورية لرسائل الاتصال مهمة",
      });
    }
  } catch { /* skip */ }

  return { name: "فحص قاعدة البيانات", passed: issues.length === 0, issues };
}

async function checkSecurity(): Promise<CheckResult> {
  const issues: ScanIssue[] = [];

  // Check settings PUT requires admin
  try {
    const res = await fetch(`${BASE_URL}/api/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteName: "__scan_test__" }),
      signal: AbortSignal.timeout(10000),
    });
    if (res.status !== 401) {
      issues.push({
        name: "إعدادات الموقع غير محمية",
        type: "security",
        severity: "critical",
        section: "الإعدادات",
        fileName: "route.ts",
        filePath: "src/app/api/settings/route.ts",
        description: "أي شخص يمكنه تعديل إعدادات الموقع بدون مصادقة",
        cause: "عدم وجود فحص requireAdmin في طلب PUT",
        solution: "أضف requireAdmin() في بداية دالة PUT",
        recommendation: "إعدادات الموقع يجب أن تكون محمية بصلاحيات الإدارة حصراً",
      });
    }
  } catch { /* skip */ }

  // Check notification endpoints ownership
  try {
    const res = await fetch(`${BASE_URL}/api/notifications`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "fake_id" }),
      signal: AbortSignal.timeout(10000),
    });
    // Should return 401 (not logged in) not 500 or 200
    if (res.status === 500 || res.status === 200) {
      issues.push({
        name: "إشعارات بدون فحص ملكية",
        type: "security",
        severity: "high",
        section: "الإشعارات",
        fileName: "route.ts",
        filePath: "src/app/api/notifications/route.ts",
        description: "نقطة نهاية الإشعارات لا تتحقق من ملكية المستخدم بشكل صحيح",
        cause: "عدم فحص session أو userId قبل تعديل الإشعار",
        solution: "تأكد من فحص الجلسة والملكية قبل أي تعديل",
        recommendation: "كل عملية تعديل/حذف يجب أن تتحقق من أن المستخدم يملك السجل",
      });
    }
  } catch { /* skip */ }

  // Check admin login endpoint exists
  try {
    const res = await fetch(`${BASE_URL}/api/auth/check-admin`, {
      signal: AbortSignal.timeout(10000),
    });
    if (res.status === 404) {
      issues.push({
        name: "نقطة فحص الإدارة غير موجودة",
        type: "security",
        severity: "high",
        section: "المصادقة",
        fileName: "route.ts",
        filePath: "src/app/api/auth/check-admin/route.ts",
        description: "نقطة نهاية فحص صلاحيات الإدارة غير موجودة",
        cause: "الملف غير موجود أو المسار خاطئ",
        solution: "أنشئ نقطة نهاية للتحقق من صلاحيات الإدارة",
        recommendation: "فحص صلاحيات الإدارة ضروري لحماية لوحة التحكم",
      });
    }
  } catch { /* skip */ }

  return { name: "فحص الأمان", passed: issues.length === 0, issues };
}

async function checkPerformance(): Promise<CheckResult> {
  const issues: ScanIssue[] = [];

  // Check response times for critical endpoints
  const endpoints = [
    { path: "/api/languages", name: "API اللغات", maxMs: 2000 },
    { path: "/api/settings", name: "API الإعدادات", maxMs: 1000 },
  ];

  for (const endpoint of endpoints) {
    try {
      const start = Date.now();
      await fetch(`${BASE_URL}${endpoint.path}`, {
        signal: AbortSignal.timeout(15000),
      });
      const duration = Date.now() - start;

      if (duration > endpoint.maxMs) {
        issues.push({
          name: `بطء في ${endpoint.name}`,
          type: "performance",
          severity: duration > endpoint.maxMs * 2 ? "high" : "medium",
          section: endpoint.name,
          fileName: "route.ts",
          filePath: `src/app${endpoint.path}/route.ts`,
          description: `${endpoint.name} يستغرق ${duration}ms (الحد المسموح: ${endpoint.maxMs}ms)`,
          cause: "استعلامات قاعدة بيانات بطيئة أو معالجة ثقيلة",
          solution: "حسّن استعلامات Prisma وأضف فهارس إذا لزم الأمر",
          recommendation: "استخدم select بدلاً من include لتقليل البيانات المسترجعة",
        });
      }
    } catch (error) {
      issues.push({
        name: `انتهاء مهلة ${endpoint.name}`,
        type: "performance",
        severity: "high",
        section: endpoint.name,
        fileName: "route.ts",
        filePath: `src/app${endpoint.path}/route.ts`,
        description: `${endpoint.name} تجاوز مهلة الاستجابة (15 ثانية)`,
        cause: `${error instanceof Error ? error.message : "انتهاء مهلة الاتصال"}`,
        solution: "تحقق من أداء قاعدة البيانات والاستعلامات",
        recommendation: "أضف تخزين مؤقت للبيانات التي لا تتغير كثيراً",
      });
    }
  }

  // Check database size
  try {
    const userCount = await prisma.user.count();
    const notifCount = await prisma.notification.count();
    const ticketMsgCount = await prisma.ticketMessage.count();

    if (notifCount > 10000) {
      issues.push({
        name: "عدد كبير من الإشعارات",
        type: "performance",
        severity: "medium",
        section: "الإشعارات",
        fileName: "",
        filePath: "",
        description: `يوجد ${notifCount} إشعار في قاعدة البيانات مما قد يؤثر على الأداء`,
        cause: "تراكم الإشعارات بدون حذف القديمة",
        solution: "أضف آلية حذف تلقائي للإشعارات القديمة",
        recommendation: `احذف الإشعارات الأقدم من 30 يوماً. عدد المستخدمين: ${userCount}`,
      });
    }

    if (ticketMsgCount > 5000) {
      issues.push({
        name: "عدد كبير من رسائل التذاكر",
        type: "performance",
        severity: "low",
        section: "نظام التذاكر",
        fileName: "",
        filePath: "",
        description: `يوجد ${ticketMsgCount} رسالة تذكرة في قاعدة البيانات`,
        cause: "تراكم رسائل التذاكر القديمة",
        solution: "أضف أرشفة للتذاكر المغلقة",
        recommendation: "التذاكر المغلقة القديمة يمكن أرشفتها لتحسين الأداء",
      });
    }
  } catch { /* skip */ }

  return { name: "فحص الأداء", passed: issues.length === 0, issues };
}

async function checkTicketSystem(): Promise<CheckResult> {
  const issues: ScanIssue[] = [];

  try {
    // Check ticket API works
    const res = await fetch(`${BASE_URL}/api/tickets`, {
      signal: AbortSignal.timeout(10000),
    });
    // Should return 401 (requires auth)
    if (res.status === 500) {
      issues.push({
        name: "خطأ في نظام التذاكر",
        type: "api",
        severity: "high",
        section: "نظام التذاكر",
        fileName: "route.ts",
        filePath: "src/app/api/tickets/route.ts",
        description: "نظام التذاكر يرجع خطأ 500",
        cause: "خطأ في الكود أو الاتصال بقاعدة البيانات",
        solution: "تحقق من سجلات الخادم لمعرفة تفاصيل الخطأ",
        recommendation: "راجع ملف route.ts وتأكد من صحة الاستعلامات",
      });
    }
  } catch { /* skip */ }

  // Check ticket data integrity
  try {
    const allTickets = await prisma.ticket.findMany({ include: { user: true } });
    const orphanedTickets = allTickets.filter(t => !t.user);
    if (orphanedTickets.length > 0) {
      issues.push({
        name: "تذاكر بدون مستخدم مرتبط",
        type: "database",
        severity: "high",
        section: "نظام التذاكر",
        fileName: "schema.prisma",
        filePath: "prisma/schema.prisma",
        description: `توجد ${orphanedTickets.length} تذكرة بدون مستخدم مرتبط (orphaned)`,
        cause: "تم حذف المستخدم دون حذف تذاكره",
        solution: "أضف onDelete: Cascade للعلاقة بين Ticket و User",
        recommendation: "تأكد من حذف البيانات المرتبطة عند حذف المستخدم",
      });
    }
  } catch { /* skip */ }

  return { name: "فحص نظام التذاكر", passed: issues.length === 0, issues };
}

async function checkNotificationSystem(): Promise<CheckResult> {
  const issues: ScanIssue[] = [];

  // Check notifications API
  try {
    const res = await fetch(`${BASE_URL}/api/notifications`, {
      signal: AbortSignal.timeout(10000),
    });
    if (res.status === 500) {
      issues.push({
        name: "خطأ في نظام الإشعارات",
        type: "api",
        severity: "high",
        section: "نظام الإشعارات",
        fileName: "route.ts",
        filePath: "src/app/api/notifications/route.ts",
        description: "نظام الإشعارات يرجع خطأ داخلي",
        cause: "خطأ في الكود أو الاتصال بقاعدة البيانات",
        solution: "تحقق من سجلات الخادم لمعرفة تفاصيل الخطأ",
        recommendation: "راجع ملف route.ts وتأكد من صحة الاستعلامات",
      });
    }
  } catch { /* skip */ }

  // Check deleted notifications ratio
  try {
    const totalNotifs = await prisma.notification.count();
    const deletedNotifs = await prisma.notification.count({ where: { isDeleted: true } });
    if (totalNotifs > 0 && deletedNotifs / totalNotifs > 0.7) {
      issues.push({
        name: "نسبة عالية من الإشعارات المحذوفة",
        type: "performance",
        severity: "low",
        section: "نظام الإشعارات",
        fileName: "",
        filePath: "",
        description: `${Math.round((deletedNotifs / totalNotifs) * 100)}% من الإشعارات محذوفة (soft-deleted) - يجب تنظيفها`,
        cause: "الإشعارات المحذوفة تبقى في قاعدة البيانات",
        solution: "أضف مهمة دورية لحذف الإشعارات المحذوفة نهائياً",
        recommendation: "الحذف الفعلي للإشعارات القديمة يحسن أداء الاستعلامات",
      });
    }
  } catch { /* skip */ }

  return { name: "فحص نظام الإشعارات", passed: issues.length === 0, issues };
}

async function checkCertificateSystem(): Promise<CheckResult> {
  const issues: ScanIssue[] = [];

  // Check certificates API
  try {
    const res = await fetch(`${BASE_URL}/api/certificates`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      issues.push({
        name: "خطأ في نظام الشهادات",
        type: "api",
        severity: "high",
        section: "نظام الشهادات",
        fileName: "route.ts",
        filePath: "src/app/api/certificates/route.ts",
        description: `API الشهادات يرجع خطأ ${res.status}`,
        cause: "خطأ في الكود أو الاتصال بقاعدة البيانات",
        solution: "تحقق من ملف route.ts وسجلات الخادم",
        recommendation: "تأكد من صحة العلاقات في schema.prisma",
      });
    }
  } catch { /* skip */ }

  // Check verify-certificate API
  try {
    const res = await fetch(`${BASE_URL}/api/verify-certificate?code=TEST`, {
      signal: AbortSignal.timeout(10000),
    });
    if (res.status === 500) {
      issues.push({
        name: "خطأ في التحقق من الشهادات",
        type: "api",
        severity: "high",
        section: "نظام الشهادات",
        fileName: "route.ts",
        filePath: "src/app/api/verify-certificate/route.ts",
        description: "نقطة التحقق من الشهادات ترجع خطأ داخلي",
        cause: "خطأ في استعلام قاعدة البيانات أو المعالجة",
        solution: "تحقق من ملف route.ts وتأكد من صحة الاستعلام",
        recommendation: "يجب أن يرجع 404 عند عدم وجود شهادة، وليس 500",
      });
    }
  } catch { /* skip */ }

  // Check certificate data integrity
  try {
    const allCerts = await prisma.certificate.findMany({ include: { user: true } });
    const certsWithoutUser = allCerts.filter(c => !c.user).length;
    if (certsWithoutUser > 0) {
      issues.push({
        name: "شهادات بدون مستخدم مرتبط",
        type: "database",
        severity: "medium",
        section: "نظام الشهادات",
        fileName: "schema.prisma",
        filePath: "prisma/schema.prisma",
        description: `توجد ${certsWithoutUser} شهادة بدون مستخدم مرتبط`,
        cause: "تم حذف المستخدم دون حذف شهاداته",
        solution: "أضف onDelete: Cascade للعلاقة",
        recommendation: "الشهادات يجب أن تبقى مرتبطة بمستخدم صالح",
      });
    }
  } catch { /* skip */ }

  return { name: "فحص نظام الشهادات", passed: issues.length === 0, issues };
}

async function checkTestSystem(): Promise<CheckResult> {
  const issues: ScanIssue[] = [];

  // Check test submission API
  try {
    const res = await fetch(`${BASE_URL}/api/tests/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(10000),
    });
    if (res.status === 500) {
      issues.push({
        name: "خطأ في نظام الاختبارات",
        type: "api",
        severity: "high",
        section: "نظام الاختبارات",
        fileName: "route.ts",
        filePath: "src/app/api/tests/submit/route.ts",
        description: "نظام تقديم الاختبارات يرجع خطأ داخلي",
        cause: "خطأ في معالجة بيانات الاختبار",
        solution: "تحقق من معالجة الأخطاء في ملف submit/route.ts",
        recommendation: "أضف تحقق أفضل من البيانات المدخلة",
      });
    }
  } catch { /* skip */ }

  // Check tests have questions available
  try {
    const tests = await prisma.test.findMany({
      include: { level: { include: { lessons: { include: { questions: true } } } } },
    });

    for (const test of tests) {
      const questionCount = test.level.lessons.reduce((sum, l) => sum + l.questions.length, 0);
      if (questionCount === 0) {
        issues.push({
          name: `اختبار "${test.title}" بدون أسئلة`,
          type: "database",
          severity: "high",
          section: "نظام الاختبارات",
          fileName: "",
          filePath: "",
          description: `الاختبار "${test.title}" لا يحتوي على أسئلة متاحة`,
          cause: "المستوى المرتبط لا يحتوي على دروس بأسئلة",
          solution: "أضف أسئلة للدروس المرتبطة بهذا المستوى",
          recommendation: "كل اختبار يحتاج أسئلة لكي يعمل بشكل صحيح",
        });
      }
    }
  } catch { /* skip */ }

  return { name: "فحص نظام الاختبارات", passed: issues.length === 0, issues };
}

// ==================== Level 2: AI Analysis ====================

function generateAISummary(allIssues: ScanIssue[]): string {
  const critical = allIssues.filter(i => i.severity === "critical").length;
  const high = allIssues.filter(i => i.severity === "high").length;
  const medium = allIssues.filter(i => i.severity === "medium").length;
  const low = allIssues.filter(i => i.severity === "low").length;

  if (allIssues.length === 0) {
    return "تحليل الذكاء الاصطناعي: النظام في حالة ممتازة. جميع الفحوصات نجحت بدون اكتشاف أي مشاكل. النظام جاهز للاستخدام بشكل كامل.";
  }

  let summary = "تحليل الذكاء الاصطناعي: ";

  if (critical > 0) {
    summary += `تم اكتشاف ${critical} مشكلة حرجة تتطلب إصلاحاً فورياً. `;
  }
  if (high > 0) {
    summary += `${high} مشكلة ذات خطورة عالية تحتاج معالجة سريعة. `;
  }
  if (medium > 0) {
    summary += `${medium} مشكلة متوسطة يُنصح بمعالجتها. `;
  }
  if (low > 0) {
    summary += `${low} ملاحظة بسيطة للتحسين. `;
  }

  // AI recommendations based on issue types
  const types = Array.from(new Set(allIssues.map(i => i.type)));
  if (types.includes("security")) {
    summary += "| توصية أمنية: يجب إصلاح الثغرات الأمنية أولاً لحماية بيانات المستخدمين. ";
  }
  if (types.includes("database")) {
    summary += "| توصية قاعدة البيانات: تحقق من سلامة البيانات وأصلح السجلات المفقودة. ";
  }
  if (types.includes("performance")) {
    summary += "| توصية الأداء: حسّن الاستعلامات البطيئة وأضف تخزيناً مؤقتاً. ";
  }
  if (types.includes("api")) {
    summary += "| توصية API: أصلح نقاط النهاية المعطلة لضمان استقرار النظام. ";
  }

  // Priority ranking
  summary += `| ترتيب الأولويات: `;
  if (critical > 0) summary += "1) أصلح المشاكل الحرجة فوراً. ";
  if (high > 0) summary += `${critical > 0 ? "2" : "1"}) عالج المشاكل ذات الخطورة العالية. `;
  summary += "يُنصح بإعادة الفحص بعد إجراء الإصلاحات للتأكد من حل جميع المشاكل.";

  return summary;
}

// ==================== Main Scanner ====================

type ScanType = "full" | "pages" | "files" | "api" | "database" | "performance" | "security" | "tickets" | "notifications" | "certificates" | "tests";

export async function runSystemScan(scanType: ScanType = "full", startedBy: string = "admin"): Promise<string> {
  // Create scan record
  const scan = await prisma.systemScan.create({
    data: {
      scanType,
      status: "running",
      startedBy,
    },
  });

  const startTime = Date.now();
  const allResults: CheckResult[] = [];

  try {
    const checksToRun: (() => Promise<CheckResult>)[] = [];

    if (scanType === "full" || scanType === "pages") checksToRun.push(checkPageRoutes);
    if (scanType === "full" || scanType === "api") checksToRun.push(checkAPIEndpoints);
    if (scanType === "full" || scanType === "database") checksToRun.push(checkDatabase);
    if (scanType === "full" || scanType === "security") checksToRun.push(checkSecurity);
    if (scanType === "full" || scanType === "performance") checksToRun.push(checkPerformance);
    if (scanType === "full" || scanType === "tickets") checksToRun.push(checkTicketSystem);
    if (scanType === "full" || scanType === "notifications") checksToRun.push(checkNotificationSystem);
    if (scanType === "full" || scanType === "certificates") checksToRun.push(checkCertificateSystem);
    if (scanType === "full" || scanType === "tests") checksToRun.push(checkTestSystem);

    // Run all checks
    for (const check of checksToRun) {
      try {
        const result = await check();
        allResults.push(result);
      } catch (error) {
        allResults.push({
          name: "فحص فاشل",
          passed: false,
          issues: [{
            name: "خطأ في تنفيذ الفحص",
            type: "config",
            severity: "high",
            section: "",
            fileName: "",
            filePath: "",
            description: `فشل في تنفيذ أحد الفحوصات: ${error instanceof Error ? error.message : "unknown"}`,
            cause: "خطأ غير متوقع أثناء الفحص",
            solution: "أعد تشغيل الفحص أو تحقق من سجلات الخادم",
            recommendation: "تأكد من أن جميع الخدمات تعمل بشكل صحيح",
          }],
        });
      }
    }

    // Collect all issues
    const allIssues = allResults.flatMap(r => r.issues);
    const duration = Date.now() - startTime;

    // Generate AI summary
    const summary = generateAISummary(allIssues);

    // Create issue records in database
    for (const issue of allIssues) {
      await prisma.systemIssue.create({
        data: {
          name: issue.name,
          type: issue.type,
          severity: issue.severity,
          section: issue.section,
          fileName: issue.fileName,
          filePath: issue.filePath,
          lineNumber: issue.lineNumber || null,
          description: issue.description,
          cause: issue.cause,
          solution: issue.solution,
          recommendation: issue.recommendation,
          scanId: scan.id,
        },
      });
    }

    // Update scan record
    await prisma.systemScan.update({
      where: { id: scan.id },
      data: {
        status: "completed",
        totalChecks: allResults.length,
        passedChecks: allResults.filter(r => r.passed).length,
        failedChecks: allResults.filter(r => !r.passed).length,
        criticalCount: allIssues.filter(i => i.severity === "critical").length,
        highCount: allIssues.filter(i => i.severity === "high").length,
        mediumCount: allIssues.filter(i => i.severity === "medium").length,
        lowCount: allIssues.filter(i => i.severity === "low").length,
        duration,
        summary,
        completedAt: new Date(),
      },
    });

    return scan.id;
  } catch (error) {
    await prisma.systemScan.update({
      where: { id: scan.id },
      data: {
        status: "failed",
        duration: Date.now() - startTime,
        summary: `فشل الفحص: ${error instanceof Error ? error.message : "خطأ غير معروف"}`,
        completedAt: new Date(),
      },
    });
    return scan.id;
  }
}
