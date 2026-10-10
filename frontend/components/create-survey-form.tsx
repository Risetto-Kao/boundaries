"use client";

import { useI18n } from "@/components/i18n-provider";
import { useMemo, useState } from "react";
import Link from "next/link";

import { LoadingSpinner } from "@/components/loading-indicator";
import { Button } from "@/components/ui/button";
import { Check, Plus, ArrowRight } from "lucide-react";
import { CopyLinkButton } from "@/components/copy-link-button";
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
    requestAnimationFrame(() => document.getElementById(`question-${questionCount}`)?.focus());
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
    <div className="space-y-8">
      <header>
        <h1 className="page-heading">{t("newForm")}</h1>
        <p className="page-description">{t("createDescription")}</p>
      </header>
      <form className="space-y-8" onSubmit={handleSubmit} aria-busy={isSubmitting}>
        <fieldset disabled={isSubmitting} className="min-w-0 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold" htmlFor="survey-title">{t("title")}</label>
            <Input id="survey-title" placeholder={t("titlePlaceholder")} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} required
              aria-invalid={!!errorMessage && !title.trim()} aria-describedby={errorMessage && !title.trim() ? "create-error" : undefined} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold" htmlFor="survey-description">{t("description")}</label>
            <Textarea id="survey-description" placeholder={t("descriptionPlaceholder")} value={description} onChange={(event) => setDescription(event.target.value)} maxLength={1000} />
          </div>
          <section className="page-section space-y-5" aria-labelledby="questions-heading">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="questions-heading" className="text-xl font-bold">{t("questionList", { count: questionCount })}</h2>
              <Button type="button" variant="outline" onClick={addQuestion} disabled={hasReachedQuestionLimit}><Plus aria-hidden="true" />{t("addQuestion")}</Button>
            </div>
            <p className="text-sm text-muted-foreground">{t("fixedAnswers", { options: [t("yes"), t("no"), t("depends")].join(" / ") })}</p>
            <div className="space-y-5">
              {questions.map((question, index) => (
                <div key={`question-${index}`} className="grid min-w-0 grid-cols-[28px_minmax(0,1fr)] gap-3">
                  <span aria-hidden="true" className="pt-8 text-sm font-bold text-brand">{String(index + 1).padStart(2, "0")}</span>
                  <div className="min-w-0 space-y-2">
                    <label className="block text-sm font-semibold" htmlFor={`question-${index}`}>{t("questionNumber", { count: index + 1 })}</label>
                    <Textarea id={`question-${index}`} value={question} placeholder={t("questionPlaceholder", { count: index + 1 })} onChange={(event) => updateQuestion(index, event.target.value)} required className="min-h-20"
                      aria-invalid={!!errorMessage && !question.trim()} aria-describedby={errorMessage && !question.trim() ? "create-error" : undefined} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </fieldset>
        {errorMessage && <div id="create-error" role="alert" className="feedback feedback-error"><p>{errorMessage}</p>{!title.trim() ? <a href="#survey-title" className="text-action text-destructive">{t("title")}</a> : questions.some(q => !q.trim()) && <a href={`#question-${questions.findIndex(q => !q.trim())}`} className="text-action text-destructive">{t("questionNumber", { count: questions.findIndex(q => !q.trim()) + 1 })}</a>}</div>}
        <div className="page-section">
          <Button type="submit" disabled={!isFormValid || isSubmitting} className="w-full sm:w-auto" size="lg">{isSubmitting ? <LoadingSpinner /> : <ArrowRight aria-hidden="true" />}{isSubmitting ? t("creating") : t("createSurvey")}</Button>
          {isSubmitting && <p role="status" className="mt-3 text-sm text-muted-foreground">{t("creatingStatus")}</p>}
        </div>
      </form>
      {createResult && <section role="status" className="feedback feedback-success space-y-4">
        <h2 className="flex items-center gap-2 text-xl font-bold"><Check size={24} aria-hidden="true" />{t("created")}</h2>
        <div className="flex flex-wrap gap-3">
          <CopyLinkButton label={t("copySurvey")} path={createResult.fillUrl} />
          <CopyLinkButton label={t("copyResults")} path={createResult.resultUrl} />
        </div>
        <div className="flex flex-wrap gap-5"><Link href={createResult.fillUrl} className="text-action">{t("openForm")}</Link><Link href={createResult.resultUrl} className="text-action">{t("viewResults")}</Link></div>
      </section>}
    </div>
  );
}
