// Authenticated profile page. Read-only display of account info + avatar
// upload widget. Server component fetches the user; the avatar widget itself
// is a small client island.
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { levelForPoints } from "@/lib/levels";
import { prisma } from "@/lib/prisma";
import AvatarWidget from "./avatar-widget";
import ParentLinksSection from "./parent-links-section";
import TwoFactorSection from "./two-factor-section";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/profile");

  const [badgeCount, attemptCount, certificateCount, parentLinks] = await Promise.all([
    prisma.userBadge.count({ where: { userId: user.id } }),
    prisma.attempt.count({ where: { userId: user.id, finishedAt: { not: null } } }),
    prisma.certificate.count({ where: { userId: user.id } }),
    user.role === "student"
      ? prisma.parentLink.findMany({
          where: { userId: user.id, revokedAt: null },
          orderBy: { createdAt: "desc" },
          select: { id: true, token: true, label: true, createdAt: true, lastViewedAt: true },
        })
      : Promise.resolve([]),
  ]);
  const level = levelForPoints(user.points);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black text-violet-900 dark:text-violet-100 mb-6">
        👤 ملفي الشخصي
      </h1>

      <div className="card p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <AvatarWidget
            initialAvatarUrl={user.avatar ? `/api/avatar/${user.id}` : null}
            userName={user.name}
          />
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-extrabold text-violet-900 dark:text-violet-100">
              {user.name}
            </div>
            <div className="text-sm text-violet-600 dark:text-violet-300/80 break-all">
              {user.email}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="chip">{user.role === "admin" ? "🛠️ مشرفة" : "🎓 طالبة"}</span>
              <span className="chip">{level.current.icon} {level.current.name}</span>
              <span className="chip">{user.points} نقطة</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <Stat icon="🧩" label="اختبارات أُنجزت" value={attemptCount} />
        <Stat icon="🏅" label="شارات" value={badgeCount} />
        <Stat icon="📜" label="شهادات" value={certificateCount} />
      </div>

      <div className="card p-6 mb-6">
        <div className="font-bold text-violet-900 dark:text-violet-100 mb-2">
          إعدادات الحساب
        </div>
        <p className="text-sm text-violet-600/90 dark:text-violet-300/80">
          غيّري الصورة الرمزية من المربّع في الأعلى. لتغيير كلمة المرور استخدمي
          صفحة <a href="/login" className="text-violet-700 dark:text-violet-200 underline">إعادة تعيين كلمة المرور</a>.
        </p>
      </div>

      {user.role === "student" && (
        <ParentLinksSection initialLinks={parentLinks} />
      )}

      {user.role === "admin" && (
        <TwoFactorSection enabled={Boolean(user.totpEnabledAt)} />
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className="text-3xl">{icon}</div>
      <div>
        <div className="text-xs text-violet-500 dark:text-violet-300/70">{label}</div>
        <div className="text-2xl font-extrabold text-violet-900 dark:text-violet-100 num">
          {value}
        </div>
      </div>
    </div>
  );
}
