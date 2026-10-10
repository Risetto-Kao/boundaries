"use client";

import { createContext, useContext, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { createTranslator, isLocale, languages, localeCookie, type Locale } from "@/lib/i18n/config";

type I18n = { locale: Locale; t: ReturnType<typeof createTranslator>; setLocale: (locale: Locale) => void; isChanging: boolean };
const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  const [locale, updateLocale] = useState(initialLocale);
  const [isChanging, startTransition] = useTransition();
  const router = useRouter();
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  const setLocale = (next: Locale) => {
    if (!isLocale(next) || next === locale) return;
    document.cookie = `${localeCookie}=${next}; Path=/; Max-Age=31536000; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
    updateLocale(next);
    startTransition(() => router.refresh());
  };
  return <I18nContext.Provider value={{ locale, t: createTranslator(locale), setLocale, isChanging }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n requires I18nProvider");
  return context;
}

export function LanguageSwitcher() {
  const { locale, t, setLocale, isChanging } = useI18n();
  return <label className="inline-flex min-h-11 items-center gap-2 text-foreground">
    <Globe className="size-5" aria-hidden="true" />
    <select aria-label={t("language")} value={locale} disabled={isChanging}
      onChange={(event) => { if (isLocale(event.target.value)) setLocale(event.target.value); }}
      className="min-h-11 max-w-32 rounded-lg border border-border bg-card px-2 py-2 text-sm focus-visible:outline-2 focus-visible:outline-ring">
      {(Object.keys(languages) as Locale[]).map((value) => <option key={value} value={value} lang={value}>{languages[value].name}</option>)}
    </select>
  </label>;
}
