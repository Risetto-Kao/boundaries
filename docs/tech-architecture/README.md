# 📁 技術架構文件導覽

> **Boundaries 專案技術文件**  
> 適合：工程師、技術決策者  
> 閱讀時間：約 30 分鐘

---

## 📋 文件清單

### 🔍 [00-decision-analysis.md](./00-decision-analysis.md)
**必讀！技術選型分析**

深度評估三個關鍵問題：
1. Parse Server vs Supabase vs Firebase
2. NoSQL vs SQL（未來加登入功能的考量）
3. Firebase 的後端邏輯限制

**結論**：選擇 Supabase + Next.js 的原因與權衡

---

### 🎨 [frontend.md](./frontend.md)
**前端架構完整指南**

包含：
- Next.js 14 專案結構
- 組件設計（創建問卷、填寫、矩陣視圖）
- Server Actions 實作細節
- RWD 響應式設計
- 性能優化策略
- 專案初始化步驟

**適合**：前端工程師、全端工程師

---

### 🗄️ [backend.md](./backend.md)
**後端架構完整指南**

包含：
- Supabase + PostgreSQL 資料庫設計
- Prisma Schema 定義
- Server Actions API 設計
- 查詢優化技巧
- Migration 策略
- Row Level Security（V2）

**適合**：後端工程師、全端工程師、DBA

---

### 🚀 [CI-CD.md](./CI-CD.md)
**部署流程完整指南**

包含：
- Vercel 自動部署設定
- Supabase 專案設定
- 環境變數管理
- 多環境策略（Dev/Prod）
- 監控 & 除錯
- 成本估算
- 緊急回滾流程

**適合**：DevOps、全端工程師、專案負責人

---

## 🚀 快速開始（5 分鐘上手）

### 1. 先讀技術決策分析
```bash
閱讀：00-decision-analysis.md
了解：為什麼選擇這個技術棧
```

### 2. 依角色閱讀對應文件
```bash
前端工程師 → frontend.md
後端工程師 → backend.md
全端工程師 → 三份都讀
DevOps     → CI-CD.md
```

### 3. 開始專案初始化
```bash
依照 frontend.md > 專案初始化步驟
執行指令建立專案
```

---

## 📊 技術棧速覽

| 層級 | 技術 | 用途 |
|------|------|------|
| **前端** | Next.js 14 + TypeScript + Tailwind | React 框架 + 樣式 |
| **UI 組件** | Shadcn/ui + Radix UI | 無樣式組件庫 |
| **後端** | Supabase (PostgreSQL) | BaaS 平台 |
| **ORM** | Prisma | 類型安全的資料庫操作 |
| **API** | Next.js Server Actions | 取代傳統 REST API |
| **部署** | Vercel | 自動 CI/CD |

---

## 🎯 開發里程碑

### Week 1：MVP 開發
- [ ] Day 1-2：專案初始化 + 資料庫設計
- [ ] Day 3-4：創建問卷頁 + 填寫問卷頁
- [ ] Day 5：結果矩陣頁
- [ ] Day 6：分享功能 + 防呆機制
- [ ] Day 7：測試 + 部署

---

## 🔗 外部資源

- [Next.js 官方文件](https://nextjs.org/docs)
- [Supabase 官方文件](https://supabase.com/docs)
- [Prisma 文件](https://www.prisma.io/docs)
- [Tailwind CSS 文件](https://tailwindcss.com/docs)
- [Shadcn/ui 組件庫](https://ui.shadcn.com)

---

## 🤝 貢獻指南

1. 發現文件錯誤？提 Issue
2. 想補充內容？提 PR
3. 技術問題？查看對應文件的「未來擴展」章節

---

**文件版本**：v1.0  
**最後更新**：2026-02-18  
**維護者**：技術團隊
