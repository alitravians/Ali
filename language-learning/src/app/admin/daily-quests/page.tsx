"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Quest {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  type: string;
  target: number;
  xpReward: number;
  pointsReward: number;
  icon: string;
  isActive: boolean;
  order: number;
}

const QUEST_TYPES = [
  { value: "login", label: "تسجيل دخول" },
  { value: "messages", label: "إرسال رسائل" },
  { value: "activity", label: "نشاط عام" },
  { value: "study", label: "دراسة" },
];

export default function AdminDailyQuestsPage() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Quest | null>(null);

  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [type, setType] = useState("messages");
  const [target, setTarget] = useState(5);
  const [xpReward, setXpReward] = useState(50);
  const [pointsReward, setPointsReward] = useState(25);
  const [icon, setIcon] = useState("🎯");
  const [isActive, setIsActive] = useState(true);
  const [order, setOrder] = useState(0);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/daily-quests");
      const data = await res.json();
      if (Array.isArray(data)) setQuests(data);
    } catch { /* */ }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setNameAr(""); setNameEn(""); setDescriptionAr(""); setType("messages");
    setTarget(5); setXpReward(50); setPointsReward(25); setIcon("🎯");
    setIsActive(true); setOrder(0); setEditing(null);
  };

  const handleSave = async () => {
    if (!nameAr.trim()) return;
    const body: Record<string, unknown> = {
      nameAr, nameEn, descriptionAr, type, target, xpReward, pointsReward, icon, isActive, order,
    };
    if (editing) body.id = editing.id;
    await fetch("/api/admin/daily-quests", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setShowModal(false);
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف هذه المهمة؟")) return;
    await fetch(`/api/admin/daily-quests?id=${id}`, { method: "DELETE" });
    fetchData();
  };

  const openEdit = (q: Quest) => {
    setEditing(q); setNameAr(q.nameAr); setNameEn(q.nameEn); setDescriptionAr(q.descriptionAr);
    setType(q.type); setTarget(q.target); setXpReward(q.xpReward); setPointsReward(q.pointsReward);
    setIcon(q.icon); setIsActive(q.isActive); setOrder(q.order);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">🎯 إدارة المهام اليومية</h1>
            <div className="flex gap-2">
              <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary text-sm">+ مهمة جديدة</button>
              <Link href="/admin" className="btn-secondary text-sm">← لوحة التحكم</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {quests.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-4xl mb-3">🎯</p>
            <p className="text-gray-500">لا توجد مهام يومية بعد</p>
          </div>
        ) : (
          <div className="space-y-3">
            {quests.map((q) => (
              <div key={q.id} className={`card p-5 ${!q.isActive ? "opacity-60" : ""}`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-2xl">{q.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900">{q.nameAr}</h3>
                      <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                        {QUEST_TYPES.find((t) => t.value === q.type)?.label}
                      </span>
                      {!q.isActive && <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-600">معطّل</span>}
                    </div>
                    <p className="text-sm text-gray-500">{q.descriptionAr}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                      <span>الهدف: {q.target}</span>
                      <span>مكافأة: {q.xpReward} XP + {q.pointsReward} نقطة</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(q)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors">✏️</button>
                    <button onClick={() => handleDelete(q.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors">🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 mb-4">{editing ? "تعديل المهمة" : "مهمة جديدة"}</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الاسم بالعربي</label>
                  <input value={nameAr} onChange={(e) => setNameAr(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الاسم بالإنجليزي</label>
                  <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
                <textarea value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm" rows={2} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
                  <select value={type} onChange={(e) => setType(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm">
                    {QUEST_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الهدف</label>
                  <input type="number" value={target} onChange={(e) => setTarget(parseInt(e.target.value) || 1)} className="w-full p-2.5 border rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الأيقونة</label>
                  <input value={icon} onChange={(e) => setIcon(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">مكافأة XP</label>
                  <input type="number" value={xpReward} onChange={(e) => setXpReward(parseInt(e.target.value) || 0)} className="w-full p-2.5 border rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">مكافأة نقاط</label>
                  <input type="number" value={pointsReward} onChange={(e) => setPointsReward(parseInt(e.target.value) || 0)} className="w-full p-2.5 border rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الترتيب</label>
                  <input type="number" value={order} onChange={(e) => setOrder(parseInt(e.target.value) || 0)} className="w-full p-2.5 border rounded-xl text-sm" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 rounded" />
                <span className="text-sm">مفعّلة</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} className="btn-primary flex-1">{editing ? "حفظ" : "إضافة"}</button>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary flex-1">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
