import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lessonId = searchParams.get("lessonId");
    const questions = await prisma.question.findMany({
      where: lessonId ? { lessonId } : {},
      include: { lesson: { include: { level: { include: { language: true } } } } },
    });
    return NextResponse.json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const question = await prisma.question.create({
      data: {
        type: body.type,
        question: body.question,
        questionAr: body.questionAr || "",
        options: JSON.stringify(body.options || []),
        answer: body.answer,
        explanation: body.explanation || "",
        audioUrl: body.audioUrl || "",
        points: body.points || 10,
        lessonId: body.lessonId,
      },
    });
    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error("Error creating question:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
