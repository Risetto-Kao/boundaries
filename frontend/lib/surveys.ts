import { prisma } from "@/lib/prisma";

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
