# 🤔 技術選型深度分析

> **目的**：針對三個核心技術疑問進行客觀評估，找出最適合 Boundaries MVP 的技術方案

---

## 📊 問題總覽

1. **Parse Server** 做後端 + 部署問題
2. **NoSQL vs SQL** - 考量未來登入功能的 Schema 變更
3. **Firebase** 的後端邏輯限制問題

---

## 🔍 問題 1：Parse Server 評估

### ✅ Parse Server 的優勢

1. **開箱即用的後端功能**
   - 內建 RESTful API 和 GraphQL
   - 自動生成 CRUD 操作
   - 內建使用者認證系統
   - 檔案儲存功能

2. **靈活的資料模型**
   - 基於 MongoDB（NoSQL）
   - Schema 可動態調整
   - 支援關聯查詢（Pointer, Relation）

3. **開發效率高**
   - JavaScript SDK 與前端整合順暢
   - Cloud Code 可寫後端邏輯
   - Dashboard 方便管理資料

### ❌ Parse Server 的劣勢

1. **部署複雜度高** ⚠️
   ```
   需要自行部署：
   - Parse Server（Node.js 應用）
   - MongoDB（資料庫）
   - Redis（可選，用於 Session）
   - Parse Dashboard（管理介面）
   ```

2. **部署選項評估**

   | 部署方式 | 優點 | 缺點 | 成本（月） |
   |---------|------|------|----------|
   | **Railway** | 一鍵部署、自動擴展 | 免費額度低（5美元） | $5-20 |
   | **Render** | 免費額度可用、簡單 | 冷啟動慢、效能一般 | $0-7 |
   | **DigitalOcean** | 效能穩定、價格透明 | 需手動設定 Docker | $12-24 |
   | **AWS/GCP** | 彈性最高 | 設定複雜、成本難估 | $10-50 |
   | **Heroku** | 最簡單（已淘汰 Parse） | 2022 年取消免費方案 | $7+ |

3. **維護成本**
   - 需要監控 MongoDB 連線數
   - 需要處理 Server 升級
   - 需要自行備份資料庫

### 💡 Parse Server 最佳實踐

**如果選擇 Parse Server，建議方案：**

```yaml
# 使用 Railway 快速部署
Parse Server: Railway (自動部署 + MongoDB Atlas)
優點：
  - 一鍵部署，支援 GitHub Auto Deploy
  - 內建環境變數管理
  - MongoDB Atlas 免費 512MB
  - 自動 HTTPS

流程：
1. 使用 Parse Server Template
2. 連接 GitHub Repo
3. 設定環境變數
4. 自動部署完成
```

---

## 🔍 問題 2：NoSQL vs SQL 評估

### 🎯 你的核心擔憂
> "如果未來要加登入功能，改 DB Schema 是否麻煩？NoSQL 是否更靈活？"

### 📊 兩者對比分析

#### **SQL (PostgreSQL)** - 以 Supabase 為例

**優勢：**
1. ✅ **Schema 變更其實不難**
   ```sql
   -- 未來加登入功能，只需 Migration
   ALTER TABLE surveys ADD COLUMN user_id UUID REFERENCES users(id);
   
   -- 保持向下相容
   ALTER TABLE surveys ALTER COLUMN user_id SET DEFAULT NULL;
   ```

2. ✅ **類型安全 + 資料完整性**
   - Foreign Key 保證關聯正確
   - UNIQUE 約束防呆（如：暱稱重複）
   - Transaction 保證一致性

3. ✅ **複雜查詢更高效**
   ```sql
   -- 矩陣視圖查詢（JOIN 效能高）
   SELECT 
     q.text, 
     r.nickname, 
     a.value 
   FROM questions q
   JOIN answers a ON a.question_id = q.id
   JOIN responses r ON a.response_id = r.id
   WHERE q.survey_id = $1;
   ```

4. ✅ **未來擴展友善**
   - V2 加統計功能：用 Aggregate 查詢
   - V3 加相容度演算法：用 PostgreSQL Functions
   - 搜尋功能：內建 Full-Text Search

**劣勢：**
- ❌ Schema 需要事先設計（但這其實是好事）
- ❌ Migration 需要謹慎執行（有工具協助）

---

#### **NoSQL (MongoDB)** - 以 Parse Server 為例

**優勢：**
1. ✅ **Schema 靈活**
   ```javascript
   // 直接加欄位，不需要 Migration
   survey.set('user_id', user.id);
   await survey.save();
   ```

2. ✅ **嵌套資料方便**
   ```javascript
   // 可以直接儲存整個物件
   {
     title: "旅遊問卷",
     questions: [
       { text: "問題1", order: 1 },
       { text: "問題2", order: 2 }
     ]
   }
   ```

**劣勢：**
1. ❌ **關聯查詢效能差**
   ```javascript
   // 需要多次查詢或手動 JOIN
   const survey = await Survey.findById(id);
   const questions = await Question.find({ survey_id: id });
   const responses = await Response.find({ survey_id: id });
   // 無法一次 JOIN，需要手動組裝
   ```

2. ❌ **資料一致性難保證**
   - 沒有 Foreign Key，刪除 Survey 時 Questions 可能殘留
   - 需要手動寫 Cascade Delete 邏輯

3. ❌ **未來擴展受限**
   - 複雜統計查詢困難（如：計算相容度）
   - 資料量大時效能下降明顯

---

### 💡 結論：選 SQL 還是 NoSQL？

**對於 Boundaries 專案，建議選擇 SQL (PostgreSQL)**

| 考量點 | SQL | NoSQL | 勝出 |
|--------|-----|-------|------|
| MVP 開發速度 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | NoSQL |
| 未來加登入功能 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **平手** |
| 矩陣視圖查詢效能 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | SQL |
| 資料完整性 | ⭐⭐⭐⭐⭐ | ⭐⭐ | SQL |
| 未來擴展性（統計/演算法） | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | SQL |
| 部署成本 | ⭐⭐⭐⭐⭐（Supabase 免費） | ⭐⭐⭐（需付費） | SQL |

**關鍵原因：**
1. ❌ **Schema 變更不是 NoSQL 的優勢** - SQL Migration 工具已經很成熟
2. ✅ **矩陣視圖是核心功能** - SQL JOIN 查詢效能遠超 NoSQL
3. ✅ **未來有統計需求** - SQL Aggregate 更適合

---

## 🔍 問題 3：Firebase 評估

### ✅ Firebase 的優勢

1. **開發速度極快**
   ```javascript
   // 寫資料超簡單
   await addDoc(collection(db, 'surveys'), {
     title: '問卷標題',
     questions: [...]
   });
   ```

2. **內建完整生態系**
   - Authentication（支援多種登入方式）
   - Firestore（NoSQL 資料庫）
   - Storage（檔案儲存）
   - Hosting（靜態網站部署）
   - Analytics（數據分析）

3. **免費額度超高**
   - Firestore：50k 讀 / 20k 寫 / 天
   - Hosting：10GB 流量 / 月
   - Authentication：無限制

### ❌ Firebase 的限制

#### 1. **後端邏輯撰寫受限** ⚠️

**問題：Cloud Functions 的限制**
```javascript
// ✅ 可以寫簡單邏輯
exports.createSurvey = onCall(async (data) => {
  // 驗證、寫入資料庫
  return { id: 'xxx' };
});

// ❌ 複雜查詢很麻煩
// 例如：矩陣視圖需要多表 JOIN
exports.getMatrix = onCall(async (surveyId) => {
  // Firestore 沒有 JOIN，需要多次查詢
  const survey = await getDoc(surveyRef);
  const questions = await getDocs(questionsQuery); // 第 2 次
  const responses = await getDocs(responsesQuery); // 第 3 次
  
  // 手動組裝資料（效能差）
  const matrix = [];
  for (const response of responses.docs) {
    const answers = await getDocs(answersQuery); // N+1 查詢！
    // ...
  }
});
```

**為什麼這是問題？**
- Firestore 沒有 JOIN，矩陣視圖需要 N+1 查詢
- Cloud Functions 有冷啟動時間（2-5 秒）
- 複雜邏輯會讓成本快速上升（計費：執行時間 × 記憶體）

#### 2. **資料模型設計困難**

```javascript
// 方案 1：嵌套資料（反模式）
{
  survey_id: 'xxx',
  responses: [
    {
      nickname: 'Alice',
      answers: [
        { question_id: 'q1', value: 'yes' },
        { question_id: 'q2', value: 'no' }
      ]
    }
  ]
}
// 問題：更新單個答案需要重寫整個 document

// 方案 2：拆分 Collections（複雜查詢困難）
surveys/{surveyId}
responses/{responseId}
answers/{answerId}
// 問題：查矩陣需要多次查詢 + 手動 JOIN
```

#### 3. **成本不可預測**

```
免費額度用完後：
- 讀取：$0.06 / 100k 次
- 寫入：$0.18 / 100k 次
- Cloud Functions：$0.40 / 百萬次呼叫

矩陣視圖一次查詢可能：
- 1 次讀 survey
- 20 次讀 questions
- 50 次讀 responses
- 1000 次讀 answers
= 1071 次讀取 / 每次查看

1000 人查看 = 1,071,000 次讀取 = $0.64
```

### 💡 Firebase 適合的場景

✅ **適合 Firebase 的專案**
- 即時聊天 App（Realtime Database）
- 部落格、內容網站（Firestore + Hosting）
- 簡單的 CRUD App（如：待辦事項）

❌ **不適合 Firebase 的專案**
- 需要複雜關聯查詢（如：矩陣視圖）
- 需要自訂後端邏輯（演算法、排程任務）
- 需要精確成本控制

---

## 🎯 最終建議方案

### 🏆 推薦方案：**Supabase + Next.js**

| 項目 | 選擇 | 原因 |
|------|------|------|
| **前端** | Next.js 14 + TypeScript | App Router + Server Actions，減少 API 開發 |
| **後端** | Supabase (PostgreSQL) | 免費額度高、SQL 查詢效能好、內建 Auth |
| **ORM** | Prisma | 類型安全、Migration 工具完善 |
| **部署** | Vercel | 與 Next.js 完美整合、自動 CI/CD |
| **未來擴展** | Supabase Functions | 需要時可寫自訂後端邏輯（Deno/TypeScript） |

### ✅ 為什麼這是最佳方案？

#### 1. **開發速度快**
```typescript
// Next.js Server Actions - 不需要寫 API
'use server'
export async function createSurvey(data: SurveyInput) {
  const survey = await prisma.survey.create({ data });
  return survey.id;
}
```

#### 2. **查詢效能好**
```sql
-- 矩陣視圖：一次 JOIN 查詢完成
SELECT 
  q.text as question,
  r.nickname,
  a.value as answer
FROM questions q
CROSS JOIN responses r
LEFT JOIN answers a ON a.question_id = q.id AND a.response_id = r.id
WHERE q.survey_id = $1
ORDER BY q.order_index, r.submitted_at;
```

#### 3. **未來擴展容易**
```typescript
// V2 加登入功能：只需 Migration
// prisma/migrations/xxx_add_auth.sql
ALTER TABLE surveys ADD COLUMN user_id UUID;
ALTER TABLE surveys ADD FOREIGN KEY (user_id) REFERENCES auth.users(id);

// Supabase Auth 自動處理登入
const { data: { user } } = await supabase.auth.getUser();
```

#### 4. **成本可控**
```
免費額度（Supabase）：
- 500MB Database
- 1GB File Storage
- 50k Monthly Active Users
- Unlimited API Requests

預估可支撐：
- 10,000+ 問卷
- 100,000+ 填寫次數
- 1M+ API Requests
```

#### 5. **部署簡單**
```bash
# 1. Push to GitHub
git push origin main

# 2. Vercel 自動部署（無需額外設定）

# 3. 環境變數設定（Vercel Dashboard）
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
DATABASE_URL=postgresql://xxx
```

---

## 🔄 三個方案總結對比

| 方案 | 開發速度 | 查詢效能 | 後端彈性 | 部署難度 | 成本 | 推薦度 |
|------|---------|---------|---------|---------|------|--------|
| **Supabase + Next.js** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | $0 | ✅ **最推薦** |
| **Parse Server** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | $5-20/月 | ⚠️ 除非需要極高後端彈性 |
| **Firebase** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | 不可預測 | ❌ 不適合此專案 |

---

## 📝 決策結論

### ✅ 最終選擇：Supabase + Next.js

**決定性因素：**
1. ✅ **矩陣視圖是核心功能** - 需要高效的關聯查詢（SQL 勝出）
2. ✅ **未來有統計/演算法需求** - PostgreSQL Functions 更適合
3. ✅ **部署要簡單** - Supabase 免費 + Vercel 自動部署
4. ✅ **成本要可控** - 免費額度足夠 MVP 使用
5. ✅ **未來加登入不是問題** - Prisma Migration + Supabase Auth

**放棄 Parse Server 原因：**
- 部署複雜度高（需要自己管理 MongoDB + Server）
- 部署成本較高（Railway 最低 $5/月）
- NoSQL 對矩陣視圖查詢不友善

**放棄 Firebase 原因：**
- 矩陣視圖需要多次查詢（N+1 問題）
- Cloud Functions 冷啟動影響體驗
- 成本不可預測（讀取次數爆炸）

---

## 🚀 下一步行動

1. ✅ 確認技術選型：Supabase + Next.js
2. 📝 撰寫詳細的前端架構文件
3. 📝 撰寫詳細的後端架構文件
4. 📝 撰寫 CI/CD 部署文件
5. 🏗️ 開始專案初始化

---

**文件版本**：v1.0  
**最後更新**：2026-02-18  
**決策者**：開發團隊
