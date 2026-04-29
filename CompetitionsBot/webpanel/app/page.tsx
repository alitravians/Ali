import Link from "next/link";
import { api } from "@/lib/api";

export const revalidate = 60;

export default async function HomePage() {
  let stats: Awaited<ReturnType<typeof api.stats>> | null = null;
  let health: Awaited<ReturnType<typeof api.health>> | null = null;
  let error: string | null = null;
  try {
    [stats, health] = await Promise.all([api.stats(), api.health()]);
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <>
      <h1>أهلاً بك في بوت المسابقات</h1>
      <p className="muted">
        لوحة عامة تعرض إحصائيات البوت وترتيب المتصدّرين بشكل مباشر.
      </p>

      {error ? (
        <div className="error-box">
          تعذّر الاتصال بالـ API: <code>{error}</code>
        </div>
      ) : (
        <>
          <h2>نظرة سريعة</h2>
          <div className="stats-grid">
            <div className="card stat">
              <div className="label">المتسابقون</div>
              <div className="value">{stats?.users.toLocaleString("ar") ?? "—"}</div>
            </div>
            <div className="card stat">
              <div className="label">المسابقات</div>
              <div className="value">{stats?.competitions.toLocaleString("ar") ?? "—"}</div>
            </div>
            <div className="card stat">
              <div className="label">إجابات صحيحة</div>
              <div className="value">{stats?.correct_answers.toLocaleString("ar") ?? "—"}</div>
            </div>
            <div className="card stat">
              <div className="label">مجموع النقاط</div>
              <div className="value">{stats?.total_points.toLocaleString("ar") ?? "—"}</div>
            </div>
          </div>

          {health && (
            <p className="muted" style={{ marginTop: "1.5rem" }}>
              {health.bot_user_name ? `${health.bot_user_name} • ` : ""}
              {health.guilds} سيرفر • وقت تشغيل {Math.round(health.uptime_seconds / 3600)} ساعة
            </p>
          )}
        </>
      )}

      <h2>روابط سريعة</h2>
      <p>
        <Link href="/leaderboard">لوحة المتصدّرين الكاملة »</Link>
        <br />
        <Link href="/stats">إحصائيات تفصيلية »</Link>
      </p>
    </>
  );
}
