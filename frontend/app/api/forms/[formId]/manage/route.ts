import { formBody, formContext, formJson, formRoute, forms } from "@/lib/form-server";
import { formSchemas } from "@/lib/form-validation";
import { formId, type FormContext } from "@/lib/form-id";
import { getRequestI18n } from "@/lib/i18n/server";
export const dynamic = "force-dynamic";
export async function GET(request: Request, context: FormContext) { return formRoute(request, async () => { const { actor } = await formContext(); return formJson(await forms.management(await formId(context), actor.userId)); }); }
export async function PATCH(request: Request, context: FormContext) {
  return formRoute(request, async () => { const { actor } = await formContext(); const input = await formBody(request, formSchemas(getRequestI18n(request).locale).management); await forms.manage(await formId(context), actor.userId, input); return formJson({ ok: true }); });
}
