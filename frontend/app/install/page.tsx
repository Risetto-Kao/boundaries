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
    <main className="mx-auto max-w-xl px-5 py-10 sm:px-8">
      <h1 className="text-2xl font-bold">{t("installTitle")}</h1>
      <p className="mt-4 text-slate-600">{t("installDescription")}</p>
      <ol className="mt-6 list-decimal space-y-4 pl-6">
        <li>{t("installStep1")}</li>
        <li>{t("installStep2")}</li>
        <li>{t("installStep3")}</li>
        <li>{t("installStep4")}</li>
        <li>{t("installStep5")}</li>
      </ol>
      <p className="mt-6 text-sm text-slate-600">{t("installHint")}</p>
      <Link href="/" className="mt-8 inline-flex min-h-11 items-center rounded-lg bg-slate-900 px-4 text-white">{t("backPortal")}</Link>
    </main>
  );
}
