import type { Answer } from "@/types/survey";

export const ANSWER_OPTIONS: { value: Answer; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "depends", label: "Depends" },
];

export const ANSWER_STYLE: Record<Answer, string> = {
  yes: "bg-emerald-100 text-emerald-800 border-emerald-200",
  no: "bg-rose-100 text-rose-800 border-rose-200",
  depends: "bg-slate-200 text-slate-700 border-slate-300",
};

export const ANSWER_LABEL: Record<Answer, string> = {
  yes: "Yes",
  no: "No",
  depends: "Depends",
};
