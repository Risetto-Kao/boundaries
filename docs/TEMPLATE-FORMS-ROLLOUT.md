# 基底／可填寫表單上線

本次採用獨立的 7 張 `boundary_*` 表。基底公開、不能填答；產生的可填寫
表單保存當下題目與順序，不受來源修改影響。基底編輯在鎖定來源的交易內，
刪除原題目、整批重建。可填寫表單的題目和已提交答案由 API 與 SQL trigger
共同保護；修改標題／描述不會改題目。舊 `surveys/questions/responses/answers`
保留原樣，不搬移、不列入新列表；舊 `/surveys` 和 API 路由退役。

## 已確認規則

- 每個帳號／可辨識訪客在同一表單保留一份提交，允許暱稱重複。
- 完整提交才可讀同表單的共同結果，owner、基底作者與官方皆無例外。
- 訪客首次提交發給 HttpOnly cookie，正式環境 Secure、SameSite=Lax；有效期
  7 天。單一 session 可記錄多份表單，在原有效期內沿用；後續提交不延長期限。
  到期需重新完成提交取得新 session，舊答案保留。登入不接收訪客答案，
  但同瀏覽器尚有效的 guest cookie 仍可提供存取。
- 關閉只停止新提交，可重新開放；已完成者仍能查看結果。
- 重設連結增加存取版本，立即撤銷舊連結與既有結果資格，答案保留。
  已提交者持新連結，明確按「恢復結果資格」後可再看結果。
- 刪除提交會撤銷資格，之後可重新提交。刪除表單只刪該份快照與提交。
- 提交重試用隨機 request key、payload hash 與實際身分比對；不重複建立。
  失去訪客提交回應時，重試原 key 可恢復伺服器發出的同一 cookie。

## 路由與權限

| 入口 | 規則 |
| --- | --- |
| `/`、`/templates`、`/templates/:id` | 僅公開基底題目、官方／作者顯示名稱 |
| `/create`、`/templates/:id/edit` | 登入；編輯僅限自己的 USER 基底 |
| `/forms/:id?invite=...` | owner、有效邀請或尚有效的完成資格 |
| `/forms/:id/manage` | 僅 owner；不查詢或序列化答案、其他填答者暱稱 |
| `/forms/:id/results`、`/api/forms/:id/results` | 在同一鎖定交易內驗證有效提交，再讀取答案 |
| `/account` | 我的基底、我產生的表單、登入時提交的紀錄；不預載答案 |

所有 private HTML、RSC、API 回應禁止快取與索引。沒有 browser table policy；
Supabase anon/authenticated 的新表權限撤銷且啟用 RLS，資料只能由可信任的
Next.js／Prisma DB role 取得。程式的正式 DB role 必須擁有新表與 BYPASSRLS，
不得暴露至 browser。所有 mutation 保留同源 Origin 檢查。

## 正式上線順序

**以下是可審閱的 operator 步驟，程式、build、CI 不會自動執行。**
根目錄 AGENTS.md 禁止對 production 執行 migration 或寫入；在明確核准這次
新增 schema 前，不執行正式 SQL，也不 merge 導致程式先於資料表上線。

1. 備份現有 DB，確認正式 Supabase 專案與目前 Prisma role。不要清理舊資料。
2. 在隔離環境先執行 `frontend/supabase/template-forms.sql`；本次已在本機
   PostgreSQL 17 驗證。SQL 只新增 7 表、索引、約束、函式／trigger 與 RLS，
   不修改舊表、不導入填答資料。不是可重複執行的 Prisma baseline；已執行時
   不要重跑，先確認表／constraint／trigger 完整。
3. 經正式資料庫變更授權後，由受信任 operator 在正式 SQL Editor 執行同一檔。
   檔案內 BEGIN/COMMIT 保證整批成功或回滾。確認 7 表均已啟用 RLS，
   anon/authenticated 無表權限，runtime Prisma role 可操作新表。
4. 在 Vercel **Production** 安全環境設定新增 `FORM_ACCESS_KEY`：32 個隨機
   bytes 的 64 字元 hexadecimal secret。只放 server 環境，勿使用 NEXT_PUBLIC_、
   勿貼到 PR／聊天／log。可在本機用 `node:crypto.randomBytes(32)` 產生後
   直接存入安全檔或 secret manager；不需輸出值。此 key 必須保持穩定，
   日後任意更換會使已加密邀請連結無法解密。
5. 核對 `ACCOUNT_HISTORY_ENABLED=true`、Supabase 公開 URL／key 與 OAuth 設定。
   未啟用登入時訪客可填邀請，但無法建立、複製或產生表單。
6. 必要 checks 與 PR CI 通過、SQL／key 就緒後才合併到 master，觸發 Vercel。
   本分支 Preview 關閉，避免預覽誤接正式 DB；未改 DNS 或部署保護。
7. 確認 Vercel Production Ready。正式 smoke 以唯讀的首頁／登入頁為限。
   真實提交驗收須另外授權，不可為測試對正式 API 寫資料。

回滾應回到前一版程式部署；新增表保留。不要刪表、重置或處理舊資料。
上線後新 public list 起初可能為空；舊紀錄仍在舊表，但新 UI 不顯示，符合本次
不搬移規則。原瀏覽器未存草稿備份保存在 Codex artifact，未自動寫入正式 DB。

## 官方基底維護

一般帳號／HTTP API 只能建立 USER 基底。官方使用受控 CLI：

```sh
# 只在明確隔離 DB 或獲授權的 operator 目標執行；不要從 .env.local 隱式讀取。
# JSON: {"title":"...","description":"...","questions":["..."]}
# update/retire 另帶 "id"；retire 可只提供 id。
BOUNDARIES_ADMIN_DATABASE_URL='<operator connection>' \
  node frontend/scripts/official-template.mjs create ./official.json exact-db-hostname
```

支援 create/update/retire；update 原子重建題目、不改既有表單快照。沒有公開
admin route、無自行指定 official 的權限。正式官方內容與發布仍須另行指定；
本次沒有 seed 任意官方內容。

## 驗證紀錄

- `test:forms`：8 組 PostgreSQL 17 功能測試，含快照隔離、權限、重試／並發、
  同名、7 天、重設／恢復、刪除／重填、immutability、RLS、舊表保留。
  必須明確提供 localhost 的 `boundaries_forms_test` DB；其他目標拒絕寫入。
- 本機 Next.js HTTP：登入限定、strict 輸入、private HTML／API、owner 未提交
  無結果、HttpOnly cookie、來源編輯不影響結果、重設／恢復、guest 不進帳號、
  Origin 驗證。Auth 使用本機 stub，不代表真實 Google／LINE OAuth 驗收。
- Arc：實際檢查本機基底列表與官方／作者顯示；使用者同時操作後停止互動。
  滑動／雙擊／手機 Safari 尚未實機驗證。
- `lint`、`typecheck`、`build` 為程式檢查，不冒稱功能測試。

隔離功能檢查：

```sh
BOUNDARIES_TEST_DATABASE_URL=postgresql://127.0.0.1:55440/boundaries_forms_test \
  pnpm --dir frontend test:forms
```

GitHub CI 自建 disposable PostgreSQL 17 service 執行相同功能檢查。
