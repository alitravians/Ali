import Link from "next/link";

type Props = {
  slug: string;
  title: string;
  description: string;
  durationSec: number;
  questionCount: number;
};

// F10 — Dashboard banner advertising the comprehensive mock exam. Server
// component (no client state). The student clicks ابدئي → standard quiz
// flow, scored exactly like a regular quiz.
export default function MockExamBanner({
  slug,
  title,
  description,
  durationSec,
  questionCount,
}: Props) {
  const minutes = Math.round(durationSec / 60);
  return (
    <div className="card p-5 mb-6 bg-gradient-to-l from-indigo-50 via-violet-50 to-pink-50 dark:from-indigo-900/30 dark:via-violet-900/30 dark:to-pink-900/20 border-indigo-200 dark:border-indigo-800">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-2xl" aria-hidden>📚</span>
            <span className="chip bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">
              امتحان محاكاة
            </span>
          </div>
          <h2 className="text-xl font-black text-violet-900 dark:text-violet-100 mb-1 truncate">
            {title}
          </h2>
          {description && (
            <p className="text-violet-700/85 dark:text-violet-200/80 leading-relaxed mb-2">
              {description}
            </p>
          )}
          <div className="flex flex-wrap gap-2 text-sm text-violet-600 dark:text-violet-300">
            <span className="chip bg-white/70 dark:bg-violet-950/30">⏱ {minutes} دقيقة</span>
            <span className="chip bg-white/70 dark:bg-violet-950/30">📝 {questionCount} سؤال</span>
          </div>
        </div>
        <Link href={`/quiz/${slug}`} className="btn-primary px-5 py-2.5 shrink-0">
          ابدئي الامتحان
        </Link>
      </div>
    </div>
  );
}
