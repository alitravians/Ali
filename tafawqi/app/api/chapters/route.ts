import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const chapters = await prisma.chapter.findMany({
    orderBy: { order: "asc" },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: { _count: { select: { questions: true, quizzes: true } } },
      },
      _count: { select: { quizzes: true } },
    },
  });
  return NextResponse.json({ chapters });
}
