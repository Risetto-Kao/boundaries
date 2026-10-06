"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, RotateCcw, SlidersHorizontal, X } from "lucide-react";

import { LoadingSpinner } from "@/components/loading-indicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

function getSubmissionKey(surveyId: string) {
  return `boundaries:submitted:${surveyId}`;
}

function readSubmittedNicknames(surveyId: string): string[] {
  const stored = window.localStorage.getItem(getSubmissionKey(surveyId));
  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored) as unknown;
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

function hasSubmittedWithNickname(surveyId: string, nickname: string) {
  if (typeof window === "undefined") {
    return false;
  }

  const nicknames = readSubmittedNicknames(surveyId);
  return nicknames.includes(nickname.toLowerCase());
}

function markSubmittedNickname(surveyId: string, nickname: string) {
  const key = getSubmissionKey(surveyId);
  const nextNickname = nickname.toLowerCase();
  const nicknames = readSubmittedNicknames(surveyId);

  if (!nicknames.includes(nextNickname)) {
    nicknames.push(nextNickname);
    window.localStorage.setItem(key, JSON.stringify(nicknames));
  }
}

export function SurveyResponseForm({ surveyId, questions }: SurveyResponseFormProps) {
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

  const normalizedNickname = useMemo(() => nickname.trim().toLowerCase(), [nickname]);

  useEffect(() => {
    return () => {
      if (swipeTimerRef.current) clearTimeout(swipeTimerRef.current);
    };
  }, []);

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
      setErrorMessage("請先輸入暱稱");
      return;
    }

    if (!allAnswered) {
      setErrorMessage("每一題都要作答才能提交");
      return;
    }

    if (hasSubmittedWithNickname(surveyId, trimmedNickname)) {
      setErrorMessage("這個暱稱已在此裝置提交過，請換一個暱稱");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/surveys/${surveyId}/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
        const message = "error" in payload ? payload.error : "提交失敗，請稍後重試";
        setErrorMessage(message);
        return;
      }

      if ("error" in payload) {
        setErrorMessage(payload.error);
        return;
      }

      markSubmittedNickname(surveyId, normalizedNickname || trimmedNickname);
      startNavigation(() => {
        router.push(payload.resultUrl);
        router.refresh();
      });
    } catch {
      setErrorMessage("提交失敗，請稍後重試");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestion = questions[currentIndex];
  const dragStrength = Math.min(Math.abs(dragX) / 96, 1);
  const interactionDisabled = isAnimating || isSubmitting || isNavigating;
  const answerLabel = exitAnswer === "depends" ? "看狀況" : dragX > 0 ? "YES" : "NO";

  return (
    <form className="space-y-5" onSubmit={handleSubmit} aria-busy={isSubmitting || isNavigating}>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="nickname">
          你的暱稱
        </label>
        <Input
          id="nickname"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          placeholder="例如：小明"
          maxLength={50}
          required
        />
      </div>

      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium text-slate-700" aria-live="polite">
            {allAnswered ? "全部完成" : `第 ${currentIndex + 1} 題`} <span className="text-slate-400">/ {questions.length} 題</span>
          </span>
          <Button type="button" variant="ghost" size="sm" onClick={undoAnswer} disabled={currentIndex === 0 || interactionDisabled}>
            <RotateCcw /> 上一題
          </Button>
        </div>
        <div role="progressbar" aria-label="作答進度" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={answeredCount} className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-slate-900 transition-[width] duration-200 motion-reduce:transition-none" style={{ width: `${questions.length ? answeredCount / questions.length * 100 : 0}%` }} />
        </div>

        <div className="overflow-x-clip px-2 pb-8 pt-2 sm:px-4">
          {currentQuestion ? (
            <div className="isolate grid" aria-label="問題卡牌">
              {questions.slice(currentIndex, currentIndex + 3).map((question, depth) => {
                const active = depth === 0;
                const reveal = active ? 0 : dragStrength;
                return (
                  <div
                    key={question.id}
                    ref={active ? cardRef : undefined}
                    aria-hidden={!active}
                    role={active ? "group" : undefined}
                    aria-label={active ? `第 ${currentIndex + 1} 題` : undefined}
                    onPointerDown={active ? handlePointerDown : undefined}
                    onPointerMove={active ? handlePointerMove : undefined}
                    onPointerUp={active ? handlePointerUp : undefined}
                    onPointerCancel={active ? cancelPointer : undefined}
                    onLostPointerCapture={active ? () => { if (pointerStartRef.current) cancelPointer(); } : undefined}
                    className={`relative col-start-1 row-start-1 flex min-h-[340px] flex-col rounded-[28px] border p-6 shadow-lg motion-reduce:transition-none! sm:min-h-[360px] sm:p-8 ${active ? "touch-pan-y select-none border-slate-200 bg-white cursor-grab active:cursor-grabbing" : "pointer-events-none border-slate-200 bg-slate-50"}`}
                    style={{
                      zIndex: 3 - depth,
                      transform: active
                        ? `translate3d(${dragX}px, ${exitAnswer === "depends" ? -36 : 0}px, 0) rotate(${Math.max(-16, Math.min(16, dragX / 18))}deg)`
                        : `translateY(${depth * 14 - reveal * 14}px) scale(${1 - depth * 0.04 + reveal * 0.04})`,
                      opacity: active && exitAnswer === "depends" ? 0 : 1,
                      transition: active && isDragging ? "none" : "transform 180ms ease-out, opacity 180ms ease-out",
                      ...(active && isAnimating ? { pointerEvents: "none" as const } : {}),
                    }}
                  >
                    <div className="flex items-center justify-between text-xs font-medium tracking-wider text-slate-400">
                      <span>BOUNDARIES</span>
                      <span>{String(currentIndex + depth + 1).padStart(2, "0")} / {String(questions.length).padStart(2, "0")}</span>
                    </div>
                    <h3 className="my-auto py-8 text-left text-xl font-semibold leading-relaxed text-slate-900 sm:text-2xl">{question.text}</h3>
                    <div className="flex justify-between border-t border-slate-100 pt-4 text-xs text-slate-400" aria-hidden="true">
                      <span className="flex items-center gap-1"><ArrowLeft className="size-3" /> No</span>
                      <span>雙擊 · 看狀況</span>
                      <span className="flex items-center gap-1">Yes <ArrowRight className="size-3" /></span>
                    </div>
                    {active && (Math.abs(dragX) > 8 || exitAnswer) ? (
                      <div aria-hidden="true" className={`pointer-events-none absolute top-14 rounded-xl border-[3px] px-4 py-2 text-2xl font-black tracking-widest ${exitAnswer === "depends" ? "left-6 -rotate-6 border-slate-500 text-slate-600" : dragX > 0 ? "left-6 -rotate-12 border-emerald-500 text-emerald-600" : "right-6 rotate-12 border-rose-500 text-rose-600"}`} style={{ opacity: exitAnswer ? 1 : dragStrength }}>
                        {answerLabel}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-[340px] flex-col items-center justify-center rounded-[28px] border border-emerald-100 bg-emerald-50/50 px-6 text-center">
              <div className="mb-5 rounded-full bg-emerald-100 p-4 text-emerald-700"><Check className="size-8" /></div>
              <h3 className="text-xl font-semibold text-slate-900">每一題，都有你的答案了</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">確認暱稱後，就可以提交。<br />想修改最後一題？點選「上一題」。</p>
            </div>
          )}
        </div>

        {!allAnswered && (
          <div className="flex items-start justify-center gap-6 sm:gap-10">
            {([
              { value: "no", label: "No", Icon: X, style: "border-rose-200 text-rose-600 hover:bg-rose-50" },
              { value: "depends", label: "看狀況", Icon: SlidersHorizontal, style: "border-slate-200 text-slate-600 hover:bg-slate-50" },
              { value: "yes", label: "Yes", Icon: Check, style: "border-emerald-200 text-emerald-600 hover:bg-emerald-50" },
            ] as const).map(({ value, label, Icon, style }) => (
              <div key={value} className="flex flex-col items-center gap-2">
                <Button type="button" variant="outline" onClick={() => animateAnswer(value)} disabled={interactionDisabled} aria-label={`回答 ${label}`} className={`size-14 rounded-full bg-white shadow-sm [&_svg]:size-6 ${style}`}><Icon /></Button>
                <span className="text-xs font-medium text-slate-500">{label}</span>
              </div>
            ))}
          </div>
        )}
        <p className="text-center text-xs leading-relaxed text-slate-500">
          {allAnswered ? `已作答 ${answeredCount}/${questions.length} 題，答案尚未提交` : "左滑 No，右滑 Yes · 滑過門檻即作答，也可以點按鈕"}
        </p>
      </div>

      {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}

      <Button type="submit" disabled={!canSubmit}>
        {(isSubmitting || isNavigating) && <LoadingSpinner />}
        {isNavigating ? "正在開啟結果…" : isSubmitting ? "提交中..." : "提交答案"}
      </Button>
      {(isSubmitting || isNavigating) && (
        <p role="status" className="text-sm text-slate-600">
          {isNavigating ? "答案已送出，正在載入結果…" : "正在提交答案，請稍候…"}
        </p>
      )}
    </form>
  );
}
