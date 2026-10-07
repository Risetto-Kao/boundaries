# iPhone 主畫面

Boundaries 提供 manifest、PNG 主畫面圖示、Apple standalone metadata 與安全區域 padding。
導覽列的「加入主畫面」連到 `/install`，內含 Safari 操作步驟。
這次沒有加入離線快取；問卷及帳號功能仍需要網路。

## 實機驗證

1. 部署完成後，在 iPhone Safari 開啟 `https://boundaries.weave-us.com/`。
2. 進入「加入主畫面」，確認說明可讀、返回首頁正常。
3. Safari 分享 → 加入主畫面；若有「以網頁 App 開啟」，保持開啟。
4. 確認名稱為 Boundaries，圖示為深色底白色 B。
5. 從主畫面啟動：首頁正常載入，不顯示 Safari 網址列。
6. 進入建立頁再返回，旋轉直向／橫向，確認內容不被瀏海或底部手勢區遮住。
7. 關閉 App 再開啟。若啟用登入，確認登入／登出及 OAuth 返回流程；
   主畫面 App 可能需要另行登入，不能假設與 Safari 共用 session。
8. 完整建立、填答及結果流程只在使用隔離 DB 的 Preview 驗證，勿對正式 DB 試填。

曾加入舊版主畫面捷徑者，請刪除捷徑後重新加入，以更新圖示及開啟模式。
HTTPS 是部署前提；不用 App Store 或另外下載 iOS App。

## 開發驗證

依 DEVELOPMENT.md 執行 lint、typecheck、build 與既有 auth tests。
啟動後 GET `/install`、`/manifest.webmanifest` 及 manifest 引用的所有 PNG。
檢查 metadata 含 apple-mobile-web-app-capable、apple-touch-icon、manifest、
viewport-fit=cover，且 manifest 的 display 是 standalone、start_url/scope 是 `/`。
Cloud 無 iPhone Safari；HTTP 檢查不代表實機安裝或 OAuth 已驗證。
本分支在 vercel.json 停用自動 Preview；要啟用前先配置隔離 DB。
