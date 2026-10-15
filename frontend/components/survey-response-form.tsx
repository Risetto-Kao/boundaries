"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, RotateCcw, Triangle, X } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { LoadingSpinner } from "@/components/loading-indicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ANSWER_STYLE } from "@/lib/answer-meta";
import type { Answer } from "@/types/survey";

interface Props { formId: string; invite?: string; signedIn?: boolean; defaultNickname?: string; questions: { id: string; text: string }[] }
export function SurveyResponseForm({ formId, invite, signedIn = false, questions, defaultNickname = "" }: Props) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [nickname, setNickname] = useState(defaultNickname);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [error, setError] = useState("");
  const [errorTarget, setErrorTarget] = useState<"nickname" | "question" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [navigating, startNavigation] = useTransition();
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exitAnswer, setExitAnswer] = useState<Answer | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const completion = useRef<HTMLDivElement>(null);
  const pointer = useRef<{ id: number; x: number; y: number; maxMovement: number } | null>(null);
  const lastTap = useRef<{ time: number; x: number; y: number } | null>(null);
  const requestKey = useRef<string | null>(null);
  const locked = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusNext = useRef(false);
  const count = Object.keys(answers).length;
  const allAnswered = count === questions.length;
  const busy = submitting || navigating || Boolean(exitAnswer);
  const canSubmit = Boolean((nickname.trim() || defaultNickname) && allAnswered && !busy);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => { if (focusNext.current) { (questions[index] ? card.current : completion.current)?.focus({ preventScroll: true }); focusNext.current = false; } }, [index, questions]);
  const answer = (value: Answer) => {
    const question = questions[index];
    if (!question || locked.current || submitting || navigating) return;
    locked.current = true; pointer.current = null; lastTap.current = null;
    setDragging(false); setExitAnswer(value);
    setDragX(value === "depends" ? 0 : (value === "yes" ? 1 : -1) * ((card.current?.offsetWidth ?? 400) + 80));
    timer.current = setTimeout(() => {
      focusNext.current = true; setAnswers(previous => ({ ...previous, [question.id]: value }));
      setIndex(index + 1); setDragX(0); setExitAnswer(null); locked.current = false; timer.current = null;
    }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 240);
  };
  const restart = () => {
    if (locked.current || submitting || navigating) return;
    focusNext.current = true;
    setAnswers({}); setIndex(0); setDragX(0); setDragging(false); setError(""); setErrorTarget(null); pointer.current = null; lastTap.current = null;
  };
  const pointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (locked.current || submitting || navigating || !event.isPrimary || event.button !== 0) return;
    pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY, maxMovement: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const pointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = pointer.current;
    if (!start || start.id !== event.pointerId || locked.current) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    start.maxMovement = Math.max(start.maxMovement, Math.hypot(dx, dy));
    if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) { cancel(); return; }
    if (start.maxMovement >= 8) lastTap.current = null;
    if (Math.abs(dx) < 8 && !dragging) return;
    setDragging(true);
    setDragX(dx);
  };
  const pointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = pointer.current;
    if (!start || start.id !== event.pointerId) return;
    pointer.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (locked.current) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const threshold = Math.min(90, event.currentTarget.offsetWidth * .25);
    if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy)) { answer(dx > 0 ? "yes" : "no"); return; }
    setDragging(false); setDragX(0);
    if (Math.max(start.maxMovement, Math.hypot(dx, event.clientY - start.y)) < 8) {
      const tap = lastTap.current; const now = Date.now();
      if (tap && now - tap.time < 320 && Math.hypot(event.clientX - tap.x, event.clientY - tap.y) < 8) answer("depends");
      else lastTap.current = { time: now, x: event.clientX, y: event.clientY };
    } else lastTap.current = null;
  };
  const cancel = () => { pointer.current = null; lastTap.current = null; if (!locked.current) { setDragging(false); setDragX(0); } };
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (locked.current || submitting || navigating) return;
    setError(""); setErrorTarget(null);
    const trimmedNickname = nickname.trim() || defaultNickname;
    if (!trimmedNickname) { setError(t("nicknameRequired")); setErrorTarget("nickname"); return; }
    if (!allAnswered) { setError(t("allRequired")); setErrorTarget("question"); return; }
    setSubmitting(true);
    try {
      const response = await fetch(`/api/forms/${formId}/submissions`, {
        method: "POST", headers: { "Content-Type": "application/json", "X-Boundaries-Locale": locale },
        body: JSON.stringify({ requestKey: requestKey.current ?? (requestKey.current = crypto.randomUUID()), invite, nickname: trimmedNickname, answers: questions.map(question => ({ questionId: question.id, value: answers[question.id] })) }),
      });
      const payload = await response.json();
      if (!response.ok) { setError(payload.error ?? t("submitFailed")); return; }
      startNavigation(() => { router.push(payload.resultUrl); router.refresh(); });
    } catch { setError(t("submitFailed")); }
    finally { setSubmitting(false); }
  };
  const question = questions[index];
  const feedback = exitAnswer ?? (dragX >= 0 ? "yes" : "no");
  const FeedbackIcon = feedback === "depends" ? Triangle : feedback === "yes" ? Check : X;
  return <form onSubmit={submit} aria-busy={submitting || navigating}>
    <div><label htmlFor="nickname" className="field-label">{t("nickname")}</label><Input id="nickname" value={nickname} onChange={event => setNickname(event.target.value)} placeholder={defaultNickname || t("nicknamePlaceholder")} maxLength={50} required={!defaultNickname} disabled={submitting || navigating} aria-invalid={Boolean(error && errorTarget === "nickname")} aria-describedby={error && errorTarget === "nickname" ? "response-error" : undefined} /></div>
    <div className="mt-5 flex items-center justify-between gap-3"><span id="response-progress" className="text-[15px] font-extrabold" aria-live="polite">{allAnswered ? t("allDone") : t("questionProgress", { count: index + 1, total: questions.length })}</span><Button type="button" variant="ghost" size="icon" onClick={restart} disabled={busy} className="text-muted-foreground" aria-label={t("restart")} title={t("restart")}><RotateCcw size={20} aria-hidden="true" /></Button></div>
    <div role="progressbar" aria-label={t("answerProgress")} aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={count} className="response-progress">{questions.map((q, i) => <span key={q.id} style={{ background: answers[q.id] ? `var(--${answers[q.id] === "depends" ? "maybe" : answers[q.id]})` : i === index ? "var(--violet)" : undefined }} />)}</div>
    <div className="overflow-x-clip pt-4 pb-5">
      {question ? <div className="relative isolate" aria-label={t("questionCards")}>
        {index < questions.length - 1 && <div aria-hidden="true" className="question-card pointer-events-none absolute inset-0" style={{ background: "#8C6EFF", transform: "scale(.94) translateY(16px)" }} />}
        <div key={question.id} ref={card} tabIndex={-1} id="current-question" role="group" aria-labelledby="response-progress question-heading" aria-describedby="response-hint" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={cancel} onLostPointerCapture={() => { if (pointer.current) cancel(); }} className="question-card response-card relative flex cursor-grab touch-pan-y flex-col select-none active:cursor-grabbing motion-reduce:transition-none!" style={{ transform: `translate3d(${dragX}px,${exitAnswer === "depends" ? -32 : 0}px,0) rotate(${Math.max(-12, Math.min(12, dragX / 18))}deg)`, opacity: exitAnswer === "depends" ? 0 : 1, transition: dragging ? "none" : "transform .24s ease-out, opacity .24s ease-out", pointerEvents: exitAnswer ? "none" : undefined }}>
          <div className="flex items-center justify-between gap-4 text-xs font-extrabold tracking-[.12em]"><span>BOUNDARIES</span><span>{String(index + 1).padStart(2, "0")} / {String(questions.length).padStart(2, "0")}</span></div>
          <h2 id="question-heading" className="my-auto py-5 text-[32px] leading-[1.3] font-extrabold [overflow-wrap:anywhere] [text-wrap:balance]">{question.text}</h2>
          <span className="text-[13px] font-bold text-white/80">{t("swipeCardHint")}</span>
          {(Math.abs(dragX) > 0 || exitAnswer) && <div aria-hidden="true" className={`card-feedback ${ANSWER_STYLE[feedback]}`} style={{ opacity: exitAnswer ? 1 : Math.min(Math.abs(dragX) / 90, 1), background: `color-mix(in srgb, var(--${feedback === "depends" ? "maybe" : feedback}) 85%, transparent)` }}><FeedbackIcon size={72} strokeWidth={2.5} />{t(feedback)}</div>}
        </div>
      </div> : <div ref={completion} tabIndex={-1} className="response-complete" aria-labelledby="completion-heading"><Check className="mx-auto mb-4" size={40} aria-hidden="true" /><h2 id="completion-heading" className="text-2xl font-extrabold">{t("answeredAll")}</h2><p className="mt-3 text-muted-foreground">{t("confirmNickname")}</p></div>}
    </div>
    {question && <><div className="response-buttons">{([{ value: "no", Icon: X }, { value: "depends", Icon: Triangle }, { value: "yes", Icon: Check }] as const).map(({ value, Icon }) => <Button key={value} type="button" variant="answer" className={`${ANSWER_STYLE[value]} h-16 min-h-16 rounded-[24px] px-2 text-[15px] gap-1.5 whitespace-nowrap [&_svg]:size-[22px]`} onClick={() => answer(value)} disabled={busy} aria-label={t("answerAction", { answer: t(value) })}><Icon className="size-[22px]" strokeWidth={2.5} aria-hidden="true" /><span className="min-w-0 whitespace-normal leading-tight">{t(value)}</span></Button>)}</div>
    <p id="response-hint" className="mt-3 text-center text-[13px] text-muted-foreground">{t("swipeHint")}</p></>}
    {error && <div id="response-error" role="alert" className="feedback feedback-error mt-5"><p>{error}</p>{errorTarget === "nickname" && <a href="#nickname" className="text-action text-destructive">{t("nickname")}</a>}</div>}
    {allAnswered && <><p className="mt-5 text-sm font-bold">{t("submitFinalWarning")}</p>
    {!signedIn && <p className="mt-2 text-sm text-muted-foreground">{t("guestNotice")}</p>}
    <Button type="submit" disabled={!canSubmit} className="response-submit">{(submitting || navigating) && <LoadingSpinner />}{t(navigating ? "openingResults" : submitting ? "submitting" : "submitAnswers")}</Button>
    </>}
    {(submitting || navigating) && <p role="status" className="sr-only">{t(navigating ? "submittedStatus" : "submittingStatus")}</p>}
  </form>;
}
