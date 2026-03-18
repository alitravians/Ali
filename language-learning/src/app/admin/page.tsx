"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  totalUsers: number;
  totalLanguages: number;
  totalLevels: number;
  totalLessons: number;
  totalQuestions: number;
  totalTests: number;
  totalCertificates: number;
  totalTestResults: number;
  totalTickets: number;
  openTickets: number;
  recentUsers: { id: string; name: string; email: string; createdAt: string }[];
  recentCertificates: { id: string; code: string; score: number; user: { name: string }; level: { nameAr: string } }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const statCards = [
    { label: "المستخدمين", value: stats?.totalUsers || 0, icon: "👥", color: "from-blue-500 to-blue-600", href: "/admin/users" },
    { label: "اللغات", value: stats?.totalLanguages || 0, icon: "🌐", color: "from-emerald-500 to-emerald-600", href: "/admin/languages" },
    { label: "المستويات", value: stats?.totalLevels || 0, icon: "📊", color: "from-purple-500 to-purple-600", href: "/admin/levels" },
    { label: "الدروس", value: stats?.totalLessons || 0, icon: "📚", color: "from-amber-500 to-amber-600", href: "/admin/lessons" },
    { label: "الأسئلة", value: stats?.totalQuestions || 0, icon: "❓", color: "from-pink-500 to-pink-600", href: "/admin/questions" },
    { label: "الاختبارات المنجزة", value: stats?.totalTestResults || 0, icon: "📝", color: "from-indigo-500 to-indigo-600", href: "#" },
    { label: "الشهادات", value: stats?.totalCertificates || 0, icon: "🎓", color: "from-yellow-500 to-yellow-600", href: "/admin/certificates" },
    { label: "التذاكر", value: stats?.totalTickets || 0, icon: "🎫", color: "from-teal-500 to-teal-600", href: "/admin/tickets" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">لوحة تحكم الإدارة</h1>
              <p className="text-gray-500 text-sm">إدارة المحتوى والإعدادات</p>
            </div>
            <div className="flex gap-2">
              <Link href="/admin/settings" className="btn-secondary text-sm">⚙️ الإعدادات</Link>
              <Link href="/" className="btn-primary text-sm">← العودة للموقع</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {[
              { label: "الرئيسية", href: "/admin", icon: "🏠" },
              { label: "اللغات", href: "/admin/languages", icon: "🌐" },
              { label: "المستويات", href: "/admin/levels", icon: "📊" },
              { label: "الدروس", href: "/admin/lessons", icon: "📚" },
              { label: "الأسئلة", href: "/admin/questions", icon: "❓" },
              { label: "الشهادات", href: "/admin/certificates", icon: "🎓" },
              { label: "المستخدمين", href: "/admin/users", icon: "👥" },
              { label: "التذاكر", href: "/admin/tickets", icon: "🎫" },
              { label: "الإشعارات", href: "/admin/notifications", icon: "🔔" },
              { label: "الإعدادات", href: "/admin/settings", icon: "⚙️" },
            ].map((nav) => (
              <Link
                key={nav.href}
                href={nav.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  nav.href === "/admin" ? "bg-primary-50 text-primary-700" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {nav.icon} {nav.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((card) => (
            <Link key={card.label} href={card.href} className="card-hover p-6 text-center">
              <div className={`w-14 h-14 bg-gradient-to-br ${card.color} rounded-2xl mx-auto flex items-center justify-center text-2xl mb-3 shadow-lg`}>
                {card.icon}
              </div>
              <p className="text-3xl font-bold text-gray-900">{card.value}</p>
              <p className="text-sm text-gray-500">{card.label}</p>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <div className="card p-6">
            <h3 className="font-bold text-gray-900 mb-4">أحدث المستخدمين</h3>
            {stats?.recentUsers && stats.recentUsers.length > 0 ? (
              <div className="space-y-3">
                {stats.recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <p className="text-xs text-gray-400">{new Date(user.createdAt).toLocaleDateString("ar")}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4">لا يوجد مستخدمين</p>
            )}
          </div>

          {/* Recent Certificates */}
          <div className="card p-6">
            <h3 className="font-bold text-gray-900 mb-4">أحدث الشهادات</h3>
            {stats?.recentCertificates && stats.recentCertificates.length > 0 ? (
              <div className="space-y-3">
                {stats.recentCertificates.map((cert) => (
                  <div key={cert.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-xl">🎓</div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{cert.user.name}</p>
                      <p className="text-xs text-gray-500">{cert.level.nameAr} - {cert.score}%</p>
                    </div>
                    <p className="text-xs text-gray-400 font-mono" dir="ltr">{cert.code}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4">لا توجد شهادات</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
