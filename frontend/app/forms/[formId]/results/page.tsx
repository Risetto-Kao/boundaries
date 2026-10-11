import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { forms, formContext } from "@/lib/form-server";
import { FormError } from "@/lib/form-service";
import { getI18n } from "@/lib/i18n/server";
import { formSchemas } from "@/lib/form-validation";
import { SurveyResults } from "@/components/survey-results";
import { Avatar, StatusArt } from "@/components/design-primitives";
import type { Answer } from "@/types/survey";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { referrer: "no-referrer", robots: { index: false, follow: false } };
export default async function ResultsPage({ params, searchParams }: { params: Promise<{ formId: string }>; searchParams: Promise<{ invite?: string }> }) {
  const { formId } = await params; if (!formSchemas().id.safeParse(formId).success) notFound();
  const { t } = await getI18n(); const { actor } = await formContext();
  let matrix; try { matrix = await forms.matrix(formId, actor); } catch (error) { if (error instanceof FormError) {
    const { invite } = await searchParams;
    const access = await forms.access(formId, actor, invite).catch(e => { if (e instanceof FormError) return null; throw e; });
    return <main className="page-shell space-y-5"><h1 className="page-heading">{t("resultsLocked")}</h1>{access && (access.owner || access.invited) ? <Link className="text-action" prefetch={false} href={`/forms/${formId}${access.invited ? `?invite=${invite}` : ""}`}>{t("openForm")}</Link> : <p className="text-muted-foreground">{t("accessDenied")}</p>}</main>;
  } throw error; }
  const participants = matrix.participants.map(({ id, nickname }) => ({ id, nickname }));
  const answers = Object.fromEntries(matrix.participants.map(person => [person.id, Object.fromEntries(person.answers.map(a => [a.questionId, a.value as Answer]))]));
  return <main><header className="results-hero"><div className="page-shell results-hero-inner"><div className="results-hero-copy"><p className="eyebrow mb-5">{t("resultsEyebrow")}</p><h1 className="page-heading">{matrix.title}</h1>{matrix.description && <p className="results-description">{matrix.description}</p>}<div className="results-info"><span className="avatar-stack">{participants.map((p, index) => <Avatar key={p.id} name={p.nickname} index={index} size={32} />)}</span><span>{t("resultsSummary", { people: participants.length, questions: matrix.questions.length })}</span></div></div><div className="results-art"><StatusArt /></div></div></header><div className="page-shell"><SurveyResults questions={matrix.questions} participants={participants} answers={answers} /></div></main>;
}
