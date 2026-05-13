import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default function ChaptersPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-black text-violet-900 dark:text-violet-100">فصول الرياضيات — الصف العاشر</h1>
        <p className="text-violet-600/80 dark:text-violet-300/70 mt-2">منهاج الجمهورية العربية السورية — اختاري فصلاً للبدء</p>
      </div>
      <Suspense fallback={<ChaptersSkeleton />}>
        <ChaptersList />
      </Suspense>
    </div>
  );
}

async function ChaptersList() {
  const chapters = await prisma.chapter.findMany({
    orderBy: { order: "asc" },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: { _count: { select: { questions: true, quizzes: true } } },
      },
      _count: { select: { quizzes: true } },
    },
  });
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {chapters.map((c) => (
        <Link key={c.id} href={`/chapters/${c.slug}`} className="card p-5 hover:shadow-lg transition group">
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-2xl grid place-items-center text-3xl" style={{ background: `${c.color}22`, color: c.color }}>
              {c.icon}
            </div>
            <div className="flex-1">
              <div className="text-lg font-extrabold text-violet-900 dark:text-violet-100 group-hover:text-violet-700 dark:group-hover:text-violet-300 transition">
                {c.title}
              </div>
              <div className="text-sm text-violet-600/80 dark:text-violet-300/70">{c.description}</div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {c.sections.map((s) => (
                  <span key={s.id} className="chip">{s.title}</span>
                ))}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function ChaptersSkeleton() {
  return (
    <div
      className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse"
      role="status"
      aria-live="polite"
      aria-label="جاري تحميل الفصول"
    >
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="card p-5">
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-2xl bg-violet-200/60 dark:bg-violet-900/40" />
            <div className="flex-1 space-y-3">
              <div className="h-5 w-3/4 bg-violet-200/60 dark:bg-violet-900/40 rounded" />
              <div className="h-4 w-1/2 bg-violet-200/40 dark:bg-violet-900/30 rounded" />
              <div className="flex gap-1.5 mt-2">
                <div className="h-5 w-14 bg-violet-200/40 dark:bg-violet-900/30 rounded-full" />
                <div className="h-5 w-16 bg-violet-200/40 dark:bg-violet-900/30 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      ))}
      <span className="sr-only">جاري تحميل الفصول</span>
    </div>
  );
}
