"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface Language {
  id: string;
  name: string;
  nameAr: string;
  code: string;
  flag: string;
  description: string;
  levels: { id: string; name: string; nameAr: string }[];
}

interface Settings {
  maintenanceMode: boolean;
  maintenanceMsg: string;
}

export default function HomePage() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/languages").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ]).then(([langs, siteSettings]) => {
      setLanguages(Array.isArray(langs) ? langs : []);
      setSettings(siteSettings);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (settings?.maintenanceMode) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 md:p-12 max-w-lg w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">الموقع تحت الصيانة</h1>
          <p className="text-gray-500 mb-6">{settings.maintenanceMsg}</p>
          <p className="text-sm text-gray-400">سنعود قريباً إن شاء الله</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="gradient-bg text-white py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-accent-300 rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
              تعلم اللغات بطريقة
              <span className="block text-accent-200">ذكية واحترافية</span>
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 mb-10 leading-relaxed">
              منصة متكاملة لتعلم اللغات الأجنبية مع اختبارات تفاعلية، نظام نطق صوتي،
              وشهادات معتمدة عند إتمام كل مستوى بنجاح
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="bg-white text-primary-700 font-bold py-4 px-8 rounded-xl hover:bg-primary-50 transition-all shadow-xl hover:shadow-2xl text-lg">
                ابدأ التعلم مجاناً
              </Link>
              <Link href="/languages" className="border-2 border-white/30 text-white font-bold py-4 px-8 rounded-xl hover:bg-white/10 transition-all text-lg">
                استعرض اللغات
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title">لماذا LinguaMaster؟</h2>
            <p className="section-subtitle">منصة شاملة تجمع بين التعلم والاختبار والتقييم</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: "📚", title: "دروس منظمة", desc: "محتوى تعليمي مرتب حسب المستوى مع كلمات وقواعد وأمثلة" },
              { icon: "📝", title: "اختبارات متنوعة", desc: "5 أنواع من الاختبارات لقياس إتقانك الحقيقي للغة" },
              { icon: "🔊", title: "نطق صوتي", desc: "استمع للنطق الصحيح لكل كلمة وجملة مع إمكانية التكرار" },
              { icon: "🏆", title: "شهادات معتمدة", desc: "احصل على شهادة احترافية بعد اجتياز كل مستوى بنجاح" },
            ].map((feature, i) => (
              <div key={i} className="card p-8 text-center group hover:border-primary-200">
                <div className="text-4xl mb-4 group-hover:animate-bounce-gentle">{feature.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Languages Section */}
      {languages.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="section-title">اللغات المتاحة</h2>
              <p className="section-subtitle">ابدأ رحلتك مع اللغة التي تريد تعلمها</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {languages.map((lang) => (
                <Link key={lang.id} href={`/languages/${lang.id}`} className="card-hover p-8 text-center">
                  <div className="text-5xl mb-4">{lang.flag || "🌐"}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{lang.nameAr}</h3>
                  <p className="text-gray-500 mb-4">{lang.name}</p>
                  <div className="flex justify-center gap-2">
                    {lang.levels.map((level) => (
                      <span key={level.id} className="badge-primary text-xs">{level.nameAr}</span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title">كيف يعمل الموقع؟</h2>
            <p className="section-subtitle">خطوات بسيطة نحو إتقان اللغة</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: "1", title: "اختر اللغة", desc: "اختر اللغة التي تريد تعلمها من قائمة اللغات المتاحة" },
              { step: "2", title: "ادرس المحتوى", desc: "تعلم الكلمات والقواعد مع النطق الصوتي والأمثلة" },
              { step: "3", title: "اجتز الاختبار", desc: "اختبر معلوماتك بأنواع متعددة من الأسئلة التفاعلية" },
              { step: "4", title: "احصل على الشهادة", desc: "عند النجاح، احصل على شهادة احترافية قابلة للتحميل" },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold shadow-lg">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-bg text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">جاهز لبدء رحلة التعلم؟</h2>
          <p className="text-xl text-primary-100 mb-8">
            انضم إلى آلاف المتعلمين واحصل على شهادات معتمدة في اللغات الأجنبية
          </p>
          <Link href="/register" className="inline-block bg-white text-primary-700 font-bold py-4 px-10 rounded-xl hover:bg-primary-50 transition-all shadow-xl text-lg">
            سجل الآن مجاناً
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
