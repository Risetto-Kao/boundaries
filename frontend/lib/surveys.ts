import { prisma } from "@/lib/prisma";
import { detectSurveyLanguage } from "@/lib/design";
import type { Answer } from "@/types/survey";
import { getSurveyCreators } from "@/lib/survey-creators";

// Base queries work before the Auth schema rollout; the optional server-only
// creator lookup is gated by ACCOUNT_HISTORY_ENABLED.
const surveyFields = { id: true, title: true, description: true, createdAt: true, updatedAt: true } as const;

export async function getRecentSurveys(limit = 10) {
  try {
    const surveys = await prisma.survey.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      select: {
        ...surveyFields,
        questions: { select: { text: true } },
        _count: {
          select: {
            responses: true,
          },
        },
      },
    });
    const creators = await getSurveyCreators(surveys.map(({ id }) => id));
    return surveys.map((survey) => ({ ...survey, language: detectSurveyLanguage(survey.title, survey.questions), creator: creators.get(survey.id)! }));
  } catch {
    return [];
  }
}

export async function getAllSurveys({ throwOnError = false } = {}) {
  try {
    const surveys = await prisma.survey.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        ...surveyFields,
        questions: { select: { text: true } },
        _count: {
          select: {
            responses: true,
          },
        },
      },
    });
    const creators = await getSurveyCreators(surveys.map(({ id }) => id));
    return surveys.map((survey) => ({ ...survey, language: detectSurveyLanguage(survey.title, survey.questions), creator: creators.get(survey.id)! }));
  } catch (error) {
    if (throwOnError) throw error;
    return [];
  }
}

export async function getSurveyById(surveyId: string) {
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
    },
  });
  if (!survey) return null;
  const creators = await getSurveyCreators([survey.id]);
  return { ...survey, creator: creators.get(survey.id)! };
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
  const creators = await getSurveyCreators([survey.id]);

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
      creator: creators.get(survey.id)!,
    },
    questions: survey.questions,
    participants,
    answers,
  };
}
