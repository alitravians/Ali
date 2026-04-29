import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "بوت المسابقات — لوحة عامة",
  description: "إحصائيات وترتيب المتصدّرين الحيّ لبوت المسابقات.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <header className="site-header">
          <div className="container">
            <Link href="/" className="brand">
              🏆 بوت المسابقات
            </Link>
            <nav>
              <Link href="/leaderboard">المتصدرون</Link>
              <Link href="/stats">إحصائيات</Link>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
        <footer className="site-footer">
          <div className="container">
            بيانات حيّة من البوت • للقراءة فقط
          </div>
        </footer>
      </body>
    </html>
  );
}
