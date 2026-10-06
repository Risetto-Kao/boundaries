# 🎯 Boundaries

> **社交化問卷工具** - 讓群體決策更透明，找出衝突與共識

一個讓使用者快速建立問卷、邀請朋友填寫，並以**矩陣視圖**即時查看所有人的答案的 Web App。

---

## 🌟 核心特色

- ✅ **零門檻參與**：無需註冊，填寫暱稱即可開始
- 📊 **矩陣視圖**：一眼看出誰跟誰想法不同
- 🚀 **快速分享**：一鍵複製連結，病毒式傳播
- 🎨 **視覺化差異**：綠色 Yes / 紅色 No / 灰色 Depends
- 👆 **手勢作答**：單題畫面，右滑 Yes / 左滑 No / 連點兩下 Depends

---

## 📖 專案文件

### 📋 產品文件
- [introduction.md](./introduction.md) - 專案簡介與核心理念
- [PRD.md](./PRD.md) - 產品需求文件
- [MVP.md](./MVP.md) - MVP 功能規劃與優先級
- [docs/MVP-P0-endpoints.md](./docs/MVP-P0-endpoints.md) - 目前可用頁面路由與 API 端點整理

### 🏗️ 技術文件
📁 [docs/tech-architecture/](./docs/tech-architecture/)
- [README.md](./docs/tech-architecture/README.md) - 技術文件導覽（從這裡開始）
- [00-decision-analysis.md](./docs/tech-architecture/00-decision-analysis.md) - **必讀！** 技術選型深度分析
- [frontend.md](./docs/tech-architecture/frontend.md) - 前端架構指南
- [backend.md](./docs/tech-architecture/backend.md) - 後端架構指南
- [CI-CD.md](./docs/tech-architecture/CI-CD.md) - 部署流程指南

---

## 🚀 快速開始

### 給產品經理 / 設計師
```bash
1. 閱讀 introduction.md（了解產品理念）
2. 閱讀 MVP.md（了解功能優先級）
3. 閱讀 PRD.md（了解詳細需求）
```

### 給工程師

本機、Codex Cloud、同步與部署請先閱讀 [開發指南](docs/DEVELOPMENT.md)。

```bash
nvm install
nvm use
npm install --global pnpm@10.13.1
cd frontend
cp .env.example .env.local  # 填入開發資料庫設定；不要使用正式資料庫
pnpm install --frozen-lockfile
pnpm dev
```

```bash
1. 閱讀 docs/tech-architecture/00-decision-analysis.md（了解技術選型）
2. 依角色閱讀對應文件：
   - 前端 → frontend.md
   - 後端 → backend.md
   - DevOps → CI-CD.md
3. 按照 frontend.md 的「專案初始化步驟」開始開發
```

---

## 🛠️ 技術棧

| 層級 | 技術 |
|------|------|
| **前端** | Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 + Shadcn/ui |
| **後端** | Supabase (PostgreSQL) + Prisma ORM |
| **API** | Next.js Route Handlers |
| **部署** | Vercel + Supabase Cloud |

**為什麼選擇這個技術棧？** 👉 [閱讀完整分析](./docs/tech-architecture/00-decision-analysis.md)

---

## 📅 開發計劃

### MVP（Week 1）
- [x] 技術選型完成
- [ ] 專案初始化
- [ ] 創建問卷頁
- [ ] 填寫問卷頁
- [ ] 矩陣結果頁
- [ ] 分享功能
- [ ] 測試 & 部署

### V2（未來）
- [ ] 問卷編輯功能
- [ ] 衝突高亮 + 一致性標記
- [ ] QR Code 分享
- [ ] 使用者登入系統

### V3（更遠的未來）
- [ ] 即時更新（WebSocket）
- [ ] 相容度演算法
- [ ] 公開模板市集
- [ ] 統計後台

---

## 🎯 核心使用場景

> **旅遊絕交問卷**  
> 旅遊前讓朋友們填寫習慣問題（如「能不能排隊 30 分鐘」），透過矩陣一眼看出誰跟誰合不來。

```
矩陣視圖範例：

              │ Alice │ Bob   │ Carol │
──────────────┼───────┼───────┼───────┤
排隊30分鐘？    │ ✅ Yes │ ❌ No  │ ⚪ Depends │
早上6點起床？   │ ❌ No  │ ✅ Yes │ ❌ No     │
臨時改行程？    │ ✅ Yes │ ✅ Yes │ ❌ No     │
```

**洞察**：Alice 和 Carol 可能不適合一起旅遊！

---

## 🤝 貢獻指南

歡迎任何形式的貢獻！

1. Fork 本專案
2. 建立你的功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的修改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

---

## 📄 授權

MIT License

---

## 📞 聯絡方式

- **專案負責人**：[你的名字]
- **Email**：[your-email@example.com]
- **問題回報**：[GitHub Issues](https://github.com/your-username/boundaries/issues)

---

**專案狀態**：🚧 MVP 開發中  
**最後更新**：2026-03-03
