import { getI18n } from "@/lib/i18n/server";
import { formatDate } from "@/lib/i18n/config";
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

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ createdPage?: string; filledPage?: string }> }) {
  const { t, locale } = await getI18n();
  let user;
  try { user = await getCurrentUser(); } catch {
    return <main className="mx-auto max-w-4xl space-y-4 px-5 py-12"><h1 className="text-2xl font-semibold">{t("sessionUnavailable")}</h1><Link href="/login?next=/account" className="text-blue-700 underline">{t("loginAgain")}</Link></main>;
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
      <div><h1 className="text-3xl font-semibold">{t("myForms")}</h1><p className="mt-3 leading-7 text-slate-600">{t("myFormsDescription")}</p><Link href="/create" className="mt-4 inline-block rounded-lg bg-blue-700 px-5 py-3 text-white">{t("newForm")}</Link></div>
      {!history ? <div role="alert" className="rounded-xl border bg-white p-6"><p>{t("historyUnavailable")}</p><Link href={href(createdPage, filledPage)} className="mt-3 inline-block text-blue-700 underline">{t("reloadHistory")}</Link></div> : <>
        <section aria-labelledby="created-heading" className="space-y-4">
          <h2 id="created-heading" className="text-xl font-semibold">{t("createdForms")}</h2>
          {history[0].length === 0 && <p className="rounded-xl border bg-white p-6 text-slate-600">{t("noCreatedHistory")}</p>}
          {history[0].slice(0, pageSize).map((survey) => <article key={survey.id} className="space-y-3 rounded-xl border bg-white p-5">
            <h3 className="break-words font-semibold">{survey.title}</h3><p className="text-sm text-slate-500">{formatDate(locale, survey.createdAt, true)} · {t("responseCount", { count: survey._count.responses })}</p>
            <div className="flex gap-4 text-blue-700"><Link className="underline" href={`/surveys/${survey.id}`}>{t("openShare")}</Link><Link className="underline" href={`/surveys/${survey.id}/results`}>{t("viewResults")}</Link></div>
          </article>)}
          <nav aria-label={t("createdPagination")} className="flex gap-5 text-blue-700">{createdPage > 1 && <Link href={href(createdPage - 1, filledPage)}>{t("previousPage")}</Link>}{history[0].length > pageSize && <Link href={href(createdPage + 1, filledPage)}>{t("nextPage")}</Link>}</nav>
        </section>
        <section aria-labelledby="filled-heading" className="space-y-4">
          <h2 id="filled-heading" className="text-xl font-semibold">{t("filledForms")}</h2>
          {history[1].length === 0 && <p className="rounded-xl border bg-white p-6 text-slate-600">{t("noFilledHistory")}</p>}
          {history[1].slice(0, pageSize).map((response) => <article key={response.id} className="space-y-3 rounded-xl border bg-white p-5">
            <h3 className="break-words font-semibold">{response.survey.title}</h3><p className="break-words text-sm text-slate-500">{formatDate(locale, response.submittedAt, true)} · {t("nicknameValue", { name: response.nickname })}</p>
            <Link className="text-blue-700 underline" href={`/surveys/${response.survey.id}/results`}>{t("groupResults")}</Link>
            <details><summary className="cursor-pointer py-2 text-sm font-medium">{t("myAnswers")}</summary><dl className="space-y-3 border-t pt-3">{response.answers.map((answer) => <div key={answer.id}><dt className="break-words text-sm text-slate-600">{answer.question.text}</dt><dd className="mt-1 font-medium">{(["yes", "no", "depends"] as const).find((value) => value === answer.value) ? t(answer.value as "yes" | "no" | "depends") : answer.value}</dd></div>)}</dl></details>
          </article>)}
          <nav aria-label={t("filledPagination")} className="flex gap-5 text-blue-700">{filledPage > 1 && <Link href={href(createdPage, filledPage - 1)}>{t("previousPage")}</Link>}{history[1].length > pageSize && <Link href={href(createdPage, filledPage + 1)}>{t("nextPage")}</Link>}</nav>
        </section>
      </>}
    </div>
  </main>;
}
