import Link from "next/link";
import { api, type LeaderboardRow } from "@/lib/api";

export const revalidate = 30;

type Scope = "all" | "weekly" | "monthly";

const SCOPES: { id: Scope; label: string }[] = [
  { id: "all", label: "العام" },
  { id: "monthly", label: "هذا الشهر" },
  { id: "weekly", label: "هذا الأسبوع" },
];

const SCOPE_COLUMN: Record<Scope, keyof LeaderboardRow> = {
  all: "points",
  monthly: "monthly_points",
  weekly: "weekly_points",
};

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: { scope?: string };
}) {
  const scope: Scope = (["all", "weekly", "monthly"] as const).includes(
    searchParams.scope as Scope
  )
    ? (searchParams.scope as Scope)
    : "all";

  let rows: LeaderboardRow[] = [];
  let error: string | null = null;
  try {
    const data = await api.leaderboard(scope, 50);
    rows = data.rows;
  } catch (e) {
    error = (e as Error).message;
  }

  const pointsKey = SCOPE_COLUMN[scope];

  return (
    <>
      <h1>لوحة المتصدّرين</h1>
      <p className="muted">
        أعلى 50 لاعباً حسب النطاق المختار. تتحدّث كل 30 ثانية تقريباً.
      </p>

      <div className="scope-tabs" role="tablist">
        {SCOPES.map((s) => (
          <Link
            key={s.id}
            href={`/leaderboard?scope=${s.id}`}
            className={s.id === scope ? "active" : ""}
            role="tab"
            aria-selected={s.id === scope}
          >
            {s.label}
          </Link>
        ))}
      </div>

      {error ? (
        <div className="error-box">
          تعذّر تحميل الترتيب: <code>{error}</code>
        </div>
      ) : rows.length === 0 ? (
        <div className="card muted">لا توجد بيانات لهذا النطاق بعد.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th style={{ width: "3rem" }}>#</th>
              <th>اللاعب</th>
              <th>النقاط</th>
              <th>الفوز</th>
              <th>الدقّة</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const rank = i + 1;
              const accuracy =
                r.total_answers > 0
                  ? Math.round((r.correct_answers / r.total_answers) * 100)
                  : 0;
              return (
                <tr key={r.user_id}>
                  <td>
                    <span className={`rank rank-${rank}`}>
                      {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank}
                    </span>
                  </td>
                  <td>{r.display_name || `مستخدم ${r.user_id.slice(-4)}`}</td>
                  <td>{(r[pointsKey] as number).toLocaleString("ar")}</td>
                  <td>{r.wins.toLocaleString("ar")}</td>
                  <td>{accuracy}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}
