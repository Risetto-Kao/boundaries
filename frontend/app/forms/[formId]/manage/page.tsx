import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { forms, formContext } from "@/lib/form-server";
import { FormError } from "@/lib/form-service";
import { formSchemas } from "@/lib/form-validation";
import { FormManagement } from "@/components/form-management";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { referrer: "no-referrer", robots: { index: false, follow: false } };
export default async function ManageFormPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params; if (!formSchemas().id.safeParse(formId).success) notFound(); const { actor } = await formContext(); if (!actor.userId) redirect(`/login?next=${encodeURIComponent(`/forms/${formId}/manage`)}`);
  let form; try { form = await forms.management(formId, actor.userId); } catch (error) { if (error instanceof FormError) notFound(); throw error; }
  return <FormManagement key={`${form.id}:${form.updatedAt.toISOString()}`} form={{ id: form.id, title: form.title, description: form.description, isOpen: form.isOpen, invitePath: form.invitePath, updatedAt: form.updatedAt.toISOString(), questions: form.questions, submissions: form.submissions.map(s => ({ id: s.id, submittedAt: s.submittedAt.toISOString() })) }} />;
}
