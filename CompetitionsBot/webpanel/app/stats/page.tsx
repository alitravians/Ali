import { api } from "@/lib/api";

export const revalidate = 60;

export default async function StatsPage() {
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
      <h1>إحصائيات البوت</h1>
      <p className="muted">قراءات حيّة من قاعدة بيانات البوت.</p>

      {error ? (
        <div className="error-box">تعذّر تحميل الإحصائيات: <code>{error}</code></div>
      ) : (
        <>
          <h2>الإجماليات</h2>
          <div className="stats-grid">
            <div className="card stat">
              <div className="label">المتسابقون</div>
              <div className="value">{stats?.users.toLocaleString("ar") ?? "—"}</div>
            </div>
            <div className="card stat">
              <div className="label">عدد المسابقات</div>
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
            <>
              <h2>حالة البوت</h2>
              <div className="stats-grid">
                <div className="card stat">
                  <div className="label">الحالة</div>
                  <div className="value" style={{ color: health.ok ? "#2ecc71" : "#e74c3c" }}>
                    {health.ok ? "متّصل" : "غير متّصل"}
                  </div>
                </div>
                <div className="card stat">
                  <div className="label">السيرفرات</div>
                  <div className="value">{health.guilds.toLocaleString("ar")}</div>
                </div>
                <div className="card stat">
                  <div className="label">وقت التشغيل</div>
                  <div className="value">
                    {Math.floor(health.uptime_seconds / 3600).toLocaleString("ar")} س
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
