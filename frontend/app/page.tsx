import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getRecentSurveys } from "@/lib/surveys";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const surveys = await getRecentSurveys(8);

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Boundaries</CardTitle>
            <CardDescription>社交化問卷工具：快速建立、匿名填寫、矩陣查看群體差異。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm text-white" href="/create">
              建立問卷
            </Link>
            <Link className="inline-flex items-center rounded-md border bg-white px-4 py-2 text-sm" href="/surveys">
              現有問卷
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>近期問卷</CardTitle>
            <CardDescription>你可以直接進入填寫頁或結果頁。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {surveys.length === 0 ? (
              <p className="text-sm text-slate-600">目前還沒有問卷，先建立第一份吧。</p>
            ) : (
              surveys.map((survey) => (
                <div key={survey.id} className="rounded-md border bg-white p-3">
                  <p className="font-medium">{survey.title}</p>
                  <p className="text-sm text-slate-600">
                    填寫數：{survey._count.responses} 人
                  </p>
                  <div className="mt-2 flex gap-3 text-sm">
                    <Link className="text-blue-700 underline" href={`/surveys/${survey.id}`}>
                      前往填寫
                    </Link>
                    <Link className="text-blue-700 underline" href={`/surveys/${survey.id}/results`}>
                      查看結果
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
