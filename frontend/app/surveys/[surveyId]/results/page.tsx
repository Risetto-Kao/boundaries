import { notFound } from "next/navigation";
import { getI18n } from "@/lib/i18n/server";
import { InviteDialog } from "@/components/invite-dialog";
import { SurveyResults } from "@/components/survey-results";
import { Avatar, StatusArt } from "@/components/design-primitives";
import { getSurveyMatrixData } from "@/lib/surveys";
import { surveyIdSchema } from "@/lib/validations";

export const revalidate = 0;
export default async function SurveyResultPage({ params }: { params: Promise<{ surveyId: string }> }) {
  const { t } = await getI18n(); const { surveyId } = await params;
  if (!surveyIdSchema.safeParse(surveyId).success) notFound();
  const matrix = await getSurveyMatrixData(surveyId);
  if (!matrix) notFound();
  const creator = matrix.survey.creator;
  const creatorName = creator.name || t(creator.kind === "member" ? "creatorMember" : creator.kind === "unavailable" ? "creatorUnavailable" : "creatorUnknown");
  return <main>
    <header className="results-hero"><div className="page-shell results-hero-inner">
      <div className="results-hero-copy"><p className="eyebrow mb-5">{t("resultsEyebrow")}</p><h1 className="page-heading">{matrix.survey.title}</h1>
        {matrix.survey.description && <p className="results-description">{matrix.survey.description}</p>}
        <div className="results-info"><span className="avatar-stack">{matrix.participants.map((person, index) => <Avatar key={person.id} name={person.nickname} index={index} size={32} />)}</span><span>{t("resultsSummary", { people: matrix.participants.length, questions: matrix.questions.length })}</span><span>{t("createdBy", { name: creatorName })}</span></div>
        <InviteDialog inverted title={matrix.survey.title} path={`/surveys/${matrix.survey.id}`} />
      </div><div className="results-art"><StatusArt /></div>
    </div></header>
    <div className="page-shell"><SurveyResults questions={matrix.questions.map(({ id, text }) => ({ id, text }))} participants={matrix.participants} answers={matrix.answers} /></div>
  </main>;
}
