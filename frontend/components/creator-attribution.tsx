"use client";

import { UserRound } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import type { SurveyCreator } from "@/lib/survey-creators";

export function CreatorAttribution({ creator }: { creator: SurveyCreator }) {
  const { t } = useI18n();
  const name = creator.name || t(creator.kind === "member" ? "creatorMember" : creator.kind === "unavailable" ? "creatorUnavailable" : "creatorUnknown");
  return <p className="mt-3 flex min-w-0 items-start gap-2 text-sm text-muted-foreground"><UserRound className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span className="[overflow-wrap:anywhere]">{t("createdBy", { name })}</span></p>;
}
