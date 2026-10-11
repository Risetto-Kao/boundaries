import { formContext, formJson, formRoute, forms } from "@/lib/form-server";
import { getAccountDisplayName } from "@/lib/auth/display-name";
import { FormError } from "@/lib/form-service";
import { formSchemas } from "@/lib/form-validation";
export async function POST(request: Request, { params }: { params: Promise<{ templateId: string }> }) {
  return formRoute(request, async () => {
    const { templateId } = await params; if (!formSchemas().id.safeParse(templateId).success) throw new FormError(404, "accessDenied");
    const { user, actor } = await formContext();
    const copy = await forms.copyTemplate(actor.userId, getAccountDisplayName(user?.user_metadata), templateId);
    return formJson({ url: `/templates/${copy.id}/edit` }, 201);
  });
}
