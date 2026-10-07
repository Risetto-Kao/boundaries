import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "加入主畫面 | Boundaries" };

export default function InstallPage() {
  return (
    <main className="mx-auto max-w-xl px-5 py-10 sm:px-8">
      <h1 className="text-2xl font-bold">將 Boundaries 加入 iPhone 主畫面</h1>
      <p className="mt-4 text-slate-600">從主畫面圖示開啟，以獨立視窗使用 Boundaries。</p>
      <ol className="mt-6 list-decimal space-y-4 pl-6">
        <li>在 Safari 開啟這個網站。若目前在其他 App 的內建瀏覽器，請先選擇「在 Safari 中開啟」。</li>
        <li>點選 Safari 的「分享」按鈕（方框向上箭頭；部分版本位於「⋯」選單內）。</li>
        <li>選擇「加入主畫面」。若沒看到，請往下捲動分享選單或選擇「編輯動作」。</li>
        <li>如果有「以網頁 App 開啟」選項，請開啟它，再點選「新增」。</li>
        <li>回到 iPhone 主畫面，點選 Boundaries 圖示。</li>
      </ol>
      <p className="mt-6 text-sm text-slate-600">使用問卷與帳號功能仍需要網路。首次從主畫面開啟時，可能需要重新登入。</p>
      <Link href="/" className="mt-8 inline-flex min-h-11 items-center rounded-lg bg-slate-900 px-4 text-white">回到表單入口</Link>
    </main>
  );
}
