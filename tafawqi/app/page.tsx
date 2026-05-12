import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { levelForPoints } from "@/lib/levels";

export const dynamic = "force-dynamic";

async function getData() {
  const [chapters, topStudents, attemptCount, studentCount, badges, registrationSetting] = await Promise.all([
    prisma.chapter.findMany({
      orderBy: { order: "asc" },
      include: { sections: true, _count: { select: { quizzes: true } } },
    }),
    prisma.user.findMany({
      where: { role: "student", isBlocked: false },
      orderBy: { points: "desc" },
      take: 5,
      select: { id: true, name: true, points: true },
    }),
    prisma.attempt.count({ where: { finishedAt: { not: null } } }),
    prisma.user.count({ where: { role: "student" } }),
    prisma.badge.findMany({ take: 6 }),
    prisma.siteSetting.findUnique({ where: { key: "registration_open" } }),
  ]);
  const registrationOpen = registrationSetting?.value !== "false";
  return { chapters, topStudents, attemptCount, studentCount, badges, registrationOpen };
}

export default async function HomePage() {
  const { chapters, topStudents, attemptCount, studentCount, badges, registrationOpen } = await getData();

  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* HERO */}
      <section className="pt-10 pb-16 sm:pt-16 sm:pb-24 text-center relative">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-10 right-10 w-72 h-72 bg-fuchsia-300/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-10 w-72 h-72 bg-violet-300/30 rounded-full blur-3xl" />
        </div>
        <div className="chip mb-4 mx-auto bg-gradient-to-l from-pink-100 to-violet-100 dark:from-pink-900/30 dark:to-violet-900/30 text-pink-700 dark:text-pink-200">
          ✨ منهاج الصف العاشر — الجمهورية العربية السورية
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-violet-900 dark:text-violet-50 text-balance">
          تعلّمي الرياضيات{" "}
          <span className="bg-gradient-to-l from-fuchsia-500 to-violet-600 bg-clip-text text-transparent">
            باختبارات ذكية وقصيرة
          </span>
        </h1>
        <p className="mt-5 max-w-2xl mx-auto text-lg sm:text-xl text-violet-700/90 dark:text-violet-200/85 leading-relaxed text-balance">
          منصة عربية تساعدكِ على فهم المادة عبر اختبارات سريعة، تقييم فوري، شرح الأخطاء،
          واقتراح تدريبات إضافية في الأقسام التي تحتاج تحسيناً.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <Link href="/chapters" className="btn-primary text-lg px-6 py-3">
            🚀 ابدئي الاختبارات الآن
          </Link>
          {registrationOpen ? (
            <Link href="/register" className="btn-secondary text-lg px-6 py-3">
              👋 أنشئي حساباً مجانياً
            </Link>
          ) : (
            <Link href="/login" className="btn-secondary text-lg px-6 py-3">
              👋 تسجيل الدخول
            </Link>
          )}
        </div>
        <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-6 max-w-2xl mx-auto">
          <Stat label="فصول دراسية" value={chapters.length} icon="📘" />
          <Stat label="اختبار محلول" value={attemptCount} icon="✅" />
          <Stat label="طالبة مسجَّلة" value={studentCount} icon="👩‍🎓" />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="grid sm:grid-cols-4 gap-4 mb-16">
        {[
          { icon: "🧠", title: "اختبارات قصيرة", text: "٥ أسئلة سريعة في دقائق" },
          { icon: "⚡", title: "تقييم فوري", text: "النتيجة وشرح الأخطاء مباشرة" },
          { icon: "🎯", title: "اقتراحات ذكية", text: "تدريب إضافي في نقاط ضعفكِ" },
          { icon: "🏆", title: "شهادات ونقاط", text: "إنجازات وشارات تحفّزكِ" },
        ].map((f, i) => (
          <div key={i} className="card p-5 hover:scale-[1.02] transition">
            <div className="text-3xl mb-2">{f.icon}</div>
            <div className="font-bold text-violet-900 dark:text-violet-100">{f.title}</div>
            <div className="text-sm text-violet-600/90 dark:text-violet-300/80 mt-1">{f.text}</div>
          </div>
        ))}
      </section>

      {/* CHAPTERS */}
      <section className="mb-16">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-violet-900 dark:text-violet-100">الفصول الدراسية</h2>
            <p className="text-sm text-violet-600/80 dark:text-violet-300/70">اختاري فصلاً لتتدرّبي على أقسامه</p>
          </div>
          <Link href="/chapters" className="text-sm font-semibold text-violet-700 dark:text-violet-200 hover:underline">عرض الكل ←</Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {chapters.map((c) => (
            <Link
              key={c.id}
              href={`/chapters/${c.slug}`}
              className="card p-5 hover:shadow-lg hover:shadow-violet-200/40 dark:hover:shadow-violet-900/30 transition group"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-12 h-12 rounded-xl grid place-items-center text-2xl shrink-0"
                  style={{ background: `${c.color}22`, color: c.color }}
                >
                  {c.icon}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-lg text-violet-900 dark:text-violet-100 group-hover:text-violet-700 dark:group-hover:text-violet-300 transition">
                    {c.title}
                  </div>
                  <div className="text-sm text-violet-600/80 dark:text-violet-300/70">{c.description}</div>
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <span className="chip">{c.sections.length} أقسام</span>
                    <span className="chip">{c._count.quizzes} اختبارات</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* BADGES */}
      <section className="mb-16">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-violet-900 dark:text-violet-100 mb-1">إنجازات تنتظركِ</h2>
        <p className="text-sm text-violet-600/80 dark:text-violet-300/70 mb-5">شارات تحصلين عليها كلما تقدّمتِ في الاختبارات</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {badges.map((b) => (
            <div key={b.id} className="card p-4 text-center">
              <div className="text-3xl mb-1">{b.icon}</div>
              <div className="font-bold text-sm text-violet-900 dark:text-violet-100">{b.title}</div>
              <div className="text-xs text-violet-500/90 dark:text-violet-300/70 mt-1 line-clamp-2">{b.description}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TOP STUDENTS */}
      <section className="mb-16">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-violet-900 dark:text-violet-100">أعلى الطالبات</h2>
            <p className="text-sm text-violet-600/80 dark:text-violet-300/70">المتصدرات هذا الأسبوع</p>
          </div>
          <Link href="/leaderboard" className="text-sm font-semibold text-violet-700 dark:text-violet-200 hover:underline">القائمة الكاملة ←</Link>
        </div>
        {topStudents.length === 0 ? (
          <div className="card p-6 text-center text-violet-600/80 dark:text-violet-300/70">
            لا توجد طالبات بعد — كوني أوّل المتصدرات!
          </div>
        ) : (
          <div className="card p-2">
            {topStudents.map((s, i) => {
              const lv = levelForPoints(s.points).current;
              return (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-violet-50/60 dark:hover:bg-violet-900/30 transition">
                  <div className={`w-10 h-10 grid place-items-center rounded-full font-extrabold text-white ${i === 0 ? "bg-amber-500" : i === 1 ? "bg-slate-400" : i === 2 ? "bg-orange-500" : "bg-violet-500"}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-violet-900 dark:text-violet-100">{s.name}</div>
                    <div className="text-xs text-violet-500 dark:text-violet-300/70">{lv.icon} {lv.name}</div>
                  </div>
                  <div className="font-extrabold text-violet-700 dark:text-violet-200 num">{s.points}</div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="mb-16">
        <div className="card p-8 sm:p-10 text-center bg-gradient-to-l from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30 border-violet-200 dark:border-violet-700/40">
          <h3 className="text-2xl sm:text-3xl font-black text-violet-900 dark:text-violet-100">
            {registrationOpen ? "جاهزة لرحلتكِ مع الرياضيات؟" : "البدء بلمسة واحدة"}
          </h3>
          <p className="mt-2 text-violet-700/90 dark:text-violet-200/85">
            {registrationOpen
              ? "سجّلي مجاناً وابدئي بـ ٥ أسئلة فقط — ولن تحتاجي أكثر من ٣ دقائق!"
              : "لديكِ حساب؟ سجّلي دخولكِ وتابعي رحلتكِ مع الرياضيات."}
          </p>
          <div className="mt-5 flex justify-center gap-3 flex-wrap">
            {registrationOpen && (
              <Link href="/register" className="btn-primary">إنشاء حساب</Link>
            )}
            <Link href="/login" className={registrationOpen ? "btn-secondary" : "btn-primary"}>
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number | string; icon: string }) {
  return (
    <div className="card px-3 py-4 sm:px-5 sm:py-5">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl sm:text-3xl font-black text-violet-900 dark:text-violet-100 num">{value}</div>
      <div className="text-xs sm:text-sm text-violet-600/80 dark:text-violet-300/70">{label}</div>
    </div>
  );
}
