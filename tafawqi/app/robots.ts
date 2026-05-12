// F16 — Static robots.txt generated from Next.js convention. We deny crawling
// of admin, profile, and quiz pages because they're private, and allow the
// public marketing/learning surface.
import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tafawqi-delta.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/profile",
          "/dashboard",
          "/quiz/",
          "/results/",
          "/verify-email",
          "/forgot",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
