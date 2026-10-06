import { AuthUnavailableError, getCurrentUser } from "@/lib/auth/user";
import { isAccountHistoryEnabled, isSameOrigin } from "@/lib/auth/config";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { submitResponseSchema, surveyIdSchema } from "@/lib/validations";

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      surveyId: string;
    }>;
  },
) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "無效的請求來源" }, { status: 403 });
  try {
    const user = await getCurrentUser();
    const { surveyId } = await context.params;
    const parsedSurveyId = surveyIdSchema.safeParse(surveyId);
    if (!parsedSurveyId.success) {
      return NextResponse.json({ error: "無效的問卷 ID" }, { status: 400 });
    }

    const body = await request.json();
    const parsedInput = submitResponseSchema.safeParse({
      surveyId: parsedSurveyId.data,
      nickname: body?.nickname,
      answers: body?.answers,
    });

    if (!parsedInput.success) {
      const firstIssue = parsedInput.error.issues[0];
      return NextResponse.json({ error: firstIssue?.message ?? "輸入資料格式錯誤" }, { status: 400 });
    }

    const { nickname, answers, surveyId: validSurveyId } = parsedInput.data;

    const questions = await prisma.question.findMany({
      where: {
        surveyId: validSurveyId,
      },
      select: {
        id: true,
      },
    });

    if (questions.length === 0) {
      return NextResponse.json({ error: "問卷不存在或尚未設定題目" }, { status: 404 });
    }

    if (answers.length !== questions.length) {
      return NextResponse.json({ error: "每一題都必須作答" }, { status: 400 });
    }

    const questionIdSet = new Set(questions.map((question) => question.id));
    const answerQuestionIdSet = new Set(answers.map((answer) => answer.questionId));
    const hasInvalidQuestion = [...answerQuestionIdSet].some((questionId) => !questionIdSet.has(questionId));
    if (hasInvalidQuestion || answerQuestionIdSet.size !== questionIdSet.size) {
      return NextResponse.json({ error: "答案與問卷題目不一致" }, { status: 400 });
    }

    const response = await prisma.response.create({
      data: {
        ...(isAccountHistoryEnabled() ? { userId: user?.id ?? null } : {}),
        surveyId: validSurveyId,
        nickname: nickname.trim(),
        answers: {
          create: answers.map((answer) => ({
            questionId: answer.questionId,
            value: answer.value,
          })),
        },
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json(
      {
        responseId: response.id,
        resultUrl: `/surveys/${validSurveyId}/results`,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof AuthUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "同一暱稱已經提交過這份問卷" }, { status: 409 });
    }

    console.error("Submit response failed:", error);
    return NextResponse.json({ error: "提交失敗，請稍後再試" }, { status: 500 });
  }
}
