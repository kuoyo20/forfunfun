# CLAUDE.md

## 常用指令
- `npm run dev` — 啟動開發伺服器
- `npm run build` — TypeScript 檢查 + Vite 打包
- `npm run lint` — ESLint 檢查
- `npm run typecheck` — 僅 TypeScript 型別檢查
- `npm test` — 跑 Vitest 測試

## 專案架構
- `src/pages/` — 頁面元件 (Index.tsx)
- `src/components/strategy/` — 策略表單元件 (StepIndicator, StepInput, StepStrategy, StepReport, LoadingOverlay)
- `src/hooks/` — 自訂 Hook (useStrategyFlow)
- `src/integrations/supabase/` — Supabase 客戶端
- `src/components/strategy/types.ts` — 共用型別定義

## 慣例
- 元件用 PascalCase，hook 用 camelCase
- API 呼叫統一用 Supabase Edge Functions
- 使用 sonner 做 toast 通知
- Tailwind CSS v4 用 @theme 定義 design tokens
- 常數（labels, options）放元件外部，避免 re-render 重建

## 環境變數
- `VITE_SUPABASE_URL` — Supabase 專案 URL
- `VITE_SUPABASE_ANON_KEY` — Supabase 匿名 Key
