import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { questionBank } from "@/prisma/questionBank";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Idempotent seeding endpoint. Protected by SEED_TOKEN env var.
// Usage: POST /api/admin/seed?token=YOUR_TOKEN
export async function POST(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const expected = process.env.SEED_TOKEN || "tafawqi-seed-token";
  if (token !== expected) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Site settings
    const settings: { key: string; value: string }[] = [
      { key: "site_name", value: "تفوّقي" },
      { key: "site_tagline", value: "اختبارات الرياضيات الذكية للصف العاشر" },
      { key: "daily_quiz_enabled", value: "true" },
      { key: "registration_open", value: "true" },
      { key: "support_email", value: "hello@tafawqi.app" },
    ];
    for (const s of settings) {
      await prisma.siteSetting.upsert({
        where: { key: s.key },
        update: { value: s.value },
        create: s,
      });
    }

    // Admin
    const adminPw = await bcrypt.hash("admin123", 10);
    await prisma.user.upsert({
      where: { email: "admin@tafawqi.app" },
      update: { role: "admin", passwordHash: adminPw, name: "المشرفة" },
      create: { email: "admin@tafawqi.app", name: "المشرفة", role: "admin", passwordHash: adminPw },
    });

    // Demo student
    const demoPw = await bcrypt.hash("demo1234", 10);
    await prisma.user.upsert({
      where: { email: "demo@tafawqi.app" },
      update: { passwordHash: demoPw, name: "ليلى الطالبة" },
      create: { email: "demo@tafawqi.app", name: "ليلى الطالبة", role: "student", passwordHash: demoPw },
    });

    // Badges
    const badges = [
      { slug: "first-quiz", title: "أول اختبار", description: "أتممتِ أول اختبار لكِ!", icon: "🎯", color: "#22c55e", threshold: 1, kind: "count" },
      { slug: "ten-quizzes", title: "عشرة اختبارات", description: "أتممتِ ١٠ اختبارات", icon: "🔥", color: "#f97316", threshold: 10, kind: "count" },
      { slug: "fifty-quizzes", title: "خمسون اختباراً", description: "أتممتِ ٥٠ اختباراً!", icon: "💪", color: "#ef4444", threshold: 50, kind: "count" },
      { slug: "perfect-score", title: "علامة كاملة", description: "حصلتِ على ١٠٠٪ في اختبار", icon: "💯", color: "#eab308", threshold: 0, kind: "perfect" },
      { slug: "100-points", title: "١٠٠ نقطة", description: "وصلتِ إلى ١٠٠ نقطة", icon: "⭐", color: "#8b5cf6", threshold: 100, kind: "points" },
      { slug: "500-points", title: "٥٠٠ نقطة", description: "وصلتِ إلى ٥٠٠ نقطة", icon: "🌟", color: "#ec4899", threshold: 500, kind: "points" },
      { slug: "1000-points", title: "١٠٠٠ نقطة", description: "وصلتِ إلى ١٠٠٠ نقطة", icon: "👑", color: "#f59e0b", threshold: 1000, kind: "points" },
      { slug: "2000-points", title: "أسطورة الرياضيات", description: "وصلتِ إلى ٢٠٠٠ نقطة", icon: "🏆", color: "#d97706", threshold: 2000, kind: "points" },
      { slug: "streak-3", title: "ثلاثية متتالية", description: "ثلاث اختبارات بنجاح ٨٠٪ فأكثر", icon: "⚡", color: "#06b6d4", threshold: 3, kind: "streak" },
    ];
    for (const b of badges) {
      await prisma.badge.upsert({ where: { slug: b.slug }, update: b, create: b });
    }

    // Chapters/sections/questions/quizzes
    let chapterOrder = 0;
    for (const ch of questionBank) {
      chapterOrder++;
      const chapter = await prisma.chapter.upsert({
        where: { slug: ch.slug },
        update: { title: ch.title, description: ch.description, icon: ch.icon, color: ch.color, order: chapterOrder },
        create: { slug: ch.slug, title: ch.title, description: ch.description, icon: ch.icon, color: ch.color, order: chapterOrder },
      });

      let sectionOrder = 0;
      for (const sec of ch.sections) {
        sectionOrder++;
        const section = await prisma.section.upsert({
          where: { slug: sec.slug },
          update: { title: sec.title, description: sec.description, order: sectionOrder, chapterId: chapter.id },
          create: { slug: sec.slug, title: sec.title, description: sec.description, order: sectionOrder, chapterId: chapter.id },
        });

        const existing = await prisma.question.count({ where: { sectionId: section.id } });
        if (existing === 0) {
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

        // Short 5-question quiz per section
        const slug = `quiz-${sec.slug}-5`;
        const questions = await prisma.question.findMany({ where: { sectionId: section.id }, take: 10 });
        const quiz = await prisma.quiz.upsert({
          where: { slug },
          update: {
            title: `اختبار سريع — ${sec.title}`,
            description: `٥ أسئلة سريعة في ${sec.title}`,
            chapterId: chapter.id,
            sectionId: section.id,
            kind: "short",
            durationSec: 180,
            questionCount: 5,
            isActive: true,
          },
          create: {
            slug,
            title: `اختبار سريع — ${sec.title}`,
            description: `٥ أسئلة سريعة في ${sec.title}`,
            chapterId: chapter.id,
            sectionId: section.id,
            kind: "short",
            durationSec: 180,
            questionCount: 5,
            isActive: true,
          },
        });
        // Link questions
        await prisma.quizQuestion.deleteMany({ where: { quizId: quiz.id } });
        for (let i = 0; i < questions.length; i++) {
          await prisma.quizQuestion.create({ data: { quizId: quiz.id, questionId: questions[i].id, order: i } });
        }
      }
    }

    return NextResponse.json({
      ok: true,
      counts: {
        users: await prisma.user.count(),
        chapters: await prisma.chapter.count(),
        sections: await prisma.section.count(),
        questions: await prisma.question.count(),
        quizzes: await prisma.quiz.count(),
        badges: await prisma.badge.count(),
      },
    });
  } catch (e: any) {
    console.error("Seed error", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return POST(req);
}
