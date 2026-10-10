import Link from "next/link";
import { notFound } from "next/navigation";
import { getI18n } from "@/lib/i18n/server";
import { getCurrentUser } from "@/lib/auth/user";
import { getAccountDisplayName } from "@/lib/auth/display-name";
import { InviteDialog } from "@/components/invite-dialog";
import { SurveyResponseForm } from "@/components/survey-response-form";
import { getSurveyById } from "@/lib/surveys";
import { surveyIdSchema } from "@/lib/validations";

export default async function SurveyPage({ params }: { params: Promise<{ surveyId: string }> }) {
  const { t } = await getI18n(); const { surveyId } = await params;
  if (!surveyIdSchema.safeParse(surveyId).success) notFound();
  const survey = await getSurveyById(surveyId);
  if (!survey) notFound();
  let defaultNickname = "";
  try { defaultNickname = getAccountDisplayName((await getCurrentUser())?.user_metadata) ?? ""; } catch { /* Submission reports unavailable sessions. */ }
  return <main className="page-shell response-page" aria-label={survey.title}>
    <h1 className="sr-only">{survey.title}</h1>
    <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2"><InviteDialog title={survey.title} path={`/surveys/${survey.id}`} /><Link href={`/surveys/${survey.id}/results`} className="text-action underline underline-offset-4">{t("currentResults")}</Link></div>
    <SurveyResponseForm surveyId={survey.id} defaultNickname={defaultNickname} questions={survey.questions.map(({ id, text }) => ({ id, text }))} />
  </main>;
}
