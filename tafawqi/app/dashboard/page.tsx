import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { levelForPoints } from "@/lib/levels";
import { readStreak } from "@/lib/streak";
import { getDailyQuiz, getDailyQuizBonus, canClaimDailyBonus } from "@/lib/daily-quiz";
import StreakBadge from "@/app/components/streak-badge";
import DailyQuizBanner from "@/app/components/daily-quiz-banner";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/dashboard");

  // Pull lightweight per-question answer rows once, then aggregate per
  // section in memory. Previously we ran N+1 queries (one findMany per
  // section, 14+ round-trips); now it's one.
  const [attempts, badges, certificates, notifications, sections, allAnswers, streak, dailyQuiz, dailyBonus, canClaim, leaderboardAbove] =
    await Promise.all([
      prisma.attempt.findMany({
        where: { userId: user.id, finishedAt: { not: null } },
        orderBy: { startedAt: "desc" },
        take: 10,
        include: { quiz: { include: { chapter: true, section: true } } },
      }),
      prisma.userBadge.findMany({ where: { userId: user.id }, include: { badge: true } }),
      prisma.certificate.findMany({ where: { userId: user.id }, orderBy: { issuedAt: "desc" } }),
      prisma.notification.findMany({
        where: { userId: user.id, isRead: false },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
      prisma.section.findMany({
        orderBy: [{ chapterId: "asc" }, { order: "asc" }],
        include: { chapter: true, _count: { select: { questions: true } } },
      }),
      prisma.attemptAnswer.findMany({
        where: { attempt: { userId: user.id } },
        select: { isCorrect: true, question: { select: { sectionId: true } } },
      }),
      readStreak(user.id),
      getDailyQuiz(),
      getDailyQuizBonus(),
      canClaimDailyBonus(user.id),
      user.role === "student"
        ? prisma.user.count({ where: { role: "student", isBlocked: false, points: { gt: user.points } } })
        : Promise.resolve(0),
    ]);
  const leaderboardRank = user.role === "student" ? leaderboardAbove + 1 : null;

  // Aggregate counts per section in a single pass.
  const perSectionCounts = new Map<string, { total: number; correct: number }>();
  for (const a of allAnswers) {
    const sid = a.question.sectionId;
    const cur = perSectionCounts.get(sid) ?? { total: 0, correct: 0 };
    cur.total++;
    if (a.isCorrect) cur.correct++;
    perSectionCounts.set(sid, cur);
  }
  const sectionPerf = sections.map((s) => {
    const c = perSectionCounts.get(s.id) ?? { total: 0, correct: 0 };
    return {
      slug: s.slug,
      title: s.title,
      chapterTitle: s.chapter.title,
      total: c.total,
      correct: c.correct,
      pct: c.total > 0 ? Math.round((c.correct / c.total) * 100) : null,
    };
  });
  const lv = levelForPoints(user.points);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <h1 className="text-3xl font-black text-violet-900 dark:text-violet-100">مرحباً بكِ، {user.name.split(" ")[0]} 👋</h1>
        {streak.current > 0 && <StreakBadge current={streak.current} best={streak.best} size="lg" />}
      </div>
      <p className="text-violet-600/85 dark:text-violet-300/80 mb-6">هذه لوحتكِ الشخصية. تابعي تقدّمكِ وإنجازاتكِ.</p>

      {/* F2 — today's daily-quiz banner */}
      {dailyQuiz && (
        <DailyQuizBanner
          slug={dailyQuiz.slug}
          title={dailyQuiz.title}
          description={dailyQuiz.description}
          bonus={dailyBonus}
          canClaim={canClaim}
        />
      )}

      {/* Top stats */}
      <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <StatCard label="نقاطكِ" value={user.points} icon="⭐" color="from-violet-500 to-fuchsia-500" />
        <StatCard label="مستواكِ" value={`${lv.current.icon} ${lv.current.name}`} icon="" color="from-amber-500 to-orange-500" />
        {leaderboardRank !== null && (
          <Link href="/leaderboard" className="contents">
            <StatCard label="ترتيبكِ" value={`#${leaderboardRank}`} icon="🏆" color="from-pink-500 to-rose-500" />
          </Link>
        )}
        <StatCard label="اختبارات" value={attempts.length} icon="📝" color="from-blue-500 to-cyan-500" />
        <StatCard label="شارات" value={badges.length} icon="🏅" color="from-emerald-500 to-teal-500" />
      </div>

      {/* Level progress */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="font-bold text-violet-900 dark:text-violet-100">
            {lv.current.icon} {lv.current.name}
            {lv.next && <span className="text-sm font-normal text-violet-500 dark:text-violet-300/70 mx-2">→ {lv.next.icon} {lv.next.name}</span>}
          </div>
          {lv.next && (
            <div className="text-sm text-violet-600 dark:text-violet-300 num">
              {user.points} / {lv.next.min} نقطة
            </div>
          )}
        </div>
        <div className="h-3 rounded-full bg-violet-100 dark:bg-violet-900/40 overflow-hidden">
          <div className="h-full bg-gradient-to-l from-fuchsia-500 to-violet-600 transition-all" style={{ width: `${Math.round(lv.progress * 100)}%` }} />
        </div>
      </div>

      {notifications.length > 0 && (
        <div className="card p-5 mb-6 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700/40">
          <div className="font-bold text-amber-900 dark:text-amber-100 mb-2">🔔 إشعارات جديدة</div>
          <ul className="space-y-1.5">
            {notifications.map((n) => (
              <li key={n.id} className="text-sm">
                <div className="font-semibold text-amber-900 dark:text-amber-100">{n.title}</div>
                <div className="text-amber-800 dark:text-amber-200">{n.body}</div>
                {n.link && <Link href={n.link} className="text-amber-700 dark:text-amber-300 font-bold hover:underline">عرض ←</Link>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent attempts */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-extrabold text-violet-900 dark:text-violet-100 mb-3">آخر الاختبارات</h2>
          {attempts.length === 0 ? (
            <div className="text-violet-600/80 dark:text-violet-300/70 text-sm">
              لم تخوضي أي اختبار بعد. <Link href="/chapters" className="font-bold text-violet-700 dark:text-violet-300 hover:underline">ابدئي الآن!</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {attempts.map((a) => {
                const pct = Math.round((a.score / Math.max(1, a.total)) * 100);
                return (
                  <Link key={a.id} href={`/results/${a.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-900/30 transition">
                    <div className="text-2xl">{a.quiz.chapter?.icon ?? "📝"}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-violet-900 dark:text-violet-100">{a.quiz.title}</div>
                      <div className="text-xs text-violet-500 dark:text-violet-300/70">{a.quiz.section?.title}</div>
                    </div>
                    <div className={`text-lg font-extrabold num ${pct >= 80 ? "text-emerald-600" : pct >= 60 ? "text-amber-600" : "text-rose-600"}`}>
                      {pct}%
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="card p-5">
          <h2 className="font-extrabold text-violet-900 dark:text-violet-100 mb-3">شاراتكِ</h2>
          {badges.length === 0 ? (
            <div className="text-violet-600/80 dark:text-violet-300/70 text-sm">لا توجد شارات بعد — حلّي المزيد!</div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {badges.map((b) => (
                <div key={b.id} className="text-center" title={b.badge.description}>
                  <div className="text-3xl">{b.badge.icon}</div>
                  <div className="text-xs font-semibold text-violet-700 dark:text-violet-300 mt-1">{b.badge.title}</div>
                </div>
              ))}
            </div>
          )}

          {certificates.length > 0 && (
            <>
              <h2 className="font-extrabold text-violet-900 dark:text-violet-100 mt-5 mb-3">شهاداتكِ</h2>
              <ul className="space-y-1.5">
                {certificates.map((c) => (
                  <li key={c.id}>
                    <Link href={`/certificate/${c.code}`} className="text-sm text-violet-700 dark:text-violet-300 hover:underline">
                      🎓 {c.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* Section performance */}
      <div className="card p-5 mt-6">
        <h2 className="font-extrabold text-violet-900 dark:text-violet-100 mb-3">تقدّمكِ في الأقسام</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {sectionPerf.map((s) => (
            <div key={s.slug} className="rounded-xl border border-violet-100 dark:border-violet-900/40 p-3">
              <div className="flex justify-between items-baseline mb-1.5">
                <div>
                  <div className="font-semibold text-violet-900 dark:text-violet-100 text-sm">{s.title}</div>
                  <div className="text-xs text-violet-500">{s.chapterTitle}</div>
                </div>
                <div className="text-sm font-bold text-violet-700 dark:text-violet-300 num">
                  {s.pct === null ? "لم تبدئي" : `${s.pct}%`}
                </div>
              </div>
              <div className="h-2 rounded-full bg-violet-100 dark:bg-violet-900/40 overflow-hidden">
                <div className={`h-full ${(s.pct ?? 0) >= 70 ? "bg-emerald-500" : (s.pct ?? 0) >= 40 ? "bg-amber-500" : "bg-rose-500"}`}
                  style={{ width: `${s.pct ?? 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: any; icon: string; color: string }) {
  return (
    <div className="card p-4 relative overflow-hidden">
      <div className={`absolute -top-6 -end-6 w-24 h-24 rounded-full bg-gradient-to-br ${color} opacity-20`} />
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-black text-violet-900 dark:text-violet-100 num">{value}</div>
      <div className="text-sm text-violet-600 dark:text-violet-300/80">{label}</div>
    </div>
  );
}
