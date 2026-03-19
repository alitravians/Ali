"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

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
  isLimited: boolean;
  limitedUntil: string | null;
  stock: number;
  soldCount: number;
}

const TYPES: Record<string, string> = {
  entry_effect: "تأثيرات دخول",
  necklace: "قلادات",
  badge: "شارات",
  bubble: "فقاعات محادثة",
};

const RARITY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  common: { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-600" },
  rare: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-600" },
  epic: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-600" },
  legendary: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-600" },
};

const RARITY_LABELS: Record<string, string> = {
  common: "عادي",
  rare: "نادر",
  epic: "أسطوري",
  legendary: "خرافي",
};

export default function ShopPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPoints, setUserPoints] = useState(0);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status !== "authenticated") return;

    Promise.all([
      fetch("/api/shop").then((r) => r.json()),
      fetch("/api/points").then((r) => r.json()),
    ]).then(([shopData, pointsData]) => {
      if (Array.isArray(shopData)) setItems(shopData);
      setUserPoints(pointsData?.points || 0);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [status, router]);

  const handlePurchase = async (itemId: string) => {
    if (purchasing) return;
    setPurchasing(itemId);
    setMessage(null);
    try {
      const res = await fetch("/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopItemId: itemId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: "تم الشراء بنجاح! تحقق من حقيبتك", type: "success" });
        setUserPoints(data.newBalance);
      } else {
        setMessage({ text: data.error || "فشلت عملية الشراء", type: "error" });
      }
    } catch {
      setMessage({ text: "حدث خطأ", type: "error" });
    }
    setPurchasing(null);
    setTimeout(() => setMessage(null), 5000);
  };

  const filteredItems = filter === "all" ? items : items.filter((i) => i.type === filter);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50">
        {/* Header */}
        <section className="gradient-bg text-white py-10">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold mb-2">🛒 المتجر</h1>
            <p className="text-primary-200 mb-4">اشترِ تأثيرات وقلادات وشارات بنقاطك</p>
            <div className="inline-flex items-center gap-2 bg-white/20 rounded-2xl px-6 py-3">
              <span className="text-2xl">💰</span>
              <span className="text-2xl font-bold">{userPoints}</span>
              <span className="text-primary-200">نقطة</span>
            </div>
          </div>
        </section>

        {/* Message */}
        {message && (
          <div className={`max-w-6xl mx-auto px-4 mt-4`}>
            <div className={`p-4 rounded-xl text-center font-medium ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {message.text}
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="max-w-6xl mx-auto px-4 mt-6">
          <div className="flex flex-wrap gap-2 justify-center">
            <button onClick={() => setFilter("all")} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === "all" ? "bg-primary-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100 border"}`}>
              الكل
            </button>
            {Object.entries(TYPES).map(([key, label]) => (
              <button key={key} onClick={() => setFilter(key)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === key ? "bg-primary-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100 border"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Items Grid */}
        <div className="max-w-6xl mx-auto px-4 py-6">
          {filteredItems.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-4xl mb-3">🛒</p>
              <p className="text-gray-500">لا توجد منتجات متاحة حالياً</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map((item) => {
                const rc = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;
                const canAfford = userPoints >= item.price;
                const outOfStock = item.stock !== -1 && item.soldCount >= item.stock;

                return (
                  <div key={item.id} className={`card overflow-hidden ${rc.border} border-2 hover:shadow-lg transition-shadow`}>
                    {/* Limited Badge */}
                    {item.isLimited && (
                      <div className="bg-red-500 text-white text-xs font-bold text-center py-1">
                        عرض محدود {item.limitedUntil && `- ينتهي ${new Date(item.limitedUntil).toLocaleDateString("ar")}`}
                      </div>
                    )}
                    <div className={`p-5 ${rc.bg}`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-4xl">{item.icon || "🎁"}</span>
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${rc.text} ${rc.bg} border ${rc.border}`}>
                          {RARITY_LABELS[item.rarity]}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg">{item.nameAr}</h3>
                      <p className="text-sm text-gray-500 mt-1">{item.descriptionAr}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                        <span>{TYPES[item.type]}</span>
                        <span>•</span>
                        <span>{item.isPermanent ? "دائم" : `${item.durationDays} يوم`}</span>
                      </div>
                    </div>
                    <div className="p-4 border-t flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-lg">💰</span>
                        <span className="font-bold text-lg text-gray-900">{item.price}</span>
                      </div>
                      <button
                        onClick={() => handlePurchase(item.id)}
                        disabled={!canAfford || outOfStock || purchasing === item.id}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                          outOfStock
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : !canAfford
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : purchasing === item.id
                            ? "bg-primary-400 text-white cursor-wait"
                            : "bg-primary-600 text-white hover:bg-primary-700"
                        }`}
                      >
                        {outOfStock ? "نفذ" : !canAfford ? "رصيد غير كافٍ" : purchasing === item.id ? "جاري..." : "شراء"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
