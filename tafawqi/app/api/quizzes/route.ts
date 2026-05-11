import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sectionSlug = url.searchParams.get("section");
  const chapterSlug = url.searchParams.get("chapter");
  const kind = url.searchParams.get("kind") || undefined;

  const where: any = { isActive: true };
  if (kind) where.kind = kind;
  if (sectionSlug) {
    const sec = await prisma.section.findUnique({ where: { slug: sectionSlug } });
    if (sec) where.sectionId = sec.id;
  }
  if (chapterSlug) {
    const ch = await prisma.chapter.findUnique({ where: { slug: chapterSlug } });
    if (ch) where.chapterId = ch.id;
  }
  const quizzes = await prisma.quiz.findMany({
    where,
    include: { chapter: true, section: true, _count: { select: { items: true, attempts: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ quizzes });
}
