import { getI18n } from "@/lib/i18n/server";
import type { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: `${t("install")} | Boundaries` };
}

export default async function InstallPage() {
  const { t } = await getI18n();
  return (
    <main className="page-shell page-shell-narrow">
      <h1 className="page-heading">{t("installTitle")}</h1>
      <p className="mt-4 text-muted-foreground">{t("installDescription")}</p>
      <ol className="mt-6 list-decimal space-y-4 pl-6">
        <li>{t("installStep1")}</li>
        <li>{t("installStep2")}</li>
        <li>{t("installStep3")}</li>
        <li>{t("installStep4")}</li>
        <li>{t("installStep5")}</li>
      </ol>
      <p className="mt-6 text-sm text-muted-foreground">{t("installHint")}</p>
      <Link href="/" className="text-action mt-8">{t("backPortal")}</Link>
    </main>
  );
}
