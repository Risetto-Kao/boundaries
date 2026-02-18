# 🧱 EPIC 1 – Template Creation (CMS / Builder)

| Feature               | Description   | Priority | Acceptance Criteria   |
| --------------------- | ------------- | -------- | --------------------- |
| Create Template       | 建立新問卷         | P0       | 使用者可輸入標題與描述並儲存        |
| Add Question          | 新增問題          | P0       | 可新增多題並排序              |
| Fixed Answer Type     | 三選一固定選項       | P0       | 預設 Yes / No / Depends |
| Edit Question         | 修改問題內容        | P1       | 可編輯問題文字               |
| Duplicate Template    | 複製既有 template | P1       | 一鍵複製並建立新 ID           |
| Public/Private Toggle | 公開或私人         | P1       | 可設定是否出現在模板列表          |

# 🧱 EPIC 2 – Survey Participation
| Feature          | Description | Priority | Acceptance Criteria |
| ---------------- | ----------- | -------- | ------------------- |
| Anonymous Entry  | 不強制登入       | P0       | 只需填名稱即可開始           |
| Answer Selection | 三選一選擇       | P0       | 每題必填才能提交            |
| Submission Lock  | 提交後不可修改     | P0       | 送出後不能再次填寫           |
| Auto Redirect    | 填完自動跳轉結果頁   | P0       | 提交後 1 秒內顯示結果頁       |
| Mobile Optimized | 手機填寫流暢      | P0       | UI 可單手操作            |

# 🧱 EPIC 3 – Social Result View (核心價值)

| Feature               | Description       | Priority | Acceptance Criteria |
| --------------------- | ----------------- | -------- | ------------------- |
| Matrix View           | 問題 × 人員矩陣         | P0       | 可橫向比較               |
| Conflict Highlight    | 有 Yes / No 同時存在標紅 | P0       | 自動偵測衝突              |
| Depends Neutral Style | Depends 使用中性色     | P0       | 不觸發衝突               |
| Real-time Update      | 新人加入即更新           | P1       | 刷新頁面可看到新增           |
| Compatibility Score   | 群體一致度百分比          | P2       | 計算一致率並顯示            |

# 🧱 EPIC 4 – Share & Virality
| Feature               | Description    | Priority | Acceptance Criteria |
| --------------------- | -------------- | -------- | ------------------- |
| Share Link            | 產生公開連結         | P0       | 可直接複製               |
| Open Result Page      | 不需登入可查看        | P0       | Link 可直接進入          |
| Invite CTA            | 結果頁顯示「邀請朋友填寫」  | P0       | 顯示邀請按鈕              |
| Copy Template CTA     | 可從結果頁複製模板      | P1       | 一鍵複製                |
| Preview Card Metadata | OG meta 支援社交分享 | P1       | 分享到社群顯示標題與簡述        |

# 🧱 EPIC 5 – Template Discovery
| Feature              | Description | Priority | Acceptance Criteria |
| -------------------- | ----------- | -------- | ------------------- |
| Public Template List | 列出公開模板      | P0       | 可瀏覽                 |
| Popular Ranking      | 依填寫數排序      | P1       | 顯示 Top 10           |
| Search               | 關鍵字搜尋       | P2       | 可搜尋標題               |
| Category Tag         | 分類標籤        | P2       | 可依類型篩選              |

# 🧱 EPIC 6 – Light Social Layer（社交感）
| Feature             | Description | Priority | Acceptance Criteria |
| ------------------- | ----------- | -------- | ------------------- |
| Click Person Filter | 點某人可查看其回答   | P1       | 可單人視圖               |
| Emoji Reaction      | 對某題加表情      | P2       | 每題可加 reaction       |
| Conflict Badge      | 顯示「高風險旅伴」   | P2       | 自動標記極端不一致           |
