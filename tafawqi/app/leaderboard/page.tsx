import { prisma } from "@/lib/prisma";
import { levelForPoints } from "@/lib/levels";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const top = await prisma.user.findMany({
    where: { role: "student", isBlocked: false },
    orderBy: { points: "desc" },
    take: 50,
    select: { id: true, name: true, points: true, _count: { select: { attempts: true, badges: true } } },
  });
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl sm:text-4xl font-black text-violet-900 dark:text-violet-100">🏆 لوحة المتصدرات</h1>
      <p className="text-violet-600/85 dark:text-violet-300/80 mt-1 mb-6">أفضل ٥٠ طالبة هذا الأسبوع</p>
      {top.length === 0 ? (
        <div className="card p-6 text-center text-violet-600">لا توجد بيانات بعد. كوني أوّل المتصدرات!</div>
      ) : (
        <div className="card p-2">
          {top.map((u, i) => {
            const lv = levelForPoints(u.points).current;
            return (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-900/30 transition">
                <div className={`w-10 h-10 grid place-items-center rounded-full font-extrabold text-white shrink-0 ${i === 0 ? "bg-amber-500" : i === 1 ? "bg-slate-400" : i === 2 ? "bg-orange-500" : "bg-violet-500"}`}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-violet-900 dark:text-violet-100">{u.name}</div>
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
