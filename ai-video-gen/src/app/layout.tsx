import type { Metadata, Viewport } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AI Video Gen — توليد فيديوهات بالذكاء الاصطناعي مجاناً',
  description:
    'موقع مجاني لتوليد فيديوهات قصيرة (5/10/15 ثانية) بالذكاء الاصطناعي. اكتب وصف المشهد واحصل على فيديو جاهز للتحميل.',
  keywords: ['AI video', 'توليد فيديو', 'ذكاء اصطناعي', 'فيديو مجاني', 'AI video generator'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a1628',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
