import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { forms, formContext } from "@/lib/form-server";
import { FormError } from "@/lib/form-service";
import { getI18n } from "@/lib/i18n/server";
import { getAccountDisplayName } from "@/lib/auth/display-name";
import { formSchemas } from "@/lib/form-validation";
import { SurveyResponseForm } from "@/components/survey-response-form";
import { RestoreResults } from "@/components/restore-results";
import { InviteDialog } from "@/components/invite-dialog";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { referrer: "no-referrer", robots: { index: false, follow: false } };
export default async function FormPage({ params, searchParams }: { params: Promise<{ formId: string }>; searchParams: Promise<{ invite?: string }> }) {
  const { formId } = await params; if (!formSchemas().id.safeParse(formId).success) notFound();
  const { invite } = await searchParams; const { actor, user } = await formContext(); const { t } = await getI18n();
  let data; try { data = await forms.questions(formId, actor, invite); } catch (error) { if (error instanceof FormError) notFound(); throw error; }
  const submitted = data.submissions.length > 0;
  return <main className="page-shell response-page"><h1 className="text-3xl font-extrabold mb-4 [overflow-wrap:anywhere]">{data.form.title}</h1>{data.form.description && <p className="mb-6 text-muted-foreground whitespace-pre-wrap">{data.form.description}</p>}<div className="mb-6 flex flex-wrap gap-4">{data.invited && invite && <InviteDialog title={data.form.title} path={`/forms/${formId}?invite=${invite}`} />}{data.owner && <Link className="text-action" prefetch={false} href={`/forms/${formId}/manage`}>{t("manageForm")}</Link>}{data.canResults && <Link className="text-action" prefetch={false} href={`/forms/${formId}/results`}>{t("viewResults")}</Link>}</div>
    {submitted ? <div className="space-y-5"><p className="feedback">{t("alreadySubmitted")}</p>{!data.canResults && data.invited && invite && <RestoreResults id={formId} invite={invite} />}</div> : !data.form.isOpen ? <p className="feedback">{t("formClosed")}</p> : <><p className="mb-5 text-sm text-muted-foreground">{t("resultsLocked")}</p><SurveyResponseForm formId={formId} invite={invite} signedIn={Boolean(user)} defaultNickname={getAccountDisplayName(user?.user_metadata) ?? ""} questions={data.questions} /></>}
  </main>;
}
