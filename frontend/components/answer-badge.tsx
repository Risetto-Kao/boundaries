import { Check, X, Triangle } from "lucide-react";
import { ANSWER_STYLE } from "@/lib/answer-meta";
import type { Answer } from "@/types/survey";

export const ANSWER_ICON = { yes: Check, no: X, depends: Triangle };

export function AnswerBadge({ answer, label }: { answer: Answer; label: string }) {
  const Icon = ANSWER_ICON[answer];
  return <span aria-label={label} title={label} className={`answer-badge ${ANSWER_STYLE[answer]}`}><Icon size={20} aria-hidden="true" /><span className="sr-only">{label}</span></span>;
}
