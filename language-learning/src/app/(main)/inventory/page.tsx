"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { EntryEffectPreview } from "@/components/chat/EntryEffectOverlay";
import type { EffectType } from "@/components/chat/EntryEffectOverlay";

const ITEM_TYPES = [
  { value: "all", label: "الكل", icon: "🎒" },
  { value: "bubble", label: "فقاعات رسائل", icon: "💬" },
  { value: "entry_effect", label: "تأثيرات دخول", icon: "🎆" },
  { value: "necklace", label: "قلادات", icon: "📿" },
  { value: "badge", label: "شارات", icon: "🏅" },
  { value: "name_frame", label: "إطارات الاسم", icon: "🖼️" },
  { value: "avatar_frame", label: "إطارات الصورة", icon: "🎨" },
  { value: "name_color", label: "ألوان الاسم", icon: "🌈" },
  { value: "profile_bg", label: "خلفيات", icon: "🖼️" },
];

const RARITIES: Record<string, { label: string; color: string; bg: string }> = {
  common: { label: "عادي", color: "#9ca3af", bg: "#f3f4f6" },
  uncommon: { label: "غير شائع", color: "#22c55e", bg: "#f0fdf4" },
  rare: { label: "نادر", color: "#3b82f6", bg: "#eff6ff" },
  epic: { label: "أسطوري", color: "#a855f7", bg: "#faf5ff" },
  legendary: { label: "خرافي", color: "#f59e0b", bg: "#fffbeb" },
};

interface InventoryItem {
  id: string;
  nameAr: string;
  descriptionAr: string;
  type: string;
  icon: string;
  imageUrl: string;
  color: string;
  previewData: string;
  rarity: string;
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
  adminNote: string;
  item: InventoryItem;
}

function getTimeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "منتهي";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days} يوم ${hours} ساعة`;
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours} ساعة ${minutes} دقيقة`;
}

function isExpiringSoon(expiresAt: string): boolean {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return diff > 0 && diff < 24 * 60 * 60 * 1000; // less than 24 hours
}

export default function InventoryPage() {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<UserInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [previewItem, setPreviewItem] = useState<UserInventoryItem | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/inventory");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    if (session?.user) fetchItems();
  }, [session]);

  const handleAction = async (itemId: string, action: "activate" | "deactivate") => {
    setActionLoading(itemId);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, itemId }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        fetchItems();
      }
    } catch {
      alert("فشل في العملية");
    }
    setActionLoading(null);
  };

  const filteredItems = activeTab === "all" ? items : items.filter((i) => i.item.type === activeTab);
  const activeItems = items.filter((i) => i.status === "active");
  const expiringSoon = items.filter((i) => !i.isPermanent && i.expiresAt && isExpiringSoon(i.expiresAt) && i.status !== "expired");

  const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
    active: { label: "مفعل", color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: "✅" },
    inactive: { label: "غير مفعل", color: "bg-gray-100 text-gray-600 border-gray-200", icon: "⏸️" },
    expired: { label: "منتهي", color: "bg-red-100 text-red-700 border-red-200", icon: "⏰" },
    revoked: { label: "مسحوب", color: "bg-orange-100 text-orange-700 border-orange-200", icon: "🚫" },
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm border p-8 text-center max-w-md">
          <div className="text-6xl mb-4">🎒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">حقيبتي</h2>
          <p className="text-gray-600 mb-4">يجب تسجيل الدخول لعرض حقيبتك</p>
          <Link href="/auth/login" className="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700">تسجيل الدخول</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🎒 حقيبتي</h1>
            <p className="text-sm text-gray-500 mt-1">إدارة عناصرك وتفعيلها</p>
          </div>
          <Link href="/" className="bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm hover:bg-gray-300">← الرئيسية</Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl border p-3 text-center">
            <div className="text-2xl font-bold text-indigo-600">{items.length}</div>
            <div className="text-xs text-gray-500">إجمالي العناصر</div>
          </div>
          <div className="bg-white rounded-xl border p-3 text-center">
            <div className="text-2xl font-bold text-emerald-600">{activeItems.length}</div>
            <div className="text-xs text-gray-500">عناصر مفعلة</div>
          </div>
          <div className="bg-white rounded-xl border p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{items.filter((i) => i.isPermanent && (i.status === "active" || i.status === "inactive")).length}</div>
            <div className="text-xs text-gray-500">عناصر دائمة</div>
          </div>
          <div className="bg-white rounded-xl border p-3 text-center">
            <div className="text-2xl font-bold text-amber-600">{items.filter((i) => !i.isPermanent && (i.status === "active" || i.status === "inactive")).length}</div>
            <div className="text-xs text-gray-500">عناصر مؤقتة</div>
          </div>
        </div>

        {/* Expiring soon warning */}
        {expiringSoon.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-sm font-medium text-amber-800">عناصر تنتهي قريباً!</p>
              <p className="text-xs text-amber-700">{expiringSoon.map((i) => i.item.nameAr).join("، ")} - تنتهي خلال 24 ساعة</p>
            </div>
          </div>
        )}

        {/* Type tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {ITEM_TYPES.map((t) => {
            const count = t.value === "all" ? items.length : items.filter((i) => i.item.type === t.value).length;
            if (t.value !== "all" && count === 0) return null;
            return (
              <button key={t.value} onClick={() => setActiveTab(t.value)}
                className={`px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-all ${
                  activeTab === t.value
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-white text-gray-600 hover:bg-gray-100 border"
                }`}>
                <span>{t.icon}</span>
                <span>{t.label}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === t.value ? "bg-white/20" : "bg-gray-100"}`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Items grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border">
            <div className="text-6xl mb-4">🎒</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">حقيبتك فارغة</h3>
            <p className="text-gray-500 text-sm">لم يتم منحك أي عناصر بعد</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((ui) => {
              const rarityInfo = RARITIES[ui.item.rarity] || RARITIES.common;
              const statusInfo = statusConfig[ui.status] || statusConfig.inactive;
              const isExpiring = !ui.isPermanent && ui.expiresAt && isExpiringSoon(ui.expiresAt);
              const canUse = ui.status === "active" || ui.status === "inactive";

              return (
                <div key={ui.id}
                  className={`bg-white rounded-2xl border-2 overflow-hidden transition-all hover:shadow-lg ${
                    ui.status === "active" ? "border-emerald-300 shadow-md" :
                    ui.status === "expired" || ui.status === "revoked" ? "border-gray-200 opacity-60" :
                    isExpiring ? "border-amber-300" : "border-gray-200"
                  }`}>
                  {/* Rarity bar */}
                  <div className="h-1" style={{ background: `linear-gradient(90deg, ${rarityInfo.color}, ${rarityInfo.color}80)` }} />

                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-sm"
                          style={{ backgroundColor: ui.item.color + "15", border: `2px solid ${ui.item.color}30` }}>
                          {ui.item.imageUrl ? <img src={ui.item.imageUrl} alt="" className="w-11 h-11 rounded-lg object-cover" /> : ui.item.icon}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{ui.item.nameAr}</h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: rarityInfo.bg, color: rarityInfo.color, border: `1px solid ${rarityInfo.color}30` }}>
                              {rarityInfo.label}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${statusInfo.color}`}>
                              {statusInfo.icon} {statusInfo.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {ui.item.descriptionAr && (
                      <p className="text-xs text-gray-500 mb-3">{ui.item.descriptionAr}</p>
                    )}

                    {/* Bubble preview */}
                    {ui.item.type === "bubble" && (() => {
                      try {
                        const p = JSON.parse(ui.item.previewData);
                        if (p.bg) {
                          return (
                            <div className="mb-3">
                              <div className="inline-block py-2 px-4 rounded-2xl text-xs" style={{ background: p.bg, color: p.text || "#fff", border: `2px solid ${p.border || "transparent"}` }}>
                                معاينة فقاعة الرسائل 💬
                              </div>
                            </div>
                          );
                        }
                      } catch { /* ignore */ }
                      return null;
                    })()}

                    {/* Entry effect preview */}
                    {ui.item.type === "entry_effect" && (() => {
                      try {
                        const p = JSON.parse(ui.item.previewData || "{}");
                        return (
                          <div className="mb-3 rounded-xl overflow-hidden">
                            <EntryEffectPreview
                              effectType={(p.effect || "glow") as EffectType}
                              icon={ui.item.icon}
                              color={ui.item.color}
                              nameAr={ui.item.nameAr}
                              size="small"
                            />
                          </div>
                        );
                      } catch { return null; }
                    })()}

                    {/* Duration info */}
                    <div className="flex items-center gap-2 mb-3 text-xs text-gray-400">
                      {ui.isPermanent ? (
                        <span className="flex items-center gap-1">♾️ دائم</span>
                      ) : ui.expiresAt ? (
                        <span className={`flex items-center gap-1 ${isExpiring ? "text-amber-600 font-medium" : ""}`}>
                          ⏳ {isExpiring ? "⚠️ " : ""}المتبقي: {getTimeRemaining(ui.expiresAt)}
                        </span>
                      ) : null}
                      <span>📅 منح: {new Date(ui.grantedAt).toLocaleDateString("ar-SA")}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {canUse && ui.status === "inactive" && (
                        <button onClick={() => handleAction(ui.itemId, "activate")}
                          disabled={actionLoading === ui.itemId}
                          className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-all">
                          {actionLoading === ui.itemId ? "..." : "✅ تفعيل"}
                        </button>
                      )}
                      {ui.status === "active" && (
                        <button onClick={() => handleAction(ui.itemId, "deactivate")}
                          disabled={actionLoading === ui.itemId}
                          className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-xl text-sm font-medium hover:bg-gray-300 disabled:opacity-50 transition-all">
                          {actionLoading === ui.itemId ? "..." : "⏸️ تعطيل"}
                        </button>
                      )}
                      <button onClick={() => setPreviewItem(ui)}
                        className="px-3 py-2 border rounded-xl text-sm hover:bg-gray-50 transition-all">
                        👁️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Preview Modal */}
        {previewItem && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPreviewItem(null)}>
            <div className="bg-white rounded-2xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="text-center mb-4">
                <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-4xl mb-3"
                  style={{ backgroundColor: previewItem.item.color + "15", border: `3px solid ${previewItem.item.color}40` }}>
                  {previewItem.item.imageUrl ? <img src={previewItem.item.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover" /> : previewItem.item.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900">{previewItem.item.nameAr}</h3>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: (RARITIES[previewItem.item.rarity] || RARITIES.common).bg, color: (RARITIES[previewItem.item.rarity] || RARITIES.common).color }}>
                    {(RARITIES[previewItem.item.rarity] || RARITIES.common).label}
                  </span>
                  <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                    {ITEM_TYPES.find((t) => t.value === previewItem.item.type)?.icon} {ITEM_TYPES.find((t) => t.value === previewItem.item.type)?.label}
                  </span>
                </div>
              </div>

              {previewItem.item.descriptionAr && (
                <p className="text-sm text-gray-600 text-center mb-4">{previewItem.item.descriptionAr}</p>
              )}

              {/* Bubble preview */}
              {previewItem.item.type === "bubble" && (() => {
                try {
                  const p = JSON.parse(previewItem.item.previewData);
                  if (p.bg) {
                    return (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-2 text-center">معاينة في الدردشة:</p>
                        <div className="bg-gray-100 rounded-xl p-4">
                          <div className="flex items-start gap-2">
                            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs">أ</div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">أحمد</p>
                              <div className="inline-block py-2 px-4 rounded-2xl text-sm" style={{ background: p.bg, color: p.text || "#fff", border: `2px solid ${p.border || "transparent"}` }}>
                                مرحباً بالجميع! 👋
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                } catch { /* ignore */ }
                return null;
              })()}

              {/* Entry effect preview - professional animated preview */}
              {previewItem.item.type === "entry_effect" && (() => {
                try {
                  const p = JSON.parse(previewItem.item.previewData || "{}");
                  return (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-2 text-center">معاينة تأثير الدخول:</p>
                      <div className="rounded-xl overflow-hidden">
                        <EntryEffectPreview
                          effectType={(p.effect || "glow") as EffectType}
                          icon={previewItem.item.icon}
                          color={previewItem.item.color}
                          nameAr={previewItem.item.nameAr}
                          size="large"
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-2 text-center">
                        يظهر هذا التأثير للمستخدمين عند دخولك الدردشة
                      </p>
                    </div>
                  );
                } catch { return null; }
              })()}

              {/* Item details */}
              <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">الحالة:</span>
                  <span className={statusConfig[previewItem.status]?.color.split(" ")[1] || "text-gray-700"}>
                    {statusConfig[previewItem.status]?.icon} {statusConfig[previewItem.status]?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">المدة:</span>
                  <span>{previewItem.isPermanent ? "♾️ دائم" : `${previewItem.durationDays} يوم`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">تاريخ المنح:</span>
                  <span>{new Date(previewItem.grantedAt).toLocaleDateString("ar-SA")}</span>
                </div>
                {!previewItem.isPermanent && previewItem.expiresAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">ينتهي في:</span>
                    <span className={isExpiringSoon(previewItem.expiresAt) ? "text-amber-600 font-medium" : ""}>
                      {getTimeRemaining(previewItem.expiresAt)}
                    </span>
                  </div>
                )}
                {previewItem.activatedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">تاريخ التفعيل:</span>
                    <span>{new Date(previewItem.activatedAt).toLocaleDateString("ar-SA")}</span>
                  </div>
                )}
              </div>

              <button onClick={() => setPreviewItem(null)}
                className="w-full bg-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-300">
                إغلاق
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
