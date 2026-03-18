"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Settings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  siteName: string;
  siteDescription: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    maintenanceMode: false,
    maintenanceMessage: "الموقع تحت الصيانة حالياً. سنعود قريباً!",
    siteName: "LinguaMaster",
    siteDescription: "منصة تعلم اللغات الأجنبية",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setSettings({
            maintenanceMode: data.maintenanceMode ?? false,
            maintenanceMessage: data.maintenanceMessage || "الموقع تحت الصيانة حالياً. سنعود قريباً!",
            siteName: data.siteName || "LinguaMaster",
            siteDescription: data.siteDescription || "منصة تعلم اللغات الأجنبية",
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const clearCache = () => {
    if (!confirm("هل أنت متأكد من مسح الذاكرة المؤقتة؟")) return;
    localStorage.clear();
    sessionStorage.clear();
    alert("تم مسح الذاكرة المؤقتة بنجاح");
    window.location.reload();
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
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">إعدادات الموقع</h1>
            <Link href="/admin" className="btn-secondary text-sm">← لوحة التحكم</Link>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Site Info */}
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-4">معلومات الموقع</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">اسم الموقع</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">وصف الموقع</label>
              <textarea
                value={settings.siteDescription}
                onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                className="input-field"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Maintenance Mode */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">وضع الصيانة</h3>
            <button
              onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                settings.maintenanceMode ? "bg-red-500" : "bg-gray-300"
              }`}
            >
              <div
                className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  settings.maintenanceMode ? "translate-x-0.5" : "translate-x-7"
                }`}
              ></div>
            </button>
          </div>

          {settings.maintenanceMode && (
            <div className="animate-fadeIn">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <p className="text-red-700 font-medium text-sm">
                  ⚠️ وضع الصيانة مفعّل - الموقع غير متاح للمستخدمين حالياً
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رسالة الصيانة</label>
                <textarea
                  value={settings.maintenanceMessage}
                  onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="الموقع تحت الصيانة حالياً..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Admin Tools */}
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-4">أدوات إدارية</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={clearCache} className="btn-danger text-sm py-3">
              🗑️ مسح الذاكرة المؤقتة
            </button>
            <Link href="/admin/certificates" className="btn-secondary text-sm py-3 text-center block">
              🎓 عرض جميع الشهادات
            </Link>
            <Link href="/admin/users" className="btn-secondary text-sm py-3 text-center block">
              👥 إدارة المستخدمين
            </Link>
            <Link href="/admin/questions" className="btn-secondary text-sm py-3 text-center block">
              ❓ إدارة الأسئلة
            </Link>
          </div>
        </div>

        {/* Save */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex-1 py-3 disabled:opacity-50"
          >
            {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
          </button>
          {saved && (
            <div className="flex items-center text-emerald-600 font-medium text-sm animate-fadeIn">
              تم الحفظ بنجاح ✓
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
