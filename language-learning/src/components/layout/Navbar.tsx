"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAdminCode, setShowAdminCode] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [adminError, setAdminError] = useState("");

  useEffect(() => {
    if (session?.user) {
      fetch("/api/notifications")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setUnreadCount(data.filter((n: { isRead: boolean }) => !n.isRead).length);
          }
        })
        .catch(() => {});
    }
  }, [session]);

  const handleAdminAccess = () => {
    if (adminCode === "3131") {
      setShowAdminCode(false);
      setAdminCode("");
      setAdminError("");
      window.location.href = "/admin";
    } else {
      setAdminError("رمز الدخول غير صحيح");
    }
  };

  return (
    <>
      <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <span className="text-xl font-bold gradient-text hidden sm:block">LinguaMaster</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="nav-link">الرئيسية</Link>
              <Link href="/languages" className="nav-link">اللغات</Link>
              <Link href="/verify-certificate" className="nav-link">التحقق من شهادة</Link>
              <Link href="/contact" className="nav-link">تواصل معنا</Link>
              
              {session?.user ? (
                <>
                  <Link href="/profile" className="nav-link flex items-center gap-1">
                    <span>ملفي الشخصي</span>
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                  <button
                    onClick={() => setShowAdminCode(true)}
                    className="text-gray-400 hover:text-gray-600 text-xs"
                    title="إدارة"
                  >
                    ⚙
                  </button>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="btn-danger text-sm py-2 px-4"
                  >
                    تسجيل خروج
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/login" className="btn-secondary text-sm py-2 px-4">
                    تسجيل دخول
                  </Link>
                  <Link href="/register" className="btn-primary text-sm py-2 px-4">
                    إنشاء حساب
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Nav */}
          {isMenuOpen && (
            <div className="md:hidden pb-4 border-t border-gray-100 mt-2 pt-4 space-y-3">
              <Link href="/" className="block nav-link py-2" onClick={() => setIsMenuOpen(false)}>الرئيسية</Link>
              <Link href="/languages" className="block nav-link py-2" onClick={() => setIsMenuOpen(false)}>اللغات</Link>
              <Link href="/verify-certificate" className="block nav-link py-2" onClick={() => setIsMenuOpen(false)}>التحقق من شهادة</Link>
              <Link href="/contact" className="block nav-link py-2" onClick={() => setIsMenuOpen(false)}>تواصل معنا</Link>
              {session?.user ? (
                <>
                  <Link href="/profile" className="block nav-link py-2" onClick={() => setIsMenuOpen(false)}>
                    ملفي الشخصي
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 mr-2">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                  <button
                    onClick={() => { setShowAdminCode(true); setIsMenuOpen(false); }}
                    className="block text-gray-400 hover:text-gray-600 text-sm py-2"
                  >
                    ⚙ إدارة الموقع
                  </button>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="block w-full text-right btn-danger text-sm py-2 px-4"
                  >
                    تسجيل خروج
                  </button>
                </>
              ) : (
                <div className="space-y-2 pt-2">
                  <Link href="/login" className="block text-center btn-secondary text-sm py-2" onClick={() => setIsMenuOpen(false)}>
                    تسجيل دخول
                  </Link>
                  <Link href="/register" className="block text-center btn-primary text-sm py-2" onClick={() => setIsMenuOpen(false)}>
                    إنشاء حساب
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Admin Access Modal */}
      {showAdminCode && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setShowAdminCode(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4 text-center">دخول لوحة الإدارة</h3>
            <input
              type="password"
              value={adminCode}
              onChange={(e) => { setAdminCode(e.target.value); setAdminError(""); }}
              placeholder="أدخل رمز الدخول"
              className="input-field mb-3 text-center"
              onKeyDown={(e) => e.key === "Enter" && handleAdminAccess()}
              autoFocus
            />
            {adminError && <p className="text-red-500 text-sm text-center mb-3">{adminError}</p>}
            <div className="flex gap-3">
              <button onClick={handleAdminAccess} className="flex-1 btn-primary text-sm py-2">
                دخول
              </button>
              <button onClick={() => { setShowAdminCode(false); setAdminCode(""); setAdminError(""); }} className="flex-1 btn-secondary text-sm py-2">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
