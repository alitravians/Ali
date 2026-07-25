"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ShopItem {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  type: string;
  price: number;
  icon: string;
  imageUrl: string;
  rarity: string;
  isPermanent: boolean;
  durationDays: number;
  isActive: boolean;
  isLimited: boolean;
  limitedUntil: string | null;
  stock: number;
  soldCount: number;
  order: number;
  inventoryItemId: string;
  _count?: { purchases: number };
}

const TYPES = [
  { value: "entry_effect", label: "تأثيرات دخول" },
  { value: "necklace", label: "قلادات" },
  { value: "badge", label: "شارات" },
  { value: "bubble", label: "فقاعات محادثة" },
];

const RARITIES = [
  { value: "common", label: "عادي", color: "bg-gray-100 text-gray-700" },
  { value: "rare", label: "نادر", color: "bg-blue-100 text-blue-700" },
  { value: "epic", label: "أسطوري", color: "bg-purple-100 text-purple-700" },
  { value: "legendary", label: "خرافي", color: "bg-amber-100 text-amber-700" },
];

export default function AdminShopPage() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ShopItem | null>(null);

  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [type, setType] = useState("entry_effect");
  const [price, setPrice] = useState(100);
  const [icon, setIcon] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [rarity, setRarity] = useState("common");
  const [isPermanent, setIsPermanent] = useState(true);
  const [durationDays, setDurationDays] = useState(7);
  const [isActive, setIsActive] = useState(true);
  const [isLimited, setIsLimited] = useState(false);
  const [limitedUntil, setLimitedUntil] = useState("");
  const [stock, setStock] = useState(-1);
  const [order, setOrder] = useState(0);
  const [inventoryItemId, setInventoryItemId] = useState("");

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/shop");
      const data = await res.json();
      if (Array.isArray(data)) setItems(data);
    } catch { /* */ }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setNameAr(""); setNameEn(""); setDescriptionAr(""); setType("entry_effect");
    setPrice(100); setIcon(""); setImageUrl(""); setRarity("common");
    setIsPermanent(true); setDurationDays(7); setIsActive(true); setIsLimited(false);
    setLimitedUntil(""); setStock(-1); setOrder(0); setInventoryItemId("");
    setEditing(null);
  };

  const handleSave = async () => {
    if (!nameAr.trim()) return;
    const body: Record<string, unknown> = {
      nameAr, nameEn, descriptionAr, type, price, icon, imageUrl, rarity,
      isPermanent, durationDays, isActive, isLimited, stock, order, inventoryItemId,
    };
    if (isLimited && limitedUntil) body.limitedUntil = limitedUntil;
    if (editing) body.id = editing.id;

    await fetch("/api/admin/shop", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setShowModal(false);
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف هذا المنتج؟")) return;
    await fetch(`/api/admin/shop?id=${id}`, { method: "DELETE" });
    fetchData();
  };

  const openEdit = (item: ShopItem) => {
    setEditing(item); setNameAr(item.nameAr); setNameEn(item.nameEn);
    setDescriptionAr(item.descriptionAr); setType(item.type); setPrice(item.price);
    setIcon(item.icon); setImageUrl(item.imageUrl); setRarity(item.rarity);
    setIsPermanent(item.isPermanent); setDurationDays(item.durationDays);
    setIsActive(item.isActive); setIsLimited(item.isLimited);
    setLimitedUntil(item.limitedUntil ? new Date(item.limitedUntil).toISOString().slice(0, 16) : "");
    setStock(item.stock); setOrder(item.order); setInventoryItemId(item.inventoryItemId || "");
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
            <h1 className="text-xl font-bold text-gray-900">🛒 إدارة المتجر</h1>
            <div className="flex gap-2">
              <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary text-sm">+ منتج جديد</button>
              <Link href="/admin" className="btn-secondary text-sm">← لوحة التحكم</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {items.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-4xl mb-3">🛒</p>
            <p className="text-gray-500">لا توجد منتجات بعد</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div key={item.id} className={`card p-5 ${!item.isActive ? "opacity-60" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">
                    {item.icon || "🎁"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 truncate">{item.nameAr}</h3>
                      {item.isLimited && <span className="px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-700">محدود</span>}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{item.descriptionAr}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="font-bold text-primary-600">{item.price} نقطة</span>
                      <span className={`px-1.5 py-0.5 rounded text-xs ${RARITIES.find((r) => r.value === item.rarity)?.color}`}>
                        {RARITIES.find((r) => r.value === item.rarity)?.label}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                        {TYPES.find((t) => t.value === item.type)?.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>{item.isPermanent ? "دائم" : `${item.durationDays} يوم`}</span>
                      <span>مباع: {item.soldCount}</span>
                      {item.stock !== -1 && <span>متبقي: {item.stock - item.soldCount}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 mt-3 border-t pt-3">
                  <button onClick={() => openEdit(item)} className="flex-1 text-center py-1.5 rounded-lg hover:bg-blue-50 text-blue-600 text-sm transition-colors">تعديل</button>
                  <button onClick={() => handleDelete(item.id)} className="flex-1 text-center py-1.5 rounded-lg hover:bg-red-50 text-red-600 text-sm transition-colors">حذف</button>
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
            <h3 className="text-xl font-bold text-gray-900 mb-4">{editing ? "تعديل المنتج" : "منتج جديد"}</h3>
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
                    {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">السعر (نقاط)</label>
                  <input type="number" value={price} onChange={(e) => setPrice(parseInt(e.target.value) || 0)} className="w-full p-2.5 border rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الندرة</label>
                  <select value={rarity} onChange={(e) => setRarity(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm">
                    {RARITIES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الأيقونة (إيموجي)</label>
                  <input value={icon} onChange={(e) => setIcon(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm" placeholder="🎁" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">رابط الصورة</label>
                  <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">معرّف عنصر الحقيبة (اختياري)</label>
                <input value={inventoryItemId} onChange={(e) => setInventoryItemId(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm" placeholder="ربط مع عنصر موجود في الحقيبة" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المخزون (-1 = غير محدود)</label>
                  <input type="number" value={stock} onChange={(e) => setStock(parseInt(e.target.value))} className="w-full p-2.5 border rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الترتيب</label>
                  <input type="number" value={order} onChange={(e) => setOrder(parseInt(e.target.value) || 0)} className="w-full p-2.5 border rounded-xl text-sm" />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isPermanent} onChange={(e) => setIsPermanent(e.target.checked)} className="w-4 h-4 rounded" />
                  <span className="text-sm">دائم</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 rounded" />
                  <span className="text-sm">مفعّل</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isLimited} onChange={(e) => setIsLimited(e.target.checked)} className="w-4 h-4 rounded" />
                  <span className="text-sm">عرض محدود</span>
                </label>
              </div>
              {!isPermanent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">مدة الصلاحية (أيام)</label>
                  <input type="number" value={durationDays} onChange={(e) => setDurationDays(parseInt(e.target.value) || 7)} className="w-full p-2.5 border rounded-xl text-sm" />
                </div>
              )}
              {isLimited && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ينتهي العرض في</label>
                  <input type="datetime-local" value={limitedUntil} onChange={(e) => setLimitedUntil(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm" />
                </div>
              )}
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
