import Link from "next/link";
import { notFound } from "next/navigation";

import { CopyLinkButton } from "@/components/copy-link-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ANSWER_LABEL, ANSWER_STYLE } from "@/lib/answer-meta";
import { getSurveyMatrixData } from "@/lib/surveys";
import { surveyIdSchema } from "@/lib/validations";
import type { Answer } from "@/types/survey";

export const revalidate = 0;

function renderAnswerCell(answer: Answer | undefined) {
  if (!answer) {
    return <span className="text-slate-400">-</span>;
  }

  return (
    <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${ANSWER_STYLE[answer]}`}>
      {ANSWER_LABEL[answer]}
    </span>
  );
}

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

  const matrix = await getSurveyMatrixData(parsedSurveyId.data);
  if (!matrix) {
    notFound();
  }

  const fillPath = `/surveys/${matrix.survey.id}`;

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto w-full max-w-6xl">
        <Card>
          <CardHeader>
            <CardTitle>{matrix.survey.title} - 結果矩陣</CardTitle>
            <CardDescription>
              {matrix.survey.description ?? "查看所有人的答案差異。重新整理頁面即可取得最新資料。"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2">
              <CopyLinkButton label="複製結果連結" />
              <CopyLinkButton label="複製問卷連結" path={fillPath} />
              <Link className="inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-white" href={fillPath}>
                邀請朋友填寫
              </Link>
            </div>

            <p className="text-slate-600">
              共 {matrix.participants.length} 人填寫，{matrix.questions.length} 題。
            </p>

            {matrix.participants.length === 0 ? (
              <p className="rounded-md border border-dashed p-4 text-slate-600">
                還沒有人提交答案，先把問卷分享出去吧。
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-64">問題 / 人員</TableHead>
                    {matrix.participants.map((participant) => (
                      <TableHead key={participant.id}>{participant.nickname}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matrix.questions.map((question, index) => (
                    <TableRow key={question.id}>
                      <TableCell className="align-top">
                        <div className="font-medium">Q{index + 1}</div>
                        <div className="text-slate-700">{question.text}</div>
                      </TableCell>
                      {matrix.participants.map((participant) => (
                        <TableCell key={`${question.id}-${participant.id}`}>
                          {renderAnswerCell(matrix.answers[participant.id]?.[question.id])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
