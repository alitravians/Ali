"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface Language {
  id: string;
  name: string;
  nameAr: string;
  code: string;
  flag: string;
  description: string;
  levels: { id: string; name: string; nameAr: string; _count: { lessons: number } }[];
}

export default function LanguagesPage() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/languages")
      .then((r) => r.json())
      .then((data) => {
        setLanguages(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="gradient-bg text-white py-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">اللغات المتاحة</h1>
            <p className="text-xl text-primary-100">اختر اللغة التي تريد تعلمها وابدأ رحلتك</p>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">جاري تحميل اللغات...</p>
              </div>
            ) : languages.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">لا توجد لغات متاحة حالياً</h3>
                <p className="text-gray-500">سيتم إضافة لغات جديدة قريباً</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {languages.map((lang) => (
                  <Link key={lang.id} href={`/languages/${lang.id}`} className="card-hover group">
                    <div className="p-8 text-center">
                      <div className="text-6xl mb-4 group-hover:animate-bounce-gentle">{lang.flag || "🌐"}</div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">{lang.nameAr}</h3>
                      <p className="text-lg text-gray-500 mb-2">{lang.name}</p>
                      {lang.description && (
                        <p className="text-gray-400 text-sm mb-4">{lang.description}</p>
                      )}
                      <div className="border-t border-gray-100 pt-4 mt-4">
                        <div className="flex justify-center gap-2 flex-wrap">
                          {lang.levels.map((level) => (
                            <span key={level.id} className="badge-primary">
                              {level.nameAr} ({level._count.lessons} درس)
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
