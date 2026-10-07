"use client";

import { useI18n } from "@/components/i18n-provider";
import Link from "next/link";
import { formatDate } from "@/lib/i18n/config";
import { useState } from "react";
import { ClipboardList, FilePlus2, FileText, Plus, Search, Users } from "lucide-react";

type PortalSurvey = {
  id: string;
  title: string;
  description: string | null;
  responses: number;
  createdAt: string;
};
const actionStyle = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600";

export function FormPortal({ surveys, unavailable }: { surveys: PortalSurvey[]; unavailable: boolean }) {
  const { t, locale } = useI18n();
  const [query, setQuery] = useState("");
  const filtered = surveys.filter((survey) => `${survey.title} ${survey.description ?? ""}`.normalize("NFKC").toLocaleLowerCase(locale).includes(query.trim().normalize("NFKC").toLocaleLowerCase(locale)));
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-blue-600" aria-label={t("portalHome")}>
            <span className="rounded-lg bg-slate-900 p-2 text-white"><ClipboardList size={22} aria-hidden="true" /></span>
            <span className="text-xl font-semibold tracking-tight">Boundaries</span>
          </Link>
          <Link href="/create" className={`${actionStyle} bg-blue-700 text-white hover:bg-blue-800`}><Plus size={18} aria-hidden="true" />{t("newForm")}</Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12">
        <div className="mb-8">
          <p className="mb-3 text-sm font-medium tracking-widest text-blue-700">{t("workspace")}</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("portal")}</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">{t("portalDescription")}</p>
        </div>
        <div className="mb-12 grid gap-4 sm:grid-cols-2">
          <Link href="/create" className="flex gap-5 rounded-xl bg-slate-900 p-6 text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 sm:p-8">
            <FilePlus2 size={28} className="mt-1 shrink-0 text-blue-300" aria-hidden="true" />
            <div><h2 className="text-xl font-semibold">{t("newForm")}</h2><p className="mt-2 text-base leading-7 text-slate-300">{t("newFormDescription")}</p><span className="mt-5 inline-block text-sm font-medium text-blue-200">{t("createNewForm")}</span></div>
          </Link>
          <a href="#existing-forms" className="flex gap-5 rounded-xl border border-slate-200 bg-white p-6 transition hover:border-blue-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 sm:p-8">
            <ClipboardList size={28} className="mt-1 shrink-0 text-blue-700" aria-hidden="true" />
            <div><h2 className="text-xl font-semibold">{t("existingForms")}</h2><p className="mt-2 text-base leading-7 text-slate-600">{t("existingDescription")}</p><span className="mt-5 inline-block text-sm font-medium text-blue-700">{t("browseForms")}</span></div>
          </a>
        </div>
        <section id="existing-forms" className="scroll-mt-6" aria-labelledby="forms-heading">
          <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3"><h2 id="forms-heading" className="text-xl font-semibold">{t("existingForms")}</h2>{!unavailable && <span className="rounded-full bg-slate-200 px-3 py-1 text-sm text-slate-700">{t("formCount", { count: surveys.length })}</span>}</div>
            <div className="relative sm:w-72">
              <Search size={18} className="pointer-events-none absolute top-3.5 left-3 text-slate-500" aria-hidden="true" />
              <label htmlFor="form-search" className="sr-only">{t("searchForms")}</label>
              <input id="form-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("searchForms")} disabled={unavailable} className="min-h-11 w-full rounded-lg border border-slate-300 bg-white py-3 pr-3 pl-10 text-sm focus:border-blue-600 focus:outline-2 focus:outline-blue-600 disabled:opacity-50" />
            </div>
          </div>
          {unavailable ? (
            <div role="status" className="rounded-xl border border-slate-200 bg-white p-8 text-center"><h3 className="text-lg font-medium">{t("formsUnavailable")}</h3><p className="mt-2 text-base text-slate-600">{t("formsRetry")}</p><button onClick={() => window.location.reload()} className={`${actionStyle} mt-5 border border-slate-300 bg-white hover:bg-slate-50`}>{t("reload")}</button></div>
          ) : filtered.length === 0 ? (
            <div role="status" className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center"><FileText size={32} className="mx-auto mb-4 text-slate-400" aria-hidden="true" /><h3 className="text-lg font-medium">{surveys.length === 0 ? t("noForms") : t("noMatches")}</h3><p className="mt-2 text-base text-slate-600">{surveys.length === 0 ? t("firstForm") : t("searchHint")}</p>{surveys.length === 0 ? <Link href="/create" className={`${actionStyle} mt-5 bg-blue-700 text-white hover:bg-blue-800`}><Plus size={18} aria-hidden="true" />{t("newForm")}</Link> : <button onClick={() => setQuery("")} className={`${actionStyle} mt-5 border border-slate-300 hover:bg-slate-50`}>{t("clearSearch")}</button>}</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filtered.map((survey) => (
                <article key={survey.id} className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-6">
                  <div className="mb-4 flex items-center gap-2 text-sm text-slate-500"><FileText size={17} aria-hidden="true" /><span>{t("createdOn", { date: formatDate(locale, survey.createdAt) })}</span></div>
                  <h3 className="break-words text-lg font-semibold">{survey.title}</h3>
                  <p className="mt-2 flex-1 break-words text-base leading-7 text-slate-600">{survey.description || t("noDescription")}</p>
                  <p className="mt-5 flex items-center gap-2 text-sm text-slate-600"><Users size={17} aria-hidden="true" />{t("responseCount", { count: survey.responses })}</p>
                  <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-5"><Link aria-label={t("fillFormLabel", { title: survey.title })} href={`/surveys/${survey.id}`} className={`${actionStyle} bg-blue-700 text-white hover:bg-blue-800`}>{t("openForm")}</Link><Link aria-label={t("resultsLabel", { title: survey.title })} href={`/surveys/${survey.id}/results`} className={`${actionStyle} border border-slate-300 hover:bg-slate-50`}>{t("viewResults")}</Link></div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
