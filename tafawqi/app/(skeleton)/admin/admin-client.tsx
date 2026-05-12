"use client";
import { useEffect, useState } from "react";
import TeamTab from "./team-tab";
import ReportsTab from "./reports-tab";
import ContactsTab from "./contacts-tab";
import AuditTab from "./audit-tab";

type Chapter = { id: string; slug: string; title: string; sections: { id: string; slug: string; title: string }[] };
type Section = { id: string; slug: string; title: string; chapter: { id: string; title: string } };

export default function AdminClient({ chapters, sections }: { chapters: Chapter[]; sections: Section[] }) {
  const [tab, setTab] = useState<
    | "stats"
    | "users"
    | "questions"
    | "quizzes"
    | "team"
    | "reports"
    | "contacts"
    | "audit"
    | "settings"
  >("stats");
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <h1 className="text-3xl font-black text-violet-900 dark:text-violet-100">⚙️ لوحة الإدارة</h1>
        <span className="chip">منطقة المشرفات فقط</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {([
          ["stats", "📊 الإحصائيات"],
          ["users", "👩‍🎓 الطالبات"],
          ["questions", "📝 الأسئلة"],
          ["quizzes", "🧩 الاختبارات"],
          ["team", "👥 فريق العمل"],
          ["reports", "🚩 بلاغات الأسئلة"],
          ["contacts", "📬 رسائل التواصل"],
          ["audit", "📜 سجلّ الأحداث"],
          ["settings", "🛠️ الإعدادات"],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-xl font-bold transition ${
              tab === k
                ? "bg-gradient-to-l from-violet-600 to-fuchsia-500 text-white shadow"
                : "bg-white dark:bg-[#161235] text-violet-700 dark:text-violet-200 border border-violet-100 dark:border-violet-900/40 hover:bg-violet-50 dark:hover:bg-violet-900/30"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "stats" && <StatsTab />}
      {tab === "users" && <UsersTab />}
      {tab === "questions" && <QuestionsTab sections={sections} />}
      {tab === "quizzes" && <QuizzesTab chapters={chapters} />}
      {tab === "team" && <TeamTab />}
      {tab === "reports" && <ReportsTab />}
      {tab === "contacts" && <ContactsTab />}
      {tab === "audit" && <AuditTab />}
      {tab === "settings" && <SettingsTab />}
    </div>
  );
}

function StatsTab() {
  const [data, setData] = useState<any>(null);
  const [range, setRange] = useState<7 | 30>(7);
  const [series, setSeries] = useState<any>(null);
  useEffect(() => {
    fetch("/api/admin/stats", { cache: "no-store" }).then((r) => r.json()).then(setData);
  }, []);
  useEffect(() => {
    setSeries(null);
    fetch(`/api/admin/stats/timeseries?range=${range}`, { cache: "no-store" })
      .then((r) => r.json())
      .then(setSeries);
  }, [range]);
  if (!data) return <div className="text-violet-600">تحميل…</div>;
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Stat label="طالبات" value={data.counts.students} icon="👩‍🎓" />
        <Stat label="مستخدمات" value={data.counts.users} icon="👥" />
        <Stat label="أسئلة" value={data.counts.questions} icon="❓" />
        <Stat label="اختبارات" value={data.counts.quizzes} icon="🧩" />
        <Stat label="محاولات" value={data.counts.attempts} icon="📝" />
        <Stat label="شهادات" value={data.counts.certificates} icon="🎓" />
      </div>
      <div className="card p-5">
        <div className="text-violet-700 dark:text-violet-200">متوسط النتائج العام</div>
        <div className="text-4xl font-black text-violet-900 dark:text-violet-100 num">{data.avgPct}%</div>
      </div>

      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="font-bold text-violet-900 dark:text-violet-100">إحصاء زمنيّ</div>
          <div className="flex gap-2">
            {([7, 30] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition ${
                  range === r
                    ? "bg-violet-600 text-white"
                    : "bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-200"
                }`}
              >
                آخر {r} يوماً
              </button>
            ))}
          </div>
        </div>
        {!series ? (
          <div className="text-sm text-violet-500">تحميل…</div>
        ) : (
          <TimeSeriesView series={series} />
        )}
      </div>
      <div className="card p-5">
        <div className="font-bold text-violet-900 dark:text-violet-100 mb-2">أصعب الأقسام (أقل نسبة نجاح)</div>
        {data.hardestSections.length === 0 ? (
          <div className="text-violet-600 text-sm">لا توجد بيانات بعد.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-violet-500 dark:text-violet-300/70">
              <tr><th className="text-right pb-2">القسم</th><th className="pb-2">إجابات</th><th className="pb-2">نجاح</th></tr>
            </thead>
            <tbody>
              {data.hardestSections.map((s: any) => (
                <tr key={s.sectionId} className="border-t border-violet-100 dark:border-violet-900/40">
                  <td className="py-2">{s.title}</td>
                  <td className="text-center num">{s.totalAnswers}</td>
                  <td className={`text-center num font-bold ${s.correctPct < 50 ? "text-rose-600" : s.correctPct < 70 ? "text-amber-600" : "text-emerald-600"}`}>{s.correctPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="card p-4 text-center">
      <div className="text-2xl">{icon}</div>
      <div className="text-2xl font-extrabold text-violet-900 dark:text-violet-100 num">{value}</div>
      <div className="text-xs text-violet-500 dark:text-violet-300/70">{label}</div>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  function load() {
    setLoading(true);
    fetch("/api/admin/users", { cache: "no-store" }).then((r) => r.json()).then((d) => {
      setUsers(d.users || []);
      setLoading(false);
    });
  }
  useEffect(() => { load(); }, []);

  async function patch(id: string, body: any) {
    await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...body }) });
    load();
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm min-w-[700px]">
        <thead className="text-violet-500 dark:text-violet-300/70 text-right">
          <tr>
            <th className="p-3">الاسم</th>
            <th className="p-3">البريد</th>
            <th className="p-3">الدور</th>
            <th className="p-3">النقاط</th>
            <th className="p-3">اختبارات</th>
            <th className="p-3">شارات</th>
            <th className="p-3">الحالة</th>
            <th className="p-3">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {loading && <tr><td colSpan={8} className="p-4 text-center text-violet-500">تحميل…</td></tr>}
          {users.map((u) => (
            <tr key={u.id} className="border-t border-violet-100 dark:border-violet-900/40">
              <td className="p-3 font-semibold">{u.name}</td>
              <td className="p-3 num" dir="ltr">{u.email}</td>
              <td className="p-3">
                <span className={`chip ${u.role === "admin" ? "bg-amber-100 text-amber-700" : ""}`}>{u.role === "admin" ? "مشرفة" : "طالبة"}</span>
              </td>
              <td className="p-3 num">{u.points}</td>
              <td className="p-3 num">{u._count.attempts}</td>
              <td className="p-3 num">{u._count.badges}</td>
              <td className="p-3">
                {u.isBlocked
                  ? <span className="chip bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200">موقوف</span>
                  : <span className="chip bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">نشط</span>}
              </td>
              <td className="p-3 whitespace-nowrap">
                <button onClick={() => patch(u.id, { isBlocked: !u.isBlocked })} className="text-xs text-rose-600 hover:underline me-2">
                  {u.isBlocked ? "إلغاء الإيقاف" : "إيقاف"}
                </button>
                <button onClick={() => confirm("صفر النقاط؟") && patch(u.id, { resetPoints: true })} className="text-xs text-violet-600 hover:underline me-2">
                  تصفير النقاط
                </button>
                {u.role !== "admin" && (
                  <button onClick={() => confirm("ترقية إلى مشرفة؟") && patch(u.id, { role: "admin" })} className="text-xs text-amber-600 hover:underline">
                    ترقية لمشرفة
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QuestionsTab({ sections }: { sections: Section[] }) {
  const [filterSection, setFilterSection] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [questions, setQuestions] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [importing, setImporting] = useState(false);
  const [loading, setLoading] = useState(false);

  function load(targetPage = page) {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterSection) params.set("sectionId", filterSection);
    if (filterType) params.set("type", filterType);
    if (search.trim()) params.set("q", search.trim());
    params.set("page", String(targetPage));
    params.set("pageSize", String(pageSize));
    fetch(`/api/admin/questions?${params.toString()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setQuestions(d.questions || []);
        setTotal(d.total ?? 0);
        setTotalPages(d.totalPages ?? 1);
        setLoading(false);
      });
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setPage(1); load(1); }, [filterSection, filterType]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(page); }, [page]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    load(1);
  }

  async function remove(id: string) {
    if (!confirm("حذف هذا السؤال؟")) return;
    await fetch("/api/admin/questions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load();
  }

  return (
    <div className="space-y-3">
      <div className="card p-4 flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={submitSearch} className="flex flex-wrap items-center gap-2 flex-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث في نصّ السؤال…"
            className="input flex-1 min-w-[200px]"
          />
          <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)} className="input max-w-xs">
            <option value="">كل الأقسام</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>{s.chapter.title} — {s.title}</option>
            ))}
          </select>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="input max-w-[160px]">
            <option value="">كل الأنواع</option>
            <option value="mcq">اختيار</option>
            <option value="tf">صح/خطأ</option>
            <option value="fill">فراغ</option>
            <option value="match">مطابقة</option>
            <option value="order">ترتيب</option>
          </select>
          <button type="submit" className="btn-secondary">🔍 بحث</button>
        </form>
        <div className="flex gap-2">
          <button onClick={() => setImporting(true)} className="btn-secondary">📥 استيراد جماعيّ</button>
          <button onClick={() => setEditing({})} className="btn-primary">＋ سؤال جديد</button>
        </div>
      </div>

      <div className="text-xs text-violet-500 dark:text-violet-300/70 px-1">
        النتائج: <span className="num font-bold text-violet-700 dark:text-violet-200">{total}</span> — الصفحة <span className="num">{page}</span> من <span className="num">{totalPages}</span>
      </div>

      <div className="card divide-y divide-violet-100 dark:divide-violet-900/40">
        {loading && <div className="p-6 text-center text-violet-500">تحميل…</div>}
        {!loading && questions.length === 0 && <div className="p-6 text-center text-violet-500">لا توجد أسئلة.</div>}
        {questions.map((q) => (
          <div key={q.id} className="p-4 flex items-start gap-3">
            <span className="chip">{labelForType(q.type)}</span>
            <div className="flex-1">
              <div className="font-semibold text-violet-900 dark:text-violet-100">{q.prompt}</div>
              <div className="text-xs text-violet-500 dark:text-violet-300/70">{q.section?.chapter?.title} — {q.section?.title}</div>
            </div>
            <button onClick={() => setEditing(q)} className="btn-ghost text-sm">تعديل</button>
            <button onClick={() => remove(q.id)} className="text-sm text-rose-600 hover:underline">حذف</button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 pt-2">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="px-3 py-1.5 rounded-lg text-sm font-bold bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-200 disabled:opacity-40"
        >
          → السابقة
        </button>
        <span className="text-sm text-violet-600 num">{page} / {totalPages}</span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className="px-3 py-1.5 rounded-lg text-sm font-bold bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-200 disabled:opacity-40"
        >
          التالية ←
        </button>
      </div>

      {editing && (
        <QuestionEditor
          sections={sections}
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}

      {importing && (
        <BulkImportModal
          sections={sections}
          onClose={() => setImporting(false)}
          onDone={() => { setImporting(false); load(); }}
        />
      )}
    </div>
  );
}

function TimeSeriesView({ series }: { series: { range: number; days: { date: string; attempts: number; newStudents: number; avgPct: number }[]; totals: { attempts: number; newStudents: number; avgPct: number } } }) {
  const maxAttempts = Math.max(1, ...series.days.map((d) => d.attempts));
  const maxNew = Math.max(1, ...series.days.map((d) => d.newStudents));
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-violet-50 dark:bg-violet-900/30 rounded-lg p-2">
          <div className="text-xs text-violet-500">محاولات</div>
          <div className="font-extrabold text-violet-900 dark:text-violet-100 num">{series.totals.attempts}</div>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-2">
          <div className="text-xs text-emerald-600">طالبات جدد</div>
          <div className="font-extrabold text-emerald-700 dark:text-emerald-200 num">{series.totals.newStudents}</div>
        </div>
        <div className="bg-sky-50 dark:bg-sky-900/30 rounded-lg p-2">
          <div className="text-xs text-sky-600">متوسط النتيجة</div>
          <div className="font-extrabold text-sky-700 dark:text-sky-200 num">{series.totals.avgPct}%</div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[480px]">
          <thead className="text-violet-500 dark:text-violet-300/70">
            <tr>
              <th className="text-right p-1.5">التاريخ</th>
              <th className="p-1.5">محاولات</th>
              <th className="p-1.5">جدد</th>
              <th className="p-1.5">متوسّط</th>
              <th className="p-1.5 w-1/3">التوزيع</th>
            </tr>
          </thead>
          <tbody>
            {series.days.map((d) => (
              <tr key={d.date} className="border-t border-violet-100 dark:border-violet-900/40">
                <td className="p-1.5 num" dir="ltr">{d.date}</td>
                <td className="p-1.5 text-center num font-bold">{d.attempts}</td>
                <td className="p-1.5 text-center num text-emerald-700 dark:text-emerald-300">{d.newStudents}</td>
                <td className="p-1.5 text-center num">{d.avgPct}%</td>
                <td className="p-1.5">
                  <div className="flex items-center gap-1">
                    <div className="flex-1 h-3 bg-violet-100 dark:bg-violet-900/30 rounded">
                      <div
                        className="h-3 bg-violet-500 rounded"
                        style={{ width: `${(d.attempts / maxAttempts) * 100}%` }}
                        aria-label={`محاولات ${d.attempts}`}
                      />
                    </div>
                    <div className="flex-1 h-3 bg-emerald-100 dark:bg-emerald-900/30 rounded">
                      <div
                        className="h-3 bg-emerald-500 rounded"
                        style={{ width: `${(d.newStudents / maxNew) * 100}%` }}
                        aria-label={`طالبات جدد ${d.newStudents}`}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BulkImportModal({ sections, onClose, onDone }: { sections: Section[]; onClose: () => void; onDone: () => void }) {
  const [raw, setRaw] = useState("");
  const [defaultSlug, setDefaultSlug] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    created: number;
    attempted: number;
    errors: { row: number; error: string }[];
  } | null>(null);

  const sectionOptions = sections.map((s) => ({
    slug: s.slug,
    label: `${s.chapter.title} — ${s.title}`,
  }));

  function parseRows(input: string): unknown[] {
    const trimmed = input.trim();
    if (!trimmed) return [];
    // JSON path: either an array or a {rows:[...]}/{questions:[...]} object.
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.rows)) return parsed.rows;
      if (parsed && Array.isArray(parsed.questions)) return parsed.questions;
      throw new Error("JSON غير صالح — يجب أن يكون مصفوفة أسئلة");
    }
    // CSV path: header row + per-question rows. Only supports mcq + tf + fill
    // because nested payload doesn't fit cleanly in CSV.
    const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) throw new Error("يجب سطر عناوين + صفّ واحد على الأقل");
    const header = parseCsvLine(lines[0]);
    const headerIdx = (name: string) => header.indexOf(name);
    const iSlug = headerIdx("sectionSlug");
    const iType = headerIdx("type");
    const iPrompt = headerIdx("prompt");
    const iOpts = headerIdx("options");
    const iAnswer = headerIdx("answer");
    const iAnswers = headerIdx("answers");
    const iExpl = headerIdx("explanation");
    const iDiff = headerIdx("difficulty");
    if (iType < 0 || iPrompt < 0) throw new Error("عمودا type و prompt إلزاميّان");
    const rows: unknown[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = parseCsvLine(lines[i]);
      const type = (cells[iType] || "").trim();
      const prompt = (cells[iPrompt] || "").trim();
      const slug = iSlug >= 0 ? (cells[iSlug] || "").trim() : "";
      const expl = iExpl >= 0 ? (cells[iExpl] || "").trim() : "";
      const diffStr = iDiff >= 0 ? (cells[iDiff] || "1").trim() : "1";
      const difficulty = Math.min(3, Math.max(1, Number(diffStr) || 1));
      const row: any = { type, prompt, explanation: expl, difficulty };
      if (slug) row.sectionSlug = slug;
      else if (defaultSlug) row.sectionSlug = defaultSlug;
      if (type === "mcq") {
        const opts = (iOpts >= 0 ? cells[iOpts] || "" : "").split("|").map((s) => s.trim()).filter(Boolean);
        const ans = Math.max(0, Number(iAnswer >= 0 ? cells[iAnswer] : 0) || 0);
        row.payload = { options: opts, answer: ans };
      } else if (type === "tf") {
        const v = (iAnswer >= 0 ? cells[iAnswer] || "" : "").trim().toLowerCase();
        row.payload = { answer: v === "true" || v === "1" || v === "صح" || v === "صحيح" };
      } else if (type === "fill") {
        const arr = (iAnswers >= 0 ? cells[iAnswers] || "" : "").split("|").map((s) => s.trim()).filter(Boolean);
        row.payload = { answers: arr };
      } else {
        // For match/order, expect a JSON column "payload_json" or skip.
        const iPayload = headerIdx("payload_json");
        if (iPayload >= 0) {
          try {
            row.payload = JSON.parse(cells[iPayload] || "{}");
          } catch {
            row.payload = {};
          }
        } else {
          row.payload = {};
        }
      }
      rows.push(row);
    }
    return rows;
  }

  function parseCsvLine(line: string): string[] {
    const out: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQ) {
        if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (c === '"') inQ = false;
        else cur += c;
      } else if (c === '"') {
        inQ = true;
      } else if (c === ",") {
        out.push(cur);
        cur = "";
      } else cur += c;
    }
    out.push(cur);
    return out.map((s) => s.trim());
  }

  async function submit() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const parsed = parseRows(raw);
      if (parsed.length === 0) {
        setError("لا توجد صفوف لاستيرادها");
        return;
      }
      // Inject defaultSlug for JSON rows that don't specify a section.
      const rows = parsed.map((r: any) => {
        if (!r.sectionSlug && !r.sectionId && defaultSlug) {
          return { ...r, sectionSlug: defaultSlug };
        }
        return r;
      });
      const res = await fetch("/api/admin/questions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "تعذّر الاستيراد");
      setResult({ created: json.created, attempted: json.attempted, errors: json.errors || [] });
      if ((json.errors || []).length === 0) {
        setTimeout(onDone, 1500);
      }
    } catch (e: any) {
      setError(e.message || "خطأ");
    } finally {
      setBusy(false);
    }
  }

  function fillExample() {
    const example = [
      {
        sectionSlug: sectionOptions[0]?.slug || "section-slug-here",
        type: "mcq",
        prompt: "كم تساوي 2 + 3؟",
        payload: { options: ["4", "5", "6", "7"], answer: 1 },
        explanation: "2+3 = 5",
        difficulty: 1,
      },
      {
        sectionSlug: sectionOptions[0]?.slug || "section-slug-here",
        type: "tf",
        prompt: "العدد 7 عدد أوّليّ.",
        payload: { answer: true },
        difficulty: 1,
      },
    ];
    setRaw(JSON.stringify(example, null, 2));
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 grid place-items-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="card p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-extrabold text-violet-900 dark:text-violet-100 mb-3">📥 استيراد أسئلة دفعة واحدة</h3>
        <p className="text-xs text-violet-600 dark:text-violet-300/80 mb-3">
          ألصقي JSON (مصفوفة أسئلة أو كائن فيه rows) أو CSV بأعمدة:
          <span className="font-mono" dir="ltr"> sectionSlug,type,prompt,options,answer,answers,explanation,difficulty</span>.
          الحدّ الأقصى للدفعة: 500 صفّاً.
        </p>
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="label">القسم الافتراضيّ (حين لا يوجد في الصفّ)</label>
            <select value={defaultSlug} onChange={(e) => setDefaultSlug(e.target.value)} className="input">
              <option value="">— غير محدّد —</option>
              {sectionOptions.map((s) => (
                <option key={s.slug} value={s.slug}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={fillExample} className="btn-ghost text-sm">📄 إدراج مثال</button>
          </div>
        </div>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          className="input min-h-[260px] font-mono text-xs"
          dir="ltr"
          placeholder='[{"sectionSlug":"...","type":"mcq","prompt":"...","payload":{"options":["...","..."],"answer":0}}]'
        />
        {error && <div className="mt-3 text-sm text-rose-600">{error}</div>}
        {result && (
          <div className="mt-3 text-sm">
            <div className="font-bold text-emerald-700 dark:text-emerald-300">تمّ إنشاء <span className="num">{result.created}</span> من أصل <span className="num">{result.attempted}</span>.</div>
            {result.errors.length > 0 && (
              <div className="mt-2 p-2 bg-rose-50 dark:bg-rose-950/40 rounded">
                <div className="font-bold text-rose-700 dark:text-rose-300 mb-1">صفوف تجاوزت:</div>
                <ul className="text-xs space-y-1 text-rose-700 dark:text-rose-200">
                  {result.errors.slice(0, 20).map((er, i) => (
                    <li key={i}>الصفّ <span className="num">{er.row}</span>: {er.error}</li>
                  ))}
                  {result.errors.length > 20 && <li>، و {result.errors.length - 20} أخرى…</li>}
                </ul>
              </div>
            )}
          </div>
        )}
        <div className="mt-5 flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary">إغلاق</button>
          <button onClick={submit} className="btn-primary" disabled={busy || !raw.trim()}>{busy ? "جارٍ…" : "استيراد"}</button>
        </div>
      </div>
    </div>
  );
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  mcq: "اختيار",
  tf: "صح/خطأ",
  fill: "أكمل الفراغ",
  match: "مطابقة",
  order: "ترتيب",
};

function labelForType(t: string) {
  return QUESTION_TYPE_LABELS[t] ?? t;
}

type QuestionType = "mcq" | "tf" | "fill" | "match" | "order";

function QuestionEditor({ sections, initial, onClose, onSaved }: { sections: Section[]; initial: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<any>(() => ({
    id: initial.id,
    sectionId: initial.sectionId || sections[0]?.id || "",
    type: initial.type || "mcq",
    prompt: initial.prompt || "",
    explanation: initial.explanation || "",
    difficulty: initial.difficulty || 1,
    payload: initial.payload || (initial.type === "tf" ? { answer: true } : initial.type === "fill" ? { answers: [""] } : { options: ["", "", "", ""], answer: 0 }),
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const payload = form.payload;
      const body = { ...form, payload };
      const url = "/api/admin/questions";
      const method = form.id ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "خطأ");
      onSaved();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 grid place-items-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-extrabold text-violet-900 dark:text-violet-100 mb-3">{form.id ? "تعديل سؤال" : "سؤال جديد"}</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">القسم</label>
            <select value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })} className="input">
              {sections.map((s) => <option key={s.id} value={s.id}>{s.chapter.title} — {s.title}</option>)}
            </select>
          </div>
          <div>
            <label className="label">النوع</label>
            <select
              value={form.type}
              onChange={(e) => {
                const t = e.target.value as QuestionType;
                const payload = t === "tf" ? { answer: true }
                  : t === "fill" ? { answers: [""] }
                  : t === "mcq" ? { options: ["", "", "", ""], answer: 0 }
                  : t === "match" ? { left: [""], right: [""], pairs: [0] }
                  : t === "order" ? { items: [""], correct: [0] }
                  : {};
                setForm({ ...form, type: t, payload });
              }}
              className="input"
            >
              <option value="mcq">اختيار من متعدد</option>
              <option value="tf">صح / خطأ</option>
              <option value="fill">أكمل الفراغ</option>
              <option value="match">مطابقة</option>
              <option value="order">ترتيب</option>
            </select>
          </div>
        </div>
        <label className="label mt-3">نص السؤال</label>
        <textarea value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })} className="input min-h-[80px]" />

        <PayloadEditor type={form.type} payload={form.payload} onChange={(p) => setForm({ ...form, payload: p })} />

        <label className="label mt-3">شرح الإجابة</label>
        <textarea value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} className="input min-h-[60px]" />

        <label className="label mt-3">المستوى ({form.difficulty})</label>
        <input type="range" min={1} max={3} value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: Number(e.target.value) })} className="w-full" />

        {error && <div className="mt-3 text-sm text-rose-600">{error}</div>}
        <div className="mt-5 flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary">إلغاء</button>
          <button onClick={save} className="btn-primary" disabled={saving}>{saving ? "..." : "حفظ"}</button>
        </div>
      </div>
    </div>
  );
}

function PayloadEditor({ type, payload, onChange }: { type: string; payload: any; onChange: (p: any) => void }) {
  if (type === "mcq") {
    const opts: string[] = payload.options || ["", "", "", ""];
    return (
      <div className="mt-3">
        <label className="label">الخيارات</label>
        {opts.map((o, i) => (
          <div key={i} className="flex gap-2 items-center mb-2">
            <input
              type="radio"
              name="mcq-answer"
              checked={payload.answer === i}
              onChange={() => onChange({ ...payload, answer: i })}
            />
            <input
              value={o}
              onChange={(e) => { const c = [...opts]; c[i] = e.target.value; onChange({ ...payload, options: c }); }}
              className="input flex-1"
              placeholder={`الخيار ${i + 1}`}
            />
            <button type="button" className="text-rose-600 text-sm" onClick={() => { const c = opts.filter((_, j) => j !== i); onChange({ ...payload, options: c, answer: 0 }); }}>×</button>
          </div>
        ))}
        <button type="button" onClick={() => onChange({ ...payload, options: [...opts, ""] })} className="text-violet-700 text-sm">＋ خيار جديد</button>
      </div>
    );
  }
  if (type === "tf") {
    return (
      <div className="mt-3">
        <label className="label">الإجابة الصحيحة</label>
        <div className="flex gap-2">
          <label className="flex items-center gap-2"><input type="radio" checked={payload.answer === true} onChange={() => onChange({ answer: true })} /> صحيح</label>
          <label className="flex items-center gap-2 me-3"><input type="radio" checked={payload.answer === false} onChange={() => onChange({ answer: false })} /> خطأ</label>
        </div>
      </div>
    );
  }
  if (type === "fill") {
    const answers: string[] = payload.answers || [""];
    return (
      <div className="mt-3">
        <label className="label">الإجابات المقبولة</label>
        {answers.map((a, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input value={a} onChange={(e) => { const c = [...answers]; c[i] = e.target.value; onChange({ answers: c }); }} className="input flex-1" placeholder={`إجابة مقبولة ${i + 1}`} />
            <button type="button" className="text-rose-600" onClick={() => onChange({ answers: answers.filter((_, j) => j !== i) })}>×</button>
          </div>
        ))}
        <button type="button" onClick={() => onChange({ answers: [...answers, ""] })} className="text-violet-700 text-sm">＋ إجابة بديلة</button>
      </div>
    );
  }
  return <div className="mt-3 text-sm text-amber-700">حرّري الـ JSON يدوياً (متقدم).</div>;
}

function QuizzesTab({ chapters }: { chapters: Chapter[] }) {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  function load() {
    setLoading(true);
    fetch("/api/admin/quizzes", { cache: "no-store" }).then((r) => r.json()).then((d) => {
      setQuizzes(d.quizzes || []);
      setLoading(false);
    });
  }
  useEffect(() => { load(); }, []);

  async function patch(id: string, body: any) {
    await fetch("/api/admin/quizzes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...body }) });
    load();
  }
  async function remove(id: string) {
    if (!confirm("حذف الاختبار؟")) return;
    await fetch("/api/admin/quizzes", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load();
  }
  const _ = chapters;

  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm min-w-[700px]">
        <thead className="text-violet-500 dark:text-violet-300/70 text-right">
          <tr>
            <th className="p-3">العنوان</th>
            <th className="p-3">الفصل</th>
            <th className="p-3">القسم</th>
            <th className="p-3">النوع</th>
            <th className="p-3">المدة</th>
            <th className="p-3">أسئلة</th>
            <th className="p-3">محاولات</th>
            <th className="p-3">الحالة</th>
            <th className="p-3">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {loading && <tr><td colSpan={9} className="p-4 text-center text-violet-500">تحميل…</td></tr>}
          {quizzes.map((q) => (
            <tr key={q.id} className="border-t border-violet-100 dark:border-violet-900/40">
              <td className="p-3 font-semibold">{q.title}</td>
              <td className="p-3">{q.chapter?.title ?? "—"}</td>
              <td className="p-3">{q.section?.title ?? "—"}</td>
              <td className="p-3"><span className="chip">{q.kind}</span></td>
              <td className="p-3 num">{q.durationSec}ث</td>
              <td className="p-3 num">{q._count.items}</td>
              <td className="p-3 num">{q._count.attempts}</td>
              <td className="p-3">
                {q.isActive
                  ? <span className="chip bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">مفعّل</span>
                  : <span className="chip bg-amber-100 text-amber-700">معطّل</span>}
              </td>
              <td className="p-3 whitespace-nowrap">
                <button onClick={() => patch(q.id, { isActive: !q.isActive })} className="text-xs text-violet-700 hover:underline me-2">
                  {q.isActive ? "تعطيل" : "تفعيل"}
                </button>
                <button onClick={() => remove(q.id)} className="text-xs text-rose-600 hover:underline">حذف</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SettingsTab() {
  const [settings, setSettings] = useState<{ key: string; value: string }[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  function load() {
    fetch("/api/admin/settings", { cache: "no-store" }).then((r) => r.json()).then((d) => setSettings(d.settings || []));
  }
  useEffect(() => { load(); }, []);

  async function save(key: string, value: string) {
    setSaving(key);
    setMsg(null);
    const res = await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, value }) });
    setSaving(null);
    if (res.ok) {
      setMsg("تم الحفظ ✅");
      load();
      setTimeout(() => setMsg(null), 2000);
    }
  }

  function upsertLocal(k: string, v: string) {
    setSettings((cur) => {
      const idx = cur.findIndex((s) => s.key === k);
      const next = [...cur];
      if (idx >= 0) next[idx] = { key: k, value: v };
      else next.push({ key: k, value: v });
      return next;
    });
  }

  const get = (k: string, d = "") => settings.find((s) => s.key === k)?.value ?? d;

  const fields = [
    { key: "site_name", label: "اسم الموقع", type: "text" },
    { key: "site_tagline", label: "الشعار / الوصف القصير", type: "text" },
    { key: "registration_open", label: "السماح بالتسجيل", type: "bool" },
    { key: "daily_quiz_slug", label: "تحدّي اليوم — رابط الاختبار (slug)", type: "text", help: "اكتبي slug اختبار موجود لتفعيله كتحدّي يومي. اتركيه فارغاً لإخفاء البانر." },
    { key: "daily_quiz_bonus", label: "تحدّي اليوم — نقاط المكافأة (افتراضي 20)", type: "text" },
    { key: "question_reports_enabled", label: "تفعيل الإبلاغ عن أخطاء الأسئلة", type: "bool" },
    { key: "social_share_enabled", label: "تفعيل مشاركة النتائج على وسائل التواصل", type: "bool" },
    { key: "email_verification_required", label: "اشتراط تأكيد البريد عند الدخول", type: "bool" },
    { key: "support_email", label: "بريد الدعم", type: "text" },
    { key: "announcement_enabled", label: "تفعيل بانر الإعلانات", type: "bool", help: "يظهر في أعلى كلّ صفحة للطالبات. يختفي تلقائياً لو النصّ فارغ." },
    { key: "announcement_text", label: "نصّ الإعلان", type: "text" },
    { key: "announcement_level", label: "نوع الإعلان (info / warning / success)", type: "text", help: "القيم المقبولة: info (افتراضي) ، warning ، success." },
    { key: "guest_demo_enabled", label: "تفعيل التجربة المجّانية /demo", type: "bool", help: "صفحة /demo تعرض ٥ أسئلة عيّنة بلا تسجيل لجذب الزوّار. اضبطيه على \"معطّل\" لإخفائها." },
    { key: "mock_exam_enabled", label: "تفعيل امتحان المحاكاة", type: "bool", help: "يُظهر بطاقة على لوحة الطالبة وصفحة /mock-exam." },
    { key: "mock_exam_slug", label: "امتحان المحاكاة — رابط الاختبار (slug)", type: "text", help: "اكتبي slug اختبار موجود (مفعّل) ليستخدم كامتحان محاكاة. سيتقدّم الطالبات عبر الاختبار العادي." },
    { key: "mock_exam_duration_min", label: "امتحان المحاكاة — مدّة بالدقائق (اختياريّة)", type: "text", help: "اتركيه فارغاً لاستخدام مدّة الاختبار الأصليّة. الحدّ الأقصى ٢٤٠ دقيقة." },
    { key: "parent_links_enabled", label: "تفعيل روابط الوالدَين (متابعة الطالبة)", type: "bool", help: "يسمح للطالبة بإنشاء روابط للقراءة فقط من /profile لمشاركة تقدّمها مع وليّ الأمر." },
    { key: "contact_form_enabled", label: "تفعيل نموذج التواصل /contact", type: "bool", help: "يظهر رابط \"تواصلي معنا\" في الـ footer. الرسائل تصل تبويب رسائل التواصل في لوحة الإدارة." },
  ] as { key: string; label: string; type: string; help?: string }[];

  return (
    <div className="space-y-3 max-w-2xl">
      {fields.map((f) => (
        <div key={f.key} className="card p-4">
          <label className="label">{f.label}</label>
          {f.type === "bool" ? (
            <div className="flex gap-3">
              <label className="flex items-center gap-2"><input type="radio" checked={get(f.key, "true") === "true"} onChange={() => upsertLocal(f.key, "true")} /> مفعّل</label>
              <label className="flex items-center gap-2"><input type="radio" checked={get(f.key, "true") === "false"} onChange={() => upsertLocal(f.key, "false")} /> معطّل</label>
            </div>
          ) : (
            <input value={get(f.key)} onChange={(e) => upsertLocal(f.key, e.target.value)} className="input" />
          )}
          {f.help && <div className="text-xs text-violet-500 mt-1">{f.help}</div>}
          <button onClick={() => save(f.key, get(f.key))} className="btn-primary text-sm mt-3" disabled={saving === f.key}>
            {saving === f.key ? "..." : "حفظ"}
          </button>
        </div>
      ))}
      {msg && <div className="text-emerald-600 text-sm">{msg}</div>}
    </div>
  );
}
