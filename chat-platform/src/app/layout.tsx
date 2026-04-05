import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import RainBackground from "@/components/RainBackground";
import prisma from "@/lib/prisma";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  display: "swap",
  variable: "--font-cairo",
});

export async function generateMetadata(): Promise<Metadata> {
  let siteName = 'ChatZone';
  try {
    const setting = await prisma.siteSetting.findUnique({ where: { key: 'site_name' } });
    if (setting?.value) siteName = setting.value;
  } catch { /* fallback */ }
  return {
    title: `${siteName} - منصة الدردشة الاحترافية`,
    description: "منصة دردشة احترافية مع نظام غرف وصلاحيات ومشرفين",
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="font-cairo bg-[#030711] text-white antialiased min-h-screen">
        <Providers>
          <RainBackground />
          <div className="relative z-[1]">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
