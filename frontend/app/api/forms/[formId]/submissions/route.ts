import { formBody, formContext, formJson, formRoute, forms } from "@/lib/form-server";
import { formSchemas } from "@/lib/form-validation";
import { formId, type FormContext } from "@/lib/form-id";
import { guestCookie } from "@/lib/form-tokens";
import { getRequestI18n } from "@/lib/i18n/server";
export async function POST(request: Request, context: FormContext) {
  return formRoute(request, async () => {
    const id = await formId(context); const { actor } = await formContext();
    const result = await forms.submit(id, actor, await formBody(request, formSchemas(getRequestI18n(request).locale).submission));
    const response = formJson({ resultUrl: `/forms/${id}/results` });
    if (result.guestToken && result.guestExpiresAt) response.cookies.set(guestCookie, result.guestToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: result.guestExpiresAt });
    return response;
  });
}
