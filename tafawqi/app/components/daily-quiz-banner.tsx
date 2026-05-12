"use client";
// F2 — banner on /dashboard prompting the user to take today's daily quiz.
// Hides itself when there's no daily quiz set, or the bonus has already
// been claimed today.

import Link from "next/link";

export default function DailyQuizBanner({
  slug,
  title,
  description,
  bonus,
  canClaim,
}: {
  slug: string;
  title: string;
  description: string;
  bonus: number;
  canClaim: boolean;
}) {
  return (
    <div className="card p-4 sm:p-5 mb-4 bg-gradient-to-l from-fuchsia-50 to-amber-50 dark:from-fuchsia-900/20 dark:to-amber-900/20 border-2 border-amber-200/70 dark:border-amber-800/40">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-amber-700 dark:text-amber-300 mb-1">
            ⚡ تحدّي اليوم
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-violet-900 dark:text-violet-100">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-violet-600/90 dark:text-violet-300/80 mt-1 leading-relaxed">
              {description}
            </p>
          )}
          {canClaim ? (
            <div className="text-xs text-amber-700 dark:text-amber-300 mt-2 font-semibold">
              مكافأة الإتمام اليوم: <span className="num">+{bonus}</span> نقطة
            </div>
          ) : (
            <div className="text-xs text-violet-500 dark:text-violet-300/70 mt-2">
              أتممتِ تحدّي اليوم — أحسنتِ! عودي غداً لتحدٍّ جديد.
            </div>
          )}
        </div>
        <Link
          href={`/quiz/${slug}`}
          className="btn-primary text-sm px-4 py-2 shrink-0"
        >
          {canClaim ? "ابدئي الآن" : "إعادة الحلّ"}
        </Link>
      </div>
    </div>
  );
}
