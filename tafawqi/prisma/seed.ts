import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { questionBank } from "./questionBank";

const prisma = new PrismaClient();

type SeedSection = {
  slug: string;
  title: string;
  description: string;
  questions: SeedQuestion[];
};

type SeedQuestion = {
  type: "mcq" | "tf" | "fill" | "match" | "order";
  prompt: string;
  payload: any;
  explanation: string;
  difficulty?: number;
};

type SeedChapter = {
  slug: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  sections: SeedSection[];
};

async function main() {
  console.log("🌱 بدء عملية البذر...");

  // ── إعدادات الموقع ──
  await prisma.siteSetting.upsert({
    where: { key: "site_name" },
    update: { value: "تفوّقي" },
    create: { key: "site_name", value: "تفوّقي" },
  });
  await prisma.siteSetting.upsert({
    where: { key: "site_tagline" },
    update: { value: "اختبارات الرياضيات الذكية للصف العاشر" },
    create: { key: "site_tagline", value: "اختبارات الرياضيات الذكية للصف العاشر" },
  });
  await prisma.siteSetting.upsert({
    where: { key: "daily_quiz_enabled" },
    update: { value: "true" },
    create: { key: "daily_quiz_enabled", value: "true" },
  });
  await prisma.siteSetting.upsert({
    where: { key: "registration_open" },
    update: { value: "true" },
    create: { key: "registration_open", value: "true" },
  });

  // ── حساب المشرفة الافتراضي ──
  const adminEmail = "admin@tafawqi.app";
  const adminPassword = "admin123";
  const adminHash = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: adminHash, role: "admin", name: "المشرفة" },
    create: {
      email: adminEmail,
      name: "المشرفة",
      passwordHash: adminHash,
      role: "admin",
    },
  });
  console.log(`👩‍💼 المشرفة: ${adminEmail} / ${adminPassword}`);

  // ── حساب طالبة تجريبي ──
  const demoEmail = "demo@tafawqi.app";
  const demoHash = await bcrypt.hash("demo1234", 10);
  await prisma.user.upsert({
    where: { email: demoEmail },
    update: { passwordHash: demoHash, role: "student", name: "ليلى — حساب تجريبي" },
    create: {
      email: demoEmail,
      name: "ليلى — حساب تجريبي",
      passwordHash: demoHash,
      role: "student",
    },
  });
  console.log(`👧 حساب تجريبي: ${demoEmail} / demo1234`);

  // ── الشارات ──
  const badges = [
    { slug: "first-quiz", title: "اختبار أول", description: "أنهيت أول اختبار لك!", icon: "🎉", color: "#10b981", threshold: 1, kind: "count" },
    { slug: "ten-quizzes", title: "مجتهدة", description: "أنهيت ١٠ اختبارات", icon: "📚", color: "#3b82f6", threshold: 10, kind: "count" },
    { slug: "perfect-score", title: "علامة كاملة", description: "علامة ١٠٠٪ في اختبار", icon: "💯", color: "#f59e0b", threshold: 1, kind: "perfect" },
    { slug: "streak-3", title: "تدريب متواصل", description: "٣ أيام متتالية", icon: "🔥", color: "#ef4444", threshold: 3, kind: "streak" },
    { slug: "100-points", title: "نقطة الانطلاق", description: "وصلتِ إلى ١٠٠ نقطة", icon: "⭐", color: "#8b5cf6", threshold: 100, kind: "points" },
    { slug: "500-points", title: "نجمة لامعة", description: "وصلتِ إلى ٥٠٠ نقطة", icon: "🌟", color: "#ec4899", threshold: 500, kind: "points" },
    { slug: "1000-points", title: "بطلة الرياضيات", description: "وصلتِ إلى ١٠٠٠ نقطة", icon: "👑", color: "#f43f5e", threshold: 1000, kind: "points" },
    { slug: "algebra-master", title: "ملكة الجبر", description: "أتقنتِ قسم الجبر", icon: "🧮", color: "#6366f1", threshold: 0, kind: "section" },
    { slug: "geometry-master", title: "ملكة الهندسة", description: "أتقنتِ قسم الهندسة", icon: "📐", color: "#0ea5e9", threshold: 0, kind: "section" },
  ];
  for (const b of badges) {
    await prisma.badge.upsert({ where: { slug: b.slug }, update: b, create: b });
  }
  console.log(`🏅 شارات: ${badges.length}`);

  // ── الفصول والأقسام والأسئلة ──
  for (const ch of questionBank) {
    const chapter = await prisma.chapter.upsert({
      where: { slug: ch.slug },
      update: { title: ch.title, description: ch.description, icon: ch.icon, color: ch.color },
      create: { slug: ch.slug, title: ch.title, description: ch.description, icon: ch.icon, color: ch.color },
    });
    let secOrder = 0;
    for (const sec of ch.sections) {
      const section = await prisma.section.upsert({
        where: { slug: sec.slug },
        update: { title: sec.title, description: sec.description, chapterId: chapter.id, order: secOrder },
        create: { slug: sec.slug, title: sec.title, description: sec.description, chapterId: chapter.id, order: secOrder },
      });
      secOrder++;

      // لا نحذف الأسئلة الموجودة للحفاظ على البيانات، نضيف فقط الجديدة
      const existingCount = await prisma.question.count({ where: { sectionId: section.id } });
      if (existingCount === 0) {
        for (const q of sec.questions) {
          await prisma.question.create({
            data: {
              sectionId: section.id,
              type: q.type,
              prompt: q.prompt,
              payload: JSON.stringify(q.payload),
              explanation: q.explanation,
              difficulty: q.difficulty ?? 1,
            },
          });
        }
      }

      // أنشئ اختباراً قصيراً افتراضياً لكل قسم
      const quizSlug = `quiz-${sec.slug}-5`;
      const questions = await prisma.question.findMany({
        where: { sectionId: section.id },
        take: 5,
        orderBy: { difficulty: "asc" },
      });
      if (questions.length > 0) {
        const quiz = await prisma.quiz.upsert({
          where: { slug: quizSlug },
          update: {
            title: `اختبار سريع — ${sec.title}`,
            sectionId: section.id,
            chapterId: chapter.id,
            kind: "short",
            durationSec: 180,
            questionCount: questions.length,
          },
          create: {
            slug: quizSlug,
            title: `اختبار سريع — ${sec.title}`,
            description: `٥ أسئلة في ٣ دقائق على ${sec.title}`,
            sectionId: section.id,
            chapterId: chapter.id,
            kind: "short",
            durationSec: 180,
            questionCount: questions.length,
          },
        });
        // أعد ربط الأسئلة
        await prisma.quizQuestion.deleteMany({ where: { quizId: quiz.id } });
        for (let i = 0; i < questions.length; i++) {
          await prisma.quizQuestion.create({
            data: { quizId: quiz.id, questionId: questions[i].id, order: i },
          });
        }
      }
    }
  }
  console.log(`📘 فصول: ${questionBank.length}`);

  // ── الاختبار اليومي ──
  const dailySlug = "daily-quiz";
  const allQs = await prisma.question.findMany({ take: 10 });
  if (allQs.length >= 5) {
    const daily = await prisma.quiz.upsert({
      where: { slug: dailySlug },
      update: { title: "اختبار اليوم", kind: "daily", durationSec: 240, questionCount: Math.min(10, allQs.length) },
      create: {
        slug: dailySlug,
        title: "اختبار اليوم",
        description: "اختبار يومي متجدد من بنك الأسئلة",
        kind: "daily",
        durationSec: 240,
        questionCount: Math.min(10, allQs.length),
      },
    });
    await prisma.quizQuestion.deleteMany({ where: { quizId: daily.id } });
    for (let i = 0; i < Math.min(10, allQs.length); i++) {
      await prisma.quizQuestion.create({ data: { quizId: daily.id, questionId: allQs[i].id, order: i } });
    }
  }

  console.log("✅ تم إنشاء البيانات بنجاح");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
