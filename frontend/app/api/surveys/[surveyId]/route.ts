import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { AuthUnavailableError, getCurrentUser } from "@/lib/auth/user";
import { isAccountHistoryEnabled, isSameOrigin } from "@/lib/auth/config";
import { getRequestI18n } from "@/lib/i18n/server";
import { createValidationSchemas } from "@/lib/validations";

class MutationError extends Error { constructor(public status: number, message: string) { super(message); } }
async function mutate(request: Request, params: Promise<{ surveyId: string }>, deleting: boolean) {
  const { t, locale } = getRequestI18n(request);
  const { surveyIdSchema, createSurveySchema } = createValidationSchemas(locale);
  if (!isSameOrigin(request)) return NextResponse.json({ error: t("invalidOrigin") }, { status: 403 });
  const { surveyId } = await params;
  if (!surveyIdSchema.safeParse(surveyId).success) return NextResponse.json({ error: t("invalidSurveyId") }, { status: 400 });
  try {
    if (!isAccountHistoryEnabled()) throw new MutationError(403, t("editDenied"));
    const user = await getCurrentUser();
    if (!user) throw new MutationError(403, t("editDenied"));
    let input: { title: string; description?: string; updatedAt: string; questions: { id?: string; text: string }[] } | undefined;
    if (!deleting) {
      const questionSchema = z.object({ id: surveyIdSchema.optional(), text: z.string().trim().min(1, t("questionRequired")) });
      const schema = createSurveySchema.omit({ questions: true }).extend({
        updatedAt: z.iso.datetime(), questions: z.array(questionSchema).min(1, t("questionsRequired")).max(20, t("questionsLimit")),
      });
      const parsed = schema.safeParse(await request.json());
      if (!parsed.success) throw new MutationError(400, parsed.error.issues[0]?.message ?? t("invalidInput"));
      input = parsed.data;
    }
    const data = await prisma.$transaction(async tx => {
      // Serialize edits/deletes with submissions; ownership is checked inside the lock.
      await tx.$queryRaw`SELECT id FROM surveys WHERE id = ${surveyId} FOR UPDATE`;
      const survey = await tx.survey.findFirst({ where: { id: surveyId, ownerId: user.id }, select: { updatedAt: true, questions: { select: { id: true } } } });
      if (!survey) throw new MutationError(404, t("editDenied"));
      if (deleting) { await tx.survey.delete({ where: { id: surveyId } }); return { deleted: true }; }
      if (!input) throw new MutationError(400, t("invalidInput"));
      if (survey.updatedAt.toISOString() !== input.updatedAt) throw new MutationError(409, t("surveyChanged"));
      const existing = new Set(survey.questions.map(question => question.id));
      const retained = input.questions.flatMap(question => question.id ? [question.id] : []);
      if (new Set(retained).size !== retained.length || retained.some(id => !existing.has(id))) throw new MutationError(400, t("invalidInput"));
      await tx.question.deleteMany({ where: { surveyId, id: { notIn: retained } } });
      // Move retained rows out of the positive range before assigning new order indexes.
      for (let index = 0; index < retained.length; index++) await tx.question.update({ where: { id: retained[index] }, data: { orderIndex: -(index + 1) } });
      for (const [index, question] of input.questions.entries()) {
        if (question.id) await tx.question.update({ where: { id: question.id }, data: { text: question.text, orderIndex: index + 1 } });
        else await tx.question.create({ data: { surveyId, text: question.text, orderIndex: index + 1 } });
      }
      const updated = await tx.survey.update({ where: { id: surveyId }, data: { title: input.title, description: input.description || null }, select: { updatedAt: true, questions: { orderBy: { orderIndex: "asc" }, select: { id: true, text: true } } } });
      return updated;
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof MutationError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof SyntaxError) return NextResponse.json({ error: t("invalidInput") }, { status: 400 });
    if (error instanceof AuthUnavailableError) return NextResponse.json({ error: t("sessionRetry") }, { status: 503 });
    console.error("Survey mutation failed:", error);
    return NextResponse.json({ error: t(deleting ? "deleteFailed" : "saveFailed") }, { status: 500 });
  }
}
export async function PATCH(request: Request, { params }: { params: Promise<{ surveyId: string }> }) { return mutate(request, params, false); }
export async function DELETE(request: Request, { params }: { params: Promise<{ surveyId: string }> }) { return mutate(request, params, true); }
