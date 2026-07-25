"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Question {
  id: string;
  type: string;
  question: string;
  questionAr: string;
  options: string;
  answer: string;
  explanation: string;
  points: number;
  lesson: { id: string; titleAr: string; level: { nameAr: string; language: { nameAr: string; flag: string } } };
}

interface Lesson {
  id: string;
  title: string;
  titleAr: string;
  level: { nameAr: string; language: { nameAr: string; flag: string } };
}

const questionTypes = [
  { value: "multiple_choice", label: "اختيار من متعدد" },
  { value: "matching", label: "توصيل" },
  { value: "writing", label: "كتابة" },
  { value: "listening", label: "استماع" },
  { value: "pronunciation", label: "نطق" },
];

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [form, setForm] = useState({
    type: "multiple_choice", question: "", questionAr: "", options: "", answer: "", explanation: "", points: 10, lessonId: "",
  });

  const fetchData = () => {
    Promise.all([
      fetch("/api/questions").then((r) => r.json()),
      fetch("/api/lessons").then((r) => r.json()),
    ]).then(([qs, lsns]) => {
      setQuestions(Array.isArray(qs) ? qs : []);
      setLessons(Array.isArray(lsns) ? lsns : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editing ? `/api/questions/${editing.id}` : "/api/questions";
    const method = editing ? "PUT" : "POST";
    // Parse options as JSON array for multiple choice
    let body = { ...form };
    if (form.type === "multiple_choice" || form.type === "matching" || form.type === "listening") {
      try {
        const optArr = form.options.split(",").map((o) => o.trim()).filter(Boolean);
        body = { ...body, options: JSON.stringify(optArr) };
      } catch {
        body = { ...body, options: "[]" };
      }
    }
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setShowForm(false);
    setEditing(null);
    setForm({ type: "multiple_choice", question: "", questionAr: "", options: "", answer: "", explanation: "", points: 10, lessonId: "" });
    fetchData();
  };

  const handleEdit = (q: Question) => {
    setEditing(q);
    let opts = q.options;
    try { opts = JSON.parse(q.options).join(", "); } catch { /* keep as is */ }
    setForm({ type: q.type, question: q.question, questionAr: q.questionAr || "", options: opts, answer: q.answer, explanation: q.explanation || "", points: q.points, lessonId: q.lesson.id });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا السؤال؟")) return;
    await fetch(`/api/questions/${id}`, { method: "DELETE" });
    fetchData();
  };

  const getTypeBadge = (type: string) => {
    const t = questionTypes.find((qt) => qt.value === type);
    const colors: Record<string, string> = {
      multiple_choice: "bg-blue-100 text-blue-700",
      matching: "bg-emerald-100 text-emerald-700",
      writing: "bg-purple-100 text-purple-700",
      listening: "bg-amber-100 text-amber-700",
      pronunciation: "bg-pink-100 text-pink-700",
    };
    return <span className={`badge text-xs ${colors[type] || "bg-gray-100 text-gray-700"}`}>{t?.label || type}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">إدارة الأسئلة</h1>
            <div className="flex gap-2">
              <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ type: "multiple_choice", question: "", questionAr: "", options: "", answer: "", explanation: "", points: 10, lessonId: lessons[0]?.id || "" }); }} className="btn-primary text-sm">+ إضافة سؤال</button>
              <Link href="/admin" className="btn-secondary text-sm">← لوحة التحكم</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {showForm && (
          <div className="card p-6 mb-6 animate-fadeIn">
            <h3 className="font-bold text-gray-900 mb-4">{editing ? "تعديل السؤال" : "إضافة سؤال جديد"}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الدرس</label>
                <select value={form.lessonId} onChange={(e) => setForm({ ...form, lessonId: e.target.value })} className="input-field" required>
                  <option value="">اختر الدرس</option>
                  {lessons.map((l) => <option key={l.id} value={l.id}>{l.level.language.flag} {l.level.nameAr} - {l.titleAr}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع السؤال</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input-field" required>
                  {questionTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">السؤال (إنجليزي)</label>
                <input type="text" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} className="input-field" required dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">السؤال (عربي)</label>
                <input type="text" value={form.questionAr} onChange={(e) => setForm({ ...form, questionAr: e.target.value })} className="input-field" />
              </div>
              {(form.type === "multiple_choice" || form.type === "matching" || form.type === "listening") && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">الخيارات (مفصولة بفاصلة)</label>
                  <input type="text" value={form.options} onChange={(e) => setForm({ ...form, options: e.target.value })} className="input-field" placeholder="خيار1, خيار2, خيار3, خيار4" dir="ltr" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الإجابة الصحيحة</label>
                <input type="text" value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} className="input-field" required dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">النقاط</label>
                <input type="number" value={form.points} onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) })} className="input-field" min={1} required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">شرح الإجابة</label>
                <input type="text" value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} className="input-field" />
              </div>
              <div className="md:col-span-2 flex gap-2 justify-end">
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="btn-secondary text-sm">إلغاء</button>
                <button type="submit" className="btn-primary text-sm">{editing ? "حفظ" : "إضافة"}</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16"><div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div></div>
        ) : questions.length === 0 ? (
          <div className="text-center py-16"><p className="text-gray-500">لا توجد أسئلة</p></div>
        ) : (
          <div className="space-y-3">
            {questions.map((q) => (
              <div key={q.id} className="card p-4 flex items-center gap-3">
                {getTypeBadge(q.type)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{q.questionAr || q.question}</p>
                  <p className="text-xs text-gray-500">{q.lesson.level.language.flag} {q.lesson.level.nameAr} - {q.lesson.titleAr} • {q.points} نقطة</p>
                </div>
                <button onClick={() => handleEdit(q)} className="btn-secondary text-xs shrink-0">تعديل</button>
                <button onClick={() => handleDelete(q.id)} className="btn-danger text-xs shrink-0">حذف</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
