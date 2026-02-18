# 🗄️ 後端架構文件

> **技術棧**：Supabase (PostgreSQL) + Prisma ORM  
> **部署方式**：Supabase Cloud（免費方案）  
> **開發時間**：2-3 天

---

## 📊 技術棧詳細說明

### 核心技術

| 技術 | 版本 | 用途 | 選擇理由 |
|------|------|------|----------|
| **Supabase** | Latest | BaaS 平台 | PostgreSQL + Auth + Storage + Realtime |
| **PostgreSQL** | 15.x | 關聯式資料庫 | 複雜查詢效能好、資料完整性高 |
| **Prisma** | 5.x | ORM | 類型安全、Migration 工具完善 |
| **Next.js Server Actions** | 14.x | API 層 | 減少 API Routes 開發 |

### 為什麼選擇 Supabase？

| 功能 | 說明 | 競品對比 |
|------|------|----------|
| **免費額度高** | 500MB DB + 1GB Storage | Firebase: 1GB (但查詢收費) |
| **PostgreSQL** | 關聯式資料庫，JOIN 效能好 | MongoDB: NoSQL，JOIN 困難 |
| **內建 Auth** | 支援 Email/OAuth/Magic Link | 省下自建時間 |
| **Real-time** | WebSocket 訂閱資料變更 | V2 可直接啟用 |
| **Row Level Security** | 資料庫層級權限控制 | V2 加登入後使用 |
| **TypeScript SDK** | 類型安全的 API 呼叫 | 開發體驗好 |

---

## 🗄️ 資料庫設計

### ER Diagram（實體關聯圖）

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│   surveys   │◄──┐   │  questions   │       │  responses  │
├─────────────┤   │   ├──────────────┤   ┌──►├─────────────┤
│ id (PK)     │   └───┤ survey_id(FK)│   │   │ id (PK)     │
│ title       │       │ order_index  │   │   │ survey_id   │
│ description │       │ text         │   │   │ nickname    │
│ created_at  │       └──────────────┘   │   │ submitted_at│
└─────────────┘                          │   └─────────────┘
                                         │          ▲
                      ┌──────────────┐   │          │
                      │   answers    │   │          │
                      ├──────────────┤   │          │
                      │ id (PK)      │   │          │
                      │ response_id  ├───┘          │
                      │ question_id  ├──────────────┘
                      │ value        │
                      └──────────────┘
```

### Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // Supabase 需要
}

// 問卷主表
model Survey {
  id          String     @id @default(uuid())
  title       String     @db.VarChar(200)
  description String?    @db.Text
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")
  
  // 關聯
  questions   Question[]
  responses   Response[]
  
  @@map("surveys")
}

// 問題表
model Question {
  id         String   @id @default(uuid())
  surveyId   String   @map("survey_id")
  orderIndex Int      @map("order_index")
  text       String   @db.Text
  createdAt  DateTime @default(now()) @map("created_at")
  
  // 關聯
  survey     Survey   @relation(fields: [surveyId], references: [id], onDelete: Cascade)
  answers    Answer[]
  
  // 約束：同一問卷中 order_index 不可重複
  @@unique([surveyId, orderIndex], name: "unique_question_order")
  @@index([surveyId]) // 查詢優化
  @@map("questions")
}

// 回答表（代表一個人的填寫記錄）
model Response {
  id          String   @id @default(uuid())
  surveyId    String   @map("survey_id")
  nickname    String   @db.VarChar(50)
  submittedAt DateTime @default(now()) @map("submitted_at")
  
  // 關聯
  survey      Survey   @relation(fields: [surveyId], references: [id], onDelete: Cascade)
  answers     Answer[]
  
  // 約束：同一問卷中暱稱不可重複
  @@unique([surveyId, nickname], name: "unique_survey_nickname")
  @@index([surveyId]) // 查詢優化
  @@map("responses")
}

// 答案表（每題的答案）
model Answer {
  id         String   @id @default(uuid())
  responseId String   @map("response_id")
  questionId String   @map("question_id")
  value      String   @db.VarChar(10) // 'yes' | 'no' | 'depends'
  createdAt  DateTime @default(now()) @map("created_at")
  
  // 關聯
  response   Response @relation(fields: [responseId], references: [id], onDelete: Cascade)
  question   Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  
  // 約束：同一回答中，每個問題只能有一個答案
  @@unique([responseId, questionId], name: "unique_answer")
  @@index([responseId])
  @@index([questionId])
  @@map("answers")
}
```

### 索引策略

```sql
-- Prisma 自動生成的索引
CREATE INDEX "questions_survey_id_idx" ON "questions"("survey_id");
CREATE INDEX "responses_survey_id_idx" ON "responses"("survey_id");
CREATE INDEX "answers_response_id_idx" ON "answers"("response_id");
CREATE INDEX "answers_question_id_idx" ON "answers"("question_id");

-- 複合索引（查詢最佳化）
CREATE UNIQUE INDEX "unique_question_order" ON "questions"("survey_id", "order_index");
CREATE UNIQUE INDEX "unique_survey_nickname" ON "responses"("survey_id", "nickname");
CREATE UNIQUE INDEX "unique_answer" ON "answers"("response_id", "question_id");
```

---

## 🔌 API 設計（Server Actions）

### 為什麼用 Server Actions？

| 傳統 API Routes | Server Actions | 優勢 |
|----------------|----------------|------|
| 需要建立 `/api/surveys` | 直接寫函式 | 減少 50% 程式碼 |
| 需要手動驗證 Request | 內建 CSRF 保護 | 更安全 |
| 需要處理 CORS | 無 CORS 問題 | 簡化設定 |
| 需要序列化資料 | 自動序列化 | 減少錯誤 |

### 核心 Server Actions

#### 1. 創建問卷

```typescript
// app/create/actions.ts
'use server'

import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// 輸入驗證 Schema
const createSurveySchema = z.object({
  title: z.string().min(1, '標題不可空白').max(200, '標題過長'),
  description: z.string().max(1000, '說明過長').optional(),
  questions: z
    .array(z.string().min(1, '問題不可空白'))
    .min(1, '至少需要一個問題')
    .max(20, '最多 20 個問題'),
});

export async function createSurveyAction(data: unknown) {
  // 1. 驗證輸入
  const validated = createSurveySchema.parse(data);

  // 2. 使用 Transaction 建立 Survey + Questions
  const survey = await prisma.survey.create({
    data: {
      title: validated.title,
      description: validated.description,
      questions: {
        create: validated.questions.map((text, index) => ({
          text,
          orderIndex: index,
        })),
      },
    },
  });

  // 3. 跳轉到問卷填寫頁
  redirect(`/survey/${survey.id}`);
}
```

#### 2. 提交答案

```typescript
// app/survey/[id]/actions.ts
'use server'

import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const submitResponseSchema = z.object({
  surveyId: z.string().uuid(),
  nickname: z.string().min(1).max(50),
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      value: z.enum(['yes', 'no', 'depends']),
    })
  ),
});

export async function submitResponseAction(data: unknown) {
  // 1. 驗證輸入
  const validated = submitResponseSchema.parse(data);

  try {
    // 2. 檢查暱稱是否已存在
    const existing = await prisma.response.findUnique({
      where: {
        surveyId_nickname: {
          surveyId: validated.surveyId,
          nickname: validated.nickname,
        },
      },
    });

    if (existing) {
      return { 
        success: false, 
        error: '此暱稱已填寫過問卷' 
      };
    }

    // 3. 使用 Transaction 建立 Response + Answers
    await prisma.response.create({
      data: {
        surveyId: validated.surveyId,
        nickname: validated.nickname,
        answers: {
          create: validated.answers.map((a) => ({
            questionId: a.questionId,
            value: a.value,
          })),
        },
      },
    });

    // 4. 清除結果頁快取（讓新答案立刻顯示）
    revalidatePath(`/survey/${validated.surveyId}/result`);

    return { success: true };
  } catch (error) {
    console.error('Submit error:', error);
    return { 
      success: false, 
      error: '提交失敗，請稍後再試' 
    };
  }
}
```

#### 3. 獲取問卷資料（用於填寫頁）

```typescript
// app/survey/[id]/page.tsx
// 不需要 Server Action，直接在 Server Component 查詢

export default async function SurveyPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const survey = await prisma.survey.findUnique({
    where: { id: params.id },
    include: {
      questions: {
        orderBy: { orderIndex: 'asc' },
      },
    },
  });

  if (!survey) notFound();

  return <SurveyForm survey={survey} />;
}
```

#### 4. 獲取矩陣結果（複雜查詢）

```typescript
// app/survey/[id]/result/page.tsx

export default async function ResultPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  // 方案 1：使用 Prisma 關聯查詢（簡單但效能稍差）
  const survey = await prisma.survey.findUnique({
    where: { id: params.id },
    include: {
      questions: {
        orderBy: { orderIndex: 'asc' },
      },
      responses: {
        include: {
          answers: true,
        },
        orderBy: { submittedAt: 'asc' },
      },
    },
  });

  // 方案 2：使用原生 SQL（效能最佳）
  const matrixData = await prisma.$queryRaw<MatrixRow[]>`
    SELECT 
      q.id as question_id,
      q.text as question_text,
      q.order_index,
      r.id as response_id,
      r.nickname,
      r.submitted_at,
      a.value
    FROM questions q
    CROSS JOIN responses r
    LEFT JOIN answers a ON a.question_id = q.id AND a.response_id = r.id
    WHERE q.survey_id = ${params.id}::uuid 
      AND r.survey_id = ${params.id}::uuid
    ORDER BY q.order_index, r.submitted_at
  `;

  // 轉換為前端需要的格式
  const matrix = transformToMatrix(matrixData);

  return <MatrixView data={matrix} />;
}

// 資料轉換函式
function transformToMatrix(rawData: MatrixRow[]) {
  const questionsMap = new Map<string, string>();
  const participantsMap = new Map<string, string>();
  const answersMap = new Map<string, Map<string, string>>();

  rawData.forEach((row) => {
    // 收集問題
    questionsMap.set(row.question_id, row.question_text);
    
    // 收集參與者
    participantsMap.set(row.response_id, row.nickname);
    
    // 收集答案
    if (!answersMap.has(row.response_id)) {
      answersMap.set(row.response_id, new Map());
    }
    answersMap.get(row.response_id)!.set(row.question_id, row.value);
  });

  return {
    questions: Array.from(questionsMap.entries()).map(([id, text]) => ({
      id,
      text,
    })),
    participants: Array.from(participantsMap.entries()).map(([id, nickname]) => ({
      id,
      nickname,
    })),
    answers: answersMap,
  };
}
```

---

## 🔐 資料驗證 & 錯誤處理

### Zod Schema 集中管理

```typescript
// lib/validations.ts

import { z } from 'zod';

// 基礎 Schema
export const surveyIdSchema = z.string().uuid();
export const nicknameSchema = z.string().min(1).max(50);
export const answerValueSchema = z.enum(['yes', 'no', 'depends']);

// 複合 Schema
export const createSurveySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  questions: z.array(z.string().min(1)).min(1).max(20),
});

export const submitResponseSchema = z.object({
  surveyId: surveyIdSchema,
  nickname: nicknameSchema,
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      value: answerValueSchema,
    })
  ),
});

// TypeScript 型別推導
export type CreateSurveyInput = z.infer<typeof createSurveySchema>;
export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;
```

### 統一錯誤處理

```typescript
// lib/error-handler.ts

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
  }
}

export function handleError(error: unknown) {
  if (error instanceof z.ZodError) {
    return {
      success: false,
      error: '輸入資料格式錯誤',
      details: error.errors,
    };
  }

  if (error instanceof AppError) {
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }

  console.error('Unexpected error:', error);
  return {
    success: false,
    error: '系統錯誤，請稍後再試',
  };
}
```

---

## 🚀 Supabase 設定

### 1. 建立 Supabase 專案

```bash
# 1. 前往 https://supabase.com
# 2. Create New Project
# 3. 填寫資訊
Name: boundaries
Database Password: (自動生成或自訂)
Region: Northeast Asia (Tokyo)

# 4. 等待專案建立（約 2 分鐘）
```

### 2. 獲取連線資訊

```bash
# Settings > API

# Project URL
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co

# anon/public key（客戶端使用）
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# service_role key（後端使用，保密！）
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Settings > Database > Connection String

# Connection Pooling（推薦用於 Serverless）
DATABASE_URL=postgres://postgres.[PROJECT]:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres

# Direct Connection（用於 Migration）
DIRECT_URL=postgres://postgres.[PROJECT]:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
```

### 3. 設定環境變數

```bash
# .env.local（本地開發）
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
DATABASE_URL=postgresql://xxx (Connection Pooling)
DIRECT_URL=postgresql://xxx (Direct Connection)
```

### 4. 初始化 Prisma

```bash
# 1. 建立 Prisma Schema
pnpx prisma init

# 2. 編輯 prisma/schema.prisma（複製上面的 Schema）

# 3. 推送 Schema 到資料庫
pnpx prisma db push

# 4. 生成 Prisma Client
pnpx prisma generate
```

### 5. 建立 Supabase Client

```typescript
// lib/supabase/client.ts（瀏覽器端）
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// lib/supabase/server.ts（Server Component / Server Action）
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
```

---

## 📊 資料庫 Migration 策略

### 開發流程

```bash
# 1. 修改 prisma/schema.prisma

# 2. 建立 Migration
pnpx prisma migrate dev --name add_user_id

# 3. 生成 Prisma Client
pnpx prisma generate

# 4. 更新程式碼使用新欄位
```

### 生產環境部署

```bash
# Vercel 自動執行
# 在 Build Command 中加入：
prisma generate && prisma migrate deploy && next build
```

### V2 加登入功能的 Migration 範例

```sql
-- prisma/migrations/xxx_add_auth/migration.sql

-- 1. 加入 user_id 欄位（可選）
ALTER TABLE "surveys" ADD COLUMN "user_id" UUID;

-- 2. 加入外鍵約束（連接到 Supabase Auth）
ALTER TABLE "surveys" 
  ADD CONSTRAINT "surveys_user_id_fkey" 
  FOREIGN KEY ("user_id") 
  REFERENCES "auth"."users"("id") 
  ON DELETE SET NULL;

-- 3. 建立索引
CREATE INDEX "surveys_user_id_idx" ON "surveys"("user_id");

-- 4. 保持向下相容（既有資料 user_id 為 NULL）
```

---

## 🔍 查詢優化技巧

### 1. 使用 `include` vs `select`

```typescript
// ❌ 不好：抓取所有欄位
const survey = await prisma.survey.findUnique({
  where: { id },
  include: { questions: true, responses: true },
});

// ✅ 較好：只抓需要的欄位
const survey = await prisma.survey.findUnique({
  where: { id },
  select: {
    id: true,
    title: true,
    questions: {
      select: { id: true, text: true },
      orderBy: { orderIndex: 'asc' },
    },
  },
});
```

### 2. 批次查詢（避免 N+1）

```typescript
// ❌ N+1 問題
const surveys = await prisma.survey.findMany();
for (const survey of surveys) {
  const questions = await prisma.question.findMany({
    where: { surveyId: survey.id },
  });
}

// ✅ 一次查詢
const surveys = await prisma.survey.findMany({
  include: { questions: true },
});
```

### 3. 使用原生 SQL（複雜查詢）

```typescript
// 矩陣視圖：使用原生 SQL 效能最佳
const result = await prisma.$queryRaw`
  SELECT ...
  FROM questions q
  CROSS JOIN responses r
  LEFT JOIN answers a ON ...
`;
```

---

## 🔐 未來擴展：Row Level Security (RLS)

### V2 加入登入功能後的安全策略

```sql
-- 啟用 RLS
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;

-- 政策：所有人可讀取
CREATE POLICY "Public surveys are viewable by everyone"
  ON surveys FOR SELECT
  USING (true);

-- 政策：只有創建者可修改
CREATE POLICY "Users can update own surveys"
  ON surveys FOR UPDATE
  USING (auth.uid() = user_id);

-- 政策：只有創建者可刪除
CREATE POLICY "Users can delete own surveys"
  ON surveys FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 📦 Prisma Client 使用

### 全域單例模式（避免開發時連線爆炸）

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

### 使用範例

```typescript
import { prisma } from '@/lib/prisma';

// 建立
const survey = await prisma.survey.create({ data: {...} });

// 查詢
const survey = await prisma.survey.findUnique({ where: { id } });

// 更新
await prisma.survey.update({ where: { id }, data: {...} });

// 刪除
await prisma.survey.delete({ where: { id } });

// Transaction
await prisma.$transaction([
  prisma.survey.create({...}),
  prisma.question.createMany({...}),
]);
```

---

## 🧪 資料庫測試資料

### Seed Script

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 建立範例問卷
  const survey = await prisma.survey.create({
    data: {
      title: '旅遊絕交問卷',
      description: '出發前測試旅伴相容度',
      questions: {
        create: [
          { text: '可以排隊超過 30 分鐘嗎？', orderIndex: 0 },
          { text: '願意早上 6 點起床嗎？', orderIndex: 1 },
          { text: '可以接受臨時改行程嗎？', orderIndex: 2 },
        ],
      },
    },
  });

  // 建立範例回答
  await prisma.response.create({
    data: {
      surveyId: survey.id,
      nickname: 'Alice',
      answers: {
        create: [
          { questionId: survey.questions[0].id, value: 'yes' },
          { questionId: survey.questions[1].id, value: 'no' },
          { questionId: survey.questions[2].id, value: 'depends' },
        ],
      },
    },
  });

  console.log('Seed completed!');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
```

```bash
# 執行 Seed
pnpx prisma db seed
```

---

## 📈 未來擴展規劃

### V2 功能
- [ ] Supabase Auth 整合（Email/Google 登入）
- [ ] Row Level Security（資料權限控制）
- [ ] Supabase Storage（上傳問卷封面圖）

### V3 功能
- [ ] Supabase Realtime（即時更新矩陣）
- [ ] PostgreSQL Functions（相容度演算法）
- [ ] Full-Text Search（問卷搜尋）
- [ ] Supabase Edge Functions（複雜後端邏輯）

---

**文件版本**：v1.0  
**最後更新**：2026-02-18  
**維護者**：後端團隊
