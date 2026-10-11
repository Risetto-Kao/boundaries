import { formBody, formContext, formJson, formRoute, forms } from "@/lib/form-server";
import { formSchemas } from "@/lib/form-validation";
import { formId, type FormContext } from "@/lib/form-id";
export async function POST(request: Request, context: FormContext) {
  return formRoute(request, async () => { const id = await formId(context); const { actor } = await formContext(); const { invite } = await formBody(request, formSchemas().invite); await forms.renewResults(id, actor, invite); return formJson({ resultUrl: `/forms/${id}/results` }); });
}
