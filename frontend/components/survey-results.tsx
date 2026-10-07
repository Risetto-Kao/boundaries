"use client";

import { useState, useSyncExternalStore } from "react";
import { LayoutGrid, List } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ANSWER_LABEL, ANSWER_OPTIONS, ANSWER_STYLE } from "@/lib/answer-meta";
import { cn } from "@/lib/utils";
import type { Answer } from "@/types/survey";

type ResultsView = "question" | "matrix";

interface SurveyResultsProps {
  questions: { id: string; text: string }[];
  participants: { id: string; nickname: string }[];
  answers: Record<string, Record<string, Answer>>;
}

// Match Tailwind's md breakpoint. CSS also applies the default before hydration.
const MATRIX_MEDIA_QUERY = "(min-width: 768px)";

function subscribeToWidth(onChange: () => void) {
  const media = window.matchMedia(MATRIX_MEDIA_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getWideScreenSnapshot() {
  return window.matchMedia(MATRIX_MEDIA_QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

export function SurveyResults({ questions, participants, answers }: SurveyResultsProps) {
  const [view, setView] = useState<ResultsView | null>(null);
  const isWideScreen = useSyncExternalStore(subscribeToWidth, getWideScreenSnapshot, getServerSnapshot);
  const activeView = view ?? (isWideScreen ? "matrix" : "question");

  return (
    <div className="min-w-0 space-y-4">
      <div role="group" aria-label="結果顯示模式" className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 sm:inline-grid">
        <Button
          type="button"
          variant="ghost"
          className={cn("h-11 px-3", view === null ? "bg-white shadow-sm md:bg-transparent md:shadow-none" : view === "question" && "bg-white shadow-sm")}
          aria-pressed={activeView === "question"}
          aria-controls="question-results"
          onClick={() => setView("question")}
        >
          <List aria-hidden="true" />
          單題顯示
        </Button>
        <Button
          type="button"
          variant="ghost"
          className={cn("h-11 px-3", view === null ? "md:bg-white md:shadow-sm" : view === "matrix" && "bg-white shadow-sm")}
          aria-pressed={activeView === "matrix"}
          aria-controls="matrix-results"
          onClick={() => setView("matrix")}
        >
          <LayoutGrid aria-hidden="true" />
          矩陣顯示
        </Button>
      </div>

      <div id="question-results" className={cn("space-y-4", view === null ? "md:hidden" : view !== "question" && "hidden")}>
        {questions.map((question, index) => {
          const unanswered = participants.filter((participant) => !answers[participant.id]?.[question.id]);

          return (
            <section key={question.id} aria-labelledby={`question-${question.id}`} className="min-w-0 space-y-4 rounded-xl border bg-white p-4">
              <div>
                <p className="mb-1 text-xs font-semibold text-slate-500">Q{index + 1}</p>
                <h2 id={`question-${question.id}`} className="text-base font-semibold leading-relaxed text-slate-900 [overflow-wrap:anywhere]">
                  {question.text}
                </h2>
              </div>
              <div className="grid min-w-0 gap-3 sm:grid-cols-3">
                {ANSWER_OPTIONS.map(({ value, label }) => {
                  const respondents = participants.filter((participant) => answers[participant.id]?.[question.id] === value);

                  return (
                    <div key={value} className={cn("min-w-0 rounded-lg border p-3", ANSWER_STYLE[value])}>
                      <h3 className="mb-2 flex items-center justify-between gap-2 font-semibold">
                        {label}<span className="text-xs font-normal">{respondents.length} 人</span>
                      </h3>
                      {respondents.length > 0 ? (
                        <ul className="flex flex-wrap gap-2">
                          {respondents.map((participant) => (
                            <li key={participant.id} className="max-w-full rounded-md bg-white/80 px-2 py-1 text-sm text-slate-800 [overflow-wrap:anywhere]">
                              {participant.nickname}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm">無人選擇</p>
                      )}
                    </div>
                  );
                })}
              </div>
              {unanswered.length > 0 && (
                <p className="text-xs leading-relaxed text-slate-500 [overflow-wrap:anywhere]">
                  未填答：{unanswered.map((participant) => participant.nickname).join("、")}
                </p>
              )}
            </section>
          );
        })}
      </div>

      <div id="matrix-results" className={cn("min-w-0", view === null ? "hidden md:block" : view !== "matrix" && "hidden")}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col" className="min-w-64">問題 / 人員</TableHead>
              {participants.map((participant) => (
                <TableHead key={participant.id} scope="col">{participant.nickname}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.map((question, index) => (
              <TableRow key={question.id}>
                <TableHead scope="row" className="min-w-64 max-w-sm py-2 align-top whitespace-normal [overflow-wrap:anywhere]">
                  <div className="font-medium">Q{index + 1}</div>
                  <div className="font-normal text-slate-700">{question.text}</div>
                </TableHead>
                {participants.map((participant) => {
                  const answer = answers[participant.id]?.[question.id];
                  return (
                    <TableCell key={participant.id}>
                      {answer ? (
                        <span className={cn("inline-flex rounded-md border px-2 py-1 text-xs font-semibold", ANSWER_STYLE[answer])}>
                          {ANSWER_LABEL[answer]}
                        </span>
                      ) : (
                        <span className="text-slate-400" aria-label="未填答">-</span>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
