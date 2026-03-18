"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Certificate {
  id: string;
  code: string;
  grade: string;
  gradeAr: string;
  score: number;
  readingScore: number;
  writingScore: number;
  listeningScore: number;
  speakingScore: number;
  issuedAt: string;
  expiresAt: string | null;
  user: { id: string; name: string; email: string };
  level: { nameAr: string; name: string; language: { nameAr: string; flag: string } };
}

export default function AdminCertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/certificates?all=true")
      .then((r) => r.json())
      .then((data) => { setCertificates(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">الشهادات الصادرة</h1>
              <p className="text-sm text-gray-500">{certificates.length} شهادة</p>
            </div>
            <Link href="/admin" className="btn-secondary text-sm">← لوحة التحكم</Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-16"><div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div></div>
        ) : certificates.length === 0 ? (
          <div className="text-center py-16"><p className="text-gray-500">لا توجد شهادات صادرة</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-2xl shadow-sm overflow-hidden">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700">المستخدم</th>
                  <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700">اللغة/المستوى</th>
                  <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700">التقدير</th>
                  <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700">النتيجة</th>
                  <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700">رقم الشهادة</th>
                  <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((cert) => (
                  <tr key={cert.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900 text-sm">{cert.user.name}</p>
                      <p className="text-xs text-gray-500">{cert.user.email}</p>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {cert.level ? `${cert.level.language?.flag || ""} ${cert.level.language?.nameAr || ""} - ${cert.level.nameAr}` : "-"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="badge-primary text-xs">{cert.gradeAr}</span>
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-gray-700">{cert.score}%</td>
                    <td className="py-3 px-4 text-sm font-mono text-gray-500" dir="ltr">{cert.code}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">{new Date(cert.issuedAt).toLocaleDateString("ar")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
