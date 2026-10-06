import { prisma } from "@/lib/prisma";
import type { Answer } from "@/types/survey";

export async function getRecentSurveys(limit = 10) {
  try {
    return await prisma.survey.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      include: {
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
      include: {
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
    include: {
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
    include: {
      questions: {
        orderBy: {
          orderIndex: "asc",
        },
      },
      responses: {
        orderBy: {
          submittedAt: "asc",
        },
        include: {
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
