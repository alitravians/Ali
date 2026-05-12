"use client";
import { useEffect, useState } from "react";
import TeamTab from "./team-tab";
import ReportsTab from "./reports-tab";

type Chapter = { id: string; slug: string; title: string; sections: { id: string; slug: string; title: string }[] };
type Section = { id: string; slug: string; title: string; chapter: { id: string; title: string } };

export default function AdminClient({ chapters, sections }: { chapters: Chapter[]; sections: Section[] }) {
  const [tab, setTab] = useState<"stats" | "users" | "questions" | "quizzes" | "team" | "reports" | "settings">("stats");
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
      {tab === "settings" && <SettingsTab />}
    </div>
  );
}

function StatsTab() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch("/api/admin/stats", { cache: "no-store" }).then((r) => r.json()).then(setData);
  }, []);
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
  const [questions, setQuestions] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  function load() {
    setLoading(true);
    const qs = filterSection ? `?sectionId=${filterSection}` : "";
    fetch(`/api/admin/questions${qs}`, { cache: "no-store" }).then((r) => r.json()).then((d) => {
      setQuestions(d.questions || []);
      setLoading(false);
    });
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [filterSection]);

  async function remove(id: string) {
    if (!confirm("حذف هذا السؤال؟")) return;
    await fetch("/api/admin/questions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load();
  }

  return (
    <div className="space-y-3">
      <div className="card p-4 flex flex-wrap items-center justify-between gap-3">
        <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)} className="input max-w-xs">
          <option value="">كل الأقسام</option>
          {sections.map((s) => (
            <option key={s.id} value={s.id}>{s.chapter.title} — {s.title}</option>
          ))}
        </select>
        <button onClick={() => setEditing({})} className="btn-primary">＋ سؤال جديد</button>
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

      {editing && (
        <QuestionEditor
          sections={sections}
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function labelForType(t: string) {
  return ({ mcq: "اختيار", tf: "صح/خطأ", fill: "أكمل الفراغ", match: "مطابقة", order: "ترتيب" } as any)[t] || t;
}

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
                const t = e.target.value as any;
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
