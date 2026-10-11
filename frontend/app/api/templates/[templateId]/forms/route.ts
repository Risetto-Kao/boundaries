import { formContext, formJson, formRoute, forms } from "@/lib/form-server";
import { FormError } from "@/lib/form-service";
import { formSchemas } from "@/lib/form-validation";
export async function POST(request: Request, { params }: { params: Promise<{ templateId: string }> }) {
  return formRoute(request, async () => {
    const { templateId } = await params; if (!formSchemas().id.safeParse(templateId).success) throw new FormError(404, "accessDenied");
    const { actor } = await formContext(); const form = await forms.generateForm(actor.userId, templateId);
    return formJson({ url: `/forms/${form.id}/manage` }, 201);
  });
}
