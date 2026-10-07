import { getI18n } from "@/lib/i18n/server";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CopyLinkButton } from "@/components/copy-link-button";
import { SurveyResults } from "@/components/survey-results";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSurveyMatrixData } from "@/lib/surveys";
import { surveyIdSchema } from "@/lib/validations";

export const revalidate = 0;

export default async function SurveyResultPage({
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

  const matrix = await getSurveyMatrixData(parsedSurveyId.data);
  if (!matrix) {
    notFound();
  }

  const fillPath = `/surveys/${matrix.survey.id}`;

  return (
    <main className="min-h-screen bg-slate-50 p-3 sm:p-6 md:p-10">
      <div className="mx-auto min-w-0 w-full max-w-6xl">
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="leading-snug [overflow-wrap:anywhere]">{t("resultsTitle", { title: matrix.survey.title })}</CardTitle>
            <CardDescription className="[overflow-wrap:anywhere]">
              {matrix.survey.description ?? t("resultsDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="min-w-0 space-y-4 px-4 text-sm sm:px-6">
            <div className="flex flex-wrap gap-2">
              <CopyLinkButton label={t("copyResults")} />
              <CopyLinkButton label={t("copySurvey")} path={fillPath} />
              <Link className="inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-white" href={fillPath}>
                {t("inviteFriends")}
              </Link>
            </div>

            <p className="text-slate-600">
              {t("resultsSummary", { people: matrix.participants.length, questions: matrix.questions.length })}
            </p>

            {matrix.participants.length === 0 ? (
              <p className="rounded-md border border-dashed p-4 text-slate-600">
                {t("noResponses")}
              </p>
            ) : (
              <SurveyResults
                questions={matrix.questions.map(({ id, text }) => ({ id, text }))}
                participants={matrix.participants}
                answers={matrix.answers}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
