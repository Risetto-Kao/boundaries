import { Check, X, SlidersHorizontal } from "lucide-react";
import { ANSWER_STYLE } from "@/lib/answer-meta";
import type { Answer } from "@/types/survey";

export const ANSWER_ICON = { yes: Check, no: X, depends: SlidersHorizontal };

export function AnswerBadge({ answer, label }: { answer: Answer; label: string }) {
  const Icon = ANSWER_ICON[answer];
  return <span className={`answer-badge ${ANSWER_STYLE[answer]}`}><Icon size={16} aria-hidden="true" />{label}</span>;
}
