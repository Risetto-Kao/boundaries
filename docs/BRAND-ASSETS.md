# Boundaries 品牌資產

目前選用 **第二輪 2B「雙聲 B」原版**，不是第三輪修正版。
輪廓直接取自 `design/phase-1-2/icons-v2.html` 的 `double-b`，沒有調整曲線、尾角或上下比例。
正式網站採用 B3 UI 設計方向，品牌與字體仍可在後續微調。

## 位置與格式

所有可使用圖檔位於 `frontend/public/assets/brand/`。
Next.js 可透過 `/assets/brand/<檔名>` 引用，不需要額外套件。
SVG 是主要向量原稿；PNG 是固定尺寸匯出檔，方便不支援 SVG 的用途。

| 檔案 | 用途 |
| --- | --- |
| `boundaries-mark.svg` | 主要紫色標誌，透明背景，viewBox 112 × 120 |
| `boundaries-mark-duotone.svg` | 紫／綠雙色標誌，透明背景 |
| `boundaries-mark-black.svg` | 黑色單色版 |
| `boundaries-mark-white.svg` | 白色單色版，適合深色底 |
| `boundaries-mark-512.png` | 紫色標誌，512 × 512 透明背景，保持原比例置中 |
| `boundaries-mark-duotone-512.png` | 雙色標誌，512 × 512 透明背景 |
| `boundaries-app-icon.svg` | 白色標誌＋紫色正方形底，512 × 512 向量版本 |
| `boundaries-app-icon-192.png` | 192 × 192 App icon |
| `boundaries-app-icon-512.png` | 512 × 512 App icon |
| `boundaries-app-icon-1024.png` | 1024 × 1024 App icon，適合較大尺寸輸出 |
| `apple-touch-icon-180.png` | 180 × 180，正方形底，不預先裁切圓角 |
| `favicon.svg` | 紫色圓角底＋白色原版標誌，可縮放 |
| `favicon.ico` | 內含 16／32／48px，供瀏覽器 favicon 使用 |

App icon PNG 使用不透明底色；標誌 PNG 保留透明背景。
App icon 的四角由使用的平台裁切，favicon 則使用圓角展示底。
沒有把新版尾角簡化圖混入本組資產，所有版本都使用選定的原 2B 輪廓。

## 顏色

- 主要紫：`#6835EF`
- 延伸綠：`#27CE7B`
- 單色黑／白：`#000000`／`#FFFFFF`

主要使用紫色單色版；雙色版保留為延伸用途。
SVG 使用明確的 fill 色值，不依賴 CSS variables 或外部字型。
標誌保持比例縮放；深色背景可使用白色版。

## 在頁面中使用

```tsx
import Image from "next/image";

<Image
  src="/assets/brand/boundaries-mark.svg"
  width={28}
  height={30}
  alt="Boundaries"
/>
```

若旁邊已顯示 Boundaries 名稱，圖示的 `alt` 可設為空字串，避免重複朗讀。
SVG 可搭配 CSS 調整顯示大小；固定色 SVG 的顏色不會跟隨父層 `color`。
這輪只交付標誌圖形，沒有將系統字型文字轉成固定字標圖檔。

## 正式網站整合

`components/brand.tsx` 在 AccountNav 中引用紫色主標誌及系統字型 Boundaries 文字。圖示保持原比例，alt 為空，避免與文字重複朗讀。

layout metadata 引用本組 ICO、SVG favicon 與 Apple touch icon；移除舊 `frontend/app/favicon.ico`，避免 App Router 圖示覆蓋 metadata。既有 manifest 改用本組 192／512px 一般 app icon，不使用未製作的 maskable 版本；保留既有安裝頁，本次沒有新增 service worker。

設計 tokens、元件與維護規則見 [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md)；實際檢視範圍見 [DESIGN-VERIFICATION.md](DESIGN-VERIFICATION.md)。

## 驗證與維護

- SVG 經 XML 解析，圖形路徑與原 2B 比對一致。
- PNG 尺寸、透明背景及 App icon 不透明背景已檢查。
- ICO 的 16／32／48px 影像已解碼檢查。
- 匯出預覽與正式 Next.js 導覽已渲染檢視；手機 Safari／主畫面尚未實測。
- 修改圖形時，先更新 SVG，再重新產生 PNG／ICO；不以 PNG 回推向量原稿。
- 資產接入正式 UI，程式檢查結果見設計導入 PR。

選擇記錄：2026-10-10，原 2B 暫定採用，保留未來調整空間。
