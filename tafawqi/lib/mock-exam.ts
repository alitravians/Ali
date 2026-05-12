// F10 — Mock exam helpers.
//
// The admin sets `mock_exam_enabled=true` + `mock_exam_slug` to expose a
// comprehensive practice exam to students. Optionally `mock_exam_duration_min`
// overrides the quiz's stored durationSec.
//
// Internally a mock exam is just an existing Quiz row; this avoids touching
// the schema and lets admins use the regular question editor / bulk import
// to build it. The student flow is the standard `/quiz/<slug>` page.

import { prisma } from "@/lib/prisma";

export type MockExamInfo = {
  slug: string;
  title: string;
  description: string;
  durationSec: number;
  questionCount: number;
} | null;

export async function getMockExam(): Promise<MockExamInfo> {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: ["mock_exam_enabled", "mock_exam_slug", "mock_exam_duration_min"] } },
  });
  const map = new Map(rows.map((r) => [r.key, r.value] as const));
  if (map.get("mock_exam_enabled") !== "true") return null;
  const slug = (map.get("mock_exam_slug") ?? "").trim();
  if (!slug) return null;
  const quiz = await prisma.quiz.findFirst({
    where: { slug, isActive: true },
    select: {
      slug: true,
      title: true,
      description: true,
      durationSec: true,
      questionCount: true,
    },
  });
  if (!quiz) return null;
  const override = parseInt(map.get("mock_exam_duration_min") ?? "", 10);
  const durationSec =
    Number.isFinite(override) && override > 0 && override <= 240
      ? override * 60
      : quiz.durationSec;
  return { ...quiz, durationSec };
}
