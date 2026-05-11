import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// نُرجع الاختبار وأسئلته بدون الكشف عن الإجابات الصحيحة في الـ payload
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const user = await getCurrentUser();
  const quiz = await prisma.quiz.findUnique({
    where: { slug },
    include: {
      chapter: true,
      section: true,
      items: {
        orderBy: { order: "asc" },
        include: { question: true },
      },
    },
  });
  if (!quiz) return NextResponse.json({ error: "الاختبار غير موجود" }, { status: 404 });

  // اختر مجموعة عشوائية من الأسئلة بحسب questionCount
  let items = quiz.items;
  if (items.length > quiz.questionCount) {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    items = shuffled.slice(0, quiz.questionCount);
  } else {
    items = [...items].sort(() => Math.random() - 0.5);
  }

  const sanitized = items.map((it, idx) => {
    const payload = JSON.parse(it.question.payload || "{}");
    const out: any = { type: it.question.type, prompt: it.question.prompt };
    if (it.question.type === "mcq") {
      out.options = payload.options;
    } else if (it.question.type === "tf") {
      // لا شيء إضافي
    } else if (it.question.type === "fill") {
      // لا شيء — الطالبة تكتب
    } else if (it.question.type === "match") {
      out.left = payload.left;
      out.right = payload.right ? [...payload.right].sort(() => Math.random() - 0.5) : payload.right;
    } else if (it.question.type === "order") {
      out.items = payload.items ? [...payload.items].sort(() => Math.random() - 0.5) : payload.items;
    }
    return {
      id: it.question.id,
      order: idx,
      ...out,
    };
  });

  return NextResponse.json({
    quiz: {
      id: quiz.id,
      slug: quiz.slug,
      title: quiz.title,
      description: quiz.description,
      durationSec: quiz.durationSec,
      kind: quiz.kind,
      chapter: quiz.chapter ? { slug: quiz.chapter.slug, title: quiz.chapter.title, icon: quiz.chapter.icon, color: quiz.chapter.color } : null,
      section: quiz.section ? { slug: quiz.section.slug, title: quiz.section.title } : null,
    },
    questions: sanitized,
    auth: user ? { id: user.id, name: user.name } : null,
  });
}
