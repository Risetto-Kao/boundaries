import { getI18n } from "@/lib/i18n/server";
import Link from "next/link";
import { HistoryNotice } from "@/components/history-notice";
import { notFound } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/user";
import { getAccountDisplayName } from "@/lib/auth/display-name";
import { CreatorAttribution } from "@/components/creator-attribution";
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

  let defaultNickname = "";
  try { defaultNickname = getAccountDisplayName((await getCurrentUser())?.user_metadata) ?? ""; } catch { /* HistoryNotice displays session errors. */ }

  return (
    <main className="page-shell page-shell-narrow">
      <HistoryNotice returnTo={`/surveys/${survey.id}`} />
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div className="min-w-0 space-y-6">
          <header>
            <h1 className="page-heading">{survey.title}</h1>
            <p className="page-description">{survey.description ?? t("answerHonestly")}</p>
            <CreatorAttribution creator={survey.creator} />
          </header>
          <div className="min-w-0 space-y-6">
            <div className="flex flex-wrap gap-2">
              <CopyLinkButton label={t("inviteFriends")} path={`/surveys/${survey.id}`} />
              <Link className="text-action" href={`/surveys/${survey.id}/results`}>
                {t("currentResults")}
              </Link>
            </div>

            <SurveyResponseForm
              surveyId={survey.id}
              defaultNickname={defaultNickname}
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
