"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Footer() {
  const [siteName, setSiteName] = useState("LinguaMaster");

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.siteName) setSiteName(data.siteName);
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-accent-400 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <span className="text-xl font-bold text-white">{siteName}</span>
            </div>
            <p className="text-gray-400 leading-relaxed max-w-md">
              منصة احترافية لتعلم اللغات الأجنبية. نقدم لك تجربة تعليمية متكاملة مع اختبارات تفاعلية وشهادات معتمدة.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">روابط سريعة</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="hover:text-primary-400 transition-colors">الرئيسية</Link></li>
              <li><Link href="/languages" className="hover:text-primary-400 transition-colors">اللغات المتاحة</Link></li>
              <li><Link href="/verify-certificate" className="hover:text-primary-400 transition-colors">التحقق من شهادة</Link></li>
              <li><Link href="/contact" className="hover:text-primary-400 transition-colors">تواصل معنا</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">تواصل معنا</h4>
            <ul className="space-y-2 text-gray-400">
              <li>info@linguamaster.com</li>
              <li>support@linguamaster.com</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} {siteName}. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}
