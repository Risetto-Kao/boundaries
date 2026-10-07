import { getI18n } from "@/lib/i18n/server";
import Link from "next/link";
import { HistoryNotice } from "@/components/history-notice";
import { notFound } from "next/navigation";

import { CopyLinkButton } from "@/components/copy-link-button";
import { SurveyResponseForm } from "@/components/survey-response-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <main className="min-h-screen bg-slate-50 px-3 py-6 sm:p-6 md:p-10">
      <HistoryNotice returnTo={`/surveys/${survey.id}`} />
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{survey.title}</CardTitle>
            <CardDescription>{survey.description ?? t("answerHonestly")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 px-3 sm:px-6">
            <div className="flex flex-wrap gap-2">
              <CopyLinkButton label={t("copySurvey")} />
              <CopyLinkButton label={t("copyResults")} path={`/surveys/${survey.id}/results`} />
              <Link className="inline-flex items-center text-sm text-blue-700 underline" href={`/surveys/${survey.id}/results`}>
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
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
