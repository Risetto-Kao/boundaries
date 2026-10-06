"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showDependsIcon, setShowDependsIcon] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  const pointerStartRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const lastTapRef = useRef<number>(0);
  const rippleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dependsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;
  const canSubmit = nickname.trim().length > 0 && allAnswered && !isSubmitting;

  const normalizedNickname = useMemo(() => nickname.trim().toLowerCase(), [nickname]);

  useEffect(() => {
    return () => {
      if (rippleTimerRef.current) {
        clearTimeout(rippleTimerRef.current);
      }
      if (dependsTimerRef.current) {
        clearTimeout(dependsTimerRef.current);
      }
    };
  }, []);

  const updateAnswer = (questionId: string, value: Answer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const advanceIfPossible = (index: number) => {
    if (index < questions.length - 1) {
      setCurrentIndex(index + 1);
    }
  };

  const handleAnswer = (value: Answer) => {
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) {
      return;
    }
    updateAnswer(currentQuestion.id, value);
    advanceIfPossible(currentIndex);
  };

  const resetVisuals = () => {
    setDragX(0);
    setIsAnimating(false);
  };

  const showDepends = () => {
    if (dependsTimerRef.current) {
      clearTimeout(dependsTimerRef.current);
    }
    setShowDependsIcon(true);
    dependsTimerRef.current = setTimeout(() => {
      setShowDependsIcon(false);
    }, 500);
  };

  const triggerRipple = () => {
    if (rippleTimerRef.current) {
      clearTimeout(rippleTimerRef.current);
    }
    setShowRipple(true);
    rippleTimerRef.current = setTimeout(() => {
      setShowRipple(false);
    }, 350);
  };

  const animateSwipe = (value: Answer, direction: "left" | "right") => {
    if (isAnimating) {
      return;
    }
    setIsAnimating(true);
    const targetX = direction === "right" ? 260 : -260;
    setDragX(targetX);
    window.setTimeout(() => {
      handleAnswer(value);
      resetVisuals();
    }, 200);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isAnimating) {
      return;
    }
    pointerStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      t: Date.now(),
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isAnimating) {
      return;
    }
    const start = pointerStartRef.current;
    if (!start) {
      return;
    }
    const deltaX = event.clientX - start.x;
    setDragX(deltaX);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    if (!start) {
      return;
    }

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    const elapsed = Date.now() - start.t;

    const swipeThreshold = 50;
    const isHorizontalSwipe = absX > swipeThreshold && absX > absY * 1.5 && elapsed < 800;

    if (isHorizontalSwipe) {
      if (deltaX > 0) {
        animateSwipe("yes", "right");
      } else {
        animateSwipe("no", "left");
      }
      return;
    }

    setDragX(0);

    const tapDistance = Math.hypot(deltaX, deltaY);
    if (tapDistance < 10) {
      const now = Date.now();
      if (now - lastTapRef.current < 350) {
        lastTapRef.current = 0;
        showDepends();
        handleAnswer("depends");
      } else {
        lastTapRef.current = now;
        triggerRipple();
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
      router.push(payload.resultUrl);
      router.refresh();
    } catch {
      setErrorMessage("提交失敗，請稍後重試");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const dragStrength = Math.min(Math.abs(dragX) / 120, 1);
  const showYesHint = dragX > 20;
  const showNoHint = dragX < -20;

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
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

      <div className="space-y-4">
        <section
          className="relative overflow-hidden rounded-lg border bg-white p-5 text-center shadow-sm touch-pan-y select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-between px-6 text-3xl font-semibold"
            aria-hidden
          >
            <span
              className="text-emerald-500 transition-opacity"
              style={{ opacity: showYesHint ? dragStrength : 0 }}
            >
              ✅
            </span>
            <span
              className="text-rose-500 transition-opacity"
              style={{ opacity: showNoHint ? dragStrength : 0 }}
            >
              ❌
            </span>
          </div>

          {showDependsIcon ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-3xl text-slate-600">
              ⚪
            </div>
          ) : null}

          {showRipple ? (
            <span className="pointer-events-none absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-300 animate-ping" />
          ) : null}

          <div
            className="relative"
            style={{
              transform: `translateX(${dragX}px)`,
              transition: isAnimating ? "transform 180ms ease-out" : "transform 120ms ease-out",
            }}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              第 {currentIndex + 1} 題 / 共 {questions.length} 題
            </p>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">{currentQuestion?.text}</h3>
            <p className="mt-4 text-sm text-slate-600">
              左滑：No　右滑：Yes　連點兩下：看狀況
            </p>
            <p className="mt-2 text-sm text-slate-500">
              目前答案：{currentAnswer ? currentAnswer.toUpperCase() : "尚未作答"}
            </p>
          </div>
        </section>
      </div>

      <p className="text-sm text-slate-600">
        已作答 {answeredCount}/{questions.length} 題
      </p>

      {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}

      <Button type="submit" disabled={!canSubmit}>
        {isSubmitting ? "提交中..." : "提交答案"}
      </Button>
    </form>
  );
}
