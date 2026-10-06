import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/user";

export async function AccountNav() {
  let user;
  try { user = await getCurrentUser(); } catch {
    return <nav className="border-b bg-white px-5 py-3 text-sm" aria-label="帳號"><span role="status">無法確認登入狀態</span> · <Link href="/login" className="text-blue-700 underline">重新登入</Link></nav>;
  }
  const displayName = user?.user_metadata.full_name ?? user?.user_metadata.name;
  return (
    <nav className="border-b border-slate-200 bg-white" aria-label="帳號">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm sm:px-8">
        <Link href="/" className="font-medium">Boundaries</Link>
        <div className="flex flex-wrap items-center gap-4">
          {user ? <>
            <Link href="/account" className="text-blue-700 underline">我的表單與填答</Link>
            <span className="max-w-40 truncate text-slate-600">{typeof displayName === "string" ? displayName : "已登入"}</span>
            <form action="/auth/signout" method="post"><button className="min-h-11 rounded-lg border px-3">登出／切換訪客</button></form>
          </> : <>
            <span className="text-slate-500">訪客模式</span>
            <Link href="/login" className="min-h-11 rounded-lg bg-slate-900 px-4 py-3 text-white">登入並儲存紀錄</Link>
          </>}
        </div>
      </div>
    </nav>
  );
}
