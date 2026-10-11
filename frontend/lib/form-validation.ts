import { z } from "zod";
import { createValidationSchemas } from "./validations";
import { createTranslator, defaultLocale, type Locale } from "./i18n/config";

export function formSchemas(locale: Locale = defaultLocale) {
  const { createSurveySchema, nicknameSchema, surveyIdSchema, answerValueSchema } = createValidationSchemas(locale);
  const t = createTranslator(locale);
  const revision = z.string().datetime();
  const invite = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
  const template = createSurveySchema.strict();
  const metadata = template.omit({ questions: true });
  return {
    id: surveyIdSchema, template, updateTemplate: template.extend({ updatedAt: revision }).strict(),
    invite: z.object({ invite }).strict(),
    submission: z.object({ nickname: nicknameSchema, requestKey: z.string().uuid(), invite: invite.optional(),
      answers: z.array(z.object({ questionId: surveyIdSchema, value: answerValueSchema }).strict()).min(1).max(20),
    }).strict(),
    management: z.discriminatedUnion("action", [
      metadata.extend({ action: z.literal("metadata"), updatedAt: revision }).strict(),
      ...(["close", "open", "reset", "delete"] as const).map(action => z.object({ action: z.literal(action), updatedAt: revision }).strict()),
      z.object({ action: z.literal("deleteSubmission"), updatedAt: revision, submissionId: surveyIdSchema }).strict(),
    ], { error: t("invalidInput") }),
  };
}
