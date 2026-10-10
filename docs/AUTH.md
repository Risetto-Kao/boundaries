# Google／LINE 登入與帳號紀錄

## 已實作的行為

- `/login` 使用已啟用的 Google／LINE → Supabase Auth → `/auth/callback`，以 PKCE 交換 session，儲存在 cookie。
- Next.js proxy 更新 session；伺服器以 `auth.getUser()` 驗證身分，不採信瀏覽器傳入的 user ID。
- 登入後建立表單，`surveys.owner_id` 儲存 Supabase `auth.users.id`。
- 登入後送出填答，`responses.user_id` 儲存同一帳號 ID；答案與帳號歸屬在同一次 Prisma nested create 寫入。
- `/account` 僅查詢目前帳號建立的表單及提交的填答，可展開自己的答案，各列表每頁 20 筆。
- 訪客可以建立、填答、分享與查看群體結果；歸屬欄位是 null，不建立 Supabase 匿名帳號，不使用 localStorage 儲存訪客歷史。
- 登出目前裝置後回到訪客模式。未送出的表單輸入不會跨登入導向保留，請先登入再填寫。
- 登入不會認領之前的訪客資料。舊資料仍保持沒有帳號歸屬。
- 共用問卷與群體結果仍採連結分享及公開列表，並非私人表單。帳號的建立／填答清單只顯示給本人。
- 保留既有「同一問卷暱稱不能重複」規則；更換帳號或切換訪客不會繞過資料庫限制。

## 1. 建立隔離的 Supabase 開發專案

從 [Supabase Dashboard](https://supabase.com/dashboard) 建立開發專案。
這個專案同時承載 Auth 與 PostgreSQL；公開 API URL/key、DATABASE_URL、DIRECT_URL
必須來自同一專案，否則新增的 Auth foreign key 會拒絕資料寫入。
不要以既有正式專案試填或測試。

全新空白專案，依序在 SQL Editor 執行：

1. `frontend/supabase/schema.sql`：建立四個原有資料表及索引（不可對既有資料庫執行）。
2. `frontend/supabase/account-history.sql`：補 Auth foreign keys、帳號索引、RLS 與 browser role 權限保護。

若開發專案已有現有四張表，只執行第二個檔案。這個腳本是 additive，舊表單與
答案不會被改成某人的歷史，也不會刪除既有資料。腳本可重跑。
目前 Prisma 沒有 migration baseline；這兩個 SQL 檔案不是 `prisma migrate deploy` 的 migration。
開發 schema 已在隔離的 Boundaries Dev 專案設定；正式資料庫尚未變更。

這個應用程式採 Next.js server + Prisma 存取資料；瀏覽器不直接存取表單資料表。
腳本啟用 RLS 並撤銷 `anon`／`authenticated` 的直接資料表權限，避免由公開 Supabase
key 讀取帳號歸屬或修改別人的紀錄。Prisma 使用 Supabase 提供的 server PostgreSQL
連線（例如 postgres role，具有 BYPASSRLS），不得把此連線交給 browser。
正式 rollout 前請確認其他程式是否依賴這些角色的直接資料表權限。

刪除 Supabase Auth 使用者時，foreign key 只清除歸屬欄位，保留共用問卷與結果；
這不等同刪除其送出過的內容。

## 2. Google OAuth 設定

依 [Supabase 官方 Google 登入指南](https://supabase.com/docs/guides/auth/social-login/auth-google)：

1. 在 [Google Cloud Console](https://console.cloud.google.com/) 建立或選擇專案。
2. Google Auth Platform 設定 Branding、Audience、Data Access，使用 `openid`、email、profile 範圍。
   開發階段使用 Testing，將可登入的 Google 帳號加入 Test users；正式開放前需檢查發布狀態。
3. 建立 OAuth Client，Application type 選 Web application。
4. Authorized JavaScript origins 加入本環境網站 origin，例如 `http://localhost:3000`。
5. Authorized redirect URIs 填入 **Supabase Dashboard > Authentication > Sign In / Providers > Google**
   顯示的 callback URL，一般為 `https://<project-ref>.supabase.co/auth/v1/callback`。
   此處不是 Next.js `/auth/callback`。
6. 在 Supabase 的 Google provider 開啟 Google，填入 Client ID 與 Client Secret，儲存。
   Google secret 只存 Supabase，不放 repo 或 NEXT_PUBLIC 環境變數。

## 3. Supabase Redirect URLs 與環境設定

Supabase Authentication > URL Configuration：

- Site URL：本環境 origin，例如 `http://localhost:3000`。
- Redirect URLs：加入 `http://localhost:3000/auth/callback**`。
  程式會加上 `?next=...` 回到原本的建立／填寫頁，因此需要允許 callback 的 query。
  僅對明確的網站 origin 與 callback 路徑使用這個 pattern，不允許任意外部網站。
- Preview：加入該 Preview 的 `https://<preview-host>/auth/callback**`；Preview 仍維持現有 deployment protection。
- 正式網站：使用正式專案及正式 origin 分別設定，不共用開發 DB；經另外授權的 rollout 後才啟用。

將 `frontend/.env.example` 複製為 `.env.local`，在本機安全設定：

- `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`：開發 Supabase API URL 與 anon/publishable key。
- `DATABASE_URL`、`DIRECT_URL`：同一開發專案的 server database connection，依 DEVELOPMENT.md 的 runtime 選擇規則。
- `ACCOUNT_HISTORY_ENABLED`：設定完成後設為 `true`；未設定或 false 時保持訪客模式。
- `AUTH_GOOGLE_ENABLED`：Google 設定完成後設為 true，預設 true。
- `AUTH_LINE_ENABLED`：LINE 設定完成後設為 true，預設 false。
- `AUTH_SITE_URL`：實際網站 origin，例如 `http://localhost:3000`，不要帶路徑。
  若使用不同 port 或 Preview URL，必須一起更新這項與 Supabase Redirect URLs。

完成 SQL、Google provider 與 redirect 設定後，才設定 `ACCOUNT_HISTORY_ENABLED=true` 並重新部署。
預設為 false：只提供訪客服務，不讀寫新增的帳號欄位，也不啟動 OAuth；
因此正式資料庫還沒更新時，既有表單仍可使用。正式啟用前的資料仍屬訪客資料。

登入功能的 `codex/google-login-history` 與 `codex/line-auth-setup` 分支已在 `frontend/vercel.json` 停用 Git Preview 部署，
避免繼承正式資料庫；master 的正式部署仍啟用。未來要建立 Preview，必須先配置隔離 DB。

不需要 `SUPABASE_SERVICE_ROLE_KEY`。請勿提交 `.env.local` 或把密鑰貼到聊天。
使用 Node `.nvmrc`、pnpm 10.13.1，執行 `pnpm --dir frontend dev`。

## 4. 驗證

程式檢查：

```sh
pnpm --dir frontend test:auth
pnpm --dir frontend lint
pnpm --dir frontend typecheck
pnpm --dir frontend build
```

`test:auth` 是導向、來源與供應商開關的 7 個單元測試；lint/typecheck/build 不是功能測試。
以下流程必須在確定隔離資料庫及 Google provider 設定完成後驗證：

1. Arc 開啟 `/login`，Google 登入後確認出現帳號導覽。
2. 登入帳號 A，建立表單並送出答案；`/account` 出現兩種紀錄，展開答案正確。
3. 登出、以訪客建立／填答，再登入 A；訪客資料不能出現在個人歷史。
4. 使用另一個 Arc profile 或無痕視窗登入帳號 B；不能在 `/account` 看到 A 的歷史。
5. A 換裝置重新登入，歷史仍存在；手機 Safari 使用隔離 DB 的 Preview URL 驗證。
6. 取消 Google 授權、過期 callback、錯誤 code、斷線時顯示可重試訊息。
7. 瀏覽器 Supabase anon/authenticated client 直接讀寫四張資料表被拒絕；server 表單 API 正常運作。
8. 資料庫無法存取時顯示紀錄載入失敗，而不是空白成功紀錄。

隔離的開發 Supabase 專案已建立並完成建表；provider 設定尚待完成，真實授權、資料庫
表單寫入、跨帳號與跨裝置流程尚未驗證。

## 5. 後續擴充

供應商集中於 `frontend/lib/auth/config.ts` 的 `authProviders`；登入入口、PKCE callback、
session 更新、帳號紀錄皆共用。新增 Apple 等 Supabase 內建 provider 時，在 Dashboard
啟用 provider、設定 secret／callback，再在清單加入 id、label、provider、scopes。
不需要改資料表或問卷寫入邏輯。

LINE 使用 `custom:line`，與 Google 共用 callback 與帳號紀錄。
每個供應商設定 `id`、`labelKey`、`provider`、`scopes`、`enabledEnv`、`enabledByDefault`。
四種語言都需加入按鈕文案；停用供應商不顯示按鈕，登入入口也拒絕啟動 OAuth。
不要以 email 或暱稱自動合併不同人的紀錄。
同一 Supabase user ID 的已連結供應商會共用紀錄；不同 user ID 不會自動合併。

## 本次本機驗證紀錄

使用離線 localhost database / Auth 占位設定，沒有對遠端資料庫讀寫：

- Node 24.21.0、pnpm 10.13.1；6 個 auth 單元測試、lint、typecheck、build 通過。
- HTTP 檢查：登入頁／建立頁 200；登入頁包含 Google 按鈕；未登入 account 回應包含登入導向。
- 9 項離線 HTTP 檢查通過；Google 登入入口產生 S256 PKCE challenge 與 verifier cookie，callback 指向本站。
- 取消授權 callback 回到錯誤頁，外部 next 被替換為 `/account`；未知 provider 不啟動登入。
- 跨來源建立請求 403；同來源無效表單 400；登出 303 回首頁；沒有有效表單寫入。
- 嘗試在 Arc 開啟登入頁、重新整理及帶到前景，Arc 內容區持續空白，未能確認畫面或操作。
  不把這項視為 UI 驗證通過，登入後與手機畫面仍待實際確認。

部署前另以 Prisma capture-only adapter 確認：訪客建立及提交產生的 INSERT
不含 owner_id／user_id，無需連線或寫入真實資料庫。正式 schema 變更仍未執行。

## LINE Login 與官方帳號設定

私人 LINE 帳號可以管理品牌的 Provider 與官方帳號。LINE Login channel 和官方帳號
是不同資源，公開名稱使用 Boundaries；不需為此另外建立私人 LINE 帳號。

1. 在 [LINE Developers Console](https://developers.line.biz/console/) 選品牌 Provider。
   本專案已建立 Boundaries（Provider ID `2005622145`）。Channel 建立後不能移到其他 Provider。
2. 新增 LINE Login channel，台灣、Web app，填入品牌描述與聯絡 email。
   管理者親自閱讀接受 Developers Agreement；Client Secret 只存安全設定。
3. LINE Login 的 Callback URL 填該環境的
   `https://<project-ref>.supabase.co/auth/v1/callback`，不是 Next.js callback。
4. 在 Supabase Authentication 設定 [Custom OAuth Provider](https://supabase.com/docs/guides/auth/custom-oauth-providers)。
   使用手動 OAuth2，identifier `custom:line`。設定參考
   `frontend/supabase/line-provider.example.json`，以 Channel ID／Secret 取代占位值。
   啟用 PKCE，scope `openid profile`，`email_optional=true`。
   LINE userinfo 的 `sub` 提供身分，不要求 email 權限，也不能將 LINE token 當成 Supabase session。
5. 開發 channel 維持 Developing，加入測試者；正式開放時再檢查 Published 設定。
   Published 不能退回 Developing。
6. 在 [LINE Official Account Manager](https://manager.line.biz/) 建立 Boundaries 台灣免費官方帳號。
   本人完成手機簡訊認證與服務條款。連結時到官方帳號設定啟用 Messaging API，
   選同一 Boundaries Provider，再到 LINE Login channel 連結官方帳號。
   只做登入不需將 Messaging API access token 放入應用程式。
7. 在隔離環境確認登入與個人紀錄後啟用 `AUTH_LINE_ENABLED=true`。

官方流程：[LINE Login](https://developers.line.biz/en/docs/line-login/getting-started/)、
[官方帳號與 Messaging API](https://developers.line.biz/en/docs/messaging-api/getting-started/)。
各環境使用各自的 Supabase 專案與 callback，密鑰不得提交到 Git。

## LINE 整合驗證紀錄（2026-10-10）

- 7 個 auth、5 個 i18n 單元測試通過；lint、typecheck、build 通過。
- Arc 實際檢視隔離的離線 localhost:3100/login：Google、LINE 與訪客入口皆顯示。
  這項只驗證登入 UI，不代表 OAuth 授權成功。
- Boundaries Dev（lmzqhamtvktsmxhtcmys）先查詢 public schema 為空，再執行
  schema.sql 與 account-history.sql。四張表 RLS=true、anon/authenticated SELECT=false，
  兩個 Auth foreign keys 已存在。正式 schema 未變更。
- 真實 Google／LINE 登入、個人紀錄寫入與跨帳號隔離仍待 provider／開發連線設定。
