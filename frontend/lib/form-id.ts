import { FormError } from "./form-service";
import { formSchemas } from "./form-validation";
export type FormContext = { params: Promise<{ formId: string }> };
export async function formId(context: FormContext) {
  const { formId } = await context.params;
  if (!formSchemas().id.safeParse(formId).success) throw new FormError(404, "accessDenied");
  return formId;
}
