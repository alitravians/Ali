"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import OfficialStamp from "@/components/certificate/OfficialStamp";

interface Settings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  siteName: string;
  siteDescription: string;
  logoText: string;
  logoColor1: string;
  logoColor2: string;
  stampTopText: string;
  stampBottomText: string;
  stampCenterText: string;
  stampVerifyBottomText: string;
  stampVerifyCenterText: string;
  stampColor: string;
  stampStars: number;
  stampShowDots: boolean;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    maintenanceMode: false,
    maintenanceMessage: "الموقع تحت الصيانة حالياً. سنعود قريباً!",
    siteName: "LinguaMaster",
    siteDescription: "منصة تعلم اللغات الأجنبية",
    logoText: "L",
    logoColor1: "#3b82f6",
    logoColor2: "#8b5cf6",
    stampTopText: "LINGUAMASTER",
    stampBottomText: "CERTIFIED",
    stampCenterText: "معتمدة",
    stampVerifyBottomText: "VERIFIED",
    stampVerifyCenterText: "موثقة",
    stampColor: "#1e40af",
    stampStars: 3,
    stampShowDots: true,
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
            logoText: data.logoText || "L",
            logoColor1: data.logoColor1 || "#3b82f6",
            logoColor2: data.logoColor2 || "#8b5cf6",
            stampTopText: data.stampTopText || "LINGUAMASTER",
            stampBottomText: data.stampBottomText || "CERTIFIED",
            stampCenterText: data.stampCenterText || "معتمدة",
            stampVerifyBottomText: data.stampVerifyBottomText || "VERIFIED",
            stampVerifyCenterText: data.stampVerifyCenterText || "موثقة",
            stampColor: data.stampColor || "#1e40af",
            stampStars: data.stampStars ?? 3,
            stampShowDots: data.stampShowDots ?? true,
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
        {/* Site Info & Logo */}
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-4">معلومات الموقع والشعار</h3>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Logo Preview */}
            <div className="flex-shrink-0 flex flex-col items-center gap-3">
              <p className="text-sm font-medium text-gray-600">معاينة الشعار</p>
              <div className="bg-gray-50 rounded-xl p-6 border flex flex-col items-center gap-3">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${settings.logoColor1}, ${settings.logoColor2})` }}
                >
                  <span className="text-white font-bold text-2xl">{settings.logoText || "L"}</span>
                </div>
                <span className="text-lg font-bold" style={{ background: `linear-gradient(135deg, ${settings.logoColor1}, ${settings.logoColor2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {settings.siteName || "LinguaMaster"}
                </span>
              </div>
            </div>

            {/* Site Info Form */}
            <div className="flex-1 space-y-4">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">حرف/رمز الشعار</label>
                  <input
                    type="text"
                    value={settings.logoText}
                    onChange={(e) => setSettings({ ...settings, logoText: e.target.value.slice(0, 3) })}
                    className="input-field text-center text-lg font-bold"
                    maxLength={3}
                    dir="ltr"
                    placeholder="L"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اللون الأول</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={settings.logoColor1}
                      onChange={(e) => setSettings({ ...settings, logoColor1: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer border"
                    />
                    <input
                      type="text"
                      value={settings.logoColor1}
                      onChange={(e) => setSettings({ ...settings, logoColor1: e.target.value })}
                      className="input-field flex-1"
                      dir="ltr"
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اللون الثاني</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={settings.logoColor2}
                      onChange={(e) => setSettings({ ...settings, logoColor2: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer border"
                    />
                    <input
                      type="text"
                      value={settings.logoColor2}
                      onChange={(e) => setSettings({ ...settings, logoColor2: e.target.value })}
                      className="input-field flex-1"
                      dir="ltr"
                      placeholder="#8b5cf6"
                    />
                  </div>
                </div>
              </div>
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

        {/* Stamp Settings */}
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-4">إعدادات الختم الرسمي</h3>
          <p className="text-sm text-gray-500 mb-4">تخصيص الختم الدائري الذي يظهر على الشهادات</p>
          
          <div className="flex flex-col md:flex-row gap-6">
            {/* Stamp Preview */}
            <div className="flex-shrink-0 flex flex-col items-center gap-3">
              <p className="text-sm font-medium text-gray-600">معاينة مباشرة</p>
              <div className="bg-gray-50 rounded-xl p-4 border">
                <OfficialStamp
                  settings={{
                    stampTopText: settings.stampTopText,
                    stampBottomText: settings.stampBottomText,
                    stampCenterText: settings.stampCenterText,
                    stampColor: settings.stampColor,
                    stampStars: settings.stampStars,
                    stampShowDots: settings.stampShowDots,
                  }}
                  size={150}
                  idPrefix="preview"
                />
              </div>
            </div>

            {/* Stamp Form */}
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">النص العلوي</label>
                  <input
                    type="text"
                    value={settings.stampTopText}
                    onChange={(e) => setSettings({ ...settings, stampTopText: e.target.value })}
                    className="input-field"
                    placeholder="LINGUAMASTER"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">النص السفلي (الشهادة)</label>
                  <input
                    type="text"
                    value={settings.stampBottomText}
                    onChange={(e) => setSettings({ ...settings, stampBottomText: e.target.value })}
                    className="input-field"
                    placeholder="CERTIFIED"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">النص الوسط (الشهادة)</label>
                  <input
                    type="text"
                    value={settings.stampCenterText}
                    onChange={(e) => setSettings({ ...settings, stampCenterText: e.target.value })}
                    className="input-field"
                    placeholder="معتمدة"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">النص السفلي (التحقق)</label>
                  <input
                    type="text"
                    value={settings.stampVerifyBottomText}
                    onChange={(e) => setSettings({ ...settings, stampVerifyBottomText: e.target.value })}
                    className="input-field"
                    placeholder="VERIFIED"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">النص الوسط (التحقق)</label>
                  <input
                    type="text"
                    value={settings.stampVerifyCenterText}
                    onChange={(e) => setSettings({ ...settings, stampVerifyCenterText: e.target.value })}
                    className="input-field"
                    placeholder="موثقة"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">لون الختم</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={settings.stampColor}
                      onChange={(e) => setSettings({ ...settings, stampColor: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer border"
                    />
                    <input
                      type="text"
                      value={settings.stampColor}
                      onChange={(e) => setSettings({ ...settings, stampColor: e.target.value })}
                      className="input-field flex-1"
                      dir="ltr"
                      placeholder="#1e40af"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-6 items-center">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">عدد النجوم</label>
                  <select
                    value={settings.stampStars}
                    onChange={(e) => setSettings({ ...settings, stampStars: parseInt(e.target.value) })}
                    className="input-field w-24"
                  >
                    <option value={0}>بدون</option>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                    <option value={5}>5</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 mt-5">
                  <button
                    onClick={() => setSettings({ ...settings, stampShowDots: !settings.stampShowDots })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${settings.stampShowDots ? "bg-primary-500" : "bg-gray-300"}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.stampShowDots ? "translate-x-0.5" : "translate-x-6"}`}></div>
                  </button>
                  <span className="text-sm text-gray-700">إظهار النقاط الزخرفية</span>
                </div>
              </div>
            </div>
          </div>
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
