import { Check, X, Triangle } from "lucide-react";
import { ANSWER_STYLE } from "@/lib/answer-meta";
import type { Answer } from "@/types/survey";

export const ANSWER_ICON = { yes: Check, no: X, depends: Triangle };
export function AnswerBadge({ answer, label, compact = false, ariaLabel }: { answer: Answer; label: string; compact?: boolean; ariaLabel?: string }) {
  const Icon = ANSWER_ICON[answer];
  return <span aria-label={ariaLabel ?? label} title={ariaLabel ?? label} className={`answer-badge ${ANSWER_STYLE[answer]} ${compact ? "answer-icon-only" : ""}`}><Icon size={20} strokeWidth={2.5} aria-hidden="true" /><span className="answer-label">{label}</span></span>;
}
