import { Brand } from "@/components/brand";
import { LanguageSwitcher } from "@/components/i18n-provider";
import { AccountMenu } from "@/components/account-menu";
import { LoginLink } from "@/components/login-link";
import { getAccountDisplayName } from "@/lib/auth/display-name";
import { getI18n } from "@/lib/i18n/server";
import { getCurrentUser } from "@/lib/auth/user";

export async function AccountNav() {
  const { t } = await getI18n();
  let user;
  let unavailable = false;
  try { user = await getCurrentUser(); } catch { unavailable = true; }
  const displayName = getAccountDisplayName(user?.user_metadata);
  return (
    <header className="site-header border-b border-border">
      <nav className="site-nav" aria-label={t("account")}>
        <Brand />
        <div className="nav-actions text-sm">
          <LanguageSwitcher />
          {unavailable ? <>
            <span role="status" className="text-destructive">{t("sessionUnavailable")}</span>
            <LoginLink className="text-action">{t("loginAgain")}</LoginLink>
          </> : <AccountMenu signedIn={!!user} displayName={displayName} />}
        </div>
      </nav>
    </header>
  );
}
