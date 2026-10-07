import { LanguageSwitcher } from "@/components/i18n-provider";
import { getI18n } from "@/lib/i18n/server";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/user";

export async function AccountNav() {
  const { t } = await getI18n();
  let user;
  try { user = await getCurrentUser(); } catch {
    return <nav className="border-b bg-white px-5 py-3 text-sm" aria-label={t("account")}><span role="status">{t("sessionUnavailable")}</span> · <Link href="/login" className="text-blue-700 underline">{t("loginAgain")}</Link><LanguageSwitcher /></nav>;
  }
  const displayName = user?.user_metadata.full_name ?? user?.user_metadata.name;
  return (
    <nav className="border-b border-slate-200 bg-white" aria-label={t("account")}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm sm:px-8">
        <Link href="/" className="font-medium">Boundaries</Link>
        <div className="flex flex-wrap items-center gap-4">
          <LanguageSwitcher />
          <Link href="/install" className="inline-flex min-h-11 items-center text-blue-700 underline">{t("install")}</Link>
          {user ? <>
            <Link href="/account" className="text-blue-700 underline">{t("myForms")}</Link>
            <span className="max-w-40 truncate text-slate-600">{typeof displayName === "string" ? displayName : t("signedIn")}</span>
            <form action="/auth/signout" method="post"><button className="min-h-11 rounded-lg border px-3">{t("signOut")}</button></form>
          </> : <>
            <span className="text-slate-500">{t("guest")}</span>
            <Link href="/login" className="min-h-11 rounded-lg bg-slate-900 px-4 py-3 text-white">{t("loginSave")}</Link>
          </>}
        </div>
      </div>
    </nav>
  );
}
