import "server-only";
import { getCurrentUser } from "@/lib/auth/user";
import { isAccountHistoryEnabled } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

export async function getEditableSurveyIds() {
  if (!isAccountHistoryEnabled()) return new Set<string>();
  try {
    const user = await getCurrentUser();
    if (!user) return new Set<string>();
    const owned = await prisma.survey.findMany({ where: { ownerId: user.id }, select: { id: true } });
    return new Set(owned.map(survey => survey.id));
  } catch { return new Set<string>(); }
}
export async function canEditSurvey(surveyId: string) {
  if (!isAccountHistoryEnabled()) return false;
  const user = await getCurrentUser();
  if (!user) return false;
  return Boolean(await prisma.survey.findFirst({ where: { id: surveyId, ownerId: user.id }, select: { id: true } }));
}
