import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createSurveySchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createSurveySchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        {
          error: firstIssue?.message ?? "輸入資料格式錯誤",
        },
        { status: 400 },
      );
    }

    const title = parsed.data.title.trim();
    const description = parsed.data.description?.trim() || null;
    const questions = parsed.data.questions.map((question) => question.trim());

    const survey = await prisma.survey.create({
      data: {
        title,
        description,
        questions: {
          create: questions.map((text, index) => ({
            text,
            orderIndex: index + 1,
          })),
        },
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json(
      {
        surveyId: survey.id,
        fillUrl: `/surveys/${survey.id}`,
        resultUrl: `/surveys/${survey.id}/results`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create survey failed:", error);
    return NextResponse.json(
      {
        error: "建立問卷失敗，請稍後再試",
      },
      { status: 500 },
    );
  }
}
