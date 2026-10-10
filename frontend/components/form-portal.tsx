"use client";

import Link from "next/link";
import { useState } from "react";
import { DropdownMenu } from "radix-ui";
import { ArrowRight, Check, ChevronDown, Globe, Pencil, Plus, Search, X } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusArt } from "@/components/design-primitives";
import { languages, type Locale } from "@/lib/i18n/config";
import { formatBoundaryDate, languageShortNames } from "@/lib/design";

type PortalSurvey = { id: string; title: string; description: string | null; responses: number; createdAt: string; language: Locale; canEdit: boolean };
export function FormPortal({ surveys, unavailable }: { surveys: PortalSurvey[]; unavailable: boolean; listOnly?: boolean }) {
  const { t, locale } = useI18n();
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState<Locale | "">("");
  const normalize = (text: string) => text.normalize("NFKC").toLocaleLowerCase(locale);
  const filtered = surveys.filter(survey => (!language || survey.language === language) && normalize(`${survey.title} ${languages[survey.language].name} ${languageShortNames[survey.language]}`).includes(normalize(query.trim())));
  const hasFilters = Boolean(query.trim() || language);
  const clear = () => { setQuery(""); setLanguage(""); };
  return <main className="page-shell">
    <div className="border-b-2 border-foreground pb-7">
      <p className="eyebrow mb-5">{t("myForms")}</p>
      <div className="flex flex-wrap items-center justify-between gap-6">
        <h1 className="page-heading">{t("existingForms")}</h1>
        <Link href="/create" className={buttonVariants()}><Plus size={20} aria-hidden="true" />{t("newForm")}</Link>
      </div>
    </div>
    {surveys.length > 0 && !unavailable && <section className="mt-6 mb-8" aria-label={t("searchForms")}>
      <div className="relative">
        <Search size={20} className="pointer-events-none absolute top-[18px] left-5 text-muted-foreground" aria-hidden="true" />
        <label htmlFor="form-search" className="sr-only">{t("searchForms")}</label>
        <Input id="form-search" value={query} onChange={event => setQuery(event.target.value)} placeholder={t("searchForms")} className="pl-14 pr-14" />
        {query && <Button type="button" variant="ghost" size="icon" className="absolute top-1.5 right-2 text-muted-foreground" aria-label={t("clearSearch")} onClick={() => setQuery("")}><X aria-hidden="true" /></Button>}
      </div>
      <div className="filter-row">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild><button type="button" className="filter-trigger" aria-pressed={Boolean(language)}><Globe size={18} aria-hidden="true" />{language ? languageShortNames[language] : t("language")}<ChevronDown size={16} aria-hidden="true" /></button></DropdownMenu.Trigger>
          <DropdownMenu.Portal><DropdownMenu.Content align="start" sideOffset={8} collisionPadding={16} className="filter-menu">
            <DropdownMenu.RadioGroup value={language} onValueChange={value => setLanguage(value as Locale | "")}>
              {(["", ...Object.keys(languages)] as (Locale | "")[]).map(value => <DropdownMenu.RadioItem key={value} value={value} className="filter-item">{value ? languages[value].name : t("allLanguages")}<DropdownMenu.ItemIndicator><Check size={18} aria-hidden="true" /></DropdownMenu.ItemIndicator></DropdownMenu.RadioItem>)}
            </DropdownMenu.RadioGroup>
          </DropdownMenu.Content></DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
      <div className="mt-5 flex min-h-11 items-center justify-between gap-3 text-sm font-bold text-muted-foreground"><span role="status">{t(hasFilters ? "filteredCount" : "formCount", { count: filtered.length })}</span>{hasFilters && <button type="button" onClick={clear} className="text-action">{t("clearFilters")}</button>}</div>
    </section>}
    {unavailable ? <div role="status" className="empty-state mt-6"><h2 className="text-xl font-extrabold">{t("formsUnavailable")}</h2><p className="mt-2 text-muted-foreground">{t("formsRetry")}</p><Button onClick={() => window.location.reload()} variant="outline" className="mt-5">{t("reload")}</Button></div>
      : filtered.length === 0 ? <div role="status" className="empty-state mt-6">{surveys.length === 0 ? <StatusArt small /> : <Search size={40} className="mx-auto mb-5 text-muted-foreground" aria-hidden="true" />}<h2 className="text-2xl font-extrabold">{t(surveys.length === 0 ? "noForms" : "noMatches")}</h2>{surveys.length === 0 ? <Link href="/create" className={buttonVariants({ className: "mt-6" })}><Plus aria-hidden="true" />{t("newForm")}</Link> : <Button onClick={clear} variant="outline" className="mt-6">{t("clearFilters")}</Button>}</div>
      : <div className="space-y-3">{filtered.map(survey => <article key={survey.id} className="survey-row">
        <div className="survey-initial" aria-hidden="true">{Array.from(survey.title.trim())[0]?.toLocaleUpperCase()}</div>
        <div className="min-w-0 flex-1"><h2 className="text-[21px] leading-[1.35] font-extrabold [overflow-wrap:anywhere]">{survey.title}</h2><div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-bold"><span className="language-tag">{languageShortNames[survey.language]}</span><span>{t("responseCount", { count: survey.responses })}</span><time dateTime={survey.createdAt} className="font-medium text-muted-foreground">{formatBoundaryDate(locale, survey.createdAt)}</time></div></div>
        <div className="survey-actions">
          {survey.canEdit && <Link href={`/surveys/${survey.id}/edit`} className={buttonVariants({ variant: "outline", size: "icon", className: "border-border" })} aria-label={t("editForm")}><Pencil size={20} aria-hidden="true" /></Link>}
          <Link href={`/surveys/${survey.id}`} aria-label={t("fillFormLabel", { title: survey.title })} className={buttonVariants({ variant: "outline", size: "sm" })}>{t("openForm")}</Link>
          <Link href={`/surveys/${survey.id}/results`} aria-label={t("resultsLabel", { title: survey.title })} className={buttonVariants({ size: "sm" })}>{t("viewResults")}<ArrowRight size={20} aria-hidden="true" /></Link>
        </div>
      </article>)}</div>}
  </main>;
}
