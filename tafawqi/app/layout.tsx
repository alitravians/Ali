import type { Metadata, Viewport } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./theme-provider";
import SiteHeader from "./site-header";
import SiteFooter from "./site-footer";
import { prisma } from "@/lib/prisma";

// The header is shared by every route and reads the registration_open
// admin toggle; rerender each request so toggling reflects without delay.
export const dynamic = "force-dynamic";

async function getRegistrationOpen(): Promise<boolean> {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: "registration_open" },
    });
    // Fail-open: anything other than explicit "false" means open.
    return setting?.value !== "false";
  } catch {
    return true;
  }
}

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "700", "800", "900"],
  variable: "--font-tajawal",
  display: "swap",
});

export const metadata: Metadata = {
  title: "تفوّقي — اختبارات الرياضيات للصف العاشر",
  description:
    "منصة عربية ذكية لاختبارات الرياضيات القصيرة لطالبات الصف العاشر في سوريا. تدريب مستمر، تقييم فوري، شرح الأخطاء، وشهادات إنجاز.",
  keywords: ["رياضيات", "الصف العاشر", "سوريا", "اختبارات", "تفوقي", "tafawqi"],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf5ff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1020" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const registrationOpen = await getRegistrationOpen();
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${tajawal.variable} font-tajawal antialiased`}>
        <ThemeProvider>
          <div className="min-h-screen flex flex-col bg-gradient-to-br from-rose-50 via-violet-50 to-sky-50 dark:from-[#0b1020] dark:via-[#15102a] dark:to-[#0b1020]">
            <SiteHeader registrationOpen={registrationOpen} />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
