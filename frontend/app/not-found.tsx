import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";

export default async function NotFound() {
  const { t } = await getI18n();
  return <main className="mx-auto max-w-xl space-y-4 px-5 py-12">
    <h1 className="text-2xl font-semibold">{t("notFound")}</h1>
    <p className="text-slate-600">{t("notFoundDescription")}</p>
    <Link href="/" className="inline-flex min-h-11 items-center text-blue-700 underline">{t("backPortal")}</Link>
  </main>;
}
