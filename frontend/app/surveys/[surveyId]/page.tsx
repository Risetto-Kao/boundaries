import { getI18n } from "@/lib/i18n/server";
import Link from "next/link";
import { HistoryNotice } from "@/components/history-notice";
import { notFound } from "next/navigation";

import { CopyLinkButton } from "@/components/copy-link-button";
import { SurveyResponseForm } from "@/components/survey-response-form";
import { getSurveyById } from "@/lib/surveys";
import { surveyIdSchema } from "@/lib/validations";

export default async function SurveyPage({
  params,
}: {
  params: Promise<{
    surveyId: string;
  }>;
}) {
  const { t } = await getI18n();
  const { surveyId } = await params;
  const parsedSurveyId = surveyIdSchema.safeParse(surveyId);

  if (!parsedSurveyId.success) {
    notFound();
  }

  const survey = await getSurveyById(parsedSurveyId.data);
  if (!survey) {
    notFound();
  }

  return (
    <main className="page-shell page-shell-narrow">
      <HistoryNotice returnTo={`/surveys/${survey.id}`} />
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div className="min-w-0 space-y-6">
          <header>
            <h1 className="page-heading">{survey.title}</h1>
            <p className="page-description">{survey.description ?? t("answerHonestly")}</p>
          </header>
          <div className="min-w-0 space-y-6">
            <div className="flex flex-wrap gap-2">
              <CopyLinkButton label={t("copySurvey")} />
              <CopyLinkButton label={t("copyResults")} path={`/surveys/${survey.id}/results`} />
              <Link className="text-action" href={`/surveys/${survey.id}/results`}>
                {t("currentResults")}
              </Link>
            </div>

            <SurveyResponseForm
              surveyId={survey.id}
              questions={survey.questions.map((question) => ({
                id: question.id,
                text: question.text,
              }))}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
