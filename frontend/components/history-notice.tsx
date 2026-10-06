import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/user";

export async function HistoryNotice({ returnTo }: { returnTo: string }) {
  let user;
  try { user = await getCurrentUser(); } catch {
    return <p role="alert" className="mx-auto mb-5 max-w-3xl rounded-lg border bg-white p-4 text-sm text-rose-700">無法確認登入狀態，請重新登入後再送出。</p>;
  }
  return <p className="mx-auto mb-5 max-w-3xl rounded-lg border bg-white p-4 text-sm leading-6 text-slate-600">{user ? "已登入：這次建立或提交的紀錄會儲存在你的帳號。" : <>目前以訪客使用，這次操作不會儲存為個人歷史。<Link className="ml-2 text-blue-700 underline" href={`/login?next=${encodeURIComponent(returnTo)}`}>先登入</Link></>}</p>;
}
