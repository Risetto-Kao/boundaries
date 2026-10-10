import type { Answer } from "@/types/survey";
import type { createTranslator } from "@/lib/i18n/config";

export function getAnswerOptions(t: ReturnType<typeof createTranslator>): { value: Answer; label: string }[] {
  return (["yes", "no", "depends"] as const).map((value) => ({ value, label: t(value) }));
}

export const ANSWER_STYLE: Record<Answer, string> = {
  yes: "answer-yes",
  no: "answer-no",
  depends: "answer-depends",
};
