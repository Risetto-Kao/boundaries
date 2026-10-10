import { getEditableSurveyIds } from "@/lib/survey-management";
import { FormPortal } from "@/components/form-portal";
import { getAllSurveys } from "@/lib/surveys";

export const dynamic = "force-dynamic";

export default async function SurveyListPage() {
  let surveys: Awaited<ReturnType<typeof getAllSurveys>> = [];
  let unavailable = false;
  try { surveys = await getAllSurveys({ throwOnError: true }); } catch { unavailable = true; }
  const editable = await getEditableSurveyIds();
  return <FormPortal listOnly unavailable={unavailable} surveys={surveys.map((survey) => ({
    id: survey.id, title: survey.title, description: survey.description,
    responses: survey._count.responses, createdAt: survey.createdAt.toISOString(), language: survey.language, canEdit: editable.has(survey.id),
  }))} />;
}
