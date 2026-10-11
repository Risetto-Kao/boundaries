import { formContext, formJson, formRoute, forms } from "@/lib/form-server";
import { formId, type FormContext } from "@/lib/form-id";
export const dynamic = "force-dynamic";
export async function GET(request: Request, context: FormContext) {
  return formRoute(request, async () => {
    const { actor } = await formContext(); const data = await forms.questions(await formId(context), actor, new URL(request.url).searchParams.get("invite") ?? undefined);
    return formJson({ title: data.form.title, description: data.form.description, isOpen: data.form.isOpen, questions: data.questions, canResults: data.canResults, submitted: data.submissions.length > 0 });
  });
}
