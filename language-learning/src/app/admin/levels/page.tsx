"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Level {
  id: string;
  name: string;
  nameAr: string;
  order: number;
  description: string;
  language: { id: string; name: string; nameAr: string; flag: string };
  _count: { lessons: number; tests: number };
}

interface Language {
  id: string;
  name: string;
  nameAr: string;
  flag: string;
}

export default function AdminLevelsPage() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Level | null>(null);
  const [form, setForm] = useState({ name: "", nameAr: "", order: 1, description: "", languageId: "", passingScore: 70 });

  const fetchData = () => {
    Promise.all([
      fetch("/api/levels").then((r) => r.json()),
      fetch("/api/languages").then((r) => r.json()),
    ]).then(([lvls, langs]) => {
      setLevels(Array.isArray(lvls) ? lvls : []);
      setLanguages(Array.isArray(langs) ? langs : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editing ? `/api/levels/${editing.id}` : "/api/levels";
    const method = editing ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowForm(false);
    setEditing(null);
    setForm({ name: "", nameAr: "", order: 1, description: "", languageId: "", passingScore: 70 });
    fetchData();
  };

  const handleEdit = (level: Level) => {
    setEditing(level);
    setForm({ name: level.name, nameAr: level.nameAr, order: level.order, description: level.description || "", languageId: level.language.id, passingScore: 70 });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المستوى؟")) return;
    await fetch(`/api/levels/${id}`, { method: "DELETE" });
    fetchData();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">إدارة المستويات</h1>
            <div className="flex gap-2">
              <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ name: "", nameAr: "", order: 1, description: "", languageId: languages[0]?.id || "", passingScore: 70 }); }} className="btn-primary text-sm">+ إضافة مستوى</button>
              <Link href="/admin" className="btn-secondary text-sm">← لوحة التحكم</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {showForm && (
          <div className="card p-6 mb-6 animate-fadeIn">
            <h3 className="font-bold text-gray-900 mb-4">{editing ? "تعديل المستوى" : "إضافة مستوى جديد"}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اللغة</label>
                <select value={form.languageId} onChange={(e) => setForm({ ...form, languageId: e.target.value })} className="input-field" required>
                  <option value="">اختر اللغة</option>
                  {languages.map((l) => <option key={l.id} value={l.id}>{l.nameAr} ({l.name})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الترتيب</label>
                <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) })} className="input-field" min={1} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم المستوى (إنجليزي)</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم المستوى (عربي)</label>
                <input type="text" value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">درجة النجاح (%)</label>
                <input type="number" value={form.passingScore} onChange={(e) => setForm({ ...form, passingScore: parseInt(e.target.value) })} className="input-field" min={0} max={100} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">وصف</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" />
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
        ) : levels.length === 0 ? (
          <div className="text-center py-16"><p className="text-gray-500">لا توجد مستويات</p></div>
        ) : (
          <div className="space-y-4">
            {levels.map((level) => (
              <div key={level.id} className="card p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600 font-bold text-xl">{level.order}</div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{level.nameAr} ({level.name})</h3>
                  <p className="text-sm text-gray-500">{level.language.flag} {level.language.nameAr} • {level._count.lessons} درس • {level._count.tests} اختبار</p>
                </div>
                <button onClick={() => handleEdit(level)} className="btn-secondary text-xs">تعديل</button>
                <button onClick={() => handleDelete(level.id)} className="btn-danger text-xs">حذف</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
