"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface CertificateData {
  id: string;
  certificateCode: string;
  userName: string;
  grade: string;
  gradeAr: string;
  score: number;
  readingScore: number;
  writingScore: number;
  listeningScore: number;
  speakingScore: number;
  issueDate: string;
  expiresAt: string | null;
  user: { name: string };
  level: {
    name: string;
    nameAr: string;
    order: number;
    language: { name: string; nameAr: string; flag: string; code: string };
  };
}

export default function CertificatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [certificates, setCertificates] = useState<CertificateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<CertificateData | null>(null);
  const [showCert, setShowCert] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status !== "authenticated") return;
    fetch("/api/certificates")
      .then((r) => r.json())
      .then((data) => { setCertificates(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [status, router]);

  const getLevelStyle = (order: number) => {
    if (order >= 3) return { gradient: "from-yellow-400 via-yellow-500 to-yellow-600", border: "border-yellow-400", label: "ذهبي", seal: "🥇" };
    if (order === 2) return { gradient: "from-gray-300 via-gray-400 to-gray-500", border: "border-gray-400", label: "فضي", seal: "🥈" };
    return { gradient: "from-amber-600 via-amber-700 to-amber-800", border: "border-amber-600", label: "برونزي", seal: "🥉" };
  };

  const viewCertificate = (cert: CertificateData) => {
    setSelectedCert(cert);
    setShowCert(true);
  };

  const downloadPDF = async () => {
    if (!certRef.current || !selectedCert) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;
      const canvas = await html2canvas(certRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      pdf.addImage(imgData, "PNG", 0, 0, 297, 210);
      pdf.save(`certificate-${selectedCert.certificateCode}.pdf`);
    } catch (err) {
      console.error("PDF error:", err);
    }
  };

  const shareUrl = (cert: CertificateData) => {
    return `${typeof window !== "undefined" ? window.location.origin : ""}/verify-certificate?code=${cert.certificateCode}`;
  };

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
        <section className="gradient-bg text-white py-12">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold mb-2">🎓 شهاداتي</h1>
            <p className="text-primary-200">جميع الشهادات التي حصلت عليها</p>
          </div>
        </section>

        <section className="py-8">
          <div className="max-w-5xl mx-auto px-4">
            {certificates.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📜</div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">لا توجد شهادات بعد</h3>
                <p className="text-gray-500 mb-4">أكمل المستويات واجتز الاختبارات للحصول على شهادات</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {certificates.map((cert) => {
                  const style = getLevelStyle(cert.level.order);
                  return (
                    <div key={cert.id} className="card overflow-hidden">
                      <div className={`bg-gradient-to-r ${style.gradient} p-4 text-white text-center`}>
                        <p className="text-3xl mb-1">{style.seal}</p>
                        <p className="font-bold">{cert.level.language.nameAr} - {cert.level.nameAr}</p>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                          <div><span className="text-gray-500">التقدير:</span> <strong>{cert.gradeAr}</strong></div>
                          <div><span className="text-gray-500">النتيجة:</span> <strong>{cert.score}%</strong></div>
                                                    <div><span className="text-gray-500">الرقم:</span> <strong className="font-mono text-xs" dir="ltr">{cert.certificateCode}</strong></div>
                                                    <div><span className="text-gray-500">التاريخ:</span> <strong>{new Date(cert.issueDate).toLocaleDateString("ar")}</strong></div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => viewCertificate(cert)} className="btn-primary text-sm flex-1">عرض الشهادة</button>
                          <button
                            onClick={() => { navigator.clipboard.writeText(shareUrl(cert)); }}
                            className="btn-secondary text-sm"
                            title="نسخ رابط المشاركة"
                          >
                            🔗
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Certificate Modal */}
      {showCert && selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowCert(false)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-gray-900">الشهادة</h3>
              <div className="flex gap-2">
                <button onClick={downloadPDF} className="btn-primary text-sm">تحميل PDF 📄</button>
                <button onClick={() => setShowCert(false)} className="btn-secondary text-sm">إغلاق</button>
              </div>
            </div>

            {/* Certificate Design */}
            <div className="p-6">
              <div
                ref={certRef}
                className={`border-4 ${getLevelStyle(selectedCert.level.order).border} p-8 md:p-12 text-center bg-white relative`}
                style={{ aspectRatio: "297/210" }}
              >
                {/* Decorative corners */}
                <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-primary-400 rounded-tl-lg"></div>
                <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-primary-400 rounded-tr-lg"></div>
                <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-primary-400 rounded-bl-lg"></div>
                <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-primary-400 rounded-br-lg"></div>

                {/* Header */}
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl mx-auto flex items-center justify-center mb-3">
                    <span className="text-white font-bold text-2xl">L</span>
                  </div>
                  <h2 className="text-sm text-gray-500 tracking-widest uppercase">LinguaMaster</h2>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">شهادة إتمام</h1>
                <p className="text-gray-500 mb-6">Certificate of Completion</p>

                <p className="text-gray-600 mb-2">يُشهد بأن</p>
                <h2 className="text-2xl md:text-3xl font-bold text-primary-700 mb-4">{selectedCert.user.name}</h2>

                <p className="text-gray-600 mb-1">قد أتم بنجاح مستوى</p>
                <p className="text-xl font-bold text-gray-900 mb-1">
                  {selectedCert.level.language.flag} {selectedCert.level.language.nameAr} - {selectedCert.level.nameAr}
                </p>
                <p className="text-lg text-gray-700 mb-4">
                  بتقدير: <span className="font-bold">{selectedCert.gradeAr}</span> ({selectedCert.score}%)
                </p>

                {/* Skills */}
                <div className="flex justify-center gap-6 mb-6 text-xs">
                  {[
                    { label: "القراءة", value: selectedCert.readingScore },
                    { label: "الكتابة", value: selectedCert.writingScore },
                    { label: "الاستماع", value: selectedCert.listeningScore },
                    { label: "النطق", value: selectedCert.speakingScore },
                  ].map((s) => (
                    <div key={s.label}>
                      <p className="text-gray-500">{s.label}</p>
                      <p className="font-bold text-gray-700">{s.value}%</p>
                    </div>
                  ))}
                </div>

                {/* Official Circular Stamp */}
                <div className="flex justify-center my-4">
                  <div className="relative" style={{ width: '140px', height: '140px' }}>
                    <svg viewBox="0 0 200 200" className="w-full h-full" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>
                      {/* Outer ring */}
                      <circle cx="100" cy="100" r="95" fill="none" stroke="#1e40af" strokeWidth="3" opacity="0.8" />
                      <circle cx="100" cy="100" r="88" fill="none" stroke="#1e40af" strokeWidth="1.5" opacity="0.6" />
                      {/* Decorative dots around the outer ring */}
                      {Array.from({ length: 36 }).map((_, i) => {
                        const angle = (i * 10 * Math.PI) / 180;
                        const x = 100 + 91.5 * Math.cos(angle);
                        const y = 100 + 91.5 * Math.sin(angle);
                        return <circle key={i} cx={x} cy={y} r="1.2" fill="#1e40af" opacity="0.5" />;
                      })}
                      {/* Curved text - top: LinguaMaster */}
                      <defs>
                        <path id="topArc" d="M 30,100 a 70,70 0 0,1 140,0" fill="none" />
                        <path id="bottomArc" d="M 170,100 a 70,70 0 0,1 -140,0" fill="none" />
                      </defs>
                      <text fill="#1e40af" fontSize="13" fontWeight="bold" letterSpacing="3">
                        <textPath href="#topArc" startOffset="50%" textAnchor="middle">LINGUAMASTER</textPath>
                      </text>
                      {/* Curved text - bottom: CERTIFIED */}
                      <text fill="#1e40af" fontSize="11" fontWeight="bold" letterSpacing="4">
                        <textPath href="#bottomArc" startOffset="50%" textAnchor="middle">CERTIFIED</textPath>
                      </text>
                      {/* Inner circle */}
                      <circle cx="100" cy="100" r="55" fill="none" stroke="#1e40af" strokeWidth="1.5" opacity="0.6" />
                      {/* Star decoration */}
                      <polygon points="100,55 104,68 118,68 107,76 111,89 100,81 89,89 93,76 82,68 96,68" fill="#1e40af" opacity="0.15" />
                      {/* Center content */}
                      <text x="100" y="95" textAnchor="middle" fill="#1e40af" fontSize="28" fontWeight="bold">✓</text>
                      <text x="100" y="115" textAnchor="middle" fill="#1e40af" fontSize="9" fontWeight="bold">معتمدة</text>
                      {/* Decorative stars on sides */}
                      <text x="100" y="130" textAnchor="middle" fill="#1e40af" fontSize="8" opacity="0.7">★ ★ ★</text>
                      {/* Inner ring */}
                      <circle cx="100" cy="100" r="45" fill="none" stroke="#1e40af" strokeWidth="0.8" opacity="0.4" strokeDasharray="3,3" />
                    </svg>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-end mt-2 text-xs text-gray-500">
                  <div>
                    <p>تاريخ الإصدار</p>
                    <p className="font-medium text-gray-700">{new Date(selectedCert.issueDate).toLocaleDateString("ar")}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-primary-600 mb-1">{getLevelStyle(selectedCert.level.order).seal} {getLevelStyle(selectedCert.level.order).label}</p>
                  </div>
                  <div>
                    <p>رقم الشهادة</p>
                    <p className="font-mono font-medium text-gray-700" dir="ltr">{selectedCert.certificateCode}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Share buttons */}
            <div className="p-4 border-t">
              <p className="text-sm text-gray-500 mb-3 text-center">مشاركة الشهادة:</p>
              <div className="flex justify-center gap-3">
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl(selectedCert))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
                >
                  LinkedIn
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`حصلت على شهادة ${selectedCert.level.language.nameAr} - ${selectedCert.level.nameAr} من LinguaMaster!`)}&url=${encodeURIComponent(shareUrl(selectedCert))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-sky-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-sky-600"
                >
                  Twitter
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl(selectedCert))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800"
                >
                  Facebook
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
