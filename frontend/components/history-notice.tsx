import { getI18n } from "@/lib/i18n/server";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/user";

export async function HistoryNotice({ returnTo }: { returnTo: string }) {
  const { t } = await getI18n();
  let user;
  try { user = await getCurrentUser(); } catch {
    return <p role="alert" className="mb-6 feedback feedback-error">{t("sessionRetry")}</p>;
  }
  return <p className="mb-6 border-l-2 border-border pl-4 text-sm leading-6 text-muted-foreground">{user ? t("historySaved") : <>{t("guestHistory")}<Link className="text-action ml-2" href={`/login?next=${encodeURIComponent(returnTo)}`}>{t("loginFirst")}</Link></>}</p>;
}
