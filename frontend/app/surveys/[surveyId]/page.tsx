import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSurveyById } from "@/lib/surveys";
import { surveyIdSchema } from "@/lib/validations";

const FIXED_OPTIONS = ["Yes", "No", "Depends"];

export default async function SurveyPage({
  params,
}: {
  params: Promise<{
    surveyId: string;
  }>;
}) {
  const { surveyId } = await params;
  const parsedSurveyId = surveyIdSchema.safeParse(surveyId);

  if (!parsedSurveyId.success) {
    notFound();
  }

  const survey = await getSurveyById(parsedSurveyId.data);
  if (!survey) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{survey.title}</CardTitle>
            <CardDescription>{survey.description ?? "這份問卷沒有描述。"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              EPIC 2（填寫流程）開發中，目前先完成問卷建立功能。固定答案選項：{FIXED_OPTIONS.join(
                " / ",
              )}
            </p>
            <ol className="list-inside list-decimal space-y-2 text-sm">
              {survey.questions.map((question) => (
                <li key={question.id}>{question.text}</li>
              ))}
            </ol>
            <Link className="text-sm text-blue-700 underline" href={`/surveys/${survey.id}/results`}>
              前往結果頁（EPIC 3）
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
