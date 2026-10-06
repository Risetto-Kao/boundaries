"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { LoadingSpinner } from "@/components/loading-indicator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const MAX_QUESTIONS = 20;
const FIXED_OPTIONS = ["Yes", "No", "Depends"] as const;

interface CreateSurveyResult {
  surveyId: string;
  fillUrl: string;
  resultUrl: string;
}

interface CreateSurveyError {
  error: string;
}

export function CreateSurveyForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [createResult, setCreateResult] = useState<CreateSurveyResult | null>(null);

  const questionCount = questions.length;
  const hasReachedQuestionLimit = questionCount >= MAX_QUESTIONS;
  const isFormValid = useMemo(() => {
    if (!title.trim()) {
      return false;
    }

    return questions.every((question) => question.trim().length > 0);
  }, [title, questions]);

  const updateQuestion = (index: number, nextValue: string) => {
    setQuestions((prev) => prev.map((question, i) => (i === index ? nextValue : question)));
  };

  const addQuestion = () => {
    if (hasReachedQuestionLimit) {
      return;
    }

    setQuestions((prev) => [...prev, ""]);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setErrorMessage("");
    setCreateResult(null);

    if (!title.trim()) {
      setErrorMessage("標題不可空白");
      return;
    }

    const trimmedQuestions = questions.map((question) => question.trim());
    if (trimmedQuestions.some((question) => question.length === 0)) {
      setErrorMessage("每個問題都要有內容");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/surveys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          questions: trimmedQuestions,
        }),
      });

      const payload = (await response.json()) as CreateSurveyResult | CreateSurveyError;

      if (!response.ok) {
        const message = "error" in payload ? payload.error : "建立問卷失敗，請稍後重試";
        setErrorMessage(message);
        return;
      }

      if ("error" in payload) {
        setErrorMessage(payload.error);
        return;
      }

      setCreateResult(payload);
      setTitle("");
      setDescription("");
      setQuestions([""]);
    } catch {
      setErrorMessage("建立問卷失敗，請稍後重試");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">建立問卷</CardTitle>
          <CardDescription>
            輸入標題、描述與 1~20 題問題。答案值固定 Yes / No / Depends，填寫時以手勢作答。
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="flex flex-col gap-6" onSubmit={handleSubmit} aria-busy={isSubmitting}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="survey-title">
                標題
              </label>
              <Input
                id="survey-title"
                placeholder="例如：旅遊絕交問卷"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={200}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="survey-description">
                描述（可選）
              </label>
              <Textarea
                id="survey-description"
                placeholder="補充這份問卷的背景說明"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={1000}
              />
            </div>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium">問題列表（{questionCount}/20）</h2>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addQuestion}
                  disabled={hasReachedQuestionLimit}
                >
                  新增問題
                </Button>
              </div>

              <div className="space-y-3">
                {questions.map((question, index) => (
                  <div key={`question-${index}`} className="rounded-lg border bg-white p-3">
                    <label className="mb-2 block text-sm font-medium" htmlFor={`question-${index}`}>
                      問題 {index + 1}
                    </label>
                    <Input
                      id={`question-${index}`}
                      value={question}
                      placeholder={`輸入第 ${index + 1} 題`}
                      onChange={(event) => updateQuestion(index, event.target.value)}
                      required
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      固定答案值：{FIXED_OPTIONS.join(" / ")}（填寫以手勢選擇）
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

            <Button type="submit" disabled={!isFormValid || isSubmitting}>
              {isSubmitting && <LoadingSpinner />}
              {isSubmitting ? "建立中..." : "建立問卷"}
            </Button>
            {isSubmitting && <p role="status" className="text-sm text-slate-600">正在建立問卷，請稍候…</p>}
          </form>
        </CardContent>
      </Card>

      {createResult ? (
        <Card>
          <CardHeader>
            <CardTitle>建立成功</CardTitle>
            <CardDescription>已產生唯一問卷 ID：{createResult.surveyId}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              填寫頁：
              <Link className="ml-1 text-blue-700 underline" href={createResult.fillUrl}>
                {createResult.fillUrl}
              </Link>
            </p>
            <p>
              結果頁：
              <Link className="ml-1 text-blue-700 underline" href={createResult.resultUrl}>
                {createResult.resultUrl}
              </Link>
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
