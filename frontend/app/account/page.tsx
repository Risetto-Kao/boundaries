import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/user";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const pageSize = 20;
function pageNumber(value?: string) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? Math.min(parsed, 10000) : 1;
}
function date(value: Date) {
  return new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", dateStyle: "medium", timeStyle: "short" }).format(value);
}

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ createdPage?: string; filledPage?: string }> }) {
  let user;
  try { user = await getCurrentUser(); } catch {
    return <main className="mx-auto max-w-4xl space-y-4 px-5 py-12"><h1 className="text-2xl font-semibold">暫時無法確認登入狀態</h1><Link href="/login?next=/account" className="text-blue-700 underline">重新登入</Link></main>;
  }
  if (!user) redirect("/login?next=/account");
  const params = await searchParams;
  const createdPage = pageNumber(params.createdPage);
  const filledPage = pageNumber(params.filledPage);
  const history = await Promise.all([
    prisma.survey.findMany({
      where: { ownerId: user.id }, orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (createdPage - 1) * pageSize, take: pageSize + 1,
      select: { id: true, title: true, createdAt: true, _count: { select: { responses: true } } },
    }),
    prisma.response.findMany({
      where: { userId: user.id }, orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
      skip: (filledPage - 1) * pageSize, take: pageSize + 1,
      select: { id: true, nickname: true, submittedAt: true, survey: { select: { id: true, title: true } },
        answers: { orderBy: { question: { orderIndex: "asc" } }, select: { id: true, value: true, question: { select: { text: true } } } } },
    }),
  ]).catch(() => null);
  const href = (created: number, filled: number) => `/account?createdPage=${created}&filledPage=${filled}`;
  return <main className="min-h-screen bg-slate-50 px-5 py-10">
    <div className="mx-auto max-w-4xl space-y-8">
      <div><h1 className="text-3xl font-semibold">我的表單與填答</h1><p className="mt-3 leading-7 text-slate-600">在這裡找到你登入後建立的表單，以及送出過的答案。</p><Link href="/create" className="mt-4 inline-block rounded-lg bg-blue-700 px-5 py-3 text-white">新增表單</Link></div>
      {!history ? <div role="alert" className="rounded-xl border bg-white p-6"><p>暫時無法載入你的紀錄，請稍後重試。</p><Link href={href(createdPage, filledPage)} className="mt-3 inline-block text-blue-700 underline">重新載入紀錄</Link></div> : <>
        <section aria-labelledby="created-heading" className="space-y-4">
          <h2 id="created-heading" className="text-xl font-semibold">我建立的表單</h2>
          {history[0].length === 0 && <p className="rounded-xl border bg-white p-6 text-slate-600">這一頁尚無建立紀錄。訪客建立的表單不會自動加入帳號。</p>}
          {history[0].slice(0, pageSize).map((survey) => <article key={survey.id} className="space-y-3 rounded-xl border bg-white p-5">
            <h3 className="break-words font-semibold">{survey.title}</h3><p className="text-sm text-slate-500">{date(survey.createdAt)} · {survey._count.responses} 人填答</p>
            <div className="flex gap-4 text-blue-700"><Link className="underline" href={`/surveys/${survey.id}`}>開啟／分享表單</Link><Link className="underline" href={`/surveys/${survey.id}/results`}>查看結果</Link></div>
          </article>)}
          <nav aria-label="建立紀錄分頁" className="flex gap-5 text-blue-700">{createdPage > 1 && <Link href={href(createdPage - 1, filledPage)}>上一頁</Link>}{history[0].length > pageSize && <Link href={href(createdPage + 1, filledPage)}>下一頁</Link>}</nav>
        </section>
        <section aria-labelledby="filled-heading" className="space-y-4">
          <h2 id="filled-heading" className="text-xl font-semibold">我填寫的表單</h2>
          {history[1].length === 0 && <p className="rounded-xl border bg-white p-6 text-slate-600">這一頁尚無填答紀錄。登入後送出答案，就能在這裡找到。</p>}
          {history[1].slice(0, pageSize).map((response) => <article key={response.id} className="space-y-3 rounded-xl border bg-white p-5">
            <h3 className="break-words font-semibold">{response.survey.title}</h3><p className="break-words text-sm text-slate-500">{date(response.submittedAt)} · 暱稱：{response.nickname}</p>
            <Link className="text-blue-700 underline" href={`/surveys/${response.survey.id}/results`}>查看群體結果</Link>
            <details><summary className="cursor-pointer py-2 text-sm font-medium">查看我送出的答案</summary><dl className="space-y-3 border-t pt-3">{response.answers.map((answer) => <div key={answer.id}><dt className="break-words text-sm text-slate-600">{answer.question.text}</dt><dd className="mt-1 font-medium">{({ yes: "Yes", no: "No", depends: "看狀況" } as Record<string, string>)[answer.value] ?? answer.value}</dd></div>)}</dl></details>
          </article>)}
          <nav aria-label="填答紀錄分頁" className="flex gap-5 text-blue-700">{filledPage > 1 && <Link href={href(createdPage, filledPage - 1)}>上一頁</Link>}{history[1].length > pageSize && <Link href={href(createdPage, filledPage + 1)}>下一頁</Link>}</nav>
        </section>
      </>}
    </div>
  </main>;
}
