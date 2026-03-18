"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Settings {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  educationalEnabled: boolean;
  certificatesEnabled: boolean;
  supportEnabled: boolean;
  accountEnabled: boolean;
  adminEnabled: boolean;
}

export default function NotificationSettingsPage() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<Settings>({
    inAppEnabled: true,
    emailEnabled: false,
    educationalEnabled: true,
    certificatesEnabled: true,
    supportEnabled: true,
    accountEnabled: true,
    adminEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/notifications/settings")
        .then((r) => r.json())
        .then((data) => {
          if (data && !data.error) {
            setSettings({
              inAppEnabled: data.inAppEnabled ?? true,
              emailEnabled: data.emailEnabled ?? false,
              educationalEnabled: data.educationalEnabled ?? true,
              certificatesEnabled: data.certificatesEnabled ?? true,
              supportEnabled: data.supportEnabled ?? true,
              accountEnabled: data.accountEnabled ?? true,
              adminEnabled: data.adminEnabled ?? true,
            });
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [session]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/notifications/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // Error handled silently
    }
    setSaving(false);
  };

  const toggleSetting = (key: keyof Settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">يرجى تسجيل الدخول</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const categories = [
    { key: "educationalEnabled" as keyof Settings, label: "إشعارات تعليمية", desc: "الدروس، الاختبارات، التقدم", icon: "📚" },
    { key: "certificatesEnabled" as keyof Settings, label: "إشعارات الشهادات", desc: "إصدار الشهادات والإنجازات", icon: "🎓" },
    { key: "supportEnabled" as keyof Settings, label: "إشعارات الدعم الفني", desc: "تحديثات التذاكر والردود", icon: "🎫" },
    { key: "accountEnabled" as keyof Settings, label: "إشعارات الحساب", desc: "تحديثات الحساب والأمان", icon: "👤" },
    { key: "adminEnabled" as keyof Settings, label: "إعلانات الإدارة", desc: "الإعلانات والتحديثات الرسمية", icon: "📢" },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إعدادات الإشعارات</h1>
          <p className="text-gray-500 text-sm mt-1">تحكم في أنواع الإشعارات التي تريد استقبالها</p>
        </div>
        <Link
          href="/profile/notifications"
          className="text-sm text-gray-500 hover:text-primary-600 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
        >
          ← الإشعارات
        </Link>
      </div>

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-4 mb-6 animate-fadeIn">
          تم حفظ الإعدادات بنجاح
        </div>
      )}

      <div className="space-y-6">
        {/* General Settings */}
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-4">إعدادات عامة</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔔</span>
                <div>
                  <p className="font-medium text-gray-900">إشعارات الموقع</p>
                  <p className="text-xs text-gray-500">استقبال الإشعارات داخل الموقع</p>
                </div>
              </div>
              <button
                onClick={() => toggleSetting("inAppEnabled")}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.inAppEnabled ? "bg-primary-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                    settings.inAppEnabled ? "right-0.5" : "right-[26px]"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📧</span>
                <div>
                  <p className="font-medium text-gray-900">إشعارات البريد الإلكتروني</p>
                  <p className="text-xs text-gray-500">استقبال الإشعارات عبر البريد (قريباً)</p>
                </div>
              </div>
              <button
                onClick={() => toggleSetting("emailEnabled")}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.emailEnabled ? "bg-primary-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                    settings.emailEnabled ? "right-0.5" : "right-[26px]"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Category Settings */}
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-4">أنواع الإشعارات</h3>
          <div className="space-y-3">
            {categories.map((cat) => (
              <div
                key={cat.key}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{cat.icon}</span>
                  <div>
                    <p className="font-medium text-gray-900">{cat.label}</p>
                    <p className="text-xs text-gray-500">{cat.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleSetting(cat.key)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings[cat.key] ? "bg-primary-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                      settings[cat.key] ? "right-0.5" : "right-[26px]"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full py-3 disabled:opacity-50"
        >
          {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
        </button>
      </div>
    </div>
  );
}
