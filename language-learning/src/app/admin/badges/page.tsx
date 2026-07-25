"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

interface Badge {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  icon: string;
  imageUrl: string;
  color: string;
  category: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  _count: { assignments: number };
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

interface Assignment {
  id: string;
  badgeId: string;
  userId: string;
  assignedBy: string;
  note: string;
  createdAt: string;
  user: User;
  badge: { name: string; nameAr: string; icon: string; imageUrl: string; color: string };
}

const CATEGORIES: Record<string, string> = {
  general: "عامة",
  achievement: "إنجاز",
  rank: "رتبة",
  special: "خاصة",
  event: "حدث",
};

const CATEGORY_COLORS: Record<string, string> = {
  general: "bg-gray-100 text-gray-700",
  achievement: "bg-amber-100 text-amber-700",
  rank: "bg-purple-100 text-purple-700",
  special: "bg-pink-100 text-pink-700",
  event: "bg-blue-100 text-blue-700",
};

const EMOJI_OPTIONS = ["⭐", "🏆", "🎖️", "🛡️", "💎", "🔥", "⚡", "🌟", "👑", "🎯", "🏅", "💪", "🎓", "📚", "💡", "🌐", "🎨", "🎵", "❤️", "✨"];

export default function AdminBadgesPage() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"badges" | "assign">("badges");

  // Create/Edit badge form
  const [showForm, setShowForm] = useState(false);
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
  const [formData, setFormData] = useState({
    name: "", nameAr: "", description: "", descriptionAr: "",
    icon: "⭐", color: "#f59e0b", category: "general", order: 0,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Assign badge
  const [assignBadgeId, setAssignBadgeId] = useState("");
  const [assignUserId, setAssignUserId] = useState("");
  const [assignNote, setAssignNote] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignPermanent, setAssignPermanent] = useState(true);
  const [assignDuration, setAssignDuration] = useState(7);

  // View assignments
  const [viewBadge, setViewBadge] = useState<Badge | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  const fetchBadges = () => {
    fetch("/api/admin/badges?section=list")
      .then((r) => r.json())
      .then((data) => {
        setBadges(data.badges || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const fetchUsers = () => {
    fetch("/api/admin/badges?section=users")
      .then((r) => r.json())
      .then((data) => setUsers(data.users || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchBadges();
    fetchUsers();
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCreateOrUpdate = async () => {
    if (!formData.nameAr) {
      alert("اسم الشارة مطلوب");
      return;
    }
    setFormLoading(true);
    try {
      // Use FormData if image is being uploaded
      if (imageFile) {
        const fd = new FormData();
        fd.append("action", editingBadge ? "update" : "create");
        fd.append("image", imageFile);
        fd.append("name", formData.name || formData.nameAr);
        fd.append("nameAr", formData.nameAr);
        fd.append("description", formData.description);
        fd.append("descriptionAr", formData.descriptionAr);
        fd.append("icon", formData.icon);
        fd.append("color", formData.color);
        fd.append("category", formData.category);
        fd.append("order", String(formData.order));
        if (editingBadge) fd.append("badgeId", editingBadge.id);

        const res = await fetch("/api/admin/badges", {
          method: "POST",
          body: fd,
        });
        if (res.ok) {
          setShowForm(false);
          setEditingBadge(null);
          resetForm();
          fetchBadges();
        } else {
          const data = await res.json();
          alert(data.error || "فشل في الحفظ");
        }
      } else {
        // JSON request (no image)
        const body = editingBadge
          ? { action: "update", badgeId: editingBadge.id, ...formData }
          : { action: "create", ...formData };
        const res = await fetch("/api/admin/badges", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          setShowForm(false);
          setEditingBadge(null);
          resetForm();
          fetchBadges();
        } else {
          const data = await res.json();
          alert(data.error || "فشل في الحفظ");
        }
      }
    } catch {
      alert("خطأ في الاتصال");
    }
    setFormLoading(false);
  };

  const handleDelete = async (badgeId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الشارة؟ سيتم إزالتها من جميع المستخدمين.")) return;
    try {
      const res = await fetch("/api/admin/badges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", badgeId }),
      });
      if (res.ok) fetchBadges();
    } catch {
      alert("خطأ في الحذف");
    }
  };

  const handleToggleActive = async (badge: Badge) => {
    try {
      await fetch("/api/admin/badges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", badgeId: badge.id, isActive: !badge.isActive }),
      });
      fetchBadges();
    } catch {
      alert("خطأ في التحديث");
    }
  };

  const handleAssign = async () => {
    if (!assignBadgeId || !assignUserId) {
      alert("اختر الشارة والمستخدم");
      return;
    }
    setAssignLoading(true);
    try {
      const res = await fetch("/api/admin/badges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assign", badgeId: assignBadgeId, userId: assignUserId, note: assignNote, isPermanent: assignPermanent, durationDays: assignPermanent ? 0 : assignDuration }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("تم تعيين الشارة بنجاح!");
        setAssignNote("");
        setAssignUserId("");
        fetchBadges();
        if (viewBadge && viewBadge.id === assignBadgeId) {
          fetchAssignments(assignBadgeId);
        }
      } else {
        alert(data.error || "فشل في التعيين");
      }
    } catch {
      alert("خطأ في الاتصال");
    }
    setAssignLoading(false);
  };

  const handleUnassign = async (badgeId: string, userId: string) => {
    if (!confirm("هل تريد إزالة هذه الشارة من المستخدم؟")) return;
    try {
      await fetch("/api/admin/badges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unassign", badgeId, userId }),
      });
      fetchBadges();
      if (viewBadge) fetchAssignments(viewBadge.id);
    } catch {
      alert("خطأ في الإزالة");
    }
  };

  const fetchAssignments = (badgeId: string) => {
    setAssignmentsLoading(true);
    fetch(`/api/admin/badges?section=assignments&badgeId=${badgeId}`)
      .then((r) => r.json())
      .then((data) => {
        setAssignments(data.assignments || []);
        setAssignmentsLoading(false);
      })
      .catch(() => setAssignmentsLoading(false));
  };

  const resetForm = () => {
    setFormData({ name: "", nameAr: "", description: "", descriptionAr: "", icon: "⭐", color: "#f59e0b", category: "general", order: 0 });
    setImageFile(null);
    setImagePreview("");
  };

  const openEdit = (badge: Badge) => {
    setEditingBadge(badge);
    setFormData({
      name: badge.name, nameAr: badge.nameAr, description: badge.description, descriptionAr: badge.descriptionAr,
      icon: badge.icon, color: badge.color, category: badge.category, order: badge.order,
    });
    setImageFile(null);
    setImagePreview(badge.imageUrl || "");
    setShowForm(true);
  };

  const handleRemoveImage = async (badgeId: string) => {
    try {
      await fetch("/api/admin/badges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "removeImage", badgeId }),
      });
      fetchBadges();
    } catch {
      alert("خطأ في إزالة الصورة");
    }
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
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🏅 إدارة الشارات</h1>
              <p className="text-gray-500 text-sm">إنشاء وتعيين الشارات للمستخدمين</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { resetForm(); setEditingBadge(null); setShowForm(true); }}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                + شارة جديدة
              </button>
              <Link href="/admin" className="btn-secondary text-sm">← لوحة التحكم</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {[
              { label: "الرئيسية", href: "/admin", icon: "🏠" },
              { label: "اللغات", href: "/admin/languages", icon: "🌐" },
              { label: "المستويات", href: "/admin/levels", icon: "📊" },
              { label: "الدروس", href: "/admin/lessons", icon: "📚" },
              { label: "الأسئلة", href: "/admin/questions", icon: "❓" },
              { label: "الشهادات", href: "/admin/certificates", icon: "🎓" },
              { label: "المستخدمين", href: "/admin/users", icon: "👥" },
              { label: "التذاكر", href: "/admin/tickets", icon: "🎫" },
              { label: "رسائل الاتصال", href: "/admin/contact", icon: "📬" },
              { label: "الإشعارات", href: "/admin/notifications", icon: "🔔" },
              { label: "الدردشة", href: "/admin/chat", icon: "💬" },
              { label: "تغيير الأسماء", href: "/admin/name-requests", icon: "✏️" },
              { label: "فريق العمل", href: "/admin/team", icon: "👨‍💼" },
              { label: "المشرفين", href: "/admin/moderators", icon: "👮" },
              { label: "الشارات", href: "/admin/badges", icon: "🏅" },
              { label: "الحقيبة", href: "/admin/inventory", icon: "🎒" },
              { label: "فحص النظام", href: "/admin/scan", icon: "🔍" },
              { label: "الإعدادات", href: "/admin/settings", icon: "⚙️" },
            ].map((nav) => (
              <Link
                key={nav.href}
                href={nav.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  nav.href === "/admin/badges" ? "bg-primary-50 text-primary-700" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {nav.icon} {nav.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("badges")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "badges" ? "bg-primary-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            🏅 الشارات ({badges.length})
          </button>
          <button
            onClick={() => setActiveTab("assign")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "assign" ? "bg-primary-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            🎯 تعيين شارة
          </button>
        </div>

        {/* Badges Tab */}
        {activeTab === "badges" && (
          <div>
            {badges.length === 0 ? (
              <div className="card p-12 text-center">
                <div className="text-6xl mb-4">🏅</div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">لا توجد شارات</h3>
                <p className="text-gray-500 mb-4">أنشئ أول شارة لمكافأة المستخدمين</p>
                <button
                  onClick={() => { resetForm(); setEditingBadge(null); setShowForm(true); }}
                  className="btn-primary"
                >
                  + إنشاء شارة
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {badges.map((badge) => (
                  <div key={badge.id} className={`card p-5 ${!badge.isActive ? "opacity-60" : ""}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm overflow-hidden"
                          style={{ backgroundColor: badge.color + "20", borderColor: badge.color, borderWidth: "2px" }}
                        >
                          {badge.imageUrl ? (
                            <Image src={badge.imageUrl} alt={badge.nameAr} width={48} height={48} className="w-full h-full object-cover" />
                          ) : (
                            badge.icon
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{badge.nameAr}</h4>
                          <p className="text-xs text-gray-500">{badge.name}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${CATEGORY_COLORS[badge.category] || "bg-gray-100 text-gray-700"}`}>
                        {CATEGORIES[badge.category] || badge.category}
                      </span>
                    </div>
                    {badge.descriptionAr && (
                      <p className="text-sm text-gray-600 mb-3">{badge.descriptionAr}</p>
                    )}
                    <div className="flex items-center justify-between border-t pt-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">👥 {badge._count.assignments} مستخدم</span>
                        {!badge.isActive && <span className="text-xs text-red-500 font-medium">معطلة</span>}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => { setViewBadge(badge); fetchAssignments(badge.id); }}
                          className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                          title="عرض المستخدمين"
                        >
                          👥
                        </button>
                        <button
                          onClick={() => openEdit(badge)}
                          className="text-xs px-2 py-1 rounded bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
                          title="تعديل"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleToggleActive(badge)}
                          className={`text-xs px-2 py-1 rounded transition-colors ${
                            badge.isActive ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          }`}
                          title={badge.isActive ? "تعطيل" : "تفعيل"}
                        >
                          {badge.isActive ? "⏸" : "▶️"}
                        </button>
                        <button
                          onClick={() => handleDelete(badge.id)}
                          className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                          title="حذف"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Assign Tab */}
        {activeTab === "assign" && (
          <div className="card p-6 max-w-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">🎯 تعيين شارة لمستخدم</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الشارة</label>
                <select
                  value={assignBadgeId}
                  onChange={(e) => setAssignBadgeId(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">-- اختر شارة --</option>
                  {badges.filter((b) => b.isActive).map((b) => (
                    <option key={b.id} value={b.id}>{b.icon} {b.nameAr}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المستخدم</label>
                <select
                  value={assignUserId}
                  onChange={(e) => setAssignUserId(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">-- اختر مستخدم --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المدة</label>
                <div className="flex gap-2 mb-2">
                  <button type="button" onClick={() => setAssignPermanent(true)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${assignPermanent ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                    ♾️ دائمة
                  </button>
                  <button type="button" onClick={() => setAssignPermanent(false)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${!assignPermanent ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                    ⏳ مؤقتة
                  </button>
                </div>
                {!assignPermanent && (
                  <div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {[1, 3, 7, 14, 30, 90].map((d) => (
                        <button key={d} type="button" onClick={() => setAssignDuration(d)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${assignDuration === d ? "bg-amber-100 border-amber-300 text-amber-700 border" : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100"}`}>
                          {d} يوم
                        </button>
                      ))}
                    </div>
                    <input type="number" value={assignDuration} onChange={(e) => setAssignDuration(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm" min={1} placeholder="عدد الأيام" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظة (اختياري)</label>
                <input
                  type="text"
                  value={assignNote}
                  onChange={(e) => setAssignNote(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="سبب منح الشارة..."
                />
              </div>
              <button
                onClick={handleAssign}
                disabled={assignLoading || !assignBadgeId || !assignUserId}
                className="w-full bg-primary-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {assignLoading ? "جاري التعيين..." : "تعيين الشارة"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Badge Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingBadge ? "✏️ تعديل الشارة" : "🏅 إنشاء شارة جديدة"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم الشارة *</label>
                <input
                  type="text"
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="شارة التميز"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">وصف الشارة</label>
                <input
                  type="text"
                  value={formData.descriptionAr}
                  onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="وصف الشارة"
                />
              </div>
              {/* Image upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">📷 صورة الشارة (يتم تصغيرها تلقائياً)</label>
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors border border-blue-200"
                  >
                    📁 اختر صورة من الجهاز
                  </button>
                  {(imagePreview || (editingBadge?.imageUrl)) && (
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-green-400 shadow-sm">
                        <Image src={imagePreview || editingBadge?.imageUrl || ""} alt="معاينة" width={48} height={48} className="w-full h-full object-cover" />
                      </div>
                      <button
                        type="button"
                        onClick={() => { setImageFile(null); setImagePreview(""); }}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        ❌ إزالة
                      </button>
                    </div>
                  )}
                  {!imagePreview && !editingBadge?.imageUrl && (
                    <span className="text-xs text-gray-400">أي حجم - يتم تصغيرها لـ 64x64 تلقائياً</span>
                  )}
                </div>
              </div>
              {/* Emoji fallback picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الأيقونة الاحتياطية (إذا لم يتم رفع صورة)</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: emoji })}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                        formData.icon === emoji
                          ? "bg-primary-100 border-2 border-primary-500 shadow-md scale-110"
                          : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اللون</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">التصنيف</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
                  >
                    {Object.entries(CATEGORIES).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الترتيب</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
                    min={0}
                  />
                </div>
              </div>
              {/* Preview */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-2">معاينة:</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-sm overflow-hidden"
                    style={{ backgroundColor: formData.color + "20", borderColor: formData.color, borderWidth: "2px" }}
                  >
                    {imagePreview ? (
                      <Image src={imagePreview} alt="معاينة" width={56} height={56} className="w-full h-full object-cover" />
                    ) : editingBadge?.imageUrl ? (
                      <Image src={editingBadge.imageUrl} alt="معاينة" width={56} height={56} className="w-full h-full object-cover" />
                    ) : (
                      formData.icon
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{formData.nameAr || "اسم الشارة"}</h4>
                    <p className="text-xs text-gray-500">{formData.descriptionAr || "وصف الشارة"}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[formData.category]}`}>
                      {CATEGORIES[formData.category]}
                    </span>
                  </div>
                </div>
                {/* Chat preview */}
                <div className="mt-3 flex items-center gap-1">
                  <span className="text-xs text-gray-500">في الدردشة:</span>
                  {imagePreview || editingBadge?.imageUrl ? (
                    <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: formData.color }}>
                      <Image src={imagePreview || editingBadge?.imageUrl || ""} alt="" width={14} height={14} className="w-3.5 h-3.5 rounded-full object-cover" />
                      {formData.nameAr || "شارة"}
                    </span>
                  ) : (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full text-white font-medium"
                      style={{ backgroundColor: formData.color }}
                    >
                      {formData.icon} {formData.nameAr || "شارة"}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCreateOrUpdate}
                  disabled={formLoading}
                  className="flex-1 bg-primary-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {formLoading ? "جاري الحفظ..." : editingBadge ? "تحديث" : "إنشاء"}
                </button>
                <button
                  onClick={() => { setShowForm(false); setEditingBadge(null); }}
                  className="px-4 py-2.5 text-gray-500 hover:text-gray-700 text-sm"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Assignments Modal */}
      {viewBadge && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewBadge(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl overflow-hidden"
                style={{ backgroundColor: viewBadge.color + "20", borderColor: viewBadge.color, borderWidth: "2px" }}
              >
                {viewBadge.imageUrl ? (
                  <Image src={viewBadge.imageUrl} alt={viewBadge.nameAr} width={48} height={48} className="w-full h-full object-cover" />
                ) : (
                  viewBadge.icon
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{viewBadge.nameAr}</h3>
                <p className="text-sm text-gray-500">المستخدمين الحاصلين على الشارة</p>
              </div>
            </div>
            {assignmentsLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
              </div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>لا يوجد مستخدمين حاصلين على هذه الشارة</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-sm">
                      {a.user.name?.charAt(0) || "?"}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{a.user.name}</p>
                      <p className="text-xs text-gray-500">{a.user.email}</p>
                      {a.note && <p className="text-xs text-gray-400 mt-0.5">📝 {a.note}</p>}
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleDateString("ar")}</p>
                      <button
                        onClick={() => handleUnassign(a.badgeId, a.userId)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        إزالة
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setViewBadge(null)}
              className="mt-4 w-full bg-gray-100 text-gray-700 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
