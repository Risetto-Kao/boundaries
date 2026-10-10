import { getI18n } from "@/lib/i18n/server";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { authProviders, isAuthConfigured, safeReturnTo } from "@/lib/auth/config";
import { getCurrentUser } from "@/lib/auth/user";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { t } = await getI18n();
  const params = await searchParams;
  const next = safeReturnTo(params.next);
  let user = null;
  try { user = await getCurrentUser(); } catch { /* Allow session recovery. */ }
  if (user && !params.error) redirect(next);
  const configured = isAuthConfigured();
  return <main className="page-shell page-shell-narrow">
    <section className="mx-auto max-w-lg space-y-6">
      <h1 className="page-heading">{t("loginTitle")}</h1>
      <p className="page-description">{t("loginDescription")}</p>
      {params.error && <p role="alert" className="feedback feedback-error">{params.error === "unavailable" ? t("loginUnavailable") : t("loginFailed")}</p>}
      {configured ? authProviders.map((provider) => <Link key={provider.id} prefetch={false} href={`/auth/signin?provider=${provider.id}&next=${encodeURIComponent(next)}`} className={buttonVariants({ size: "lg", className: "w-full" })}>{t(provider.labelKey)}</Link>) : <p role="status" className="feedback text-muted-foreground">{t("loginPreparing")}</p>}
      <Link href={next === "/account" ? "/" : next} className="text-action justify-center w-full">{user ? t("returnService") : t("continueGuest")}</Link>
      <p className="text-xs leading-6 text-muted-foreground">{t("privacyGuest")}</p>
    </section>
  </main>;
}
