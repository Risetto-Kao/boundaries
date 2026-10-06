import { prisma } from "@/lib/prisma";
import type { Answer } from "@/types/survey";

// Public form queries deliberately exclude account attribution columns so the
// existing service works before the additive Auth schema rollout.
const surveyFields = { id: true, title: true, description: true, createdAt: true, updatedAt: true } as const;

export async function getRecentSurveys(limit = 10) {
  try {
    return await prisma.survey.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      select: {
        ...surveyFields,
        _count: {
          select: {
            responses: true,
          },
        },
      },
    });
  } catch {
    return [];
  }
}

export async function getAllSurveys({ throwOnError = false } = {}) {
  try {
    return await prisma.survey.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        ...surveyFields,
        _count: {
          select: {
            responses: true,
          },
        },
      },
    });
  } catch (error) {
    if (throwOnError) throw error;
    return [];
  }
}

export async function getSurveyById(surveyId: string) {
  return prisma.survey.findUnique({
    where: {
      id: surveyId,
    },
    select: {
      ...surveyFields,
      questions: {
        orderBy: {
          orderIndex: "asc",
        },
      },
    },
  });
}

export async function getSurveyMatrixData(surveyId: string) {
  const survey = await prisma.survey.findUnique({
    where: {
      id: surveyId,
    },
    select: {
      ...surveyFields,
      questions: {
        orderBy: {
          orderIndex: "asc",
        },
      },
      responses: {
        orderBy: {
          submittedAt: "asc",
        },
        select: {
          id: true,
          nickname: true,
          answers: true,
        },
      },
    },
  });

  if (!survey) {
    return null;
  }

  const participants = survey.responses.map((response) => ({
    id: response.id,
    nickname: response.nickname,
  }));

  const answers: Record<string, Record<string, Answer>> = {};
  for (const response of survey.responses) {
    answers[response.id] = {};
    for (const answer of response.answers) {
      answers[response.id][answer.questionId] = answer.value as Answer;
    }
  }

  return {
    survey: {
      id: survey.id,
      title: survey.title,
      description: survey.description,
      createdAt: survey.createdAt,
      updatedAt: survey.updatedAt,
    },
    questions: survey.questions,
    participants,
    answers,
  };
}
