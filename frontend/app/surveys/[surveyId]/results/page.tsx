import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSurveyById } from "@/lib/surveys";
import { surveyIdSchema } from "@/lib/validations";

export default async function SurveyResultPage({
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
      <div className="mx-auto w-full max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>{survey.title} - 結果頁</CardTitle>
            <CardDescription>EPIC 3（矩陣結果）即將接續開發。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>目前已可建立問卷，下一步會完成匿名填寫與矩陣顯示。</p>
            <Link className="text-blue-700 underline" href={`/surveys/${survey.id}`}>
              返回填寫頁
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
