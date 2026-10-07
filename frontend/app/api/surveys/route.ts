import { getRequestI18n } from "@/lib/i18n/server";
import { AuthUnavailableError, getCurrentUser } from "@/lib/auth/user";
import { isAccountHistoryEnabled, isSameOrigin } from "@/lib/auth/config";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createValidationSchemas } from "@/lib/validations";

export async function POST(request: Request) {
  const { t, locale } = getRequestI18n(request);
  const { createSurveySchema } = createValidationSchemas(locale);
  if (!isSameOrigin(request)) return NextResponse.json({ error: t("invalidOrigin") }, { status: 403 });
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const parsed = createSurveySchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        {
          error: firstIssue?.message ?? t("invalidInput"),
        },
        { status: 400 },
      );
    }

    const title = parsed.data.title.trim();
    const description = parsed.data.description?.trim() || null;
    const questions = parsed.data.questions.map((question) => question.trim());

    const survey = await prisma.survey.create({
      data: {
        ...(isAccountHistoryEnabled() ? { ownerId: user?.id ?? null } : {}),
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
    if (error instanceof SyntaxError) return NextResponse.json({ error: t("invalidInput") }, { status: 400 });
    if (error instanceof AuthUnavailableError) {
      return NextResponse.json({ error: t("sessionRetry") }, { status: 503 });
    }
    console.error("Create survey failed:", error);
    return NextResponse.json(
      {
        error: t("createFailed"),
      },
      { status: 500 },
    );
  }
}
