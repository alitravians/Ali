import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ChaptersPage() {
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
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-black text-violet-900 dark:text-violet-100">فصول الرياضيات — الصف العاشر</h1>
        <p className="text-violet-600/80 dark:text-violet-300/70 mt-2">منهاج الجمهورية العربية السورية — اختاري فصلاً للبدء</p>
      </div>
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
    </div>
  );
}
