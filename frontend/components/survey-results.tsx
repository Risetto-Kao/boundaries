"use client";

import { useI18n } from "@/components/i18n-provider";
import { useState, useSyncExternalStore } from "react";
import { LayoutGrid, List } from "lucide-react";

import { AnswerBadge, ANSWER_ICON } from "@/components/answer-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAnswerOptions, ANSWER_STYLE } from "@/lib/answer-meta";
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
  const { t } = useI18n();
  const [view, setView] = useState<ResultsView | null>(null);
  const isWideScreen = useSyncExternalStore(subscribeToWidth, getWideScreenSnapshot, getServerSnapshot);
  const activeView = view ?? (isWideScreen ? "matrix" : "question");

  return (
    <div className="min-w-0 space-y-4">
      <div role="group" aria-label={t("resultsMode")} className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 sm:inline-grid">
        <Button
          type="button"
          variant="ghost"
          className={cn("h-11 px-3", view === null ? "bg-card text-brand md:bg-transparent md:text-foreground" : view === "question" && "bg-card text-brand")}
          aria-pressed={activeView === "question"}
          aria-controls="question-results"
          onClick={() => setView("question")}
        >
          <List aria-hidden="true" />
          {t("questionView")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className={cn("h-11 px-3", view === null ? "md:bg-card md:text-brand" : view === "matrix" && "bg-card text-brand")}
          aria-pressed={activeView === "matrix"}
          aria-controls="matrix-results"
          onClick={() => setView("matrix")}
        >
          <LayoutGrid aria-hidden="true" />
          {t("matrixView")}
        </Button>
      </div>

      <div id="question-results" className={cn("space-y-4", view === null ? "md:hidden" : view !== "question" && "hidden")}>
        {questions.map((question, index) => {
          const unanswered = participants.filter((participant) => !answers[participant.id]?.[question.id]);

          return (
            <section key={question.id} aria-labelledby={`question-${question.id}`} className="min-w-0 space-y-5 border-t border-border py-6">
              <div>
                <p className="mb-1 text-xs font-semibold text-muted-foreground">Q{index + 1}</p>
                <h2 id={`question-${question.id}`} className="text-lg font-bold leading-relaxed text-foreground [overflow-wrap:anywhere]">
                  {question.text}
                </h2>
              </div>
              <div className="grid min-w-0 gap-3 sm:grid-cols-3">
                {getAnswerOptions(t).map(({ value, label }) => {
                  const Icon = ANSWER_ICON[value];
                  const respondents = participants.filter((participant) => answers[participant.id]?.[question.id] === value);

                  return (
                    <div key={value} className={cn("min-w-0 rounded-lg p-4", ANSWER_STYLE[value])}>
                      <h3 className="mb-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 font-semibold">
                        <span className="inline-flex items-center gap-2"><Icon size={20} className="shrink-0" aria-hidden="true" />{label}</span><span className="text-xs font-normal">{t("peopleCount", { count: respondents.length })}</span>
                      </h3>
                      {respondents.length > 0 ? (
                        <ul className="flex flex-wrap gap-2">
                          {respondents.map((participant) => (
                            <li key={participant.id} className="max-w-full rounded-md bg-card px-2 py-1 text-sm text-foreground [overflow-wrap:anywhere]">
                              {participant.nickname}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm">{t("noSelections")}</p>
                      )}
                    </div>
                  );
                })}
              </div>
              {unanswered.length > 0 && (
                <p className="text-xs leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                  {t("unanswered")}: {unanswered.map((participant) => participant.nickname).join(", ")}
                </p>
              )}
            </section>
          );
        })}
      </div>

      <div id="matrix-results" className={cn("min-w-0", view === null ? "hidden md:block" : view !== "matrix" && "hidden")}>
        <Table aria-label={t("matrixView")} className="table-fixed" style={{ width: 260 + participants.length * 176, minWidth: "100%" }}>
          <TableHeader>
            <TableRow>
              <TableHead scope="col" className="w-[260px] py-4">{t("questionPeople")}</TableHead>
              {participants.map((participant) => (
                <TableHead key={participant.id} scope="col" className="w-44 px-4 py-4 align-top whitespace-normal [overflow-wrap:anywhere]">{participant.nickname}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.map((question, index) => (
              <TableRow key={question.id}>
                <TableHead scope="row" className="w-[260px] py-5 align-top whitespace-normal [overflow-wrap:anywhere]">
                  <div className="mb-2 text-xs font-bold text-brand">Q{index + 1}</div>
                  <div className="font-semibold text-foreground">{question.text}</div>
                </TableHead>
                {participants.map((participant) => {
                  const answer = answers[participant.id]?.[question.id];
                  return (
                    <TableCell key={participant.id} className="px-4 py-5 align-top">
                      {answer ? (
                        <AnswerBadge answer={answer} label={t(answer)} />
                      ) : (
                        <span className="text-muted-foreground" aria-label={t("unanswered")}>-</span>
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
