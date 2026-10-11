import { Prisma } from "@prisma/client";

type QuestionInput = { id?: string; text: string };

export async function updateSurveyQuestions(tx: Prisma.TransactionClient, surveyId: string, questions: QuestionInput[]) {
  const retained = questions.flatMap((question, index) => question.id ? [{ id: question.id, text: question.text, orderIndex: index + 1 }] : []);
  await tx.question.deleteMany({ where: { surveyId, id: { notIn: retained.map(question => question.id) } } });

  if (retained.length) {
    // Stage all retained IDs in one query so swaps cannot collide with the unique order index.
    const staged = Prisma.join(retained.map(question => Prisma.sql`(${question.id}::text, ${-question.orderIndex}::integer)`));
    await tx.$executeRaw`
      UPDATE questions AS question SET order_index = staged.order_index
      FROM (VALUES ${staged}) AS staged(id, order_index)
      WHERE question.id = staged.id AND question.survey_id = ${surveyId}
    `;
    const updated = Prisma.join(retained.map(question => Prisma.sql`(${question.id}::text, ${question.text}::text, ${question.orderIndex}::integer)`));
    await tx.$executeRaw`
      UPDATE questions AS question SET text = updated.text, order_index = updated.order_index
      FROM (VALUES ${updated}) AS updated(id, text, order_index)
      WHERE question.id = updated.id AND question.survey_id = ${surveyId}
    `;
  }

  const added = questions.flatMap((question, index) => question.id ? [] : [{ surveyId, text: question.text, orderIndex: index + 1 }]);
  if (added.length) await tx.question.createMany({ data: added });
}
