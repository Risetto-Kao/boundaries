# 開發指南

## Local development

GitHub repository：`Risetto-Kao/boundaries`；正式分支：`master`。
Next.js app 位於 `frontend/`。Node 使用根目錄 `.nvmrc`（24.21.0），
pnpm 固定 10.13.1。支援的 Node 範圍另見 `frontend/package.json`。

```sh
nvm install
nvm use
npm install --global pnpm@10.13.1
cd frontend
cp .env.example .env.local
# 將 placeholder 換成「開發專用」資料庫設定。
pnpm install --frozen-lockfile
pnpm dev
```

用 VS Code 開啟 repository 根目錄，安裝官方 Codex IDE extension 並以自己的
ChatGPT 帳號登入；此登入仍需本人操作。VS Code terminal 也先執行 `nvm use`。
網站通常位於 http://localhost:3000；若 port 被占用，以 terminal 顯示的 URL 為準。

```sh
pnpm lint
pnpm typecheck
pnpm build
pnpm start
```

目前 **沒有自動測試套件或 test 指令**。lint/typecheck/build 不等於功能測試。
CI 對 master push 與指向 master 的 PR 執行上述三項檢查。
Prisma client 在 install 的 postinstall 階段產生，不需要真實資料庫。

## Environment variables

只可提交 `.env.example`；真實值放在本機 `.env.local` 或 hosting/Cloud 的安全設定。
不要把本機 `.env.local` 上傳到 Cloud，也不要在 task 文字中貼上憑證。

| Variable | 用途 |
| --- | --- |
| `DATABASE_URL` | production runtime 優先使用的 PostgreSQL 連線；Cloud/Preview 請使用隔離資料庫 |
| `DIRECT_URL` | development runtime 優先使用的連線，以及 Prisma CLI 的連線 |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase client 的公開 project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client 的公開 anon/publishable key，仍需資料庫 RLS 保護 |
| `SUPABASE_SERVICE_ROLE_KEY` | 現有 runtime 沒有使用，不需為 build 或 Cloud 填入；不可公開 |

Next.js 自動讀取 `.env.local`；Prisma CLI 不會讀取這個檔案。
若確定對開發資料庫執行 Prisma 指令，可用
`node --env-file=.env.local node_modules/prisma/build/index.js <command>`。
沒有 `DIRECT_URL` 時產生 client 仍可成功；資料庫命令則必須提供連線。
不得為了測試執行 production migration、reset、seed 或 db push。
現有 schema 尚無追蹤的 migration 歷史；建置不會自動修改 schema。

## Cloud development

**狀態：published Cloud 環境已完成實際 smoke check；手機／跨裝置同步與資料庫互動尚未驗證。**
目前官方文件：https://learn.chatgpt.com/docs/environments/cloud-environments

在 Web 或 Desktop 的新 task 選 `Work in > Cloud > Select environment > Create environment`，
或 `Settings > Codex Cloud > Environments > Create environment`。
選 `Risetto-Kao/boundaries`；若要求 GitHub OAuth，由本人完成授權。
先建立 Only me 環境，Get started 後請 setup 使用：

- Node 24.21.0、pnpm 10.13.1。
- Install script：`bash scripts/codex-setup.sh`（從 repository 根目錄執行）。
- 檢查：`pnpm --dir frontend lint`、`pnpm --dir frontend typecheck`、`pnpm --dir frontend build`。
- Start skill：從 repository 根目錄執行 `pnpm --dir frontend dev --hostname 0.0.0.0`，
  等待 Ready，再 GET `/create` 確認回傳 200。
- Network：以 Package managers 範圍為起點；Prisma 如需下載 engine，再允許 `binaries.prisma.sh`。
  GitHub 推送依帳號提供的存取方式；不要將本機 SSH key 複製進容器。
- 環境變數：離線 build 模式無需真實 secrets。setup script 僅在 `.env.local` 不存在時
  寫入 localhost 連線占位值；**不會啟動資料庫**。若環境已有該檔案，必須檢查其來源再 Publish。

離線模式可安裝、build、lint、typecheck、啟動 static pages；
問卷列表、填答、建立與結果的完整互動需要隔離的開發資料庫及資料表。
先確認 Cloud 可用的 PostgreSQL 連線方式，再由本人透過 Personal vault 設定
`DATABASE_URL` / `DIRECT_URL`，不要填入 production credentials。
HTTPS Network secret 不能直接取代 PostgreSQL 連線字串。
Cloud 環境準備、檢查、review 後 Save 並 Publish；看到 Environment published 才算完成。
手機使用同一 ChatGPT 帳號，進入 Codex 選這個 published environment；
實際可用性仍需從本人的 iPhone 驗證。

### Published Cloud smoke check（2026-10-06）

- 基準：GitHub 最新 master 與 Cloud checkout 均為 `90b003169161b4e00a53d1077c4a85930eba7581`。
- Published 設定：Only me（依本次使用者提供的設定）、Node 24.21.0、pnpm 10.13.1；
  Network 為 restricted、Package managers + `binaries.prisma.sh`。
  實際 `/etc/codex/network-policy.json` 包含該網域，runtime status 回報 `enforced`。
- Install script 完整環境如下；每個檢查 shell 均載入相同變數，未變更 HOME：

```sh
export PATH=/workspace/.boundaries-tools/node-v24.21.0-linux-x64/bin:$PATH
export npm_config_prefix=/workspace/.boundaries-tools/node-v24.21.0-linux-x64
export npm_config_cache=/workspace/.boundaries-tools/npm-cache
export XDG_DATA_HOME=/workspace/.boundaries-tools/data
export XDG_CACHE_HOME=/workspace/.boundaries-tools/cache
export XDG_CONFIG_HOME=/workspace/.boundaries-tools/config
mkdir -p "$XDG_DATA_HOME" "$XDG_CACHE_HOME" "$XDG_CONFIG_HOME"
bash scripts/codex-setup.sh
```

- 原 setup 成功（exit 0）；postinstall 與單獨 `prisma generate` 均成功產生
  Prisma Client v7.4.0，確認 `PrismaClient` export 為 function。
- `pnpm --dir frontend lint`、`typecheck`、`build` 均成功（exit 0）。Test suite：**None**。
- `pnpm --dir frontend dev --hostname 0.0.0.0 --port 3000` 顯示 Ready；
  唯讀 GET `http://127.0.0.1:3000/create` 回傳 **HTTP 200**。
- 初次 command sandbox 對代理連線與本機 port 綁定回報 EPERM；經正式
  `require_escalated` 命令審核後上述檢查通過。未永久關閉 sandbox、修改網路政策、
  繞過代理或停用 checksum/TLS 檢查。
- 使用既有 localhost 離線占位值，沒有新增 secrets、啟動資料庫、使用正式 DB、
  執行 migrations/seed 或資料寫入。HTTP 200 不代表手機視覺、問卷互動或資料庫功能已驗證。

## Branch workflow / Sync

日常一個修改一個 branch：

```sh
git switch master
git pull --ff-only origin master
git switch -c codex/my-change
# 修改，執行 lint/typecheck/build
git add <本次修改的檔案>
git commit -m "Describe the change"
git push -u origin codex/my-change
```

Cloud 修改應推 feature branch、建立指向 master 的 PR；檢查 diff、CI 與 Preview
後才 merge。不要 force push。同步前先 `git status`；若有未提交修改先保留並處理，
不要直接覆蓋、隱式 stash 或 reset。

回 Mac 查看 Cloud branch：

```sh
git fetch origin
git switch --track origin/codex/my-change
# 若本機已有該 branch：git switch codex/my-change && git pull --ff-only
```

PR merge 後：`git switch master`，`git pull --ff-only origin master`。
若出現 divergence，先檢查兩邊 commits，再處理，不要強行覆蓋。

Cloud smoke task 建議只在本文件新增一行測試記錄，執行三項 checks，推
`codex/cloud-smoke-test` 並開 PR；Mac fetch/checkout 後比對 commit SHA。
本次已在實際 Codex Cloud 執行上述檢查；Mac fetch/checkout、PR、手機與資料庫互動仍未驗證。

## Preview / Production

已從 GitHub deployment 記錄確認：Vercel project 為
`risettokaos-projects/boundaries`，master 先前成功部署到 Production。
Project：https://vercel.com/risettokaos-projects/boundaries

master push / PR merge 會觸發正式部署；已實測 feature branch push 經 Vercel Git integration
成功建立 Preview。Node 20 已被 Vercel 停用，新建置統一使用 Node 24。
Node 24 驗證 Preview：https://boundaries-8uh7vlave-risettokaos-projects.vercel.app
手機存取與實際 UI 仍需驗證。
目前只有 `codex/node24-deployment` branch 的 DATABASE_URL/DIRECT_URL 設為 localhost
占位值；其他 branch 仍繼承既有 All Environments 設定。建立其他 Preview 前，
必須先配置隔離開發 DB 或該 branch 的離線占位值，不得對 production DB 試填問卷。
不要為了測試 Cloud 推 master。GitHub CI 不代表 Vercel 必然等待 CI 成功才部署；
目前沒有替你更改 branch protection 或 deployment protection。

Vercel 設定應核對 Root Directory `frontend`、Framework Next.js、pnpm frozen install、
Build `pnpm build`。Preview 必須使用開發專用資料庫，不能繼承 production DB。
Preview URL 可從 PR checks 或 Vercel deployment detail 取得，手機 Safari 登入自己的
Vercel 帳號查看受保護 Preview；不要關閉既有 protection。

## Domain

已驗證既有網域 `boundaries.weave-us.com`：HTTPS 首頁與 `/create` 回傳 200，
HTTP 以 308 轉向 HTTPS；DNS CNAME 為 `27dd56c83911e1cf.vercel-dns-017.com`。
這是現有記錄的檢查結果，不是要求新增或更改 DNS。
登入既有 Vercel project 的 Settings > Domains，
Vercel 已顯示自有網域與 `boundaries-kappa.vercel.app` 均為 Valid Configuration。
若未來更換網域，依 Vercel「該網域」提供的實際 DNS records
到 DNS provider 設定。不要用架構文件中的範例 IP/CNAME 代替實際指定值，
不要擅自刪除既有 records。

## UI verification

本機：`pnpm dev` → Arc → 檢查首頁、建立頁、手機尺寸、console/network、主要互動。
資料庫寫入前先確認連線屬於隔離開發 DB；離線模式只能驗證 static UI。
手勢填答要檢查左右滑、雙擊、必填、提交和結果，最好在 iPhone Safari 實測。

Cloud：可執行程式檢查；視覺驗證需依該 task 實際 browser 能力判定，不能假設存在。
可使用 Cloud PR → Vercel Preview → iPhone Safari → 回報問題 → Cloud 修改；
回 Mac 時再使用 Local Codex + Arc 做視覺 debugging。
