import { getI18n } from "@/lib/i18n/server";
import Link from "next/link";
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
  return <main className="min-h-screen bg-slate-50 px-5 py-16">
    <section className="mx-auto max-w-md space-y-6 rounded-2xl border bg-white p-8">
      <h1 className="text-2xl font-semibold">{t("loginTitle")}</h1>
      <p className="leading-7 text-slate-600">{t("loginDescription")}</p>
      {params.error && <p role="alert" className="text-sm text-rose-700">{params.error === "unavailable" ? t("loginUnavailable") : t("loginFailed")}</p>}
      {configured ? authProviders.map((provider) => <Link key={provider.id} prefetch={false} href={`/auth/signin?provider=${provider.id}&next=${encodeURIComponent(next)}`} className="flex min-h-12 justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 font-medium text-slate-800 hover:bg-slate-50">{t(provider.labelKey)}</Link>) : <p role="status" className="rounded-lg bg-slate-100 p-4 text-sm text-slate-600">{t("loginPreparing")}</p>}
      <Link href={next === "/account" ? "/" : next} className="block py-3 text-center text-blue-700 underline">{user ? t("returnService") : t("continueGuest")}</Link>
      <p className="text-xs leading-6 text-slate-500">{t("privacyGuest")}</p>
    </section>
  </main>;
}
