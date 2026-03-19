"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

const ITEM_TYPES = [
  { value: "bubble", label: "فقاعة رسائل", icon: "💬" },
  { value: "entry_effect", label: "تأثير دخول", icon: "🎆" },
  { value: "necklace", label: "قلادة", icon: "📿" },
  { value: "badge", label: "شارة", icon: "🏅" },
  { value: "name_frame", label: "إطار الاسم", icon: "🖼️" },
  { value: "avatar_frame", label: "إطار الصورة", icon: "🎨" },
  { value: "name_color", label: "لون الاسم", icon: "🌈" },
  { value: "profile_bg", label: "خلفية البروفايل", icon: "🖼️" },
];

const CATEGORIES = [
  { value: "general", label: "عامة" },
  { value: "achievement", label: "إنجاز" },
  { value: "rank", label: "رتبة" },
  { value: "special", label: "خاصة" },
  { value: "event", label: "حدث" },
  { value: "seasonal", label: "موسمية" },
];

const RARITIES = [
  { value: "common", label: "عادي", color: "#9ca3af" },
  { value: "uncommon", label: "غير شائع", color: "#22c55e" },
  { value: "rare", label: "نادر", color: "#3b82f6" },
  { value: "epic", label: "أسطوري", color: "#a855f7" },
  { value: "legendary", label: "خرافي", color: "#f59e0b" },
];

// Predefined bubble styles
const BUBBLE_PRESETS = [
  { name: "ذهبية", nameAr: "فقاعة ذهبية", bg: "linear-gradient(135deg, #f59e0b, #d97706)", text: "#fff", border: "#b45309" },
  { name: "فضية", nameAr: "فقاعة فضية", bg: "linear-gradient(135deg, #9ca3af, #6b7280)", text: "#fff", border: "#4b5563" },
  { name: "زمردية", nameAr: "فقاعة زمردية", bg: "linear-gradient(135deg, #10b981, #059669)", text: "#fff", border: "#047857" },
  { name: "ياقوتية", nameAr: "فقاعة ياقوتية", bg: "linear-gradient(135deg, #ef4444, #dc2626)", text: "#fff", border: "#b91c1c" },
  { name: "ماسية", nameAr: "فقاعة ماسية", bg: "linear-gradient(135deg, #06b6d4, #0891b2)", text: "#fff", border: "#0e7490" },
  { name: "بنفسجية", nameAr: "فقاعة بنفسجية", bg: "linear-gradient(135deg, #8b5cf6, #7c3aed)", text: "#fff", border: "#6d28d9" },
  { name: "وردية", nameAr: "فقاعة وردية", bg: "linear-gradient(135deg, #ec4899, #db2777)", text: "#fff", border: "#be185d" },
  { name: "قوس قزح", nameAr: "فقاعة قوس قزح", bg: "linear-gradient(135deg, #ef4444, #f59e0b, #22c55e, #3b82f6, #8b5cf6)", text: "#fff", border: "#6366f1" },
];

// Predefined entry effects
const EFFECT_PRESETS = [
  { name: "نجوم", nameAr: "تأثير النجوم", effect: "stars", icon: "⭐" },
  { name: "بريق", nameAr: "تأثير البريق", effect: "sparkle", icon: "✨" },
  { name: "ألعاب نارية", nameAr: "تأثير الألعاب النارية", effect: "fireworks", icon: "🎆" },
  { name: "قلوب", nameAr: "تأثير القلوب", effect: "hearts", icon: "❤️" },
  { name: "فقاعات", nameAr: "تأثير الفقاعات", effect: "bubbles", icon: "🫧" },
  { name: "برق", nameAr: "تأثير البرق", effect: "lightning", icon: "⚡" },
  { name: "تاج", nameAr: "تأثير التاج", effect: "crown", icon: "👑" },
  { name: "نار", nameAr: "تأثير النار", effect: "fire", icon: "🔥" },
];

interface InventoryItem {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  type: string;
  icon: string;
  imageUrl: string;
  color: string;
  previewData: string;
  category: string;
  rarity: string;
  isActive: boolean;
  order: number;
  _count?: { userItems: number };
}

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

interface UserInventoryItem {
  id: string;
  userId: string;
  itemId: string;
  status: string;
  isPermanent: boolean;
  durationDays: number;
  grantedAt: string;
  expiresAt: string | null;
  activatedAt: string | null;
  revokedAt: string | null;
  grantedBy: string;
  adminNote: string;
  item: InventoryItem;
}

export default function AdminInventoryPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [tab, setTab] = useState<"items" | "grant" | "manage">("items");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form data
  const [formData, setFormData] = useState({
    nameAr: "", descriptionAr: "", type: "bubble", icon: "✨",
    color: "#6366f1", category: "general", rarity: "common", order: 0,
    previewData: "{}",
  });

  // Grant form
  const [grantUserId, setGrantUserId] = useState("");
  const [grantItemId, setGrantItemId] = useState("");
  const [grantPermanent, setGrantPermanent] = useState(true);
  const [grantDays, setGrantDays] = useState(30);
  const [grantNote, setGrantNote] = useState("");
  const [grantLoading, setGrantLoading] = useState(false);

  // Manage user items
  const [manageUserId, setManageUserId] = useState("");
  const [userItems, setUserItems] = useState<UserInventoryItem[]>([]);
  const [revokeReason, setRevokeReason] = useState("");

  const isAdmin = (session?.user as { role?: string })?.role === "admin";

  const fetchItems = async () => {
    const res = await fetch("/api/admin/inventory?section=items");
    if (res.ok) setItems(await res.json());
  };

  const fetchUsers = async () => {
    const res = await fetch("/api/admin/inventory?section=users");
    if (res.ok) setUsers(await res.json());
  };

  useEffect(() => {
    if (isAdmin) { fetchItems(); fetchUsers(); }
  }, [isAdmin]);

  const fetchUserItems = async (uid: string) => {
    const res = await fetch(`/api/admin/inventory?section=user_items&userId=${uid}`);
    if (res.ok) setUserItems(await res.json());
  };

  useEffect(() => {
    if (manageUserId) fetchUserItems(manageUserId);
  }, [manageUserId]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({ nameAr: "", descriptionAr: "", type: "bubble", icon: "✨", color: "#6366f1", category: "general", rarity: "common", order: 0, previewData: "{}" });
    setImageFile(null);
    setImagePreview("");
    setEditingItem(null);
    setShowForm(false);
  };

  const openEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      nameAr: item.nameAr, descriptionAr: item.descriptionAr, type: item.type,
      icon: item.icon, color: item.color, category: item.category, rarity: item.rarity,
      order: item.order, previewData: item.previewData,
    });
    setImagePreview(item.imageUrl || "");
    setShowForm(true);
  };

  const handleCreateOrUpdate = async () => {
    if (!formData.nameAr) { alert("اسم العنصر مطلوب"); return; }
    setFormLoading(true);
    try {
      if (imageFile) {
        const fd = new FormData();
        fd.append("action", editingItem ? "update" : "create");
        fd.append("image", imageFile);
        fd.append("nameAr", formData.nameAr);
        fd.append("descriptionAr", formData.descriptionAr);
        fd.append("type", formData.type);
        fd.append("icon", formData.icon);
        fd.append("color", formData.color);
        fd.append("category", formData.category);
        fd.append("rarity", formData.rarity);
        fd.append("order", String(formData.order));
        fd.append("previewData", formData.previewData);
        if (editingItem) fd.append("itemId", editingItem.id);
        await fetch("/api/admin/inventory", { method: "POST", body: fd });
      } else {
        await fetch("/api/admin/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: editingItem ? "update" : "create",
            itemId: editingItem?.id,
            ...formData,
          }),
        });
      }
      resetForm();
      fetchItems();
    } catch { alert("فشل في الحفظ"); }
    setFormLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف هذا العنصر؟")) return;
    await fetch("/api/admin/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", itemId: id }),
    });
    fetchItems();
  };

  const handleToggle = async (id: string) => {
    await fetch("/api/admin/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle", itemId: id }),
    });
    fetchItems();
  };

  const handleGrant = async () => {
    if (!grantUserId || !grantItemId) { alert("اختر المستخدم والعنصر"); return; }
    setGrantLoading(true);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "grant",
          userId: grantUserId,
          itemId: grantItemId,
          isPermanent: grantPermanent,
          durationDays: grantPermanent ? 0 : grantDays,
          adminNote: grantNote,
        }),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); } else {
        alert("تم منح العنصر بنجاح!");
        setGrantUserId("");
        setGrantItemId("");
        setGrantNote("");
        fetchItems();
      }
    } catch { alert("فشل في المنح"); }
    setGrantLoading(false);
  };

  const handleRevoke = async (userId: string, itemId: string) => {
    if (!confirm("سحب هذا العنصر من المستخدم؟")) return;
    await fetch("/api/admin/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "revoke", userId, itemId, reason: revokeReason }),
    });
    setRevokeReason("");
    fetchUserItems(userId);
    fetchItems();
  };

  const applyBubblePreset = (preset: typeof BUBBLE_PRESETS[0]) => {
    setFormData({
      ...formData,
      nameAr: preset.nameAr,
      type: "bubble",
      icon: "💬",
      previewData: JSON.stringify({ bg: preset.bg, text: preset.text, border: preset.border }),
    });
  };

  const applyEffectPreset = (preset: typeof EFFECT_PRESETS[0]) => {
    setFormData({
      ...formData,
      nameAr: preset.nameAr,
      type: "entry_effect",
      icon: preset.icon,
      previewData: JSON.stringify({ effect: preset.effect }),
    });
  };

  const filteredItems = typeFilter === "all" ? items : items.filter((i) => i.type === typeFilter);
  const getTypeLabel = (type: string) => ITEM_TYPES.find((t) => t.value === type)?.label || type;
  const getTypeIcon = (type: string) => ITEM_TYPES.find((t) => t.value === type)?.icon || "✨";
  const getRarityInfo = (rarity: string) => RARITIES.find((r) => r.value === rarity) || RARITIES[0];

  const statusLabels: Record<string, { label: string; color: string }> = {
    active: { label: "مفعل", color: "bg-green-100 text-green-800" },
    inactive: { label: "غير مفعل", color: "bg-gray-100 text-gray-800" },
    expired: { label: "منتهي", color: "bg-red-100 text-red-800" },
    revoked: { label: "مسحوب", color: "bg-orange-100 text-orange-800" },
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🎒 إدارة الحقيبة</h1>
            <p className="text-sm text-gray-500 mt-1">إنشاء ومنح العناصر للمستخدمين</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-indigo-700">+ عنصر جديد</button>
            <Link href="/admin" className="bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm hover:bg-gray-300">← لوحة التحكم</Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab("items")} className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === "items" ? "bg-indigo-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"}`}>
            🎁 العناصر ({items.length})
          </button>
          <button onClick={() => setTab("grant")} className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === "grant" ? "bg-indigo-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"}`}>
            🎯 منح عنصر
          </button>
          <button onClick={() => setTab("manage")} className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === "manage" ? "bg-indigo-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"}`}>
            👥 إدارة حقائب المستخدمين
          </button>
        </div>

        {/* Items Tab */}
        {tab === "items" && (
          <div>
            {/* Type filter */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={() => setTypeFilter("all")} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${typeFilter === "all" ? "bg-indigo-600 text-white" : "bg-white text-gray-600"}`}>الكل</button>
              {ITEM_TYPES.map((t) => (
                <button key={t.value} onClick={() => setTypeFilter(t.value)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${typeFilter === t.value ? "bg-indigo-600 text-white" : "bg-white text-gray-600"}`}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {/* Items grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => {
                const rarityInfo = getRarityInfo(item.rarity);
                return (
                  <div key={item.id} className={`bg-white rounded-xl border p-4 ${!item.isActive ? "opacity-60" : ""}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: item.color + "20" }}>
                          {item.imageUrl ? <img src={item.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" /> : item.icon}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{item.nameAr}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">{getTypeIcon(item.type)} {getTypeLabel(item.type)}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: rarityInfo.color + "20", color: rarityInfo.color }}>{rarityInfo.label}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(item)} className="text-gray-400 hover:text-blue-500 text-sm" title="تعديل">✏️</button>
                        <button onClick={() => handleToggle(item.id)} className="text-gray-400 hover:text-yellow-500 text-sm" title={item.isActive ? "تعطيل" : "تفعيل"}>{item.isActive ? "⏸" : "▶️"}</button>
                        <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-500 text-sm" title="حذف">🗑️</button>
                      </div>
                    </div>
                    {item.descriptionAr && <p className="text-xs text-gray-500 mb-2">{item.descriptionAr}</p>}
                    {/* Preview for bubbles */}
                    {item.type === "bubble" && (() => {
                      try {
                        const preview = JSON.parse(item.previewData);
                        if (preview.bg) {
                          return (
                            <div className="mt-2 p-2 rounded-lg text-xs text-center" style={{ background: preview.bg, color: preview.text || "#fff", border: `2px solid ${preview.border || "transparent"}` }}>
                              معاينة الفقاعة
                            </div>
                          );
                        }
                      } catch { /* ignore */ }
                      return null;
                    })()}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <span className="text-xs text-gray-400">👥 {item._count?.userItems || 0} مستخدم</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${item.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {item.isActive ? "نشط" : "معطل"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <div className="text-5xl mb-3">🎒</div>
                <p>لا توجد عناصر</p>
              </div>
            )}
          </div>
        )}

        {/* Grant Tab */}
        {tab === "grant" && (
          <div className="max-w-xl mx-auto bg-white rounded-xl border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">🎯 منح عنصر لمستخدم</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المستخدم</label>
                <select value={grantUserId} onChange={(e) => setGrantUserId(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm">
                  <option value="">اختر المستخدم...</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العنصر</label>
                <select value={grantItemId} onChange={(e) => setGrantItemId(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm">
                  <option value="">اختر العنصر...</option>
                  {items.filter((i) => i.isActive).map((i) => (
                    <option key={i.id} value={i.id}>{getTypeIcon(i.type)} {i.nameAr} ({getTypeLabel(i.type)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المدة</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2">
                    <input type="radio" checked={grantPermanent} onChange={() => setGrantPermanent(true)} />
                    <span className="text-sm">دائم</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" checked={!grantPermanent} onChange={() => setGrantPermanent(false)} />
                    <span className="text-sm">مؤقت</span>
                  </label>
                </div>
                {!grantPermanent && (
                  <div className="mt-2 flex items-center gap-2">
                    <input type="number" min={1} value={grantDays} onChange={(e) => setGrantDays(parseInt(e.target.value) || 1)}
                      className="w-24 border rounded-lg px-3 py-1.5 text-sm" />
                    <span className="text-sm text-gray-500">يوم</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظة إدارية (اختياري)</label>
                <input type="text" value={grantNote} onChange={(e) => setGrantNote(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 text-sm" placeholder="سبب المنح..." />
              </div>

              {/* Preview selected item */}
              {grantItemId && (() => {
                const selectedItem = items.find((i) => i.id === grantItemId);
                if (!selectedItem) return null;
                return (
                  <div className="p-3 bg-gray-50 rounded-xl border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: selectedItem.color + "20" }}>
                        {selectedItem.imageUrl ? <img src={selectedItem.imageUrl} alt="" className="w-8 h-8 rounded" /> : selectedItem.icon}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{selectedItem.nameAr}</p>
                        <p className="text-xs text-gray-500">{getTypeIcon(selectedItem.type)} {getTypeLabel(selectedItem.type)} - {getRarityInfo(selectedItem.rarity).label}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <button onClick={handleGrant} disabled={grantLoading || !grantUserId || !grantItemId}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                {grantLoading ? "جاري المنح..." : "منح العنصر"}
              </button>
            </div>
          </div>
        )}

        {/* Manage Tab */}
        {tab === "manage" && (
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">اختر المستخدم</label>
              <select value={manageUserId} onChange={(e) => setManageUserId(e.target.value)} className="max-w-md w-full border rounded-xl px-3 py-2 text-sm">
                <option value="">اختر المستخدم...</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
              </select>
            </div>

            {manageUserId && (
              <div>
                <h3 className="font-bold text-gray-900 mb-3">حقيبة {users.find((u) => u.id === manageUserId)?.name || "المستخدم"}</h3>
                {userItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 bg-white rounded-xl border">
                    <div className="text-4xl mb-2">🎒</div>
                    <p>لا توجد عناصر في الحقيبة</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {userItems.map((ui) => (
                      <div key={ui.id} className="bg-white rounded-xl border p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: ui.item.color + "20" }}>
                            {ui.item.imageUrl ? <img src={ui.item.imageUrl} alt="" className="w-8 h-8 rounded" /> : ui.item.icon}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{ui.item.nameAr}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-400">{getTypeIcon(ui.item.type)} {getTypeLabel(ui.item.type)}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${statusLabels[ui.status]?.color || "bg-gray-100"}`}>
                                {statusLabels[ui.status]?.label || ui.status}
                              </span>
                              {!ui.isPermanent && ui.expiresAt && (
                                <span className="text-xs text-gray-400">ينتهي: {new Date(ui.expiresAt).toLocaleDateString("ar-SA")}</span>
                              )}
                              {ui.isPermanent && <span className="text-xs text-emerald-600">دائم</span>}
                            </div>
                          </div>
                        </div>
                        {(ui.status === "active" || ui.status === "inactive") && (
                          <button onClick={() => handleRevoke(ui.userId, ui.itemId)}
                            className="text-red-500 hover:text-red-700 text-xs px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50">
                            سحب
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Create/Edit Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => resetForm()}>
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-gray-900 mb-4">{editingItem ? "تعديل العنصر" : "إنشاء عنصر جديد"}</h3>

              <div className="space-y-4">
                {/* Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">نوع العنصر</label>
                  <div className="grid grid-cols-4 gap-2">
                    {ITEM_TYPES.map((t) => (
                      <button key={t.value} onClick={() => setFormData({ ...formData, type: t.value })}
                        className={`p-2 rounded-xl border text-xs text-center ${formData.type === t.value ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 hover:border-gray-300"}`}>
                        <div className="text-lg">{t.icon}</div>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Presets for bubbles */}
                {formData.type === "bubble" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">قوالب فقاعات جاهزة</label>
                    <div className="grid grid-cols-4 gap-2">
                      {BUBBLE_PRESETS.map((p) => (
                        <button key={p.name} onClick={() => applyBubblePreset(p)}
                          className="p-2 rounded-lg text-xs text-white text-center" style={{ background: p.bg }}>
                          {p.nameAr}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Presets for entry effects */}
                {formData.type === "entry_effect" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">تأثيرات جاهزة</label>
                    <div className="grid grid-cols-4 gap-2">
                      {EFFECT_PRESETS.map((p) => (
                        <button key={p.name} onClick={() => applyEffectPreset(p)}
                          className="p-2 rounded-xl border text-xs text-center hover:border-indigo-300">
                          <div className="text-lg">{p.icon}</div>
                          {p.nameAr}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اسم العنصر *</label>
                  <input type="text" value={formData.nameAr} onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-sm" placeholder="اسم العنصر بالعربي" />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
                  <input type="text" value={formData.descriptionAr} onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-sm" placeholder="وصف العنصر" />
                </div>

                {/* Image upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">صورة العنصر</label>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 border rounded-xl text-sm hover:bg-gray-50">📁 اختر صورة</button>
                    {imagePreview && (
                      <>
                        <img src={imagePreview} alt="" className="w-12 h-12 rounded-lg object-cover border" />
                        <button type="button" onClick={() => { setImageFile(null); setImagePreview(""); }}
                          className="text-red-500 text-sm">❌</button>
                      </>
                    )}
                  </div>
                </div>

                {/* Row: Icon, Color, Category, Rarity */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الأيقونة</label>
                    <input type="text" value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="w-full border rounded-xl px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">اللون</label>
                    <div className="flex gap-2">
                      <input type="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-10 h-10 rounded border cursor-pointer" />
                      <input type="text" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="flex-1 border rounded-xl px-3 py-2 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">التصنيف</label>
                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full border rounded-xl px-3 py-2 text-sm">
                      {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الندرة</label>
                    <select value={formData.rarity} onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}
                      className="w-full border rounded-xl px-3 py-2 text-sm">
                      {RARITIES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Preview data for bubbles */}
                {formData.type === "bubble" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">بيانات المعاينة (JSON)</label>
                    <textarea value={formData.previewData} onChange={(e) => setFormData({ ...formData, previewData: e.target.value })}
                      className="w-full border rounded-xl px-3 py-2 text-sm font-mono" rows={2}
                      placeholder='{"bg":"linear-gradient(...)","text":"#fff","border":"#000"}' />
                    {/* Bubble preview */}
                    {(() => {
                      try {
                        const p = JSON.parse(formData.previewData);
                        if (p.bg) {
                          return (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">معاينة:</p>
                              <div className="inline-block p-3 rounded-2xl text-sm" style={{ background: p.bg, color: p.text || "#fff", border: `2px solid ${p.border || "transparent"}` }}>
                                مرحباً! هذه معاينة الفقاعة 💬
                              </div>
                            </div>
                          );
                        }
                      } catch { /* ignore */ }
                      return null;
                    })()}
                  </div>
                )}

                {/* Preview data for entry effects */}
                {formData.type === "entry_effect" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">بيانات التأثير (JSON)</label>
                    <textarea value={formData.previewData} onChange={(e) => setFormData({ ...formData, previewData: e.target.value })}
                      className="w-full border rounded-xl px-3 py-2 text-sm font-mono" rows={2}
                      placeholder='{"effect":"stars"}' />
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button onClick={handleCreateOrUpdate} disabled={formLoading}
                    className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                    {formLoading ? "جاري الحفظ..." : editingItem ? "تحديث" : "إنشاء"}
                  </button>
                  <button onClick={resetForm} className="px-6 py-2.5 border rounded-xl text-sm hover:bg-gray-50">إلغاء</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
