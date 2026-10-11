import { formBody, formContext, formJson, formRoute, forms } from "@/lib/form-server";
import { FormError } from "@/lib/form-service";
import { formSchemas } from "@/lib/form-validation";
import { getRequestI18n } from "@/lib/i18n/server";
type Context = { params: Promise<{ templateId: string }> };
async function id(context: Context) { const { templateId } = await context.params; if (!formSchemas().id.safeParse(templateId).success) throw new FormError(404, "accessDenied"); return templateId; }
export async function GET(request: Request, context: Context) { return formRoute(request, async () => { const template = await forms.template(await id(context)); if (!template) throw new FormError(404, "accessDenied"); return formJson(template); }); }
export async function PATCH(request: Request, context: Context) {
  return formRoute(request, async () => { const { actor } = await formContext(); return formJson(await forms.updateTemplate(actor.userId, await id(context), await formBody(request, formSchemas(getRequestI18n(request).locale).updateTemplate))); });
}
export async function DELETE(request: Request, context: Context) { return formRoute(request, async () => { const { actor } = await formContext(); await forms.deleteTemplate(actor.userId, await id(context)); return formJson({ ok: true }); }); }
