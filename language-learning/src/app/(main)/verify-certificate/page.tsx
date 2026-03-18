"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface CertificateData {
  code: string;
  userName: string;
  languageName: string;
  levelName: string;
  grade: string;
  gradeAr: string;
  score: number;
  issueDate: string;
  expiresAt: string | null;
  level: {
    name: string;
    nameAr: string;
    language: { name: string; nameAr: string; flag: string };
  };
  skills: {
    reading: number;
    writing: number;
    listening: number;
    speaking: number;
    overall: number;
  };
}

export default function VerifyCertificatePage() {
  const [code, setCode] = useState("");
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    setCertificate(null);
    setSearched(true);

    try {
      const res = await fetch(`/api/verify-certificate?code=${encodeURIComponent(code.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (data.valid && data.certificate) {
          setCertificate(data.certificate);
        } else {
          setError("لم يتم العثور على شهادة بهذا الرقم");
        }
      } else {
        setError("لم يتم العثور على شهادة بهذا الرقم");
      }
    } catch {
      setError("حدث خطأ في الاتصال");
    }
    setLoading(false);
  };

  const getLevelStyle = (levelName: string) => {
    const name = levelName.toLowerCase();
    if (name.includes("advanced") || name.includes("متقدم")) return { bg: "from-yellow-400 to-yellow-600", text: "text-yellow-700", border: "border-yellow-300" };
    if (name.includes("intermediate") || name.includes("متوسط")) return { bg: "from-gray-300 to-gray-500", text: "text-gray-700", border: "border-gray-300" };
    return { bg: "from-amber-600 to-amber-800", text: "text-amber-700", border: "border-amber-300" };
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="gradient-bg text-white py-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">التحقق من الشهادة</h1>
            <p className="text-xl text-primary-100">أدخل رقم الشهادة للتحقق من صحتها</p>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-2xl mx-auto px-4">
            {/* Search form */}
            <form onSubmit={handleVerify} className="card p-6 mb-8">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="input-field flex-1"
                  placeholder="مثال: LM-EN-B1-2024-00001"
                  dir="ltr"
                  required
                />
                <button type="submit" disabled={loading} className="btn-primary shrink-0 disabled:opacity-50">
                  {loading ? "جاري البحث..." : "تحقق"}
                </button>
              </div>
            </form>

            {/* Error */}
            {error && searched && (
              <div className="card p-8 text-center animate-fadeIn">
                <div className="text-6xl mb-4">❌</div>
                <h3 className="text-xl font-bold text-red-600 mb-2">شهادة غير صالحة</h3>
                <p className="text-gray-500">{error}</p>
              </div>
            )}

            {/* Certificate details */}
            {certificate && (
              <div className="animate-fadeIn">
                <div className="card overflow-hidden">
                  {/* Certificate header */}
                  <div className={`bg-gradient-to-r ${getLevelStyle(certificate.level.name).bg} p-6 text-white text-center`}>
                    <div className="text-4xl mb-2">✅</div>
                    <h2 className="text-2xl font-bold mb-1">شهادة موثقة</h2>
                    <p className="text-white/80 text-sm">تم التحقق من صحة هذه الشهادة</p>
                  </div>

                  <div className="p-8">
                    {/* Certificate info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">اسم الحاصل على الشهادة</p>
                        <p className="text-lg font-bold text-gray-900">{certificate.userName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">رقم الشهادة</p>
                        <p className="text-lg font-bold text-gray-900 font-mono" dir="ltr">{certificate.code}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">اللغة</p>
                        <p className="text-lg font-bold text-gray-900">
                          {certificate.level.language.flag} {certificate.level.language.nameAr}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">المستوى</p>
                        <p className="text-lg font-bold text-gray-900">{certificate.level.nameAr}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">التقدير</p>
                        <p className={`text-lg font-bold ${getLevelStyle(certificate.level.name).text}`}>
                          {certificate.gradeAr} ({certificate.score}%)
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">تاريخ الإصدار</p>
                        <p className="text-lg font-bold text-gray-900">
                          {new Date(certificate.issueDate).toLocaleDateString("ar")}
                        </p>
                      </div>
                    </div>

                    {/* Skills breakdown */}
                    <div className="border-t border-gray-100 pt-6">
                      <h3 className="font-bold text-gray-700 mb-4">تحليل المهارات</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { label: "القراءة", value: certificate.skills.reading, icon: "📖", color: "bg-blue-500" },
                          { label: "الكتابة", value: certificate.skills.writing, icon: "✍️", color: "bg-purple-500" },
                          { label: "الاستماع", value: certificate.skills.listening, icon: "👂", color: "bg-amber-500" },
                          { label: "النطق", value: certificate.skills.speaking, icon: "🗣️", color: "bg-pink-500" },
                        ].map((skill) => (
                          <div key={skill.label} className="bg-gray-50 rounded-xl p-4 text-center">
                            <div className="text-2xl mb-1">{skill.icon}</div>
                            <p className="text-sm text-gray-600 mb-2">{skill.label}</p>
                            <div className="progress-bar h-2 mb-1">
                              <div className={`progress-fill h-2 ${skill.color}`} style={{ width: `${skill.value}%` }}></div>
                            </div>
                            <p className="text-sm font-bold text-gray-700">{skill.value}%</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Official Circular Stamp */}
                    <div className="flex justify-center my-6">
                      <div className="relative" style={{ width: '130px', height: '130px' }}>
                        <svg viewBox="0 0 200 200" className="w-full h-full" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>
                          {/* Outer ring */}
                          <circle cx="100" cy="100" r="95" fill="none" stroke="#1e40af" strokeWidth="3" opacity="0.8" />
                          <circle cx="100" cy="100" r="88" fill="none" stroke="#1e40af" strokeWidth="1.5" opacity="0.6" />
                          {/* Decorative dots around the outer ring */}
                          {Array.from({ length: 36 }).map((_, i) => {
                            const angle = (i * 10 * Math.PI) / 180;
                            const x = 100 + 91.5 * Math.cos(angle);
                            const y = 100 + 91.5 * Math.sin(angle);
                            return <circle key={`dot-${i}`} cx={x} cy={y} r="1.2" fill="#1e40af" opacity="0.5" />;
                          })}
                          {/* Curved text - top: LinguaMaster */}
                          <defs>
                            <path id="verifyTopArc" d="M 30,100 a 70,70 0 0,1 140,0" fill="none" />
                            <path id="verifyBottomArc" d="M 170,100 a 70,70 0 0,1 -140,0" fill="none" />
                          </defs>
                          <text fill="#1e40af" fontSize="13" fontWeight="bold" letterSpacing="3">
                            <textPath href="#verifyTopArc" startOffset="50%" textAnchor="middle">LINGUAMASTER</textPath>
                          </text>
                          {/* Curved text - bottom: VERIFIED */}
                          <text fill="#1e40af" fontSize="11" fontWeight="bold" letterSpacing="4">
                            <textPath href="#verifyBottomArc" startOffset="50%" textAnchor="middle">VERIFIED</textPath>
                          </text>
                          {/* Inner circle */}
                          <circle cx="100" cy="100" r="55" fill="none" stroke="#1e40af" strokeWidth="1.5" opacity="0.6" />
                          {/* Star decoration */}
                          <polygon points="100,55 104,68 118,68 107,76 111,89 100,81 89,89 93,76 82,68 96,68" fill="#1e40af" opacity="0.15" />
                          {/* Center content */}
                          <text x="100" y="95" textAnchor="middle" fill="#1e40af" fontSize="28" fontWeight="bold">✓</text>
                          <text x="100" y="115" textAnchor="middle" fill="#1e40af" fontSize="9" fontWeight="bold">موثقة</text>
                          {/* Decorative stars */}
                          <text x="100" y="130" textAnchor="middle" fill="#1e40af" fontSize="8" opacity="0.7">★ ★ ★</text>
                          {/* Inner ring */}
                          <circle cx="100" cy="100" r="45" fill="none" stroke="#1e40af" strokeWidth="0.8" opacity="0.4" strokeDasharray="3,3" />
                        </svg>
                      </div>
                    </div>

                    {certificate.expiresAt && (
                      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                        <p className="text-amber-700 text-sm">
                          تنتهي صلاحية هذه الشهادة في: {new Date(certificate.expiresAt).toLocaleDateString("ar")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
