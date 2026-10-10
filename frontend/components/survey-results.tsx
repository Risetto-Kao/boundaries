"use client";

import { useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { AnswerBadge, ANSWER_ICON } from "@/components/answer-badge";
import { Avatar } from "@/components/design-primitives";
import { disagreementBackground, disagreementScore } from "@/lib/design";
import type { Answer } from "@/types/survey";

interface Props { questions: { id: string; text: string }[]; participants: { id: string; nickname: string }[]; answers: Record<string, Record<string, Answer>> }
export function SurveyResults({ questions, participants, answers }: Props) {
  const { t } = useI18n();
  const [view, setView] = useState<"matrix" | "list">("matrix");
  const compact = participants.length >= 3;
  const gridStyle = { gridTemplateColumns: compact ? `minmax(180px,2fr) repeat(${participants.length},56px)` : `minmax(0,1.7fr)${participants.length ? ` repeat(${participants.length},minmax(0,1fr))` : ""}` };
  const values = (questionId: string) => participants.map(person => answers[person.id]?.[questionId]);
  return <div className="min-w-0">
    <div className="results-toolbar">
      <div role="group" aria-label={t("resultsMode")} className="segmented"><button type="button" aria-label={t("matrixView")} title={t("matrixView")} aria-pressed={view === "matrix"} aria-controls="matrix-results" onClick={() => setView("matrix")}><LayoutGrid size={20} aria-hidden="true" /></button><button type="button" aria-label={t("questionView")} title={t("questionView")} aria-pressed={view === "list"} aria-controls="question-results" onClick={() => setView("list")}><List size={20} aria-hidden="true" /></button></div>
      <div className="results-legend">{view === "matrix" && (["yes", "depends", "no"] as const).map(value => <span key={value}><i className={`legend-dot ${value === "depends" ? "answer-depends" : `answer-${value}`}`} aria-hidden="true" />{t(value)}</span>)}<div className="disagreement-legend"><span>{t("agree")}</span><i className="disagreement-gradient" aria-hidden="true" /><span>{t("disagree")}</span></div></div>
    </div>
    {view === "matrix" ? <div id="matrix-results" className={`matrix-card ${compact ? "matrix-compact" : ""}`} role="region" aria-label={t("matrixView")} tabIndex={0}>
      <div role="table" aria-label={t("matrixView")} style={{ minWidth: compact ? 720 : undefined }}>
        <div role="row" className="matrix-grid matrix-header" style={gridStyle}><div role="columnheader" className="px-7 py-5 text-[13px] font-extrabold tracking-[.08em] text-muted-foreground">{t("questionPeople")}</div>{participants.map((person, index) => <div role="columnheader" key={person.id} className="matrix-person" title={person.nickname} aria-label={person.nickname}><Avatar name={person.nickname} index={index} /><span className="matrix-person-name">{person.nickname}</span></div>)}</div>
        {questions.map((question, index) => <div role="row" key={question.id} className="matrix-grid matrix-row" data-disagreement={disagreementScore(values(question.id))} style={{ ...gridStyle, background: disagreementBackground(values(question.id)) }}>
          <div role="rowheader" className="matrix-question"><span className="question-number">Q{index + 1}</span><span>{question.text}</span><span className="sr-only">{t(disagreementScore(values(question.id)) > 0 ? "disagree" : "agree")}</span></div>
          {participants.map(person => { const answer = answers[person.id]?.[question.id]; return <div role="cell" key={person.id} className="matrix-answer">{answer ? <AnswerBadge answer={answer} label={t(answer)} compact={compact} /> : <span className="unanswered-circle" aria-label={t("unanswered")} title={t("unanswered")} />}</div>; })}
        </div>)}
      </div>
    </div> : <div id="question-results" className="space-y-3">{questions.map((question, index) => <section key={question.id} className="result-list-card" aria-labelledby={`question-${question.id}`} data-disagreement={disagreementScore(values(question.id))} style={{ background: disagreementBackground(values(question.id)) }}>
      <h2 id={`question-${question.id}`} className="result-list-heading"><span className="question-number">Q{index + 1}</span><span className="[overflow-wrap:anywhere]">{question.text}</span><span className="sr-only">{t(disagreementScore(values(question.id)) > 0 ? "disagree" : "agree")}</span></h2>
      <div className="space-y-2">{(["yes", "depends", "no"] as const).map(value => {
        const people = participants.filter(person => answers[person.id]?.[question.id] === value);
        if (!people.length) return null;
        const Icon = ANSWER_ICON[value]; const token = value === "depends" ? "maybe" : value;
        return <div key={value} role="group" aria-label={`${t(value)}, ${t("peopleCount", { count: people.length })}`} className="answer-group" style={{ background: `var(--${token}-50)` }}><div className={`answer-group-count answer-${value}`}><Icon size={26} strokeWidth={2.5} aria-hidden="true" /><span>{people.length}</span></div><ul className="answer-group-people">{people.map(person => <li key={person.id} className="answer-group-person"><Avatar size={28} name={person.nickname} index={participants.findIndex(p => p.id === person.id)} /><span>{person.nickname}</span></li>)}</ul></div>;
      })}</div>
      {participants.some(person => !answers[person.id]?.[question.id]) && <p className="mt-3 text-xs text-muted-foreground [overflow-wrap:anywhere]">{t("unanswered")}: {participants.filter(person => !answers[person.id]?.[question.id]).map(person => person.nickname).join(", ")}</p>}
    </section>)}</div>}
  </div>;
}
