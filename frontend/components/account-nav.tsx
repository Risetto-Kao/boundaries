import Link from "next/link";
import { Brand } from "@/components/brand";
import { LanguageSwitcher } from "@/components/i18n-provider";
import { buttonVariants } from "@/components/ui/button";
import { getI18n } from "@/lib/i18n/server";
import { getCurrentUser } from "@/lib/auth/user";

export async function AccountNav() {
  const { t } = await getI18n();
  let user;
  let unavailable = false;
  try { user = await getCurrentUser(); } catch { unavailable = true; }
  const displayName = user?.user_metadata.full_name ?? user?.user_metadata.name;
  return (
    <header className="border-b border-border">
      <nav className="site-nav" aria-label={t("account")}>
        <Brand />
        <div className="nav-actions text-sm">
          <LanguageSwitcher />
          <Link href="/install" className="text-action">{t("install")}</Link>
          {unavailable ? <>
            <span role="status" className="text-destructive">{t("sessionUnavailable")}</span>
            <Link href="/login" className="text-action">{t("loginAgain")}</Link>
          </> : user ? <>
            <Link href="/account" className="text-action">{t("myForms")}</Link>
            <span className="max-w-32 truncate text-muted-foreground">{typeof displayName === "string" ? displayName : t("signedIn")}</span>
            <form action="/auth/signout" method="post"><button className={buttonVariants({ variant: "outline", size: "sm" })}>{t("signOut")}</button></form>
          </> : <>
            <span className="text-muted-foreground">{t("guest")}</span>
            <Link href="/login" className="text-action">{t("loginSave")}</Link>
          </>}
        </div>
      </nav>
    </header>
  );
}
