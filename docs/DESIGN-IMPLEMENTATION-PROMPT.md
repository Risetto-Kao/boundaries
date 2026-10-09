# Boundaries 設計實作 Prompt

以下整段可直接貼到新的 session。

---

你是 Boundaries 專案的 Senior Product Designer 與 Frontend Engineer。請把目前已討論的設計方向完整導入現有產品，建立可維護的 UI Design System，並完成 PR、merge 與合併後的實際畫面驗證。不要只做提案或原型。

專案位置：`/Users/gaomenghui/Documents/github/weave-us/boundaries`。如果你在新 worktree 或 Cloud，請以當前 repository root 解析以下相對路徑。

## 1. 已確認的方向

我們完成了設計盤點、A／B／C 視覺探索，以及 B2／B3 和品牌 icon 的數輪調整。本次請直接採用：

- **UI：B3 活潑高彩度版**。保留 Editorial Minimal 的排版層級與精緻度，但色彩更飽和、語氣更直接，可以有趣，不要偏文青。
- **品牌圖示：原雙聲 B，即第二輪 2B**。不是第三輪修正版。請使用已匯出的 public 資產，不重新畫 Logo，也不採用第三輪的尾角或小尺寸簡化圖。
- **首頁：精簡內容，清楚引導主要動作「新增表單」**，既有表單為次要入口與列表。
- 保留現有功能、資料模型、URL、登入與使用流程。這是設計導入，不是產品架構重做。

本 prompt 是新的實作授權。舊 audit 或原型中「僅探索」「等待方向確認」「不改正式頁面」是先前階段的記錄，不是這次工作的限制。不必再重新詢問我選 A／B／C 或重做視覺提案。這輪完成後，品牌細節仍可在未來微調。

產品核心：幫助人們簡單表達自己的需求、偏好與界線，理解彼此的差異。情境包含旅行、共同生活／建立家庭與朋友日常話題。不要把產品改成問卷分析後台，也不要新增相容度分數、聊天、模板市集或其他新功能。

品牌概念 `Understanding begins with knowing our differences.` 只是背景概念，**不是已定案標語**，不要自行放上正式頁面。

## 2. 先閱讀這些檔案

- repository 的 `AGENTS.md` 與 `docs/DEVELOPMENT.md`：環境、版本、資料庫、部署與驗證規則。
- `design/phase-1-2/audit.md`：現況、產品流程、視覺問題與設計選擇歷程；如與本 prompt 衝突，以本 prompt 的最新選擇為準。
- `design/phase-1-2/index.html`、`prototype.css`、`prototype.js`：**B3** 首頁／建立／填答／結果的設計參考。B3 會繼承 B／B2 部分樣式，請看實際渲染結果與 computed styles，不能只複製最後一段 `.b3`。
- `docs/BRAND-ASSETS.md`：圖示用途、格式與引用方式。
- 現有 `frontend/app/`、`frontend/components/`、`frontend/lib/answer-meta.ts`、驗證及資料取得程式：以現況確認功能，保留業務行為。

原型是獨立設計 sandbox，沒有真實 API／登入／儲存。不要把原型的示範提交、假資料、訪客提示捷徑或互動實作複製成正式功能。

如需開啟原型，從 repository root 執行：

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory design/phase-1-2
```

若已有相同 server，直接重用；port 被其他服務占用則換 port。
參考 URL：`http://127.0.0.1:4173/?revision=3#direction=b3&page=portal&size=desktop`。
切換 `page=create`／`fill`／`results` 查看其他畫面，`size=mobile`／`small` 是 390／320px 內容預覽。
原雙聲 B 的探索來源在 `icons-v2.html` 的 **2B**；`icons-v3.html` 為未採用版本。
目前 `icons.html` 是已選原稿的資產預覽。

## 3. 視覺規格

先把以下方向映射成現有 Tailwind／CSS 的語意 tokens，再套用到共用元件與產品頁。必要的 hover、focus、disabled、error 等狀態可自行設計，保持一致並檢查對比。

| 用途 | 色彩 |
| --- | --- |
| 閱讀背景 | `#FCFCFF` |
| 主要文字 | `#202133` |
| 輔助文字 | `#5B5D70` |
| 邊框／分隔線 | `#DBDCE7` |
| 主要 CTA | `#2948FF`，白字 |
| 品牌紫／題卡／重點 | `#6835EF`，題卡使用白字 |
| Yes | 背景 `#27CE7B`，文字 `#073B24` |
| No | 背景 `#FF5C48`，文字 `#4A120B` |
| Depends／看狀況 | 背景 `#FFDC2E`，文字 `#453600` |

五色有功能分工，不是每頁平均用滿五色。品牌紫、主動作藍與回答色要各有角色。No 是有效的個人回答，不能把所有紅色回答畫成驗證錯誤；錯誤與 destructive 操作另定語意 tokens。

字體沿用 B3 的無襯線方向：`"Avenir Next", "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif`。Avenir Next／PingFang 是裝置字型；不要新增付費字型或為追求一致擅自引入外部字型服務。標題與題目用較粗字重，內文正常字重。不使用 B2 的宋體或 Georgia 斜體。跨平台粗體與 fallback 需查看實際效果。

參考尺度：首頁標題約 36–44px、內頁主標 28–38px、題目約 26–28px、內文與輸入 16px、輔助文字 12–14px。手機長題目需換行，不裁切；不要照搬原型所有固定尺寸。間距以 4／8px 步進，主要操作可點擊區至少 44px，回答按鈕約 56px。控制項圓角約 12px、題卡約 18px，避免全頁反覆套圓角卡片。移除不必要的容器、陰影與過大留白。

介面 icon 沿用 Lucide，統一 24px 網格、約 2px 線寬、圓端點；實際顯示可依元件使用 16／20／24px。答案始終保留文字＋圖示＋顏色，不能只靠色相。不要為趣味新增無用途動畫、漸層、玻璃或裝飾。

## 4. 資產位置與使用方式

正式可引用資產位於 **`frontend/public/assets/brand/`**，瀏覽器路徑是 `/assets/brand/<檔名>`：

- `boundaries-mark.svg`：紫色單色主版本，透明底，viewBox 112 × 120。
- `boundaries-mark-duotone.svg`：紫／綠雙色延伸版。
- `boundaries-mark-black.svg`、`boundaries-mark-white.svg`：黑／白版。
- `boundaries-mark-512.png`、`boundaries-mark-duotone-512.png`：512px 透明背景 PNG。
- `boundaries-app-icon.svg`、`boundaries-app-icon-192.png`／`-512.png`／`-1024.png`：不透明紫底＋白色標誌。
- `apple-touch-icon-180.png`：180px 正方形底，未預先裁切圓角。
- `favicon.svg`：紫色圓角底＋白色標誌。
- `favicon.ico`：含 16／32／48px。

UI 優先使用 SVG，保持比例、不拉伸、不自行改路徑。標誌旁搭配 B3 的 Boundaries 文字；目前沒有另外定案的向量字標。
可透過現有圖片方式或 Next Image 使用，例如 `src="/assets/brand/boundaries-mark.svg"`、`width={28}`、`height={30}`。旁邊已有品牌名稱時讓圖示 `alt=""`，避免重複朗讀。

這次請把品牌圖示接上正式導覽，並整合 favicon 與 Apple touch icon。檢查既有 `frontend/app/favicon.ico` 與 layout metadata，避免新舊 favicon 並存。可以使用 App Router 圖示檔案慣例或 metadata 引用，但保持一個清楚的來源。不要因有 App icon 就額外建立 PWA／service worker；尚未製作 maskable icon。

## 5. 頁面與元件修改範圍

完整套用現有頁面，不只修改首頁或題卡：

1. **共用導覽／品牌列**：處理 `AccountNav` 與 `FormPortal` 的重複品牌列，形成一致導覽。保留訪客、登入、帳號及登出功能與設定條件。
2. **首頁 `/`**：以「先說說你的想法。」、一句「建立一份表單，了解彼此的偏好與界線。」作為精簡起點。主 CTA「新增表單」，次要入口「開啟既有表單」。既有表單保留搜尋、名稱、填答人數、開啟與查看結果，用緊湊列表呈現；不用重複說明卡或大量介紹。「不必登入，也能開始」須與目前產品設定相符。真實列表使用現有資料，不硬編碼示範問卷。
3. **建立 `/create`**：保留標題、選填描述、1–20 題、新增題目、驗證與成功後分享連結。減少巢狀容器，主操作明確。
4. **列表 `/surveys`**：沿用同一套列表／操作樣式，保留既有 route 與連結。
5. **填答 `/surveys/[surveyId]`**：保留暱稱、逐題、進度、右滑 Yes／左滑 No／雙擊 Depends、替代按鈕、上一題、必填、提交後前往結果、複製連結。紫色實色題卡＋白字，鮮綠／珊瑚紅／亮黃回答按鈕。降低原本堆疊陰影，不破壞手勢與焦點流程。
6. **結果 `/surveys/[surveyId]/results`**：保留問題 × 參與者矩陣、答案、人數、邀請、分享與無人填答狀態。問題允許換行，人員欄保持可讀；多人表格可局部橫向捲動，整頁不可溢出。長名稱與 Depends 不重疊。
7. **登入 `/login` 與帳號 `/account`**：統一字體、表單、提示、分頁與列表；保留 Google／訪客行為、設定開關、歷史、答案展開與分頁。
8. **所有既有狀態**：loading、空白、搜尋無結果、資料不可用、驗證錯誤、提交中、複製結果、成功及 disabled 都要一致。

主要檔案包括 `frontend/app/globals.css`、`layout.tsx`、各 route，以及 `frontend/components/account-nav.tsx`、`form-portal.tsx`、`create-survey-form.tsx`、`survey-response-form.tsx`、`history-notice.tsx`、`copy-link-button.tsx`、`loading-indicator.tsx` 與 `components/ui/`。
先看實際程式再決定合理抽共用元件，避免一個龐大的頁面元件或每頁重複色值。整理硬編碼 slate／blue／emerald／rose 樣式，不能只改全域 primary 就宣稱完成。
建立顏色、字級、間距、圓角、按鈕、輸入、回答選項、導覽與回饋狀態規範，記錄於專案文件，讓後續開發可以沿用。

## 6. 技術與驗證

沿用 Next.js 16／React 19／Tailwind 4／shadcn-Radix／Lucide；不換 UI framework、不改 API、資料 schema 或登入架構。使用 `.nvmrc` 的 Node 與 pnpm 10.13.1，遵守最新 AGENTS 與 DEVELOPMENT。

Mobile first，查看 320／390px、平板與桌面。檢查長題目／名稱、焦點、鍵盤操作、輸入標籤、錯誤連結、觸控範圍、答案文字與色彩對比。不要新增深色模式功能；保留現有可用行為，新增 tokens 如涉及 dark 要避免破壞既有樣式。

執行並修正：

```sh
pnpm --dir frontend lint
pnpm --dir frontend typecheck
pnpm --dir frontend build
```

依目前 repository 的測試配置執行受影響的既有測試；需要補測試時只補能驗證重要行為的內容，沒有變更的視覺值不要做鏡像或佔位測試。lint／typecheck／build 是檢查，不能稱為功能測試。

本機用 **Arc** 真正查看正式 Next.js 畫面並與 B3 原型比較，記錄實際頁面、尺寸及截圖／結果。不把原型渲染或離線錯誤頁當作真實問卷流程驗證。Phone Safari 如未實測要明確說明。

不得執行 production migration、db push、reset、seed 或寫 API。互動填答／建立驗證只可用明確隔離的開發資料庫；Preview 也不能繼承 production DB 後直接試填。沒有隔離 DB 時繼續完成可進行的設計與靜態驗證，明確列出未驗證流程；必要時使用可移除的開發專用資料展示，不能把假資料塞進 production 或以此宣稱 DB 流程已驗證。

## 7. Create PR、merge 與合併後確認

不要只把修改留在本機。請遵循 repository 的 git 工作流程：保留既有變更，確認遠端與目前分支，在最新 production 基底上建立 `codex/` feature branch，完成實作、驗證、commit、push，**直接 create PR then merge**。

**我明確授權本次設計 PR 在檢查通過、沒有待解決 review 或合併衝突後合併到 `master`，並理解 merge 到 `master` 會觸發 Vercel production 部署。** 不需要再問是否建立 PR 或是否 merge；但不能繞過 branch protection、失敗的檢查或未解決的實質問題，也不要直接 push 到 master。其他環境、權限、DNS 或資料庫變更不在這次授權範圍。

若 `design/`、品牌資產或設計文件仍未追蹤，請把本次相關的原型／資產／文件與實作納入 PR，讓它們在其他 session 與工作環境也可取得；不要無差別提交其他人的未提交內容、環境檔或 secrets。遇到 checkout 障礙先用可保留資料的方式處理，不 reset 或隱式 stash。建立 PR 後將 PR 附加到本 task。

PR 描述要讓沒看過討論的 reviewer 知道：採用 B3＋原 2B、各頁改了什麼、保留了哪些流程、實際檢查與任何未驗證範圍。Merge 前檢查 diff、CI 與可取得的 Preview；若工具或外部條件阻擋必要步驟，清楚報告已完成部分與具體阻礙，不假稱成功。

**Merge 後等 Vercel production 部署成功，再用瀏覽器確認畫面是否如我們想像的一樣。** 核對該 deployment 對應本次 merge commit，查看首頁、建立、能安全取得的填答／結果、登入／帳號畫面，以及 favicon、品牌圖示與窄螢幕版面。Production 只做安全的閱讀／視覺確認，不建立或提交測試問卷。要確認真正的畫面與資產，不能只看到 CI 綠燈就結束。

若畫面明顯不符或發生可修復的回歸，繼續在 feature branch 修正，透過後續 PR、檢查與 merge 完成，再驗證部署；不直接修改 production branch。

最後用繁體中文簡潔交付：PR 連結、merge commit、部署與實際檢視的 URL／畫面、主要修改、驗證結果、設計系統文件、未驗證範圍。請直接 create PR then merge，並在 merge 後確認畫面是否如想像的一樣，完成這個循環再回報。
