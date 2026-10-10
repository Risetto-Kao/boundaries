import type { Locale } from "@/lib/i18n/config";
import type { Answer } from "@/types/survey";

export const languageShortNames: Record<Locale, string> = { "zh-Hant": "繁中", en: "EN", ja: "日本語", ko: "한국어" };
// Derived from actual content; never rewrite stored titles or questions.
export function detectSurveyLanguage(title: string, questions: { text: string }[] = []): Locale {
  const text = `${title} ${questions.map(q => q.text).join(" ")}`;
  if (/[\uac00-\ud7af\u1100-\u11ff]/u.test(text)) return "ko";
  if (/[\u3041-\u3096\u30a1-\u30fa\u30ff]/u.test(text)) return "ja";
  if (/[\u3400-\u9fff]/u.test(text)) return "zh-Hant";
  if (/[a-z]/i.test(text)) return "en";
  return "zh-Hant";
}

export function disagreementScore(values: (Answer | undefined)[]) {
  const answered = values.filter((value): value is Answer => Boolean(value));
  if (answered.length < 2) return 0;
  const maxCount = Math.max(...(["yes", "depends", "no"] as const).map(value => answered.filter(answer => answer === value).length));
  return Math.min(1, (1 - maxCount / answered.length) / (2 / 3));
}
export function disagreementBackground(values: (Answer | undefined)[]) {
  const score = disagreementScore(values);
  return score > 0 ? `rgba(104, 54, 239, ${0.05 + 0.20 * score})` : "#FFFFFF";
}

export function formatBoundaryDate(locale: Locale, value: string) {
  const date = new Date(value);
  const year = new Intl.DateTimeFormat("en", { timeZone: "Asia/Taipei", year: "numeric" });
  return new Intl.DateTimeFormat(locale === "zh-Hant" ? "zh-TW" : locale, {
    timeZone: "Asia/Taipei", month: "long", day: "numeric",
    ...(year.format(date) !== year.format(new Date()) ? { year: "numeric" } : {}),
  }).format(date);
}
