import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { levelForPoints } from "@/lib/levels";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const [top, me] = await Promise.all([
    prisma.user.findMany({
      where: { role: "student", isBlocked: false },
      orderBy: { points: "desc" },
      take: 50,
      select: {
        id: true,
        name: true,
        points: true,
        _count: { select: { attempts: true, badges: true } },
      },
    }),
    getCurrentUser(),
  ]);

  // F3 — compute the viewer's rank (if a student), even if not in top 50.
  let viewerRank: number | null = null;
  let viewerInTop = false;
  if (me && me.role === "student" && !me.isBlocked) {
    const above = await prisma.user.count({
      where: { role: "student", isBlocked: false, points: { gt: me.points } },
    });
    viewerRank = above + 1;
    viewerInTop = top.some((u) => u.id === me.id);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl sm:text-4xl font-black text-violet-900 dark:text-violet-100">🏆 لوحة المتصدرات</h1>
      <p className="text-violet-600/85 dark:text-violet-300/80 mt-1 mb-6">أفضل ٥٠ طالبة هذا الأسبوع</p>

      {/* F3 — your-rank section */}
      {viewerRank !== null && me && (
        <div className="card p-4 mb-4 bg-gradient-to-l from-violet-50 to-fuchsia-50 dark:from-violet-900/30 dark:to-fuchsia-900/20 border-2 border-violet-200 dark:border-violet-800/50">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-xs font-bold text-violet-600 dark:text-violet-300/80 mb-0.5">ترتيبكِ الحالي</div>
              <div className="text-2xl font-black text-violet-900 dark:text-violet-100 num">
                #{viewerRank}
                <span className="text-sm font-normal mr-2 text-violet-500">— {levelForPoints(me.points).current.icon} {levelForPoints(me.points).current.name}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-violet-500 dark:text-violet-300/70">نقاطكِ</div>
              <div className="text-2xl font-extrabold text-violet-700 dark:text-violet-200 num">{me.points}</div>
            </div>
          </div>
          {!viewerInTop && (
            <div className="text-xs text-violet-500 dark:text-violet-300/70 mt-2">
              لم تدخلي بعد ضمن قائمة الـ ٥٠ الأوائل — تابعي حلّ الاختبارات لترتفعي إلى القمّة! 💪
            </div>
          )}
        </div>
      )}

      {top.length === 0 ? (
        <div className="card p-6 text-center text-violet-600">لا توجد بيانات بعد. كوني أوّل المتصدرات!</div>
      ) : (
        <div className="card p-2">
          {top.map((u, i) => {
            const lv = levelForPoints(u.points).current;
            const isMe = me && u.id === me.id;
            return (
              <div
                key={u.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition ${
                  isMe
                    ? "bg-violet-100 dark:bg-violet-900/40 ring-2 ring-violet-400/60"
                    : "hover:bg-violet-50 dark:hover:bg-violet-900/30"
                }`}
              >
                <div className={`w-10 h-10 grid place-items-center rounded-full font-extrabold text-white shrink-0 ${i === 0 ? "bg-amber-500" : i === 1 ? "bg-slate-400" : i === 2 ? "bg-orange-500" : "bg-violet-500"}`}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-violet-900 dark:text-violet-100">
                    {u.name}
                    {isMe && <span className="text-xs font-normal mr-2 text-violet-500">(أنتِ)</span>}
                  </div>
                  <div className="text-xs text-violet-500 dark:text-violet-300/70">
                    {lv.icon} {lv.name} · <span className="num">{u._count.attempts}</span> اختبار · <span className="num">{u._count.badges}</span> شارة
                  </div>
                </div>
                <div className="font-extrabold text-violet-700 dark:text-violet-200 num text-lg">{u.points}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
