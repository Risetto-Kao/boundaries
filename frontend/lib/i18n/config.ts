import zhHant from "./messages/zh-Hant";
import en from "./messages/en";
import ja from "./messages/ja";
import ko from "./messages/ko";

export type MessageKey = keyof typeof zhHant;
export type Messages = Record<MessageKey, string>;

// Add a catalog and registry entry to support another language everywhere.
export const languages = {
  "zh-Hant": { name: "繁體中文", dateLocale: "zh-TW", messages: zhHant },
  en: { name: "English", dateLocale: "en", messages: en },
  ja: { name: "日本語", dateLocale: "ja", messages: ja },
  ko: { name: "한국어", dateLocale: "ko", messages: ko },
} satisfies Record<string, { name: string; dateLocale: string; messages: Messages }>;
export type Locale = keyof typeof languages;
export const defaultLocale: Locale = "zh-Hant";
export const localeCookie = "boundaries-locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && Object.hasOwn(languages, value);
}

export function matchLocale(value: string): Locale | undefined {
  const tag = value.trim().toLowerCase();
  const locales = Object.keys(languages) as Locale[];
  return locales.find((locale) => locale.toLowerCase() === tag)
    ?? locales.find((locale) => locale.split("-")[0].toLowerCase() === tag.split("-")[0]);
}

export function negotiateLocale(acceptLanguage: string | null): Locale {
  const preferences = (acceptLanguage ?? "").split(",").map((entry, index) => {
    const [tag, ...params] = entry.trim().split(";");
    const quality = params.find((param) => param.trim().startsWith("q="));
    const q = quality ? Number(quality.trim().slice(2)) : 1;
    return { tag, q, index };
  }).filter(({ q }) => Number.isFinite(q) && q > 0 && q <= 1)
    .sort((a, b) => b.q - a.q || a.index - b.index);
  for (const { tag } of preferences) {
    const locale = matchLocale(tag);
    if (locale) return locale;
  }
  return defaultLocale;
}

export function createTranslator(locale: Locale) {
  return (key: MessageKey, values: Record<string, string | number> = {}) => {
    const template: string = languages[locale].messages[key] ?? zhHant[key];
    return template.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
      Object.hasOwn(values, name) ? String(values[name]) : placeholder);
  };
}

export function formatDate(locale: Locale, value: Date | string, includeTime = false) {
  return new Intl.DateTimeFormat(languages[locale].dateLocale, {
    timeZone: "Asia/Taipei", dateStyle: "medium", ...(includeTime ? { timeStyle: "short" } : {}),
  }).format(new Date(value));
}
