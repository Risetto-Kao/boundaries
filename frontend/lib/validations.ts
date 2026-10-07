import { z } from "zod";
import { createTranslator, defaultLocale, type Locale } from "./i18n/config";

// Construct per-request schemas; never mutate Zod's global locale across users.
export function createValidationSchemas(locale: Locale = defaultLocale) {
  const t = createTranslator(locale);
  const surveyIdSchema = z.string({ error: t("invalidSurveyId") }).uuid(t("invalidSurveyId"));
  const nicknameSchema = z.string({ error: t("nicknameRequired") }).trim()
    .min(1, t("nicknameRequired")).max(50, t("nicknameLong"));
  const answerValueSchema = z.enum(["yes", "no", "depends"], { error: t("invalidInput") });
  const createSurveySchema = z.object({
    title: z.string({ error: t("titleRequired") }).trim().min(1, t("titleRequired")).max(200, t("titleLong")),
    description: z.string({ error: t("invalidInput") }).trim().max(1000, t("descriptionLong")).optional(),
    questions: z.array(z.string({ error: t("questionRequired") }).trim().min(1, t("questionRequired")), { error: t("questionsRequired") })
      .min(1, t("questionsRequired")).max(20, t("questionsLimit")),
  }, { error: t("invalidInput") });
  const submitResponseSchema = z.object({
    surveyId: surveyIdSchema,
    nickname: nicknameSchema,
    answers: z.array(z.object({
      questionId: z.string({ error: t("invalidQuestionId") }).uuid(t("invalidQuestionId")),
      value: answerValueSchema,
    }, { error: t("invalidInput") }), { error: t("answersRequired") }).min(1, t("answersRequired")),
  }, { error: t("invalidInput") });
  return { surveyIdSchema, nicknameSchema, answerValueSchema, createSurveySchema, submitResponseSchema };
}

export const { surveyIdSchema, nicknameSchema, answerValueSchema, createSurveySchema, submitResponseSchema } = createValidationSchemas();
export type CreateSurveyInput = z.infer<typeof createSurveySchema>;
export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;
