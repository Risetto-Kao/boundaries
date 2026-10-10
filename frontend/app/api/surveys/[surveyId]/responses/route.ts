import { resolveResponseNickname } from "@/lib/auth/display-name";
import { getRequestI18n } from "@/lib/i18n/server";
import { AuthUnavailableError, getCurrentUser } from "@/lib/auth/user";
import { isAccountHistoryEnabled, isSameOrigin } from "@/lib/auth/config";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createValidationSchemas } from "@/lib/validations";

class ResponseValidationError extends Error { constructor(public status: number, message: string) { super(message); } }

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      surveyId: string;
    }>;
  },
) {
  const { t, locale } = getRequestI18n(request);
  const { submitResponseSchema, surveyIdSchema } = createValidationSchemas(locale);
  if (!isSameOrigin(request)) return NextResponse.json({ error: t("invalidOrigin") }, { status: 403 });
  try {
    const user = await getCurrentUser();
    const { surveyId } = await context.params;
    const parsedSurveyId = surveyIdSchema.safeParse(surveyId);
    if (!parsedSurveyId.success) {
      return NextResponse.json({ error: t("invalidSurveyId") }, { status: 400 });
    }

    const body = await request.json();
    const parsedInput = submitResponseSchema.safeParse({
      surveyId: parsedSurveyId.data,
      nickname: resolveResponseNickname(body?.nickname, user?.user_metadata),
      answers: body?.answers,
    });

    if (!parsedInput.success) {
      const firstIssue = parsedInput.error.issues[0];
      return NextResponse.json({ error: firstIssue?.message ?? t("invalidInput") }, { status: 400 });
    }

    const { nickname, answers, surveyId: validSurveyId } = parsedInput.data;

    const response = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM surveys WHERE id = ${validSurveyId} FOR UPDATE`;
      const questions = await tx.question.findMany({
        where: {
          surveyId: validSurveyId,
        },
        select: {
          id: true,
        },
      });

      if (questions.length === 0) {
        throw new ResponseValidationError(404, t("surveyMissing"));
      }

      if (answers.length !== questions.length) {
        throw new ResponseValidationError(400, t("allRequired"));
      }

      const questionIdSet = new Set(questions.map((question) => question.id));
      const answerQuestionIdSet = new Set(answers.map((answer) => answer.questionId));
      const hasInvalidQuestion = [...answerQuestionIdSet].some((questionId) => !questionIdSet.has(questionId));
      if (hasInvalidQuestion || answerQuestionIdSet.size !== questionIdSet.size) {
        throw new ResponseValidationError(400, t("answersMismatch"));
      }

      return await tx.response.create({
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

    });

    return NextResponse.json(
      {
        responseId: response.id,
        resultUrl: `/surveys/${validSurveyId}/results`,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ResponseValidationError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof SyntaxError) return NextResponse.json({ error: t("invalidInput") }, { status: 400 });
    if (error instanceof AuthUnavailableError) {
      return NextResponse.json({ error: t("sessionRetry") }, { status: 503 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: t("duplicateNickname") }, { status: 409 });
    }

    console.error("Submit response failed:", error);
    return NextResponse.json({ error: t("submitFailed") }, { status: 500 });
  }
}
