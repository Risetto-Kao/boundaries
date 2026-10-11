import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { getCurrentUser, AuthUnavailableError } from "./auth/user";
import { isSameOrigin } from "./auth/config";
import { getRequestI18n } from "./i18n/server";
import { prisma } from "./prisma";
import { FormError, FormService } from "./form-service";
import { guestCookie } from "./form-tokens";

export const forms = new FormService(prisma);
export async function formContext() {
  const user = await getCurrentUser();
  return { user, actor: { userId: user?.id ?? null, guestToken: (await cookies()).get(guestCookie)?.value } };
}
export const formJson = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
export async function formBody<T>(request: Request, schema: ZodType<T>) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) throw new FormError(400, "invalidInput");
  return parsed.data;
}
export async function formRoute(request: Request, action: () => Promise<NextResponse>) {
  const { t } = getRequestI18n(request);
  if (request.method !== "GET" && !isSameOrigin(request)) return formJson({ error: t("invalidOrigin") }, 403);
  try { return await action(); }
  catch (error) {
    if (error instanceof FormError) return formJson({ error: t(error.key) }, error.status);
    if (error instanceof SyntaxError) return formJson({ error: t("invalidInput") }, 400);
    if (error instanceof AuthUnavailableError) return formJson({ error: t("sessionRetry") }, 503);
    // Avoid logging request bodies, tokens, connection strings or answer values.
    console.error("Form operation failed", error instanceof Error ? error.name : "unknown");
    return formJson({ error: t("pageRetry") }, 503);
  }
}
