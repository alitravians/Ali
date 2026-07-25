"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Lesson {
  id: string;
  title: string;
  titleAr: string;
  order: number;
  level: { id: string; name: string; nameAr: string; language: { nameAr: string; flag: string } };
  _count: { words: number; grammarRules: number; questions: number };
}

interface Level {
  id: string;
  name: string;
  nameAr: string;
  language: { nameAr: string; flag: string };
}

export default function AdminLessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [form, setForm] = useState({ title: "", titleAr: "", order: 1, content: "", levelId: "" });

  const fetchData = () => {
    Promise.all([
      fetch("/api/lessons").then((r) => r.json()),
      fetch("/api/levels").then((r) => r.json()),
    ]).then(([lsns, lvls]) => {
      setLessons(Array.isArray(lsns) ? lsns : []);
      setLevels(Array.isArray(lvls) ? lvls : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editing ? `/api/lessons/${editing.id}` : "/api/lessons";
    const method = editing ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowForm(false);
    setEditing(null);
    setForm({ title: "", titleAr: "", order: 1, content: "", levelId: "" });
    fetchData();
  };

  const handleEdit = (lesson: Lesson) => {
    setEditing(lesson);
    setForm({ title: lesson.title, titleAr: lesson.titleAr, order: lesson.order, content: "", levelId: lesson.level.id });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الدرس؟")) return;
    await fetch(`/api/lessons/${id}`, { method: "DELETE" });
    fetchData();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">إدارة الدروس</h1>
            <div className="flex gap-2">
              <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ title: "", titleAr: "", order: 1, content: "", levelId: levels[0]?.id || "" }); }} className="btn-primary text-sm">+ إضافة درس</button>
              <Link href="/admin" className="btn-secondary text-sm">← لوحة التحكم</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {showForm && (
          <div className="card p-6 mb-6 animate-fadeIn">
            <h3 className="font-bold text-gray-900 mb-4">{editing ? "تعديل الدرس" : "إضافة درس جديد"}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المستوى</label>
                <select value={form.levelId} onChange={(e) => setForm({ ...form, levelId: e.target.value })} className="input-field" required>
                  <option value="">اختر المستوى</option>
                  {levels.map((l) => <option key={l.id} value={l.id}>{l.language.flag} {l.language.nameAr} - {l.nameAr}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الترتيب</label>
                <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) })} className="input-field" min={1} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">عنوان الدرس (إنجليزي)</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" required dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">عنوان الدرس (عربي)</label>
                <input type="text" value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} className="input-field" required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">محتوى الدرس</label>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="input-field" rows={3} />
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
        ) : lessons.length === 0 ? (
          <div className="text-center py-16"><p className="text-gray-500">لا توجد دروس</p></div>
        ) : (
          <div className="space-y-4">
            {lessons.map((lesson) => (
              <div key={lesson.id} className="card p-5 flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 font-bold">{lesson.order}</div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-sm">{lesson.titleAr} ({lesson.title})</h3>
                  <p className="text-xs text-gray-500">
                    {lesson.level.language.flag} {lesson.level.language.nameAr} - {lesson.level.nameAr} • 
                    {lesson._count.words} كلمة • {lesson._count.grammarRules} قاعدة • {lesson._count.questions} سؤال
                  </p>
                </div>
                <button onClick={() => handleEdit(lesson)} className="btn-secondary text-xs">تعديل</button>
                <button onClick={() => handleDelete(lesson.id)} className="btn-danger text-xs">حذف</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
