# 苗林行策略表單系統 (Miaolin Strategy)

> 價值工程師：對策執行系統 v10.0

## 功能說明

四步驟策略表單流程，協助業務人員透過 AI 分析客戶資訊、產生銷售對策：

| 步驟 | 名稱 | 說明 |
|------|------|------|
| Step 0 | **輸入資訊** | 填寫品牌名稱、對象類型、產品、銷售模式等基本資料 |
| Step 1 | **診斷分析** | AI 分析客戶特性，產出目標分析、痛點、開場策略；可規劃營收品項 |
| Step 2 | **趨勢對策** | AI 搜尋亞洲市場趨勢，產出競爭分析、定價策略、提案大綱 |
| Step 3 | **執行報告** | 彙整所有分析結果與營收預估，輸出完整策略執行計畫 |

## 專案架構

```
src/
├── pages/
│   └── Index.tsx              # 主頁面（純 UI 組裝）
├── hooks/
│   └── useStrategyFlow.ts     # 核心邏輯 Hook（狀態管理 + API 呼叫）
├── components/strategy/
│   ├── types.ts               # 共用型別（FormData, DiagnosticData, StrategyData, RevenueItem）
│   ├── StepIndicator.tsx      # 步驟進度指示器
│   ├── StepInput.tsx          # Step 0 - 表單輸入
│   ├── StepStrategy.tsx       # Step 1 & 2 - 診斷分析 / 趨勢對策（雙階段元件）
│   ├── StepReport.tsx         # Step 3 - 執行報告
│   └── LoadingOverlay.tsx     # 全螢幕 Loading 遮罩
├── integrations/supabase/
│   └── client.ts              # Supabase 客戶端初始化
├── App.tsx                    # 根元件（含 Toaster）
├── main.tsx                   # 進入點
└── index.css                  # Tailwind v4 @theme design tokens
```

## 使用技術

| 類別 | 技術 |
|------|------|
| 框架 | React 19 + TypeScript 5.9 |
| 建置 | Vite 8 |
| 樣式 | Tailwind CSS v4（`@theme` design tokens） |
| 後端 | Supabase Edge Functions（`sales-diagnosis`、`sales-trends`） |
| UI 通知 | sonner |
| 圖標 | lucide-react |
| 路由 | react-router-dom（已安裝，尚未啟用） |
| 測試 | Vitest + @testing-library/react（已安裝） |
| Lint | ESLint + typescript-eslint |
| 格式化 | Prettier |

## 快速開始

```bash
# 安裝依賴
npm install

# 設定環境變數（建立 .env 檔案）
# VITE_SUPABASE_URL=你的_Supabase_URL
# VITE_SUPABASE_ANON_KEY=你的_Supabase_Anon_Key

# 啟動開發伺服器
npm run dev

# 型別檢查
npm run typecheck

# 建置
npm run build
```

## 原始碼修正重點

從原始 Index.tsx 做了以下改進：

1. **抽出 `useStrategyFlow` Hook** — Index.tsx 從 ~120 行邏輯減至純 UI 組裝
2. **常數移至元件外** — `TARGET_LABELS`、`MODE_LABELS` 不再每次 render 重建
3. **加入表單驗證** — 品牌名稱和產品為空時阻擋提交並提示
4. **型別安全的錯誤處理** — `catch (err: any)` 改為 `err instanceof Error` 判斷
5. **移除假延遲** — `handleGenerateReport` 的 `setTimeout` 1200ms 已移除
6. **元件職責分離** — 每個 Step 獨立元件，StepStrategy 用 discriminated union 處理雙階段

## 尚未完成的部分

- [ ] **Supabase Edge Functions** — `sales-diagnosis` 和 `sales-trends` 需要在 Supabase 專案中建立
- [ ] **環境變數** — 需建立 `.env` 填入 Supabase URL 和 Key
- [ ] **測試** — Vitest 已安裝但尚未撰寫任何測試案例
- [ ] **路由** — react-router-dom 已安裝但尚未設定路由
- [ ] **報告匯出** — Step 3 執行報告目前僅顯示，無 PDF/列印匯出功能
- [ ] **步驟回退** — Step 1 → Step 0 缺少返回按鈕
- [ ] **資料持久化** — 表單資料目前僅存在記憶體，重整即消失
- [ ] **推送至 GitHub** — 因權限問題尚未推送成功
