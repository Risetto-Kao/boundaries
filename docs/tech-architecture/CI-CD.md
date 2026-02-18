# 🚀 CI/CD 部署文件

> **部署平台**：Vercel（前端 + Server Actions）+ Supabase（資料庫）  
> **部署時間**：首次 5 分鐘，後續自動部署 < 1 分鐘  
> **成本**：$0（免費方案足夠 MVP 使用）

---

## 📊 部署架構總覽

```
GitHub Repository
       │
       ├──► Vercel（自動部署）
       │    ├── Next.js App（SSR + SSG）
       │    ├── Server Actions（API 層）
       │    ├── Edge Functions（可選）
       │    └── Static Assets（CDN）
       │
       └──► Supabase（手動設定一次）
            ├── PostgreSQL Database
            ├── Auth（V2）
            └── Storage（V2）
```

---

## 🔧 部署流程詳解

### 階段 1：Supabase 設定（一次性）

#### 1.1 建立 Supabase 專案

```bash
# 1. 前往 https://supabase.com
# 2. 點選 "New Project"
# 3. 填寫資訊：
Name: boundaries-prod（或 boundaries-dev）
Database Password: (強密碼，記得儲存！)
Region: Northeast Asia (Tokyo)  # 選擇離使用者最近的區域

# 4. 等待專案建立（約 2 分鐘）
```

#### 1.2 執行資料庫 Migration

```bash
# 方法 1：使用 Prisma Migrate（推薦）
# 確保 .env 設定正確
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# 執行 Migration
pnpx prisma migrate deploy

# 方法 2：使用 Supabase SQL Editor
# 1. 複製 prisma/schema.prisma 的 SQL
# 2. 前往 Supabase Dashboard > SQL Editor
# 3. 貼上並執行
```

#### 1.3 獲取環境變數

```bash
# Supabase Dashboard > Settings > API

# 記錄以下資訊（稍後要設定到 Vercel）：
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (保密！)

# Supabase Dashboard > Settings > Database > Connection String
DATABASE_URL=postgresql://postgres.xxx:xxx@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres
```

---

### 階段 2：Vercel 部署（自動化）

#### 2.1 連接 GitHub Repository

```bash
# 1. 前往 https://vercel.com
# 2. 點選 "Add New Project"
# 3. Import Git Repository
# 4. 選擇你的 boundaries repo
# 5. 選擇 Framework Preset: Next.js
```

#### 2.2 設定環境變數

```bash
# Vercel Dashboard > Settings > Environment Variables

# 新增以下變數（所有環境：Production, Preview, Development）
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
DATABASE_URL=postgresql://...（Connection Pooling）
DIRECT_URL=postgresql://...（Direct Connection）
```

#### 2.3 設定 Build 指令

```bash
# Vercel Dashboard > Settings > Build & Development Settings

# Build Command（預設即可，或自訂）
prisma generate && next build

# Install Command（使用 pnpm）
pnpm install

# Output Directory
.next
```

#### 2.4 部署

```bash
# 首次部署：點選 "Deploy"
# Vercel 會自動：
# 1. 拉取程式碼
# 2. 安裝依賴（pnpm install）
# 3. 執行 Build（prisma generate && next build）
# 4. 部署到全球 CDN
# 5. 產生預覽 URL（如：boundaries.vercel.app）

# 部署完成！
```

---

## 🔄 自動化部署流程

### Git Workflow

```bash
# 開發流程
main（生產環境）
  ├── develop（開發環境）
  │     ├── feature/matrix-view
  │     ├── feature/copy-link
  │     └── ...
  └── hotfix/xxx（緊急修復）
```

### Vercel 自動部署規則

| Git 動作 | Vercel 行為 | 環境 | 用途 |
|---------|------------|------|------|
| `git push origin main` | 自動部署到生產環境 | Production | 正式上線 |
| `git push origin develop` | 自動部署到預覽環境 | Preview | 測試環境 |
| 建立 PR | 自動建立預覽連結 | Preview | Code Review |

### 自動化腳本

```bash
# 本地測試 → 提交 → 自動部署

# 1. 本地開發
pnpm dev

# 2. 提交代碼
git add .
git commit -m "feat: add matrix view"
git push origin feature/matrix-view

# 3. 建立 Pull Request
# GitHub > New Pull Request
# Vercel 自動產生預覽連結（如：boundaries-git-feature-xxx.vercel.app）

# 4. Code Review 通過後 Merge to main
# Vercel 自動部署到生產環境（boundaries.vercel.app）
```

---

## 🌍 自訂網域設定

### 設定步驟

```bash
# 1. 購買網域（如：boundaries.app）
# 推薦：Cloudflare Registrar / Namecheap

# 2. Vercel Dashboard > Settings > Domains
# 輸入：boundaries.app

# 3. 設定 DNS 紀錄（在你的網域商）
Type: A
Name: @
Value: 76.76.21.21（Vercel IP）

Type: CNAME
Name: www
Value: cname.vercel-dns.com

# 4. 等待 DNS 傳播（5 分鐘 - 48 小時）

# 5. Vercel 自動產生 SSL 憑證（Let's Encrypt）
```

---

## 📊 環境管理策略

### 多環境設定

| 環境 | Git Branch | Vercel URL | Supabase Project | 用途 |
|------|-----------|-----------|-----------------|------|
| **Development** | `develop` | dev.boundaries.app | boundaries-dev | 開發測試 |
| **Production** | `main` | boundaries.app | boundaries-prod | 正式上線 |

### 環境變數管理

```bash
# Vercel 支援不同環境的變數
# Settings > Environment Variables

# 設定變數時選擇環境：
☑ Production
☑ Preview
☑ Development

# 範例：使用不同的 Supabase 專案
# Production:
NEXT_PUBLIC_SUPABASE_URL=https://prod.supabase.co

# Preview/Development:
NEXT_PUBLIC_SUPABASE_URL=https://dev.supabase.co
```

---

## 🔍 監控 & 除錯

### Vercel Analytics（免費）

```bash
# 1. 安裝套件
pnpm add @vercel/analytics

# 2. 加入到 Layout
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}

# 3. Vercel Dashboard > Analytics
# 可查看：頁面瀏覽量、載入時間、裝置分布
```

### Vercel Logs（即時日誌）

```bash
# Vercel Dashboard > Deployments > [選擇部署] > Runtime Logs

# 或使用 Vercel CLI
pnpm add -g vercel
vercel logs [DEPLOYMENT_URL]

# 查看即時日誌
vercel logs --follow
```

### Error Tracking（可選）

```bash
# 整合 Sentry（生產環境推薦）
pnpm add @sentry/nextjs

# 初始化
pnpx @sentry/wizard@latest -i nextjs

# 設定環境變數
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

---

## ⚡ 性能優化

### 1. 啟用 Vercel Speed Insights

```bash
pnpm add @vercel/speed-insights

// app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### 2. 設定快取策略

```typescript
// app/survey/[id]/result/page.tsx

// 設定頁面快取（減少資料庫查詢）
export const revalidate = 60; // 60 秒重新驗證

// 或使用 ISR（Incremental Static Regeneration）
export async function generateStaticParams() {
  const surveys = await prisma.survey.findMany({
    select: { id: true },
    take: 100, // 預先生成熱門問卷
  });

  return surveys.map((survey) => ({
    id: survey.id,
  }));
}
```

### 3. 設定 Vercel Edge Config（進階）

```bash
# 儲存常用設定到 Edge（全球分佈）
# 如：功能開關、A/B 測試設定
pnpm add @vercel/edge-config

// lib/feature-flags.ts
import { get } from '@vercel/edge-config';

export async function isFeatureEnabled(feature: string) {
  return await get(feature);
}
```

---

## 🔐 安全性設定

### 1. 環境變數保護

```bash
# ✅ 正確：使用 NEXT_PUBLIC_ 前綴（客戶端可見）
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# ❌ 錯誤：敏感資訊不加前綴（僅 Server 端可見）
SUPABASE_SERVICE_ROLE_KEY=xxx  # 不要加 NEXT_PUBLIC_！
DATABASE_URL=xxx
```

### 2. CORS 設定（Vercel 自動處理）

```typescript
// next.config.js（如需自訂）
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://boundaries.app' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
        ],
      },
    ];
  },
};
```

### 3. Rate Limiting（Vercel Edge Middleware）

```typescript
// middleware.ts（V2 考慮）
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests / 10 seconds
});

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

---

## 💰 成本估算

### 免費額度（足夠 MVP 使用）

| 服務 | 免費額度 | 預估可支撐 | 超出後費用 |
|------|---------|-----------|----------|
| **Vercel** | 100GB 頻寬/月 | 10 萬次頁面瀏覽 | $20/月（Pro） |
| **Supabase** | 500MB DB + 1GB Storage | 1 萬問卷 + 10 萬填寫 | $25/月（Pro） |
| **總計** | **$0/月** | 足夠 MVP 驗證 | 成長後約 $45/月 |

### 成本優化建議

```bash
# 1. 啟用 Vercel 圖片優化（自動壓縮）
# next.config.js
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

# 2. 使用 Next.js 靜態生成（減少 Server 負擔）
export const revalidate = 3600; // 1 小時快取

# 3. Supabase Connection Pooling（防止連線數爆炸）
DATABASE_URL=postgresql://...pooler.supabase.com:6543/postgres
```

---

## 🚨 緊急回滾流程

### 方案 1：Vercel Dashboard 回滾

```bash
# 1. Vercel Dashboard > Deployments
# 2. 找到上一個穩定版本
# 3. 點選 "..." > "Promote to Production"
# 4. 立即生效（< 1 分鐘）
```

### 方案 2：Git Revert

```bash
# 1. 本地回滾
git revert HEAD
git push origin main

# 2. Vercel 自動重新部署（約 1-2 分鐘）
```

### 方案 3：資料庫 Migration 回滾

```bash
# Prisma 不支援自動回滾，需手動執行

# 1. 找到 Migration 檔案
prisma/migrations/xxx_bad_migration/migration.sql

# 2. 撰寫反向 SQL
-- 範例：如果 Migration 是 ADD COLUMN
ALTER TABLE surveys DROP COLUMN new_field;

# 3. 在 Supabase SQL Editor 執行

# 4. 更新 Prisma Schema
# 5. 重新部署
```

---

## 📋 部署檢查清單

### 上線前檢查

- [ ] ✅ 環境變數已設定（Vercel + Supabase）
- [ ] ✅ 資料庫 Migration 已執行
- [ ] ✅ Prisma Client 已生成
- [ ] ✅ 測試資料已清除（或保留範例）
- [ ] ✅ Error Tracking 已設定（Sentry / Vercel Logs）
- [ ] ✅ Analytics 已安裝（Vercel Analytics）
- [ ] ✅ OG Meta 已設定（社交分享卡）
- [ ] ✅ Favicon 已上傳
- [ ] ✅ 測試所有核心功能：
  - [ ] 建立問卷
  - [ ] 填寫問卷
  - [ ] 查看矩陣結果
  - [ ] 複製連結
- [ ] ✅ 手機瀏覽測試（iOS Safari + Android Chrome）
- [ ] ✅ 效能測試（Lighthouse Score > 90）

### 上線後監控

- [ ] ✅ 查看 Vercel Logs（有無錯誤）
- [ ] ✅ 查看 Supabase Dashboard（資料庫連線正常）
- [ ] ✅ 測試生產環境 URL（實際填寫問卷）
- [ ] ✅ 設定 Uptime Monitoring（如：UptimeRobot）

---

## 🔄 持續整合 (CI) 設定（進階）

### GitHub Actions（可選）

```yaml
# .github/workflows/ci.yml

name: CI

on:
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm lint

  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm tsc --noEmit

  build:
    runs-on: ubuntu-latest
    env:
      NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm build
```

---

## 📚 相關資源

### 官方文件
- [Vercel 部署文件](https://vercel.com/docs)
- [Next.js 部署指南](https://nextjs.org/docs/deployment)
- [Supabase 部署指南](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Prisma 部署最佳實踐](https://www.prisma.io/docs/guides/deployment)

### 工具推薦
- **Uptime Monitoring**: [UptimeRobot](https://uptimerobot.com)（免費）
- **Error Tracking**: [Sentry](https://sentry.io)（免費額度）
- **Performance**: [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

---

**文件版本**：v1.0  
**最後更新**：2026-02-18  
**維護者**：DevOps 團隊
