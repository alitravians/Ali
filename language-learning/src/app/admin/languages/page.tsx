"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Language {
  id: string;
  name: string;
  nameAr: string;
  code: string;
  flag: string;
  description: string;
  isActive: boolean;
  _count: { levels: number };
}

export default function AdminLanguagesPage() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Language | null>(null);
  const [form, setForm] = useState({ name: "", nameAr: "", code: "", flag: "", description: "", isActive: true });

  const fetchData = () => {
    fetch("/api/languages")
      .then((r) => r.json())
      .then((data) => { setLanguages(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editing ? `/api/languages/${editing.id}` : "/api/languages";
    const method = editing ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowForm(false);
    setEditing(null);
    setForm({ name: "", nameAr: "", code: "", flag: "", description: "", isActive: true });
    fetchData();
  };

  const handleEdit = (lang: Language) => {
    setEditing(lang);
    setForm({ name: lang.name, nameAr: lang.nameAr, code: lang.code, flag: lang.flag || "", description: lang.description || "", isActive: lang.isActive });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه اللغة؟")) return;
    await fetch(`/api/languages/${id}`, { method: "DELETE" });
    fetchData();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">إدارة اللغات</h1>
            <div className="flex gap-2">
              <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ name: "", nameAr: "", code: "", flag: "", description: "", isActive: true }); }} className="btn-primary text-sm">
                + إضافة لغة
              </button>
              <Link href="/admin" className="btn-secondary text-sm">← لوحة التحكم</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {showForm && (
          <div className="card p-6 mb-6 animate-fadeIn">
            <h3 className="font-bold text-gray-900 mb-4">{editing ? "تعديل اللغة" : "إضافة لغة جديدة"}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم اللغة (إنجليزي)</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم اللغة (عربي)</label>
                <input type="text" value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">كود اللغة (مثل: en, fr)</label>
                <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="input-field" required dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العلم (إيموجي)</label>
                <input type="text" value={form.flag} onChange={(e) => setForm({ ...form, flag: e.target.value })} className="input-field" dir="ltr" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">وصف</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" rows={2} />
              </div>
              <div className="md:col-span-2 flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-5 h-5 rounded" />
                  <span className="text-sm text-gray-700">نشطة</span>
                </label>
                <div className="flex-1"></div>
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="btn-secondary text-sm">إلغاء</button>
                <button type="submit" className="btn-primary text-sm">{editing ? "حفظ التعديلات" : "إضافة"}</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16"><div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div></div>
        ) : languages.length === 0 ? (
          <div className="text-center py-16"><p className="text-gray-500">لا توجد لغات</p></div>
        ) : (
          <div className="space-y-4">
            {languages.map((lang) => (
              <div key={lang.id} className="card p-5 flex items-center gap-4">
                <div className="text-4xl">{lang.flag || "🌐"}</div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{lang.nameAr} ({lang.name})</h3>
                  <p className="text-sm text-gray-500">كود: {lang.code} • {lang._count.levels} مستوى</p>
                </div>
                <span className={`badge text-xs ${lang.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                  {lang.isActive ? "نشطة" : "غير نشطة"}
                </span>
                <button onClick={() => handleEdit(lang)} className="btn-secondary text-xs">تعديل</button>
                <button onClick={() => handleDelete(lang.id)} className="btn-danger text-xs">حذف</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
