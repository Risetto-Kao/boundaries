"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, FileText, Plus, Search, Users } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/i18n/config";

type PortalSurvey = { id: string; title: string; description: string | null; responses: number; createdAt: string };

export function FormPortal({ surveys, unavailable, listOnly = false }: { surveys: PortalSurvey[]; unavailable: boolean; listOnly?: boolean }) {
  const { t, locale } = useI18n();
  const [query, setQuery] = useState("");
  const filtered = surveys.filter((survey) => `${survey.title} ${survey.description ?? ""}`.normalize("NFKC").toLocaleLowerCase(locale).includes(query.trim().normalize("NFKC").toLocaleLowerCase(locale)));
  return (
    <main className="page-shell">
      {listOnly ? <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="page-heading">{t("existingForms")}</h1>
        <Link href="/create" className={buttonVariants()}><Plus size={20} aria-hidden="true" />{t("newForm")}</Link>
      </div> : <section className="pb-8 sm:pb-10" aria-labelledby="home-heading">
        <h1 id="home-heading" className={`max-w-2xl text-[clamp(24px,6vw,44px)] leading-[1.2] font-extrabold tracking-tight ${locale === "zh-Hant" ? "whitespace-nowrap" : ""}`}>
          {t("homeTitleLead")}<span className="whitespace-nowrap text-brand">{t("homeTitleAccent")}</span>
        </h1>
        <p className="page-description">{t("homeDescription")}</p>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link href="/create" className={buttonVariants({ size: "lg" })}>{t("newForm")}<ArrowRight size={20} aria-hidden="true" /></Link>
          <Link href="/surveys" className="text-action">{t("openExisting")}<ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
      </section>}
      <section id="existing-forms" className="page-section scroll-mt-6" aria-labelledby="forms-heading">
        <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-3"><h2 id="forms-heading" className="text-xl font-bold">{t("existingForms")}</h2>{!unavailable && <span className="text-sm text-muted-foreground">{t("formCount", { count: surveys.length })}</span>}</div>
          <div className="relative sm:w-80">
            <Search size={20} className="pointer-events-none absolute top-3.5 left-3 text-muted-foreground" aria-hidden="true" />
            <label htmlFor="form-search" className="sr-only">{t("searchForms")}</label>
            <Input id="form-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("searchForms")} disabled={unavailable} className="pl-10" />
          </div>
        </div>
        {unavailable ? (
          <div role="status" className="empty-state"><h3 className="text-lg font-bold">{t("formsUnavailable")}</h3><p className="mt-2 text-muted-foreground">{t("formsRetry")}</p><Button onClick={() => window.location.reload()} variant="outline" className="mt-5">{t("reload")}</Button></div>
        ) : filtered.length === 0 ? (
          <div role="status" className="empty-state"><FileText size={28} className="mx-auto mb-4 text-brand" aria-hidden="true" /><h3 className="text-lg font-bold">{surveys.length === 0 ? t("noForms") : t("noMatches")}</h3><p className="mt-2 text-muted-foreground">{surveys.length === 0 ? t("firstForm") : t("searchHint")}</p>{surveys.length === 0 ? <Link href="/create" className={buttonVariants({ className: "mt-5" })}><Plus size={20} aria-hidden="true" />{t("newForm")}</Link> : <Button onClick={() => setQuery("")} variant="outline" className="mt-5">{t("clearSearch")}</Button>}</div>
        ) : <div>
          {filtered.map((survey) => (
            <article key={survey.id} className="survey-row">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold [overflow-wrap:anywhere]">{survey.title}</h3>
                <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground"><span className="inline-flex items-center gap-2"><Users size={16} aria-hidden="true" />{t("responseCount", { count: survey.responses })}</span><span>{t("createdOn", { date: formatDate(locale, survey.createdAt) })}</span></p>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <Link aria-label={t("fillFormLabel", { title: survey.title })} href={`/surveys/${survey.id}`} className={buttonVariants({ variant: "outline" })}>{t("openForm")}</Link>
                <Link aria-label={t("resultsLabel", { title: survey.title })} href={`/surveys/${survey.id}/results`} className="text-action">{t("viewResults")}</Link>
              </div>
            </article>
          ))}
        </div>}
      </section>
    </main>
  );
}
