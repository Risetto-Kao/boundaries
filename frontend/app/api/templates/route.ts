import { formBody, formContext, formJson, formRoute, forms } from "@/lib/form-server";
import { getAccountDisplayName } from "@/lib/auth/display-name";
import { formSchemas } from "@/lib/form-validation";
import { getRequestI18n } from "@/lib/i18n/server";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { return formRoute(request, async () => formJson(await forms.templates())); }
export async function POST(request: Request) {
  return formRoute(request, async () => {
    const { user, actor } = await formContext();
    const input = await formBody(request, formSchemas(getRequestI18n(request).locale).template);
    const template = await forms.createTemplate(actor.userId, getAccountDisplayName(user?.user_metadata), input);
    return formJson({ id: template.id, templateUrl: `/templates/${template.id}` }, 201);
  });
}
