"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import OfficialStamp from "@/components/certificate/OfficialStamp";

interface BannedWordItem {
  id: string;
  word: string;
  category: string;
  createdAt: string;
}

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
  chatEnabled: boolean;
  chatPrivateEnabled: boolean;
  chatFileUpload: boolean;
  chatBannedWords: string;
  chatAutoFilter: boolean;
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
    chatEnabled: true,
    chatPrivateEnabled: false,
    chatFileUpload: false,
    chatBannedWords: "",
    chatAutoFilter: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Banned words state
  const [bannedWords, setBannedWords] = useState<BannedWordItem[]>([]);
  const [newBannedWord, setNewBannedWord] = useState("");
  const [newBannedCategory, setNewBannedCategory] = useState("inappropriate");
  const [bannedWordLoading, setBannedWordLoading] = useState(false);
  const [bannedWordError, setBannedWordError] = useState("");
  const [aiGenerating, setAiGenerating] = useState<"names" | "chat" | null>(null);
  const [aiResult, setAiResult] = useState<{ type: string; message: string; added: number } | null>(null);

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
            chatEnabled: data.chatEnabled ?? true,
            chatPrivateEnabled: data.chatPrivateEnabled ?? false,
            chatFileUpload: data.chatFileUpload ?? false,
            chatBannedWords: data.chatBannedWords || "",
            chatAutoFilter: data.chatAutoFilter ?? true,
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setSaveError("");
    try {
      const res = await fetch("/api/settings", {
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

  const fetchBannedWords = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/banned-words");
      const data = await res.json();
      if (Array.isArray(data)) setBannedWords(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchBannedWords();
  }, [fetchBannedWords]);

  const addBannedWord = async () => {
    if (!newBannedWord.trim()) return;
    setBannedWordLoading(true);
    setBannedWordError("");
    try {
      const res = await fetch("/api/admin/banned-words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: newBannedWord.trim(), category: newBannedCategory }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBannedWordError(data.error || "فشل في إضافة الكلمة");
      } else {
        setNewBannedWord("");
        fetchBannedWords();
      }
    } catch {
      setBannedWordError("حدث خطأ");
    }
    setBannedWordLoading(false);
  };

  const deleteBannedWord = async (id: string) => {
    try {
      await fetch(`/api/admin/banned-words?id=${id}`, { method: "DELETE" });
      fetchBannedWords();
    } catch { /* ignore */ }
  };

  const generateAIWords = async (type: "names" | "chat") => {
    setAiGenerating(type);
    setAiResult(null);
    try {
      const res = await fetch("/api/admin/banned-words/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiResult({ type, message: data.error || "فشل في استخراج الكلمات", added: 0 });
      } else {
        setAiResult({ type, message: data.message, added: data.added });
        if (type === "names") {
          fetchBannedWords();
        } else if (type === "chat" && data.mergedList) {
          setSettings((prev) => ({ ...prev, chatBannedWords: data.mergedList }));
        }
      }
    } catch {
      setAiResult({ type, message: "حدث خطأ في الاتصال", added: 0 });
    }
    setAiGenerating(null);
    setTimeout(() => setAiResult(null), 5000);
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

        {/* Chat Settings */}
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-4">💬 إعدادات الدردشة</h3>
          <p className="text-sm text-gray-500 mb-4">التحكم في نظام الدردشة العام</p>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">تفعيل نظام الدردشة</span>
              <button onClick={() => setSettings({ ...settings, chatEnabled: !settings.chatEnabled })} className={`relative w-14 h-7 rounded-full transition-colors ${settings.chatEnabled ? "bg-emerald-500" : "bg-gray-300"}`}>
                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${settings.chatEnabled ? "translate-x-0.5" : "translate-x-7"}`}></div>
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">السماح بالرسائل الخاصة</span>
              <button onClick={() => setSettings({ ...settings, chatPrivateEnabled: !settings.chatPrivateEnabled })} className={`relative w-14 h-7 rounded-full transition-colors ${settings.chatPrivateEnabled ? "bg-emerald-500" : "bg-gray-300"}`}>
                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${settings.chatPrivateEnabled ? "translate-x-0.5" : "translate-x-7"}`}></div>
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">السماح بإرسال الملفات والصور</span>
              <button onClick={() => setSettings({ ...settings, chatFileUpload: !settings.chatFileUpload })} className={`relative w-14 h-7 rounded-full transition-colors ${settings.chatFileUpload ? "bg-emerald-500" : "bg-gray-300"}`}>
                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${settings.chatFileUpload ? "translate-x-0.5" : "translate-x-7"}`}></div>
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">فلترة الكلمات المسيئة تلقائياً</span>
              <button onClick={() => setSettings({ ...settings, chatAutoFilter: !settings.chatAutoFilter })} className={`relative w-14 h-7 rounded-full transition-colors ${settings.chatAutoFilter ? "bg-emerald-500" : "bg-gray-300"}`}>
                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${settings.chatAutoFilter ? "translate-x-0.5" : "translate-x-7"}`}></div>
              </button>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">الكلمات الممنوعة (مفصولة بفواصل)</label>
                <button
                  onClick={() => generateAIWords("chat")}
                  disabled={aiGenerating === "chat"}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 transition-all shadow-sm disabled:opacity-50"
                  title="استخراج الكلمات الممنوعة بالذكاء الاصطناعي"
                >
                  {aiGenerating === "chat" ? (
                    <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> جاري الاستخراج...</>
                  ) : (
                    <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg> استخراج بالذكاء الاصطناعي</>
                  )}
                </button>
              </div>
              {aiResult && aiResult.type === "chat" && (
                <div className={`text-xs mb-2 px-3 py-1.5 rounded-lg ${aiResult.added > 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  {aiResult.message}
                </div>
              )}
              <textarea value={settings.chatBannedWords} onChange={(e) => setSettings({ ...settings, chatBannedWords: e.target.value })} className="input-field" rows={3} placeholder="كلمة1, كلمة2, كلمة3" />
            </div>
          </div>
        </div>

        {/* Banned Words for Name Changes */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-900">الكلمات الممنوعة في الأسماء</h3>
            <button
              onClick={() => generateAIWords("names")}
              disabled={aiGenerating === "names"}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 transition-all shadow-sm disabled:opacity-50"
              title="استخراج الكلمات الممنوعة بالذكاء الاصطناعي"
            >
              {aiGenerating === "names" ? (
                <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> جاري الاستخراج...</>
              ) : (
                <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg> استخراج بالذكاء الاصطناعي</>
              )}
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-4">الأسماء التي تحتوي على هذه الكلمات ستخضع لمراجعة إدارية قبل الموافقة</p>
          {aiResult && aiResult.type === "names" && (
            <div className={`text-xs mb-3 px-3 py-2 rounded-lg ${aiResult.added > 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
              {aiResult.message}
            </div>
          )}

          {/* Add new word */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newBannedWord}
              onChange={(e) => setNewBannedWord(e.target.value)}
              className="input-field flex-1"
              placeholder="أدخل كلمة ممنوعة"
              dir="auto"
            />
            <select
              value={newBannedCategory}
              onChange={(e) => setNewBannedCategory(e.target.value)}
              className="input-field w-40"
            >
              <option value="inappropriate">غير لائقة</option>
              <option value="offensive">مسيئة</option>
              <option value="misleading">مضللة</option>
              <option value="other">أخرى</option>
            </select>
            <button
              onClick={addBannedWord}
              disabled={bannedWordLoading || !newBannedWord.trim()}
              className="btn-primary text-sm px-4 disabled:opacity-50"
            >
              {bannedWordLoading ? "..." : "إضافة"}
            </button>
          </div>

          {bannedWordError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-700 text-sm">{bannedWordError}</p>
            </div>
          )}

          {/* Words list */}
          {bannedWords.length === 0 ? (
            <p className="text-gray-400 text-center py-4 text-sm">لا توجد كلمات ممنوعة مضافة</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {bannedWords.map((bw) => (
                <div key={bw.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900 text-sm">{bw.word}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      bw.category === "offensive" ? "bg-red-100 text-red-700" :
                      bw.category === "misleading" ? "bg-amber-100 text-amber-700" :
                      bw.category === "inappropriate" ? "bg-purple-100 text-purple-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {bw.category === "offensive" ? "مسيئة" :
                       bw.category === "misleading" ? "مضللة" :
                       bw.category === "inappropriate" ? "غير لائقة" : "أخرى"}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteBannedWord(bw.id)}
                    className="text-red-400 hover:text-red-600 text-sm"
                    title="حذف"
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-4 border-t">
            <Link href="/admin/name-requests" className="text-primary-600 text-sm font-medium hover:text-primary-700">
              عرض طلبات تغيير الأسماء ←
            </Link>
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
          {saveError && (
            <div className="flex items-center text-red-600 font-medium text-sm animate-fadeIn">
              ⚠️ {saveError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
