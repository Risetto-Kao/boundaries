import { getI18n } from "@/lib/i18n/server";
import { formatDate } from "@/lib/i18n/config";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { AnswerBadge } from "@/components/answer-badge";
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
    return <main className="page-shell space-y-4"><h1 className="page-heading">{t("sessionUnavailable")}</h1><Link href="/login?next=/account" className="text-action">{t("loginAgain")}</Link></main>;
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
  return <main className="page-shell">
    <div className="min-w-0 space-y-8">
      <div><h1 className="page-heading">{t("myForms")}</h1><p className="page-description">{t("myFormsDescription")}</p><Link href="/create" className={buttonVariants({ className: "mt-5" })}>{t("newForm")}</Link></div>
      {!history ? <div role="alert" className="feedback"><p>{t("historyUnavailable")}</p><Link href={href(createdPage, filledPage)} className="text-action mt-3">{t("reloadHistory")}</Link></div> : <>
        <section aria-labelledby="created-heading" className="space-y-4">
          <h2 id="created-heading" className="text-xl font-semibold">{t("createdForms")}</h2>
          {history[0].length === 0 && <p className="feedback text-muted-foreground">{t("noCreatedHistory")}</p>}
          {history[0].slice(0, pageSize).map((survey) => <article key={survey.id} className="history-row space-y-3">
            <h3 className="break-words font-semibold">{survey.title}</h3><p className="text-sm text-muted-foreground">{formatDate(locale, survey.createdAt, true)} · {t("responseCount", { count: survey._count.responses })}</p>
            <div className="flex flex-wrap gap-4"><Link className="text-action" href={`/surveys/${survey.id}`}>{t("openShare")}</Link><Link className="text-action" href={`/surveys/${survey.id}/results`}>{t("viewResults")}</Link></div>
          </article>)}
          <nav aria-label={t("createdPagination")} className="flex flex-wrap gap-3">{createdPage > 1 && <Link className={buttonVariants({ variant: "outline" })} href={href(createdPage - 1, filledPage)}>{t("previousPage")}</Link>}{history[0].length > pageSize && <Link className={buttonVariants({ variant: "outline" })} href={href(createdPage + 1, filledPage)}>{t("nextPage")}</Link>}</nav>
        </section>
        <section aria-labelledby="filled-heading" className="space-y-4">
          <h2 id="filled-heading" className="text-xl font-semibold">{t("filledForms")}</h2>
          {history[1].length === 0 && <p className="feedback text-muted-foreground">{t("noFilledHistory")}</p>}
          {history[1].slice(0, pageSize).map((response) => <article key={response.id} className="history-row space-y-3">
            <h3 className="break-words font-semibold">{response.survey.title}</h3><p className="break-words text-sm text-muted-foreground">{formatDate(locale, response.submittedAt, true)} · {t("nicknameValue", { name: response.nickname })}</p>
            <Link className="text-action" href={`/surveys/${response.survey.id}/results`}>{t("groupResults")}</Link>
            <details><summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-brand">{t("myAnswers")}</summary><dl className="space-y-3 border-t pt-3">{response.answers.map((answer) => <div key={answer.id}><dt className="break-words text-sm text-muted-foreground">{answer.question.text}</dt><dd className="mt-1 font-medium">{(["yes", "no", "depends"] as const).find((value) => value === answer.value) ? <AnswerBadge answer={answer.value as "yes" | "no" | "depends"} label={t(answer.value as "yes" | "no" | "depends")} /> : answer.value}</dd></div>)}</dl></details>
          </article>)}
          <nav aria-label={t("filledPagination")} className="flex flex-wrap gap-3">{filledPage > 1 && <Link className={buttonVariants({ variant: "outline" })} href={href(createdPage, filledPage - 1)}>{t("previousPage")}</Link>}{history[1].length > pageSize && <Link className={buttonVariants({ variant: "outline" })} href={href(createdPage, filledPage + 1)}>{t("nextPage")}</Link>}</nav>
        </section>
      </>}
    </div>
  </main>;
}
