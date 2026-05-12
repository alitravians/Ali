// F16 — Dynamic sitemap of public routes + every chapter/section page so search
// engines can index the Arabic 10th-grade math content. Generated at build
// and at the next request after a chapter change.
import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tafawqi-delta.vercel.app";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/chapters`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/leaderboard`, lastModified: now, changeFrequency: "daily", priority: 0.5 },
    { url: `${BASE_URL}/team`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/register`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/demo`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  try {
    const chapters = await prisma.chapter.findMany({
      select: { slug: true },
      orderBy: { order: "asc" },
    });
    const chapterRoutes: MetadataRoute.Sitemap = chapters.map((ch) => ({
      url: `${BASE_URL}/chapters/${ch.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
    return [...staticRoutes, ...chapterRoutes];
  } catch {
    return staticRoutes;
  }
}
