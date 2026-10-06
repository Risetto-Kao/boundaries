import Link from "next/link";
import { redirect } from "next/navigation";
import { authProviders, isAuthConfigured, safeReturnTo } from "@/lib/auth/config";
import { getCurrentUser } from "@/lib/auth/user";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const params = await searchParams;
  const next = safeReturnTo(params.next);
  let user = null;
  try { user = await getCurrentUser(); } catch { /* Allow session recovery. */ }
  if (user && !params.error) redirect(next);
  const configured = isAuthConfigured();
  return <main className="min-h-screen bg-slate-50 px-5 py-16">
    <section className="mx-auto max-w-md space-y-6 rounded-2xl border bg-white p-8">
      <h1 className="text-2xl font-semibold">把你的表單留在自己的帳號</h1>
      <p className="leading-7 text-slate-600">登入後，建立過的表單與填答紀錄會保存在帳號中，換裝置也能查看。</p>
      {params.error && <p role="alert" className="text-sm text-rose-700">{params.error === "unavailable" ? "登入尚未設定完成，請先以訪客繼續使用。" : "登入未完成或連線暫時中斷，請重試。"}</p>}
      {configured ? authProviders.map((provider) => <Link key={provider.id} prefetch={false} href={`/auth/signin?provider=${provider.id}&next=${encodeURIComponent(next)}`} className="flex min-h-12 justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 font-medium text-slate-800 hover:bg-slate-50">{provider.label}</Link>) : <p role="status" className="rounded-lg bg-slate-100 p-4 text-sm text-slate-600">登入服務準備中，你仍可使用訪客模式。</p>}
      <Link href={next === "/account" ? "/" : next} className="block py-3 text-center text-blue-700 underline">{user ? "返回服務" : "以訪客繼續"}</Link>
      <p className="text-xs leading-6 text-slate-500">訪客不會建立帳號或儲存個人歷史。表單與答案仍會送出並保留在共用表單中；訪客紀錄不會在登入後自動加入帳號。</p>
    </section>
  </main>;
}
