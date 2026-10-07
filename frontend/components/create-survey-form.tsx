"use client";

import { useI18n } from "@/components/i18n-provider";
import { useMemo, useState } from "react";
import Link from "next/link";

import { LoadingSpinner } from "@/components/loading-indicator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const MAX_QUESTIONS = 20;


interface CreateSurveyResult {
  surveyId: string;
  fillUrl: string;
  resultUrl: string;
}

interface CreateSurveyError {
  error: string;
}

export function CreateSurveyForm() {
  const { t, locale } = useI18n();
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
      setErrorMessage(t("titleRequired"));
      return;
    }

    const trimmedQuestions = questions.map((question) => question.trim());
    if (trimmedQuestions.some((question) => question.length === 0)) {
      setErrorMessage(t("questionRequired"));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/surveys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Boundaries-Locale": locale,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          questions: trimmedQuestions,
        }),
      });

      const payload = (await response.json()) as CreateSurveyResult | CreateSurveyError;

      if (!response.ok) {
        const message = "error" in payload ? payload.error : t("createFailed");
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
      setErrorMessage(t("createFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{t("createSurvey")}</CardTitle>
          <CardDescription>
            {t("createDescription")}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="flex flex-col gap-6" onSubmit={handleSubmit} aria-busy={isSubmitting}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="survey-title">
                {t("title")}
              </label>
              <Input
                id="survey-title"
                placeholder={t("titlePlaceholder")}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={200}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="survey-description">
                {t("description")}
              </label>
              <Textarea
                id="survey-description"
                placeholder={t("descriptionPlaceholder")}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={1000}
              />
            </div>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium">{t("questionList", { count: questionCount })}</h2>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addQuestion}
                  disabled={hasReachedQuestionLimit}
                >
                  {t("addQuestion")}
                </Button>
              </div>

              <div className="space-y-3">
                {questions.map((question, index) => (
                  <div key={`question-${index}`} className="rounded-lg border bg-white p-3">
                    <label className="mb-2 block text-sm font-medium" htmlFor={`question-${index}`}>
                      {t("questionNumber", { count: index + 1 })}
                    </label>
                    <Input
                      id={`question-${index}`}
                      value={question}
                      placeholder={t("questionPlaceholder", { count: index + 1 })}
                      onChange={(event) => updateQuestion(index, event.target.value)}
                      required
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      {t("fixedAnswers", { options: [t("yes"), t("no"), t("depends")].join(" / ") })}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

            <Button type="submit" disabled={!isFormValid || isSubmitting}>
              {isSubmitting && <LoadingSpinner />}
              {isSubmitting ? t("creating") : t("createSurvey")}
            </Button>
            {isSubmitting && <p role="status" className="text-sm text-slate-600">{t("creatingStatus")}</p>}
          </form>
        </CardContent>
      </Card>

      {createResult ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("created")}</CardTitle>
            <CardDescription>{t("surveyId", { id: createResult.surveyId })}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              {t("fillPage")}:
              <Link className="ml-1 text-blue-700 underline" href={createResult.fillUrl}>
                {createResult.fillUrl}
              </Link>
            </p>
            <p>
              {t("resultPage")}:
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
