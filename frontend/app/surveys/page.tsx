import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllSurveys } from "@/lib/surveys";

export const dynamic = "force-dynamic";

export default async function SurveyListPage() {
  const surveys = await getAllSurveys();

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>現有問卷</CardTitle>
            <CardDescription>瀏覽目前所有問卷，直接進入填寫或結果頁。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {surveys.length === 0 ? (
              <p className="text-sm text-slate-600">
                還沒有問卷。先到
                <Link className="mx-1 text-blue-700 underline" href="/create">
                  建立問卷
                </Link>
                新增第一份。
              </p>
            ) : (
              surveys.map((survey) => (
                <div key={survey.id} className="rounded-md border bg-white p-4">
                  <p className="font-medium">{survey.title}</p>
                  <p className="text-sm text-slate-600">
                    {survey.description || "無描述"} | 填寫數：{survey._count.responses}
                  </p>
                  <div className="mt-2 flex gap-3 text-sm">
                    <Link className="text-blue-700 underline" href={`/surveys/${survey.id}`}>
                      填寫頁
                    </Link>
                    <Link className="text-blue-700 underline" href={`/surveys/${survey.id}/results`}>
                      結果頁
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
