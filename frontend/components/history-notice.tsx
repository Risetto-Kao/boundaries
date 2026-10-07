import { getI18n } from "@/lib/i18n/server";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/user";

export async function HistoryNotice({ returnTo }: { returnTo: string }) {
  const { t } = await getI18n();
  let user;
  try { user = await getCurrentUser(); } catch {
    return <p role="alert" className="mx-auto mb-5 max-w-3xl rounded-lg border bg-white p-4 text-sm text-rose-700">{t("sessionRetry")}</p>;
  }
  return <p className="mx-auto mb-5 max-w-3xl rounded-lg border bg-white p-4 text-sm leading-6 text-slate-600">{user ? t("historySaved") : <>{t("guestHistory")}<Link className="ml-2 text-blue-700 underline" href={`/login?next=${encodeURIComponent(returnTo)}`}>{t("loginFirst")}</Link></>}</p>;
}
