// F9 — PWA manifest. Renders at /manifest.webmanifest via the Next.js
// metadata convention. The icons use a single self-contained SVG that
// browsers (Chrome ≥ 91, Safari, Firefox) accept for both launcher icons
// and home-screen installs.
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "تفوّقي — اختبارات الرياضيات للصف العاشر",
    short_name: "تفوّقي",
    description:
      "منصة عربية ذكية لاختبارات الرياضيات القصيرة لطالبات الصف العاشر في سوريا.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#faf5ff",
    theme_color: "#7c3aed",
    lang: "ar",
    dir: "rtl",
    categories: ["education", "books"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "الفصول",
        short_name: "الفصول",
        description: "تصفح فصول المنهاج",
        url: "/chapters",
      },
      {
        name: "لوحتي",
        short_name: "لوحتي",
        description: "لوحة الطالبة",
        url: "/dashboard",
      },
    ],
  };
}
