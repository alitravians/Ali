import type { Metadata, Viewport } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./theme-provider";
import SiteHeader from "./site-header";
import SiteFooter from "./site-footer";
import AnnouncementBanner from "./components/announcement-banner";
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

// F21 — read announcement settings once at the layout level so the banner is
// SSR-rendered and visible on the very first paint of every page.
async function getAnnouncement(): Promise<{
  enabled: boolean;
  text: string;
  level: "info" | "warning" | "success";
}> {
  try {
    const rows = await prisma.siteSetting.findMany({
      where: { key: { in: ["announcement_enabled", "announcement_text", "announcement_level"] } },
    });
    const map = new Map(rows.map((r) => [r.key, r.value]));
    const enabled = map.get("announcement_enabled") === "true";
    const text = (map.get("announcement_text") ?? "").trim();
    const lvl = (map.get("announcement_level") ?? "info").trim();
    const level: "info" | "warning" | "success" =
      lvl === "warning" || lvl === "success" ? lvl : "info";
    return { enabled: enabled && text.length > 0, text, level };
  } catch {
    return { enabled: false, text: "", level: "info" };
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
  const [registrationOpen, announcement] = await Promise.all([
    getRegistrationOpen(),
    getAnnouncement(),
  ]);
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${tajawal.variable} font-tajawal antialiased`}>
        <ThemeProvider>
          <div className="min-h-screen flex flex-col bg-gradient-to-br from-rose-50 via-violet-50 to-sky-50 dark:from-[#0b1020] dark:via-[#15102a] dark:to-[#0b1020]">
            <AnnouncementBanner
              enabled={announcement.enabled}
              text={announcement.text}
              level={announcement.level}
            />
            <SiteHeader registrationOpen={registrationOpen} />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
