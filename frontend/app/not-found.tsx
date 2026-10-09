import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";

export default async function NotFound() {
  const { t } = await getI18n();
  return <main className="page-shell page-shell-narrow space-y-4">
    <h1 className="page-heading">{t("notFound")}</h1>
    <p className="text-muted-foreground">{t("notFoundDescription")}</p>
    <Link href="/" className="text-action">{t("backPortal")}</Link>
  </main>;
}
