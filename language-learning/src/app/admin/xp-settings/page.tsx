"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Settings {
  xpPerMessage: number;
  xpPerLogin: number;
  xpPerQuest: number;
  xpDailyMessageCap: number;
  xpMinMsgLength: number;
  xpMsgCooldown: number;
  pointsPerMessage: number;
  pointsPerLogin: number;
  pointsPerQuest: number;
  pointsPerLevelUp: number;
  pointsDailyMsgCap: number;
}

export default function AdminXPSettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    xpPerMessage: 5, xpPerLogin: 20, xpPerQuest: 50, xpDailyMessageCap: 100,
    xpMinMsgLength: 3, xpMsgCooldown: 30, pointsPerMessage: 2, pointsPerLogin: 10,
    pointsPerQuest: 25, pointsPerLevelUp: 100, pointsDailyMsgCap: 50,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    fetch("/api/admin/xp-settings")
      .then((r) => r.json())
      .then((data) => { if (!data.error) setSettings(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setSaveError("");
    try {
      const res = await fetch("/api/admin/xp-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error || `فشل في حفظ الإعدادات (${res.status})`);
        setSaving(false);
        return;
      }
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaveError("حدث خطأ في الاتصال بالخادم");
      setSaving(false);
    }
  };

  const updateField = (field: keyof Settings, value: number) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
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
            <h1 className="text-xl font-bold text-gray-900">⚡ إعدادات XP والنقاط</h1>
            <div className="flex gap-2">
              {saved && <span className="text-emerald-600 text-sm font-medium self-center">تم الحفظ!</span>}
              {saveError && <span className="text-red-600 text-sm font-medium self-center">⚠️ {saveError}</span>}
              <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">{saving ? "جاري الحفظ..." : "حفظ الإعدادات"}</button>
              <Link href="/admin" className="btn-secondary text-sm">← لوحة التحكم</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* XP Settings */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">⭐ إعدادات الخبرة (XP)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">XP لكل رسالة</label>
              <input type="number" value={settings.xpPerMessage} onChange={(e) => updateField("xpPerMessage", parseInt(e.target.value) || 0)} className="w-full p-3 border rounded-xl" />
              <p className="text-xs text-gray-400 mt-1">عدد نقاط الخبرة لكل رسالة</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">XP لتسجيل الدخول</label>
              <input type="number" value={settings.xpPerLogin} onChange={(e) => updateField("xpPerLogin", parseInt(e.target.value) || 0)} className="w-full p-3 border rounded-xl" />
              <p className="text-xs text-gray-400 mt-1">مكافأة تسجيل الدخول اليومي</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">XP لكل مهمة</label>
              <input type="number" value={settings.xpPerQuest} onChange={(e) => updateField("xpPerQuest", parseInt(e.target.value) || 0)} className="w-full p-3 border rounded-xl" />
              <p className="text-xs text-gray-400 mt-1">مكافأة إكمال المهمة اليومية</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">حد XP اليومي من الرسائل</label>
              <input type="number" value={settings.xpDailyMessageCap} onChange={(e) => updateField("xpDailyMessageCap", parseInt(e.target.value) || 0)} className="w-full p-3 border rounded-xl" />
              <p className="text-xs text-gray-400 mt-1">أقصى XP يمكن كسبه من الرسائل يومياً</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">أقل طول للرسالة</label>
              <input type="number" value={settings.xpMinMsgLength} onChange={(e) => updateField("xpMinMsgLength", parseInt(e.target.value) || 0)} className="w-full p-3 border rounded-xl" />
              <p className="text-xs text-gray-400 mt-1">أقل عدد أحرف لكسب XP</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">فترة الانتظار (ثواني)</label>
              <input type="number" value={settings.xpMsgCooldown} onChange={(e) => updateField("xpMsgCooldown", parseInt(e.target.value) || 0)} className="w-full p-3 border rounded-xl" />
              <p className="text-xs text-gray-400 mt-1">الوقت بين كل رسالتين تكسب XP</p>
            </div>
          </div>
        </div>

        {/* Points Settings */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">💰 إعدادات النقاط</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نقاط لكل رسالة</label>
              <input type="number" value={settings.pointsPerMessage} onChange={(e) => updateField("pointsPerMessage", parseInt(e.target.value) || 0)} className="w-full p-3 border rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نقاط لتسجيل الدخول</label>
              <input type="number" value={settings.pointsPerLogin} onChange={(e) => updateField("pointsPerLogin", parseInt(e.target.value) || 0)} className="w-full p-3 border rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نقاط لكل مهمة</label>
              <input type="number" value={settings.pointsPerQuest} onChange={(e) => updateField("pointsPerQuest", parseInt(e.target.value) || 0)} className="w-full p-3 border rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نقاط لكل ارتقاء مستوى</label>
              <input type="number" value={settings.pointsPerLevelUp} onChange={(e) => updateField("pointsPerLevelUp", parseInt(e.target.value) || 0)} className="w-full p-3 border rounded-xl" />
              <p className="text-xs text-gray-400 mt-1">نقاط تُمنح عند الوصول لمستوى جديد</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">حد النقاط اليومي من الرسائل</label>
              <input type="number" value={settings.pointsDailyMsgCap} onChange={(e) => updateField("pointsDailyMsgCap", parseInt(e.target.value) || 0)} className="w-full p-3 border rounded-xl" />
            </div>
          </div>
        </div>

        {/* Level Formula Info */}
        <div className="card p-6 bg-blue-50 border-blue-200">
          <h2 className="text-lg font-bold text-blue-900 mb-2">📊 معادلة المستويات</h2>
          <p className="text-blue-700 text-sm mb-3">XP المطلوب للمستوى = المستوى × 100</p>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((lvl) => (
              <div key={lvl} className="bg-white rounded-lg p-2 text-center">
                <p className="text-xs text-blue-500">مستوى {lvl}</p>
                <p className="font-bold text-blue-900 text-sm">{lvl * 100}</p>
                <p className="text-xs text-blue-400">XP</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
