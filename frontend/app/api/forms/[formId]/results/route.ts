import { formContext, formJson, formRoute, forms } from "@/lib/form-server";
import { formId, type FormContext } from "@/lib/form-id";
export const dynamic = "force-dynamic";
export async function GET(request: Request, context: FormContext) { return formRoute(request, async () => { const { actor } = await formContext(); return formJson(await forms.matrix(await formId(context), actor)); }); }
