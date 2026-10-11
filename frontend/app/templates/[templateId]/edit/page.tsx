import { notFound, redirect } from "next/navigation";
import { CreateSurveyForm } from "@/components/create-survey-form";
import { getCurrentUser } from "@/lib/auth/user";
import { getAccountDisplayName } from "@/lib/auth/display-name";
import { forms } from "@/lib/form-server";
import { formSchemas } from "@/lib/form-validation";
export default async function EditTemplatePage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params;
  if (!formSchemas().id.safeParse(templateId).success) notFound();
  const user = await getCurrentUser(); if (!user) redirect(`/login?next=${encodeURIComponent(`/templates/${templateId}/edit`)}`);
  if (!await forms.canEditTemplate(templateId, user.id)) notFound();
  const template = await forms.template(templateId); if (!template) notFound();
  return <CreateSurveyForm signedIn displayName={getAccountDisplayName(user.user_metadata)} initialSurvey={{ id: template.id, title: template.title, description: template.description, updatedAt: template.updatedAt.toISOString(), questions: template.questions }} />;
}
