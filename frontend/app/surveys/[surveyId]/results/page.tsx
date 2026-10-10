import { getI18n } from "@/lib/i18n/server";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CopyLinkButton } from "@/components/copy-link-button";
import { SurveyResults } from "@/components/survey-results";
import { buttonVariants } from "@/components/ui/button";
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
    <main className="page-shell">
      <div className="mx-auto min-w-0 w-full max-w-6xl">
        <div className="min-w-0 space-y-6">
          <header>
            <h1 className="page-heading">{t("resultsTitle", { title: matrix.survey.title })}</h1>
            <p className="page-description">
              {matrix.survey.description ?? t("resultsDescription")}
            </p>
          </header>
          <div className="min-w-0 space-y-6">
            <div className="flex flex-wrap gap-2">
              <CopyLinkButton label={t("copyResults")} />
              <CopyLinkButton label={t("copySurvey")} path={fillPath} />
              <Link className={buttonVariants()} href={fillPath}>
                {t("inviteFriends")}
              </Link>
            </div>

            <p className="text-muted-foreground">
              {t("resultsSummary", { people: matrix.participants.length, questions: matrix.questions.length })}
            </p>

            {matrix.participants.length === 0 ? (
              <p className="empty-state text-muted-foreground">
                {t("noResponses")}
              </p>
            ) : (
              <SurveyResults
                questions={matrix.questions.map(({ id, text }) => ({ id, text }))}
                participants={matrix.participants}
                answers={matrix.answers}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
