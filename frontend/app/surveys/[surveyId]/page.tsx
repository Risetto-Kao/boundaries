import Link from "next/link";
import { notFound } from "next/navigation";

import { CopyLinkButton } from "@/components/copy-link-button";
import { SurveyResponseForm } from "@/components/survey-response-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSurveyById } from "@/lib/surveys";
import { surveyIdSchema } from "@/lib/validations";

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
            <CardDescription>{survey.description ?? "請根據你的習慣誠實作答。"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <CopyLinkButton label="複製問卷連結" />
              <CopyLinkButton label="複製結果連結" path={`/surveys/${survey.id}/results`} />
              <Link className="inline-flex items-center text-sm text-blue-700 underline" href={`/surveys/${survey.id}/results`}>
                查看目前結果
              </Link>
            </div>

            <SurveyResponseForm
              surveyId={survey.id}
              questions={survey.questions.map((question) => ({
                id: question.id,
                text: question.text,
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
