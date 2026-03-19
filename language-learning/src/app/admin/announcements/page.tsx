"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Announcement {
  id: string;
  title: string;
  content: string;
  importance: string;
  placement: string;
  targetType: string;
  targetUsers: string;
  status: string;
  isPinned: boolean;
  showOnce: boolean;
  publishedAt: string;
  expiresAt: string | null;
  viewCount: number;
  createdAt: string;
}

const IMPORTANCE = [
  { value: "normal", label: "عادي", color: "bg-gray-100 text-gray-700" },
  { value: "important", label: "مهم", color: "bg-amber-100 text-amber-700" },
  { value: "urgent", label: "عاجل", color: "bg-red-100 text-red-700" },
];

const PLACEMENT = [
  { value: "banner", label: "بانر علوي" },
  { value: "popup", label: "نافذة منبثقة" },
  { value: "chat_pin", label: "تثبيت في الدردشة" },
  { value: "notification_center", label: "مركز الإشعارات" },
];

const TARGET = [
  { value: "all", label: "الجميع" },
  { value: "members", label: "الأعضاء فقط" },
  { value: "moderators", label: "المشرفين فقط" },
  { value: "specific", label: "مستخدمين محددين" },
];

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [importance, setImportance] = useState("normal");
  const [placement, setPlacement] = useState("banner");
  const [targetType, setTargetType] = useState("all");
  const [targetUsers, setTargetUsers] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [showOnce, setShowOnce] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/announcements");
      const data = await res.json();
      if (Array.isArray(data)) setAnnouncements(data);
    } catch { /* */ }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setTitle(""); setContent(""); setImportance("normal"); setPlacement("banner");
    setTargetType("all"); setTargetUsers(""); setIsPinned(false); setShowOnce(false); setExpiresAt("");
    setEditing(null);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;
    const body: Record<string, unknown> = { title, content, importance, placement, targetType, targetUsers, isPinned, showOnce };
    if (expiresAt) body.expiresAt = new Date(expiresAt).toISOString();
    if (editing) body.id = editing.id;

    await fetch("/api/admin/announcements", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setShowModal(false);
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف هذا الإعلان؟")) return;
    await fetch(`/api/admin/announcements?id=${id}`, { method: "DELETE" });
    fetchData();
  };

  const openEdit = (a: Announcement) => {
    setEditing(a); setTitle(a.title); setContent(a.content); setImportance(a.importance);
    setPlacement(a.placement); setTargetType(a.targetType); setTargetUsers(a.targetUsers);
    setIsPinned(a.isPinned); setShowOnce(a.showOnce);
    setExpiresAt(a.expiresAt ? new Date(a.expiresAt).toISOString().slice(0, 16) : "");
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
            <h1 className="text-xl font-bold text-gray-900">📢 إدارة الإعلانات</h1>
            <div className="flex gap-2">
              <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary text-sm">+ إعلان جديد</button>
              <Link href="/admin" className="btn-secondary text-sm">← لوحة التحكم</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {announcements.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-4xl mb-3">📢</p>
            <p className="text-gray-500">لا توجد إعلانات بعد</p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((a) => (
              <div key={a.id} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {a.isPinned && <span className="text-amber-500">📌</span>}
                      <h3 className="font-bold text-gray-900">{a.title}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${IMPORTANCE.find((i) => i.value === a.importance)?.color}`}>
                        {IMPORTANCE.find((i) => i.value === a.importance)?.label}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700">
                        {PLACEMENT.find((p) => p.value === a.placement)?.label}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs bg-purple-50 text-purple-700">
                        {TARGET.find((t) => t.value === a.targetType)?.label}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{a.content}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>👁 {a.viewCount} مشاهدة</span>
                      <span>{new Date(a.createdAt).toLocaleDateString("ar")}</span>
                      {a.expiresAt && <span>ينتهي: {new Date(a.expiresAt).toLocaleDateString("ar")}</span>}
                      {a.showOnce && <span>يظهر مرة واحدة</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(a)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="تعديل">✏️</button>
                    <button onClick={() => handleDelete(a.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors" title="حذف">🗑️</button>
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 mb-4">{editing ? "تعديل الإعلان" : "إعلان جديد"}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 border rounded-xl" placeholder="عنوان الإعلان" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المحتوى</label>
                <textarea value={content} onChange={(e) => setContent(e.target.value)} className="w-full p-3 border rounded-xl" rows={4} placeholder="نص الإعلان" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الأهمية</label>
                  <select value={importance} onChange={(e) => setImportance(e.target.value)} className="w-full p-3 border rounded-xl">
                    {IMPORTANCE.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">مكان العرض</label>
                  <select value={placement} onChange={(e) => setPlacement(e.target.value)} className="w-full p-3 border rounded-xl">
                    {PLACEMENT.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الاستهداف</label>
                  <select value={targetType} onChange={(e) => setTargetType(e.target.value)} className="w-full p-3 border rounded-xl">
                    {TARGET.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الانتهاء</label>
                  <input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="w-full p-3 border rounded-xl" />
                </div>
              </div>
              {targetType === "specific" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">معرّفات المستخدمين (مفصولة بفواصل)</label>
                  <input value={targetUsers} onChange={(e) => setTargetUsers(e.target.value)} className="w-full p-3 border rounded-xl" placeholder="user1,user2" />
                </div>
              )}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} className="w-4 h-4 rounded" />
                  <span className="text-sm">📌 تثبيت</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showOnce} onChange={(e) => setShowOnce(e.target.checked)} className="w-4 h-4 rounded" />
                  <span className="text-sm">عرض مرة واحدة فقط</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} className="btn-primary flex-1">{editing ? "حفظ التعديلات" : "نشر الإعلان"}</button>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary flex-1">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
