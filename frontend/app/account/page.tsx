import Link from "next/link";
import { redirect } from "next/navigation";
import { getI18n } from "@/lib/i18n/server";
import { formatDate } from "@/lib/i18n/config";
import { getCurrentUser } from "@/lib/auth/user";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
export const dynamic = "force-dynamic";
const pageSize = 20;
function pageNumber(value?: string) { const parsed = Number(value); return Number.isSafeInteger(parsed) && parsed > 0 ? Math.min(parsed, 10000) : 1; }
export default async function AccountPage({ searchParams }: { searchParams: Promise<{ templatesPage?: string; formsPage?: string; filledPage?: string }> }) {
  const { t, locale } = await getI18n(); let user;
  try { user = await getCurrentUser(); } catch { return <main className="page-shell space-y-4"><h1 className="page-heading">{t("sessionUnavailable")}</h1><Link href="/login?next=/account" className="text-action">{t("loginAgain")}</Link></main>; }
  if (!user) redirect("/login?next=/account");
  const params = await searchParams; const pages = [pageNumber(params.templatesPage), pageNumber(params.formsPage), pageNumber(params.filledPage)];
  const history = await Promise.all([
    prisma.template.findMany({ where: { ownerId: user.id, ownerType: "USER", deletedAt: null }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (pages[0] - 1) * pageSize, take: pageSize + 1, select: { id: true, title: true, createdAt: true } }),
    prisma.fillableForm.findMany({ where: { ownerId: user.id }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (pages[1] - 1) * pageSize, take: pageSize + 1, select: { id: true, title: true, createdAt: true, _count: { select: { submissions: true } } } }),
    // No guest adoption and no answer prefetch. Result routes recheck qualifications.
    prisma.submission.findMany({ where: { userId: user.id }, orderBy: [{ submittedAt: "desc" }, { id: "desc" }], skip: (pages[2] - 1) * pageSize, take: pageSize + 1, select: { id: true, nickname: true, submittedAt: true, form: { select: { id: true, title: true } } } }),
  ]).catch(() => null);
  const href = (index: number, page: number) => { const next = [...pages]; next[index] = page; return `/account?templatesPage=${next[0]}&formsPage=${next[1]}&filledPage=${next[2]}`; };
  const pagination = (index: number, hasNext: boolean) => <nav aria-label={t(index === 2 ? "filledPagination" : "createdPagination")} className="flex gap-3">{pages[index] > 1 && <Link href={href(index, pages[index] - 1)} className={buttonVariants({ variant: "outline" })}>{t("previousPage")}</Link>}{hasNext && <Link href={href(index, pages[index] + 1)} className={buttonVariants({ variant: "outline" })}>{t("nextPage")}</Link>}</nav>;
  return <main className="page-shell space-y-8"><div><h1 className="page-heading">{t("myForms")}</h1><Link href="/create" className={buttonVariants({ className: "mt-5" })}>{t("newTemplate")}</Link></div>{!history ? <p role="alert" className="feedback">{t("historyUnavailable")}</p> : <>
    <section className="space-y-4"><h2 className="text-xl font-extrabold">{t("myTemplates")}</h2>{!history[0].length && <p>{t("noForms")}</p>}{history[0].slice(0, pageSize).map(row => <article className="history-row space-y-3" key={row.id}><h3 className="font-bold">{row.title}</h3><p className="text-sm text-muted-foreground">{formatDate(locale, row.createdAt, true)}</p><div className="flex gap-4"><Link href={`/templates/${row.id}`} className="text-action">{t("viewTemplate")}</Link><Link href={`/templates/${row.id}/edit`} className="text-action">{t("editTemplate")}</Link></div></article>)}{pagination(0, history[0].length > pageSize)}</section>
    <section className="space-y-4"><h2 className="text-xl font-extrabold">{t("myFillableForms")}</h2>{!history[1].length && <p>{t("noForms")}</p>}{history[1].slice(0, pageSize).map(row => <article className="history-row space-y-3" key={row.id}><h3 className="font-bold">{row.title}</h3><p className="text-sm text-muted-foreground">{formatDate(locale, row.createdAt, true)} · {t("responseCount", { count: row._count.submissions })}</p><Link prefetch={false} href={`/forms/${row.id}/manage`} className="text-action">{t("manageForm")}</Link></article>)}{pagination(1, history[1].length > pageSize)}</section>
    <section className="space-y-4"><h2 className="text-xl font-extrabold">{t("filledForms")}</h2>{!history[2].length && <p>{t("noFilledHistory")}</p>}{history[2].slice(0, pageSize).map(row => <article className="history-row space-y-3" key={row.id}><h3 className="font-bold">{row.form.title}</h3><p className="text-sm text-muted-foreground">{formatDate(locale, row.submittedAt, true)} · {t("nicknameValue", { name: row.nickname })}</p><Link prefetch={false} href={`/forms/${row.form.id}/results`} className="text-action">{t("viewResults")}</Link></article>)}{pagination(2, history[2].length > pageSize)}</section>
  </>}</main>;
}
