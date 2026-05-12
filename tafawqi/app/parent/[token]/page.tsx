import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { levelForPoints } from "@/lib/levels";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "متابعة وليّ الأمر",
  // F17 — explicitly tell crawlers not to index parent share links.
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ token: string }> };

export default async function ParentViewPage(props: Props) {
  const params = await props.params;
  const token = params.token;
  if (!token || token.length < 16) notFound();

  const link = await prisma.parentLink.findUnique({ where: { token } });
  if (!link || link.revokedAt) notFound();

  // Bump lastViewedAt so the student can see her parent has opened the link.
  // We don't block render on this — best-effort write.
  prisma.parentLink
    .update({ where: { id: link.id }, data: { lastViewedAt: new Date() } })
    .catch(() => undefined);

  const [user, attempts] = await Promise.all([
    prisma.user.findUnique({
      where: { id: link.userId },
      select: {
        name: true,
        points: true,
        streakDays: true,
        streakBestDays: true,
        createdAt: true,
        role: true,
        isBlocked: true,
      },
    }),
    prisma.attempt.findMany({
      where: { userId: link.userId, finishedAt: { not: null } },
      orderBy: { startedAt: "desc" },
      take: 10,
      select: {
        id: true,
        startedAt: true,
        finishedAt: true,
        score: true,
        total: true,
        quiz: { select: { title: true, chapter: { select: { title: true } } } },
      },
    }),
  ]);

  if (!user || user.role !== "student") notFound();

  function pctOf(a: { score: number; total: number }) {
    return a.total > 0 ? Math.round((a.score / a.total) * 100) : 0;
  }
  const lv = levelForPoints(user.points);
  const completed = attempts.length;
  const avgPct =
    completed === 0 ? 0 : Math.round(attempts.reduce((s, a) => s + pctOf(a), 0) / completed);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <header className="text-center mb-6">
        <div className="chip mb-3 mx-auto bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200">
          👪 متابعة وليّ الأمر — تفوّقي
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-violet-900 dark:text-violet-100">
          تقدّم {user.name}
        </h1>
        <p className="mt-2 text-violet-600 dark:text-violet-300">
          هذه نظرة عامّة فقط للقراءة على نشاط ابنتكم في منصّة تفوّقي.
        </p>
      </header>

      {user.isBlocked && (
        <div className="card p-4 mb-5 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <strong>تنبيه:</strong> هذا الحساب موقوف حاليّاً عن طرف الإدارة.
        </div>
      )}

      <div className="grid sm:grid-cols-4 gap-3 mb-5">
        <Card label="النقاط" value={user.points.toString()} icon="⭐" />
        <Card label="المستوى" value={`${lv.current.icon} ${lv.current.name}`} icon="" />
        <Card label="السلسلة الحاليّة" value={`${user.streakDays} يوم`} icon="🔥" />
        <Card label="أفضل سلسلة" value={`${user.streakBestDays} يوم`} icon="🏆" />
      </div>

      <div className="card p-5 mb-5">
        <h2 className="text-xl font-bold text-violet-900 dark:text-violet-100 mb-3">
          آخر ١٠ اختبارات
        </h2>
        {attempts.length === 0 ? (
          <p className="text-violet-600 dark:text-violet-300 text-sm">
            لم تنجز ابنتكم أيّ اختبار بعد. شجّعيها على البدء برحلتها مع تفوّقي.
          </p>
        ) : (
          <>
            <div className="mb-3 text-sm text-violet-700/85 dark:text-violet-200/80">
              متوسّط الدرجات في آخر ١٠ اختبارات: <strong>{avgPct}%</strong>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-violet-600 dark:text-violet-300/80 text-right">
                  <tr className="border-b border-violet-100 dark:border-violet-900/40">
                    <th className="py-2 pe-3 font-semibold">الاختبار</th>
                    <th className="py-2 pe-3 font-semibold">الفصل</th>
                    <th className="py-2 pe-3 font-semibold">النتيجة</th>
                    <th className="py-2 font-semibold">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((a) => {
                    const pct = pctOf(a);
                    return (
                    <tr key={a.id} className="border-b border-violet-50 dark:border-violet-900/30">
                      <td className="py-2 pe-3 text-violet-900 dark:text-violet-100">{a.quiz.title}</td>
                      <td className="py-2 pe-3 text-violet-700 dark:text-violet-200/85">
                        {a.quiz.chapter?.title ?? "—"}
                      </td>
                      <td className="py-2 pe-3">
                        <span
                          className={[
                            "chip",
                            pct >= 80
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
                              : pct >= 50
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200"
                              : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200",
                          ].join(" ")}
                        >
                          {pct}%
                        </span>
                      </td>
                      <td className="py-2 text-violet-600 dark:text-violet-300/80 text-xs">
                        {new Date(a.startedAt).toLocaleDateString("ar-SY")}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div className="text-center text-xs text-violet-500 dark:text-violet-300/70 mt-8">
        تفوّقي — منصّة عربيّة لاختبارات الرياضيات للصف العاشر
        <br />
        <Link href="/" className="hover:text-violet-700 underline">العودة إلى تفوّقي</Link>
      </div>
    </div>
  );
}

function Card({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="card p-4 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-lg font-black text-violet-900 dark:text-violet-100">{value}</div>
      <div className="text-xs text-violet-600 dark:text-violet-300/80">{label}</div>
    </div>
  );
}
