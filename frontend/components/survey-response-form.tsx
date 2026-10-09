"use client";

import { useI18n } from "@/components/i18n-provider";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, RotateCcw, SlidersHorizontal, X } from "lucide-react";

import { LoadingSpinner } from "@/components/loading-indicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ANSWER_STYLE } from "@/lib/answer-meta";
import type { Answer } from "@/types/survey";

interface SurveyResponseFormProps {
  surveyId: string;
  questions: {
    id: string;
    text: string;
  }[];
}

interface SubmitResponseResult {
  resultUrl: string;
}

interface SubmitResponseError {
  error: string;
}

export function SurveyResponseForm({ surveyId, questions }: SurveyResponseFormProps) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNavigating, startNavigation] = useTransition();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [exitAnswer, setExitAnswer] = useState<Answer | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const completionRef = useRef<HTMLDivElement | null>(null);
  const pointerStartRef = useRef<{
    id: number;
    x: number;
    y: number;
    horizontal: boolean;
  } | null>(null);
  // A ref locks the gesture immediately, before React paints the next frame.
  const animationLockRef = useRef(false);
  const lastTapRef = useRef(0);
  const swipeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;
  const canSubmit = nickname.trim().length > 0 && allAnswered && !isSubmitting && !isNavigating && !isAnimating;


  useEffect(() => {
    return () => {
      if (swipeTimerRef.current) clearTimeout(swipeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (allAnswered && currentIndex > 0) completionRef.current?.focus();
  }, [allAnswered, currentIndex]);

  const animateAnswer = (value: Answer) => {
    const question = questions[currentIndex];
    if (!question || animationLockRef.current || isSubmitting || isNavigating) return;

    animationLockRef.current = true;
    pointerStartRef.current = null;
    lastTapRef.current = 0;
    setIsDragging(false);
    setIsAnimating(true);
    setExitAnswer(value);
    const distance = Math.max(window.innerWidth, (cardRef.current?.offsetWidth ?? 400) * 1.5);
    setDragX(value === "yes" ? distance : value === "no" ? -distance : 0);

    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 180;
    swipeTimerRef.current = setTimeout(() => {
      setAnswers((previous) => ({ ...previous, [question.id]: value }));
      setCurrentIndex(currentIndex + 1);
      setDragX(0);
      setExitAnswer(null);
      setIsAnimating(false);
      animationLockRef.current = false;
      swipeTimerRef.current = null;
    }, duration);
  };

  const undoAnswer = () => {
    if (animationLockRef.current || currentIndex === 0 || isSubmitting || isNavigating) return;
    const previousQuestion = questions[currentIndex - 1];
    setAnswers((previous) => {
      const next = { ...previous };
      delete next[previousQuestion.id];
      return next;
    });
    pointerStartRef.current = null;
    lastTapRef.current = 0;
    setDragX(0);
    setIsDragging(false);
    setCurrentIndex(currentIndex - 1);
  };

  const swipeThreshold = () => Math.min(96, Math.max(64, (cardRef.current?.offsetWidth ?? 400) * 0.24));

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (animationLockRef.current || isSubmitting || isNavigating || !event.isPrimary || event.button !== 0) return;
    pointerStartRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, horizontal: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;
    if (!start || start.id !== event.pointerId || animationLockRef.current) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (!start.horizontal) {
      if (Math.abs(deltaY) > 8 && Math.abs(deltaY) > Math.abs(deltaX)) {
        pointerStartRef.current = null;
        lastTapRef.current = 0;
        return;
      }
      if (Math.abs(deltaX) < 8 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.2) return;
      start.horizontal = true;
      lastTapRef.current = 0;
      setIsDragging(true);
    }
    setDragX(deltaX);
    // Commit as soon as the card crosses the threshold, without waiting for release.
    if (Math.abs(deltaX) >= swipeThreshold()) animateAnswer(deltaX > 0 ? "yes" : "no");
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;
    if (start && start.id !== event.pointerId) return;
    pointerStartRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (!start || animationLockRef.current) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) >= swipeThreshold() && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      animateAnswer(deltaX > 0 ? "yes" : "no");
      return;
    }
    setIsDragging(false);
    setDragX(0);
    if (Math.hypot(deltaX, deltaY) < 10 && !start.horizontal) {
      const now = Date.now();
      if (now - lastTapRef.current < 350) animateAnswer("depends");
      else lastTapRef.current = now;
    }
  };

  const cancelPointer = () => {
    pointerStartRef.current = null;
    lastTapRef.current = 0;
    if (!animationLockRef.current) {
      setIsDragging(false);
      setDragX(0);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || isNavigating) return;
    setErrorMessage("");

    const trimmedNickname = nickname.trim();
    if (!trimmedNickname) {
      setErrorMessage(t("nicknameRequired"));
      return;
    }

    if (!allAnswered) {
      setErrorMessage(t("allRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/surveys/${surveyId}/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Boundaries-Locale": locale,
        },
        body: JSON.stringify({
          nickname: trimmedNickname,
          answers: questions.map((question) => ({
            questionId: question.id,
            value: answers[question.id],
          })),
        }),
      });

      const payload = (await response.json()) as SubmitResponseResult | SubmitResponseError;

      if (!response.ok) {
        const message = "error" in payload ? payload.error : t("submitFailed");
        setErrorMessage(message);
        return;
      }

      if ("error" in payload) {
        setErrorMessage(payload.error);
        return;
      }

      startNavigation(() => {
        router.push(payload.resultUrl);
        router.refresh();
      });
    } catch {
      setErrorMessage(t("submitFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestion = questions[currentIndex];
  const dragStrength = Math.min(Math.abs(dragX) / 96, 1);
  const interactionDisabled = isAnimating || isSubmitting || isNavigating;
  const answerLabel = exitAnswer === "depends" ? t("depends") : dragX > 0 ? t("yes") : t("no");

  return (
    <form className="space-y-5" onSubmit={handleSubmit} aria-busy={isSubmitting || isNavigating}>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="nickname">
          {t("nickname")}
        </label>
        <Input
          id="nickname"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          placeholder={t("nicknamePlaceholder")}
          maxLength={50}
          required
          disabled={isSubmitting || isNavigating}
          aria-invalid={!!errorMessage && !nickname.trim()}
          aria-describedby={errorMessage ? "response-error" : undefined}
        />
      </div>

      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium text-foreground" aria-live="polite">
            {allAnswered ? t("allDone") : t("questionProgress", { count: currentIndex + 1, total: questions.length })}
          </span>
          <Button type="button" variant="ghost" size="sm" onClick={undoAnswer} disabled={currentIndex === 0 || interactionDisabled}>
            <RotateCcw /> {t("previousQuestion")}
          </Button>
        </div>
        <div role="progressbar" aria-label={t("answerProgress")} aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={answeredCount} className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-[width] duration-200 motion-reduce:transition-none" style={{ width: `${questions.length ? answeredCount / questions.length * 100 : 0}%` }} />
        </div>

        <div className="overflow-x-clip pb-5 pt-2">
          {currentQuestion ? (
            <div className="relative isolate grid" aria-label={t("questionCards")}>
              {questions.slice(currentIndex, currentIndex + 3).map((question, depth) => {
                const active = depth === 0;
                const reveal = active ? 0 : dragStrength;
                return (
                  <div
                    key={question.id}
                    ref={active ? cardRef : undefined}
                    aria-hidden={!active}
                    role={active ? "group" : undefined}
                    aria-label={active ? t("questionNumber", { count: currentIndex + 1 }) : undefined}
                    onPointerDown={active ? handlePointerDown : undefined}
                    onPointerMove={active ? handlePointerMove : undefined}
                    onPointerUp={active ? handlePointerUp : undefined}
                    onPointerCancel={active ? cancelPointer : undefined}
                    onLostPointerCapture={active ? () => { if (pointerStartRef.current) cancelPointer(); } : undefined}
                    className={`question-card col-start-1 row-start-1 flex flex-col motion-reduce:transition-none! ${active ? "relative touch-pan-y select-none cursor-grab active:cursor-grabbing" : "absolute inset-0 pointer-events-none overflow-hidden bg-brand-soft"}`}
                    style={{
                      zIndex: 3 - depth,
                      transform: active
                        ? `translate3d(${dragX}px, ${exitAnswer === "depends" ? -36 : 0}px, 0) rotate(${Math.max(-16, Math.min(16, dragX / 18))}deg)`
                        : `translateY(${depth * 8 - reveal * 8}px) scale(${1 - depth * 0.04 + reveal * 0.04})`,
                      opacity: active && exitAnswer === "depends" ? 0 : 1,
                      transition: active && isDragging ? "none" : "transform 180ms ease-out, opacity 180ms ease-out",
                      ...(active && isAnimating ? { pointerEvents: "none" as const } : {}),
                    }}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-brand-foreground">
                      <span>BOUNDARIES</span>
                      <span>{String(currentIndex + depth + 1).padStart(2, "0")} / {String(questions.length).padStart(2, "0")}</span>
                    </div>
                    <h3 aria-live={active ? "polite" : undefined} aria-atomic="true" className="my-auto py-8 text-left text-[26px] font-extrabold leading-[1.45] tracking-tight text-brand-foreground [overflow-wrap:anywhere] sm:text-[28px]">{question.text}</h3>
                    <div className="flex flex-wrap justify-between gap-2 border-t border-brand-foreground/30 pt-4 text-xs text-brand-foreground" aria-hidden="true">
                      <span className="flex items-center gap-1"><ArrowLeft className="size-3" /> {t("no")}</span>
                      <span>{t("doubleTap", { answer: t("depends") })}</span>
                      <span className="flex items-center gap-1">{t("yes")} <ArrowRight className="size-3" /></span>
                    </div>
                    {active && (Math.abs(dragX) > 8 || exitAnswer) ? (
                      <div aria-hidden="true" className={`pointer-events-none absolute top-14 rounded-lg px-4 py-2 text-2xl font-black tracking-widest ${exitAnswer === "depends" ? "left-6 -rotate-6 answer-depends" : dragX > 0 ? "left-6 -rotate-12 answer-yes" : "right-6 rotate-12 answer-no"}`} style={{ opacity: exitAnswer ? 1 : dragStrength }}>
                        {answerLabel}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div ref={completionRef} tabIndex={-1} className="question-card flex flex-col items-center justify-center text-center">
              <div className="mb-5 rounded-full bg-answer-yes p-3 text-answer-yes-foreground"><Check className="size-8" /></div>
              <h3 className="text-2xl font-bold text-brand-foreground">{t("answeredAll")}</h3>
              <p className="mt-3 text-sm leading-relaxed text-brand-foreground">{t("confirmNickname")}</p>
            </div>
          )}
        </div>

        {!allAnswered && (
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {([
              { value: "no", label: t("no"), Icon: X },
              { value: "depends", label: t("depends"), Icon: SlidersHorizontal },
              { value: "yes", label: t("yes"), Icon: Check },
            ] as const).map(({ value, label, Icon }) => (
              <Button key={value} type="button" variant="answer" onClick={() => animateAnswer(value)} disabled={interactionDisabled}
                aria-label={t("answerAction", { answer: label })}
                className={`min-h-14 flex-col gap-1 px-1 text-sm font-bold min-[390px]:flex-row min-[390px]:gap-2 [&_svg]:size-5 ${ANSWER_STYLE[value]}`}>
                <Icon aria-hidden="true" />{label}
              </Button>
            ))}
          </div>
        )}
        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          {allAnswered ? t("notSubmitted", { count: answeredCount, total: questions.length }) : t("swipeHint")}
        </p>
      </div>

      {errorMessage && <div id="response-error" role="alert" className="feedback feedback-error"><p>{errorMessage}</p><a href="#nickname" className="text-action text-destructive">{t("nickname")}</a></div>}

      <Button type="submit" disabled={!canSubmit} size="lg" className="w-full sm:w-auto">
        {(isSubmitting || isNavigating) && <LoadingSpinner />}
        {isNavigating ? t("openingResults") : isSubmitting ? t("submitting") : t("submitAnswers")}
      </Button>
      {(isSubmitting || isNavigating) && (
        <p role="status" className="text-sm text-muted-foreground">
          {isNavigating ? t("submittedStatus") : t("submittingStatus")}
        </p>
      )}
    </form>
  );
}
