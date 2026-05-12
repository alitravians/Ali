"use client";

// F14 — Audit log tab: filterable feed of admin actions + CSV export button.
import { useEffect, useState } from "react";

type Entry = {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  details: unknown;
  ip: string | null;
  createdAt: string;
  admin: { id: string; name: string; email: string };
};

const ACTION_LABELS: Record<string, string> = {
  block_user: "إيقاف طالبة",
  unblock_user: "إلغاء إيقاف",
  change_role: "تغيير دور",
  reset_points: "تصفير نقاط",
  create_question: "إنشاء سؤال",
  update_question: "تعديل سؤال",
  delete_question: "حذف سؤال",
  create_quiz: "إنشاء اختبار",
  update_quiz: "تعديل اختبار",
  delete_quiz: "حذف اختبار",
  update_setting: "تعديل إعداد",
  delete_reset_token: "حذف رمز استعادة",
  seed_data: "بذر بيانات",
  create_department: "إنشاء قسم",
  update_department: "تعديل قسم",
  delete_department: "حذف قسم",
  add_team_member: "إضافة عضوة",
  update_team_member: "تعديل عضوة",
  remove_team_member: "إخفاء عضوة",
  resolve_report: "حلّ بلاغ",
  dismiss_report: "تجاهل بلاغ",
};

export default function AuditTab() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");

  function load() {
    setLoading(true);
    fetch("/api/admin/audit", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setEntries(d.entries || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  const filtered = filter
    ? entries.filter((e) => e.action === filter || e.targetType === filter)
    : entries;

  function downloadCsv(days: number) {
    // Trigger a real download via an anchor so the browser handles the file.
    const url = `/api/admin/audit/export?days=${days}&max=5000`;
    window.location.href = url;
  }

  return (
    <div className="space-y-3">
      <div className="card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-sm text-violet-700 dark:text-violet-200">فلترة:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input max-w-xs">
            <option value="">كل الأحداث</option>
            <optgroup label="حسب الفعل">
              {Object.entries(ACTION_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </optgroup>
            <optgroup label="حسب نوع الهدف">
              <option value="user">على طالبة</option>
              <option value="question">على سؤال</option>
              <option value="quiz">على اختبار</option>
              <option value="setting">على إعداد</option>
              <option value="department">على قسم</option>
              <option value="team_member">على عضوة</option>
              <option value="question_report">على بلاغ</option>
            </optgroup>
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={() => downloadCsv(7)} className="btn-ghost text-sm">⬇️ تصدير آخر 7 أيام</button>
          <button onClick={() => downloadCsv(30)} className="btn-ghost text-sm">⬇️ تصدير آخر 30 يوماً</button>
          <button onClick={() => downloadCsv(90)} className="btn-secondary text-sm">⬇️ تصدير 90 يوماً</button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="text-violet-500 dark:text-violet-300/70 text-right">
            <tr>
              <th className="p-3">الوقت</th>
              <th className="p-3">المشرفة</th>
              <th className="p-3">الإجراء</th>
              <th className="p-3">على</th>
              <th className="p-3">IP</th>
              <th className="p-3">تفاصيل</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="p-4 text-center text-violet-500">تحميل…</td></tr>}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={6} className="p-4 text-center text-violet-500">لا توجد أحداث.</td></tr>
            )}
            {filtered.map((e) => (
              <tr key={e.id} className="border-t border-violet-100 dark:border-violet-900/40">
                <td className="p-3 whitespace-nowrap num text-xs" dir="ltr">{formatDate(e.createdAt)}</td>
                <td className="p-3">
                  <div className="font-semibold text-violet-900 dark:text-violet-100">{e.admin?.name ?? "—"}</div>
                  <div className="text-xs text-violet-500 num" dir="ltr">{e.admin?.email ?? ""}</div>
                </td>
                <td className="p-3">
                  <span className="chip">{ACTION_LABELS[e.action] ?? e.action}</span>
                </td>
                <td className="p-3 text-xs">
                  <span className="text-violet-700 dark:text-violet-200">{labelForTarget(e.targetType)}</span>
                  {e.targetId && <div className="text-violet-400 num" dir="ltr">{e.targetId.slice(0, 16)}…</div>}
                </td>
                <td className="p-3 text-xs num" dir="ltr">{e.ip ?? "—"}</td>
                <td className="p-3 text-xs text-violet-600 dark:text-violet-300/80 max-w-[300px] truncate">
                  {e.details ? <code dir="ltr">{JSON.stringify(e.details)}</code> : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function labelForTarget(t: string): string {
  const map: Record<string, string> = {
    user: "طالبة",
    question: "سؤال",
    quiz: "اختبار",
    setting: "إعداد",
    department: "قسم",
    team_member: "عضوة",
    question_report: "بلاغ",
    other: "أخرى",
  };
  return map[t] ?? t;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("ar", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
