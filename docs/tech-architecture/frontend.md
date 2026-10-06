# 🎨 前端架構文件

> **技術棧**：Next.js 14 + TypeScript + Tailwind CSS + Shadcn/ui  
> **部署平台**：Vercel  
> **開發時間**：3-5 天

---

## 📊 技術棧詳細說明

### 核心框架

| 技術 | 版本 | 用途 | 選擇理由 |
|------|------|------|----------|
| **Next.js** | 14.x | React 框架 | App Router + Server Actions + SSR |
| **React** | 18.x | UI 函式庫 | 生態系完整、社群支援強 |
| **TypeScript** | 5.x | 類型系統 | 減少 Runtime 錯誤、提升開發效率 |
| **Tailwind CSS** | 3.x | CSS 框架 | Utility-First、快速開發、RWD 友善 |

### UI 組件庫

| 技術 | 用途 | 選擇理由 |
|------|------|----------|
| **Shadcn/ui** | 組件庫 | 可自訂、Accessible、無 Bundle Size 負擔 |
| **Radix UI** | Headless UI | Shadcn/ui 的底層、無樣式組件 |
| **Lucide React** | Icon 庫 | 輕量、Tree-shakeable、風格統一 |

### 狀態管理 & 資料抓取

| 技術 | 用途 | 選擇理由 |
|------|------|----------|
| **Zustand** | 全域狀態管理 | 輕量（<1KB）、簡單、TypeScript 友善 |
| **Server Actions** | 資料抓取 | 內建於 Next.js、減少 API 層開發 |
| **Server Components** | SSR 資料 | 預設 Server-side Rendering |

### 表單處理

| 技術 | 用途 | 選擇理由 |
|------|------|----------|
| **React Hook Form** | 表單驗證 | 效能好、與 Zod 整合完美 |
| **Zod** | Schema 驗證 | TypeScript-first、錯誤訊息友善 |

---

## 🗂️ 專案結構

```
boundaries/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # 根佈局（全域樣式、字型）
│   ├── page.tsx                 # 首頁（Landing Page）
│   ├── globals.css              # 全域 CSS（Tailwind 設定）
│   │
│   ├── create/                  # 創建問卷頁面
│   │   ├── page.tsx            # 主頁面
│   │   └── actions.ts          # Server Actions（建立問卷）
│   │
│   ├── survey/                  # 問卷相關頁面
│   │   └── [id]/               # 動態路由（問卷 ID）
│   │       ├── page.tsx        # 填寫問卷頁
│   │       ├── actions.ts      # Server Actions（提交答案）
│   │       └── result/         # 結果頁
│   │           └── page.tsx    # 矩陣視圖頁
│   │
│   └── api/                     # API Routes（保留給特殊需求）
│       └── og/                  # Open Graph 圖片生成
│           └── route.ts
│
├── components/                   # React 組件
│   ├── ui/                      # Shadcn/ui 基礎組件
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── table.tsx
│   │   ├── dialog.tsx
│   │   └── toast.tsx
│   │
│   ├── survey/                  # 問卷專用組件
│   │   ├── QuestionForm.tsx    # 問題編輯表單
│   │   ├── QuestionList.tsx    # 問題列表
│   │   ├── SwipeAnswerCard.tsx # 單題卡片手勢作答（Yes/No/Depends）
│   │   └── MatrixView.tsx      # 結果矩陣表格
│   │
│   └── shared/                  # 共用組件
│       ├── CopyLinkButton.tsx  # 複製連結按鈕
│       ├── ShareButton.tsx     # 分享按鈕
│       └── LoadingSpinner.tsx  # 載入動畫
│
├── lib/                         # 工具函式 & 設定
│   ├── supabase/               # Supabase 客戶端
│   │   ├── client.ts           # 瀏覽器端客戶端
│   │   └── server.ts           # Server 端客戶端
│   ├── prisma.ts               # Prisma 客戶端
│   ├── utils.ts                # 通用工具函式（cn, formatDate）
│   └── validations.ts          # Zod Schema 定義
│
├── store/                       # Zustand 狀態管理
│   └── survey-store.ts         # 問卷建立流程狀態
│
├── types/                       # TypeScript 型別定義
│   ├── survey.ts               # 問卷相關型別
│   └── database.ts             # 資料庫型別（Prisma 自動生成）
│
├── public/                      # 靜態資源
│   ├── favicon.ico
│   └── og-image.png            # Open Graph 預設圖片
│
├── prisma/                      # Prisma ORM
│   ├── schema.prisma           # 資料庫 Schema
│   └── migrations/             # Migration 檔案
│
├── .env.local                   # 環境變數（本地開發）
├── next.config.js              # Next.js 設定
├── tailwind.config.ts          # Tailwind CSS 設定
├── tsconfig.json               # TypeScript 設定
├── components.json             # Shadcn/ui 設定
└── package.json                # 專案依賴
```

---

## 🎯 核心頁面設計

### 1. 創建問卷頁 (`/create`)

#### 功能需求
- 輸入問卷標題 & 描述
- 動態新增問題（1-20 題）
- 即時預覽
- 儲存後跳轉到分享頁

#### UI 結構
```typescript
// app/create/page.tsx
export default function CreateSurveyPage() {
  return (
    <main className="container max-w-3xl mx-auto py-8">
      <h1>建立新問卷</h1>
      <SurveyForm />
    </main>
  );
}

// components/survey/SurveyForm.tsx
function SurveyForm() {
  const [questions, setQuestions] = useState<string[]>([]);
  
  return (
    <form action={createSurveyAction}>
      <Input name="title" placeholder="問卷標題" />
      <Textarea name="description" placeholder="問卷說明" />
      
      <QuestionList 
        questions={questions}
        onAdd={() => setQuestions([...questions, ''])}
        onChange={(index, value) => {
          const newQ = [...questions];
          newQ[index] = value;
          setQuestions(newQ);
        }}
      />
      
      <Button type="submit">建立問卷</Button>
    </form>
  );
}
```

#### Server Action
```typescript
// app/create/actions.ts
'use server'

import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const createSurveySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  questions: z.array(z.string().min(1)).min(1).max(20),
});

export async function createSurveyAction(formData: FormData) {
  // 1. 驗證資料
  const data = createSurveySchema.parse({
    title: formData.get('title'),
    description: formData.get('description'),
    questions: JSON.parse(formData.get('questions') as string),
  });

  // 2. 建立 Survey + Questions（Transaction）
  const survey = await prisma.survey.create({
    data: {
      title: data.title,
      description: data.description,
      questions: {
        create: data.questions.map((text, index) => ({
          text,
          order_index: index,
        })),
      },
    },
  });

  // 3. 跳轉到問卷頁
  redirect(`/survey/${survey.id}`);
}
```

---

### 2. 填寫問卷頁 (`/survey/[id]`)

#### 功能需求
- 顯示問卷標題
- 輸入暱稱
- 單題畫面，手勢作答（右滑 Yes / 左滑 No / 連點兩下 Depends）
- 驗證所有題目都已填寫
- 提交後跳轉結果頁

#### UI 結構
```typescript
// app/survey/[id]/page.tsx
export default async function SurveyPage({ params }: { params: { id: string } }) {
  // Server Component：直接抓資料
  const survey = await prisma.survey.findUnique({
    where: { id: params.id },
    include: { questions: { orderBy: { order_index: 'asc' } } },
  });

  if (!survey) notFound();

  return (
    <main className="container max-w-2xl mx-auto py-8">
      <h1>{survey.title}</h1>
      <p className="text-muted-foreground">{survey.description}</p>
      
      <AnswerForm survey={survey} />
    </main>
  );
}

// components/survey/AnswerForm.tsx (Client Component)
'use client'

function AnswerForm({ survey }) {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [nickname, setNickname] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // 驗證所有問題都已回答
    if (Object.keys(answers).length !== survey.questions.length) {
      toast.error('請回答所有問題');
      return;
    }

    // 提交
    const result = await submitResponseAction({
      surveyId: survey.id,
      nickname,
      answers,
    });

    if (result.success) {
      // 儲存到 localStorage（防止重複填寫）
      localStorage.setItem(`survey_${survey.id}`, nickname);
      
      // 跳轉結果頁
      router.push(`/survey/${survey.id}/result`);
    }
  };

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentQuestion = survey.questions[currentIndex];

  const handleAnswer = (value: Answer) => {
    if (!currentQuestion) return;
    setAnswers({ ...answers, [currentQuestion.id]: value });
    if (currentIndex < survey.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        placeholder="你的暱稱"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        required
      />

      <SwipeAnswerCard
        question={currentQuestion?.text ?? ''}
        value={currentQuestion ? answers[currentQuestion.id] : undefined}
        onAnswer={handleAnswer}
      />

      <Button type="submit">提交答案</Button>
    </form>
  );
}
```

#### 單題手勢作答卡
```typescript
// components/survey/SwipeAnswerCard.tsx
type Answer = 'yes' | 'no' | 'depends';

function SwipeAnswerCard({ question, value, onAnswer }: {
  question: string;
  value?: Answer;
  onAnswer: (value: Answer) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="font-medium">{question}</p>
      <div
        className="rounded-lg border p-4 text-center"
        onPointerDown={/* 記錄起點 */}
        onPointerUp={/* 判斷左滑/右滑 */}
        onDoubleClick={() => onAnswer('depends')}
      >
        <p className="text-sm text-muted-foreground">
          右滑 Yes / 左滑 No / 連點兩下 Depends
        </p>
        <p className="mt-2 text-sm">目前答案：{value ?? '尚未作答'}</p>
      </div>
    </div>
  );
}
```

---

### 3. 結果矩陣頁 (`/survey/[id]/result`)

#### 功能需求
- 顯示所有參與者的答案（矩陣視圖）
- 顏色編碼（綠/紅/灰）
- 複製連結按鈕
- 邀請朋友填寫 CTA

#### 資料查詢
```typescript
// app/survey/[id]/result/page.tsx
export default async function ResultPage({ params }: { params: { id: string } }) {
  // 複雜查詢：一次 JOIN 取得所有資料
  const matrixData = await prisma.$queryRaw`
    SELECT 
      q.id as question_id,
      q.text as question,
      q.order_index,
      r.id as response_id,
      r.nickname,
      a.value as answer
    FROM questions q
    CROSS JOIN responses r
    LEFT JOIN answers a ON a.question_id = q.id AND a.response_id = r.id
    WHERE q.survey_id = ${params.id} AND r.survey_id = ${params.id}
    ORDER BY q.order_index, r.submitted_at
  `;

  // 轉換為矩陣格式
  const matrix = transformToMatrix(matrixData);

  return (
    <main className="container mx-auto py-8">
      <MatrixView data={matrix} />
      <ShareButtons surveyId={params.id} />
    </main>
  );
}
```

#### 矩陣視圖組件
```typescript
// components/survey/MatrixView.tsx
function MatrixView({ data }: { data: MatrixData }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-white">
          <tr>
            <th className="border p-2">問題</th>
            {data.participants.map((p) => (
              <th key={p} className="border p-2">{p}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.questions.map((q, i) => (
            <tr key={q.id}>
              <td className="border p-2 font-medium">{q.text}</td>
              {data.participants.map((participant) => {
                const answer = data.answers[participant]?.[i];
                return (
                  <td 
                    key={participant}
                    className={cn(
                      'border p-2 text-center',
                      answer === 'yes' && 'bg-green-100 text-green-700',
                      answer === 'no' && 'bg-red-100 text-red-700',
                      answer === 'depends' && 'bg-gray-100 text-gray-700'
                    )}
                  >
                    {answer ? answerEmoji[answer] : '-'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const answerEmoji = {
  yes: '✅',
  no: '❌',
  depends: '⚪',
};
```

---

## 🎨 樣式設計指南

### 色彩系統（Tailwind 自訂）

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        // 品牌色
        primary: {
          50: '#f0fdf4',
          500: '#22c55e',  // 主色（綠色）
          600: '#16a34a',
        },
        // 答案色
        answer: {
          yes: '#22c55e',    // 綠色
          no: '#ef4444',     // 紅色
          depends: '#6b7280', // 灰色
        },
      },
    },
  },
};
```

### 組件樣式慣例

```typescript
// 使用 cn() 合併 className
import { cn } from '@/lib/utils';

<Button 
  className={cn(
    'base-class',
    isActive && 'active-class',
    variant === 'primary' && 'variant-class'
  )}
/>
```

---

## 📱 RWD 響應式設計

### 斷點設定（Tailwind 預設）

```typescript
sm: '640px'   // 手機橫向
md: '768px'   // 平板直向
lg: '1024px'  // 平板橫向 / 小筆電
xl: '1280px'  // 桌機
```

### 矩陣視圖 RWD 策略

```typescript
// 手機：垂直滾動 + 橫向滾動
<div className="overflow-x-auto">
  <table className="min-w-full">
    {/* 固定第一欄 */}
    <th className="sticky left-0 bg-white z-10">問題</th>
  </table>
</div>

// 桌機：完整顯示
<div className="hidden lg:block">
  <table>{/* 完整矩陣 */}</table>
</div>

// 手機：卡片式顯示（V2 考慮）
<div className="lg:hidden space-y-4">
  {participants.map(p => (
    <Card>
      <h3>{p.nickname}</h3>
      {answers.map(a => (
        <div>{a.question}: {a.value}</div>
      ))}
    </Card>
  ))}
</div>
```

---

## 🚀 性能優化策略

### 1. Server Components 優先

```typescript
// ✅ 預設使用 Server Component（無 'use client'）
// app/survey/[id]/page.tsx
export default async function SurveyPage() {
  const data = await fetchData(); // Server-side
  return <View data={data} />;
}

// ❌ 僅在需要互動時才用 Client Component
// components/survey/AnswerForm.tsx
'use client'
export function AnswerForm() {
  const [state, setState] = useState();
  // ...
}
```

### 2. 圖片優化（Next.js Image）

```typescript
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Boundaries"
  width={200}
  height={50}
  priority // 首頁 Logo 優先載入
/>
```

### 3. 字型優化（next/font）

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // 避免 FOUT
});

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW" className={inter.className}>
      {children}
    </html>
  );
}
```

### 4. Code Splitting（自動）

```typescript
// Next.js 自動處理 Code Splitting
// 每個 page.tsx 自動分割成獨立 bundle
```

---

## 🔐 安全性考量

### XSS 防護

```typescript
// ✅ React 預設 Escape HTML
<div>{userInput}</div> // 自動轉義

// ❌ 危險：使用 dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

### CSRF 防護

```typescript
// Server Actions 自動處理 CSRF Token
// 無需手動設定
```

---

## 📦 專案初始化步驟

### 1. 建立 Next.js 專案

```bash
pnpx create-next-app@latest boundaries \
  --typescript \
  --tailwind \
  --app \
  --src-dir=false \
  --import-alias="@/*" \
  --eslint
```

### 2. 安裝核心依賴

```bash
cd boundaries

# UI & 樣式
pnpm add class-variance-authority clsx tailwind-merge
pnpm add lucide-react

# 表單處理
pnpm add react-hook-form zod @hookform/resolvers

# 狀態管理
pnpm add zustand

# Supabase & Prisma
pnpm add @supabase/supabase-js @prisma/client
pnpm add -D prisma
```

### 3. 安裝 Shadcn/ui

```bash
pnpx shadcn-ui@latest init

# 選擇選項
✔ Would you like to use TypeScript? Yes
✔ Which style would you like to use? Default
✔ Which color would you like to use as base color? Slate
✔ Where is your global CSS file? app/globals.css
✔ Would you like to use CSS variables for colors? Yes
✔ Where is your tailwind.config.js located? tailwind.config.ts
✔ Configure the import alias for components: @/components
✔ Configure the import alias for utils: @/lib/utils

# 安裝常用組件
pnpx shadcn-ui@latest add button input card table toast dialog
```

### 4. 設定環境變數

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
DATABASE_URL=postgresql://xxx
```

### 5. 初始化 Prisma

```bash
pnpx prisma init
# 編輯 prisma/schema.prisma（見後端文件）
pnpx prisma db push
pnpx prisma generate
```

---

## 🧪 開發工作流程

### 本地開發

```bash
pnpm dev          # 啟動開發伺服器（http://localhost:3000）
pnpm build        # 建置生產版本
pnpm start        # 執行生產版本
pnpm lint         # ESLint 檢查
```

### 代碼品質

```bash
pnpm lint         # ESLint
pnpm format       # Prettier（需安裝）
```

---

## 📈 未來擴展規劃

### V2 功能
- [ ] 問卷編輯功能（需要複雜狀態管理）
- [ ] 衝突高亮 + 一致性標記（前端計算）
- [ ] QR Code 生成（qrcode.react）
- [ ] 分享預覽卡（next-seo）

### V3 功能
- [ ] 即時更新（Supabase Realtime）
- [ ] 圖表視覺化（Recharts）
- [ ] PWA 支援（next-pwa）
- [ ] 國際化（next-intl）

---

**文件版本**：v1.0  
**最後更新**：2026-02-18  
**維護者**：前端團隊
