import { notFound } from "next/navigation";
import { forms } from "@/lib/form-server";
import { getCurrentUser } from "@/lib/auth/user";
import { getI18n } from "@/lib/i18n/server";
import { formSchemas } from "@/lib/form-validation";
import { TemplateActions } from "@/components/template-actions";
export default async function TemplatePage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params; if (!formSchemas().id.safeParse(templateId).success) notFound();
  const template = await forms.template(templateId); if (!template) notFound();
  const { t } = await getI18n(); let user = null; try { user = await getCurrentUser(); } catch { /* Public preview remains available. */ }
  const canEdit = await forms.canEditTemplate(templateId, user?.id ?? null);
  return <main className="page-shell page-shell-narrow"><p className="eyebrow mb-5">{t("templates")}</p><h1 className="page-heading">{template.title}</h1><p className="mt-3 text-sm font-bold">{template.ownerType === "OFFICIAL" ? t("officialTemplate") : t("createdBy", { name: template.authorName || t("creatorMember") })}</p>{template.description && <p className="page-description whitespace-pre-wrap">{template.description}</p>}<p className="mt-5 text-muted-foreground">{t("templateOnly")}</p><TemplateActions id={templateId} signedIn={Boolean(user)} canEdit={canEdit} /><ol className="mt-8 space-y-3">{template.questions.map((q, index) => <li className="history-row font-bold" key={q.id}><span className="mr-3 text-brand">Q{index + 1}</span>{q.text}</li>)}</ol></main>;
}
