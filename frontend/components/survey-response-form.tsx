"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ANSWER_OPTIONS } from "@/lib/answer-meta";
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

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;
  const canSubmit = nickname.trim().length > 0 && allAnswered && !isSubmitting;

  const normalizedNickname = useMemo(() => nickname.trim().toLowerCase(), [nickname]);

  const updateAnswer = (questionId: string, value: Answer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
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
        {questions.map((question, index) => {
          const selectedValue = answers[question.id];
          return (
            <section key={question.id} className="rounded-lg border bg-white p-4">
              <h3 className="mb-3 text-sm font-medium">
                {index + 1}. {question.text}
              </h3>
              <div className="flex flex-wrap gap-2">
                {ANSWER_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={selectedValue === option.value ? "default" : "outline"}
                    onClick={() => updateAnswer(question.id, option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </section>
          );
        })}
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
