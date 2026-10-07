import type { Answer } from "@/types/survey";
import type { createTranslator } from "@/lib/i18n/config";

export function getAnswerOptions(t: ReturnType<typeof createTranslator>): { value: Answer; label: string }[] {
  return (["yes", "no", "depends"] as const).map((value) => ({ value, label: t(value) }));
}

export const ANSWER_STYLE: Record<Answer, string> = {
  yes: "bg-emerald-100 text-emerald-800 border-emerald-200",
  no: "bg-rose-100 text-rose-800 border-rose-200",
  depends: "bg-slate-200 text-slate-700 border-slate-300",
};
