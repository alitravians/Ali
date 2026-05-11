import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { levelForPoints } from "@/lib/levels";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/profile");
  const [badges, certs, attempts] = await Promise.all([
    prisma.userBadge.findMany({ where: { userId: user.id }, include: { badge: true } }),
    prisma.certificate.findMany({ where: { userId: user.id }, orderBy: { issuedAt: "desc" } }),
    prisma.attempt.count({ where: { userId: user.id, finishedAt: { not: null } } }),
  ]);
  const lv = levelForPoints(user.points);
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="card p-6 mb-6 flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-pink-400 to-violet-500 grid place-items-center text-white text-3xl font-black">
          {user.name.slice(0, 1)}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-violet-900 dark:text-violet-100">{user.name}</h1>
          <div className="text-sm text-violet-600 dark:text-violet-300/80" dir="ltr">{user.email}</div>
          <div className="mt-1 text-sm">
            <span className="chip">{lv.current.icon} {lv.current.name}</span>
            <span className="chip ms-2 num">{user.points} نقطة</span>
            <span className="chip ms-2 num">{attempts} اختبار</span>
          </div>
        </div>
      </div>

      <div className="card p-5 mb-6">
        <h2 className="font-extrabold text-violet-900 dark:text-violet-100 mb-3">شاراتي ({badges.length})</h2>
        {badges.length === 0 ? (
          <div className="text-violet-600/80 dark:text-violet-300/70 text-sm">لا توجد شارات بعد.</div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {badges.map((b) => (
              <div key={b.id} className="text-center p-2 rounded-xl bg-violet-50 dark:bg-violet-900/30">
                <div className="text-3xl">{b.badge.icon}</div>
                <div className="text-xs font-bold text-violet-800 dark:text-violet-200 mt-1">{b.badge.title}</div>
                <div className="text-[10px] text-violet-500 dark:text-violet-300/70 line-clamp-2 mt-0.5">{b.badge.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-5">
        <h2 className="font-extrabold text-violet-900 dark:text-violet-100 mb-3">شهاداتي ({certs.length})</h2>
        {certs.length === 0 ? (
          <div className="text-violet-600/80 dark:text-violet-300/70 text-sm">لا توجد شهادات بعد. حلّي ٣ اختبارات في قسم واحد بمعدل ٧٠٪ للحصول على شهادة.</div>
        ) : (
          <ul className="space-y-2">
            {certs.map((c) => (
              <li key={c.id} className="flex justify-between items-center p-3 rounded-xl bg-violet-50 dark:bg-violet-900/30">
                <div>
                  <div className="font-bold text-violet-900 dark:text-violet-100">🎓 {c.title}</div>
                  <div className="text-xs text-violet-500 dark:text-violet-300/70 num">{new Date(c.issuedAt).toLocaleDateString("ar-SY")}</div>
                </div>
                <Link href={`/certificate/${c.code}`} className="btn-secondary text-sm">عرض الشهادة</Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
