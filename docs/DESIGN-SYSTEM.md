# Boundaries UI Design System

採用 B3 高彩度介面與原第二輪 2B「雙聲 B」。以排版、規則線及功能色彩建立層級，保留既有四語介面、URL、登入、手勢、資料模型和 API。

## Tokens

來源：`frontend/app/globals.css`。Tailwind utilities 透過 `@theme inline` 引用語意 CSS variables，產品元件不另寫 slate／blue／rose 色值。

| Token | 色彩 | 用途 |
| --- | --- | --- |
| background / foreground | #FCFCFF / #202133 | 閱讀背景與主要文字 |
| muted-foreground | #5B5D70 | 說明、日期、提示 |
| border / input | #DBDCE7 | 分隔線及輸入框 |
| primary / primary-foreground | #2948FF / #FFFFFF | 新增、建立、提交、登入等主動作 |
| brand / brand-foreground | #6835EF / #FFFFFF | 品牌、題卡、文字入口及重點 |
| brand-soft | #F0EAFF | 次要表面、題卡背面及資訊回饋 |
| answer-yes / answer-yes-foreground | #27CE7B / #073B24 | Yes 回答 |
| answer-no / answer-no-foreground | #FF5C48 / #4A120B | No 回答 |
| answer-depends / answer-depends-foreground | #FFDC2E / #453600 | Depends 回答 |
| destructive / error-surface | #B42338 / #FFF0F3 | 驗證錯誤與 destructive 操作 |
| success / success-surface | #11643F / #E7F8EF | 建立成功、已複製 |
| ring | primary | 鍵盤焦點 |

No 是有效的個人回答，必須使用 answer-no，不能使用 destructive。回答保留翻譯文字、Lucide 圖示與色彩；API 值仍為 `yes`、`no`、`depends`。共用 `AnswerBadge` 和 `ANSWER_STYLE` 用於結果與帳號答案。

實色對比（相對亮度計算）：正文 15.46:1、輔助文字 6.32:1、CTA 白字 6.06:1、題卡白字 6.28:1、Yes 6.14:1、No 4.97:1、Depends 8.72:1、錯誤 5.87:1。只涵蓋這些配對，不代表完整 WCAG 審核。

## 字體與尺度

系統字體：`"Avenir Next", "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif`。不載入外部字型。英文 Avenir Next、中文 PingFang TC 的實際效果已在 Mac Arc 查看；其他平台使用 fallback，尚未跨平台實測。

| 用途 | 尺度 |
| --- | --- |
| 首頁主標 | 36px；640px 以上 44px，800 字重，1.2 行高 |
| 內頁 h1 | clamp(28px, 4vw, 38px)，800 字重，1.3 行高 |
| 題卡問題 | 26px；640px 以上 28px，800 字重，1.45 行高 |
| 區塊標題 | 20px，700 字重 |
| 正文／輸入 | 16px，正常字重；預設 1.6 行高 |
| 操作／輔助文字 | 14px；題號及細節 12px |
| 品牌文字 | 24–26px，800 字重，搭配原版 SVG |

長題目與標題使用 `overflow-wrap: anywhere`；不設固定題卡高度、不裁切。裝置字型若沒有指定字重，由系統選擇最接近字重。

## 版型、間距與圓角

間距使用 Tailwind 4px 步進，以 8／16／24／32／40px 為主。`page-shell` 最大 1040px，建立／填答使用 `page-shell-narrow` 最大 720px。手機左右 20px，640px 以上 40px；內容以分隔線和字級分組，頁面外層不套 Card。

共用控制項 12px 圓角。Input 高 48px，Textarea 最少 96px、題目編輯 80px，允許垂直擴展。Button 的所有尺寸至少 44px；主 CTA 48px；回答 56px。窄於 390px 的回答 icon 和文字上下排列，以容納翻譯文字。題卡圓角 18px，最少 280px，保留既有動作及 reduced-motion。

`survey-row`、`history-row` 為規則線列表，窄螢幕操作換行；`text-action` 點擊高度至少 44px。結果手機預設單題、桌面預設矩陣，保留切換功能。矩陣問題欄 260px、每位人員 176px，長人名換行；表格容器可局部捲動並可用鍵盤聚焦，整頁不溢出。

## 元件與狀態

- 導覽只有 `AccountNav` 中的一個 `Brand`，涵蓋四語切換、既有安裝頁、訪客、帳號及登出。會依既有設定判斷登入可用性。
- `Button`／`buttonVariants` 共用主動作、outline、secondary、ghost、link、destructive、answer。answer variant 不覆寫答案背景，hover 僅稍降亮度。
- `Input`／`Textarea` 維持 16px、清楚 label；focus 使用完整 primary 3px ring；錯誤以 aria-invalid、aria-describedby 連結提示。
- `feedback` 為資訊；`feedback-error`、`feedback-success` 分別為失敗與成功。使用 role=alert 或 role=status；錯誤提供可定位欄位的連結。
- `empty-state` 用於空白、搜尋無結果、資料不可用與無填答。Disabled 保留標籤，以降低透明度及原生 disabled 限制互動。
- `CopyLinkButton` 保留複製結果，新增成功圖示及失敗訊息；狀態由 live region 宣告。
- `LoadingSpinner` 和列表骨架保留 reduced-motion；不新增裝飾動畫。
- 題卡仍保留右滑 Yes、左滑 No、雙擊 Depends、替代按鈕和上一題。全部作答後聚焦完成提示，再可用鍵盤前往提交。

Lucide 沿用 24px 網格、2px 線寬、圓端點；顯示大小為 16／20／24px。

## 品牌與既有安裝功能

正式 SVG 來源 `/assets/brand/boundaries-mark.svg`，保持 28×30 比例，旁邊有品牌名稱時 alt 為空。Favicon 由 layout metadata 指向 `/assets/brand/favicon.ico` 及 SVG；刪除 App Router 舊 favicon，Apple touch icon 使用同組 180px 圖檔。

本次未新增 PWA 或 service worker。最新 master 已有安裝頁及 manifest，保留並換用原 2B 的 192／512px 一般 app icon；因原 2B 資產尚無 maskable 版本，manifest 不宣稱 maskable。

## 維護

新增頁面先使用 page-shell、page-heading、共用表單／按鈕與回饋狀態；新增語意色先定義 token。不要將原型假資料或示範提交搬入產品。視覺確認與限制見 `docs/DESIGN-VERIFICATION.md`。
