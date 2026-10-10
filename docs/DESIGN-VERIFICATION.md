# B3 設計導入驗證

日期：2026-10-10（Asia/Taipei）。基底為最新 production master `43b7b7c`，保留其四語、結果切換與安裝功能。

## 本機

Node 24.21.0、pnpm 10.13.1。另啟動 127.0.0.1:3001，以 loopback 離線占位資料庫及 ACCOUNT_HISTORY_ENABLED=false 覆寫環境，未使用正式資料庫、未執行 migration／seed。

Arc 實際查看 B3 原型首頁與填答，並輔以瀏覽器 computed styles 確認 B／B2 繼承後的 B3 字型、粗細、題卡、回答按鈕。正式 Next.js 首頁、建立頁、登入／帳號訪客導向及既有安裝介面皆沿用相同設計。

| 檢查 | 實際結果 |
| --- | --- |
| Arc 桌面首頁／建立 | 單一品牌導覽、電光藍 CTA、無外層卡片；首頁顯示資料不可用狀態 |
| Arc 建立 390／320px | label、描述、題目與按鈕正常換行；新增問題聚焦新欄位 |
| Arc 填答 320px（開發展示） | 右滑→左滑→雙擊，各前進一題；進度 3/3；完成提示取得焦點，空暱稱仍不能提交 |
| Arc 結果 320／390／768px（開發展示） | 單題／矩陣切換；長中文、無空格英文題目及人名換行；局部橫向捲動 |
| 輔助 DOM 量測 320／390px | 首頁、建立、列表、登入、帳號訪客導向、安裝均無整頁水平溢出 |
| 輔助 DOM 量測 768／1280px | 首頁、建立、登入、安裝均無整頁水平溢出 |
| 控制項 | 輸入 48px、上一題 44px、回答 56px、提交 48px |
| 矩陣長文字展示 320px | 表格容器 265px、內部捲動寬 964px；頁寬未溢出 |
| 20 題上限 | 新增 19 題後共有 20 題，新增按鈕 disabled；焦點在 question-19；空題使提交 disabled |
| 多語 | Arc 實際切換繁體中文與英文；其餘語言保留相同 key 與插值結構，由既有 i18n 測試檢查 |
| 色彩 | 指定文字／背景配對皆至少 4.5:1，詳見設計系統 |

開發展示頁僅組合正式 SurveyResponseForm／SurveyResults 與明確標示的長文字假資料，不連資料庫，沒有提交答案。展示 route、獨立暫存 build 目錄與開發設定在交付前移除，不納入正式程式。

## 檢查與測試

lint、typecheck、production build 全數通過；既有 test:auth 6/6、test:i18n 5/5 通過。前三項是程式檢查，不是功能測試；兩組既有測試不涵蓋完整資料庫流程。

## 部署確認與限制

本次 codex/b3-design-system 的 DATABASE_URL／DIRECT_URL 已經使用者確認後，在 Vercel 設為僅限該分支 Preview 的 loopback 離線占位值。首次註冊遠端分支時暫停其自動部署，完成環境設定後即移除暫時設定；production 與其他分支設定未修改。

PR merge 前確認 CI、review、合併狀態及可取得的 Preview。merge 後核對 Vercel Production 的 merge commit 並在瀏覽器確認實際頁面；部署 URL 與畫面記錄由 PR／本次交付提供。

未實測：隔離資料庫的建立、提交與儲存流程、Google OAuth、登入後帳號歷史／分頁、iPhone Safari／加入主畫面、非 Mac 字型 fallback。正式站只進行安全閱讀和視覺確認，不建立或提交測試資料。
