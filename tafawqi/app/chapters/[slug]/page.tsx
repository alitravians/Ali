import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ChapterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const chapter = await prisma.chapter.findUnique({
    where: { slug },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: {
          _count: { select: { questions: true, quizzes: true } },
          quizzes: { where: { isActive: true } },
        },
      },
    },
  });
  if (!chapter) notFound();

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-6">
        <Link href="/chapters" className="text-sm text-violet-600 dark:text-violet-300 hover:underline">← كل الفصول</Link>
      </div>
      <div className="card p-6 sm:p-8 mb-8 flex items-start gap-4" style={{ background: `linear-gradient(135deg, ${chapter.color}10, transparent)` }}>
        <div className="w-16 h-16 rounded-2xl grid place-items-center text-4xl shrink-0" style={{ background: `${chapter.color}22`, color: chapter.color }}>
          {chapter.icon}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl sm:text-4xl font-black text-violet-900 dark:text-violet-100">{chapter.title}</h1>
          <p className="text-violet-600/85 dark:text-violet-300/80 mt-1">{chapter.description}</p>
        </div>
      </div>

      <h2 className="text-xl font-extrabold text-violet-900 dark:text-violet-100 mb-3">أقسام الفصل</h2>
      <div className="space-y-3">
        {chapter.sections.map((s) => (
          <div key={s.id} className="card p-5">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <div className="text-lg font-bold text-violet-900 dark:text-violet-100">{s.title}</div>
                <div className="text-sm text-violet-600/80 dark:text-violet-300/70">{s.description}</div>
                <div className="mt-2 flex gap-2 flex-wrap">
                  <span className="chip">{s._count.questions} أسئلة</span>
                  <span className="chip">{s._count.quizzes} اختبارات</span>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {s.quizzes.map((q) => (
                  <Link key={q.id} href={`/quiz/${q.slug}`} className="btn-primary text-sm">
                    ▶ {q.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
