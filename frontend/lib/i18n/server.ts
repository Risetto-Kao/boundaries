import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { createTranslator, isLocale, localeCookie, negotiateLocale } from "./config";

export const getI18n = cache(async () => {
  const cookie = (await cookies()).get(localeCookie)?.value;
  const locale = isLocale(cookie) ? cookie : negotiateLocale((await headers()).get("accept-language"));
  return { locale, t: createTranslator(locale) };
});

export function getRequestI18n(request: Request) {
  // Forms explicitly send their selected language; external clients can negotiate it too.
  const explicit = request.headers.get("x-boundaries-locale");
  const cookie = request.headers.get("cookie")?.split(";")
    .map((entry) => entry.trim()).find((entry) => entry.startsWith(`${localeCookie}=`))
    ?.slice(localeCookie.length + 1);
  const locale = isLocale(explicit) ? explicit : isLocale(cookie) ? cookie
    : negotiateLocale(request.headers.get("accept-language"));
  return { locale, t: createTranslator(locale) };
}
