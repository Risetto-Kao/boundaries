import { notFound } from "next/navigation";
import { CreateSurveyForm } from "@/components/create-survey-form";
import { canEditSurvey } from "@/lib/survey-management";
import { getSurveyById } from "@/lib/surveys";
import { surveyIdSchema } from "@/lib/validations";
import { getCurrentUser } from "@/lib/auth/user";
import { getAccountDisplayName } from "@/lib/auth/display-name";

export default async function EditSurveyPage({ params }: { params: Promise<{ surveyId: string }> }) {
  const { surveyId } = await params;
  if (!surveyIdSchema.safeParse(surveyId).success || !await canEditSurvey(surveyId)) notFound();
  const survey = await getSurveyById(surveyId);
  if (!survey) notFound();
  const user = await getCurrentUser();
  return <CreateSurveyForm signedIn displayName={getAccountDisplayName(user?.user_metadata)} initialSurvey={{ id: survey.id, title: survey.title, description: survey.description, updatedAt: survey.updatedAt.toISOString(), questions: survey.questions.map(({ id, text }) => ({ id, text })) }} />;
}
