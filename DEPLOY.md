# 部署到 Vercel

這份指南帶你把整個專案部署到 Vercel，取得一個公開可瀏覽的網址。

## 架構概念

- **前端**（React + Vite）→ Vercel 靜態網站
- **後端**（Express API）→ Vercel Serverless Functions（自動從 `api/` 產生）
- **資料庫**（PostgreSQL）→ Vercel Postgres（與 Vercel 專案整合，無需額外註冊）
- **AI**（Claude API）→ 呼叫 Anthropic API
- **Email**（可選）→ SMTP

## 部署步驟

### 1. 準備 Anthropic API Key

1. 到 https://console.anthropic.com/settings/keys
2. 點 **Create Key** 建立一組新的 API key
3. 複製 key（`sk-ant-...` 開頭），待會會用到

### 2. 到 Vercel 匯入專案

1. 打開 https://vercel.com/new
2. 如果還沒登入，用 GitHub 帳號登入
3. 找到 `kuoyo20/forfunfun` repo，點 **Import**
4. **Configure Project** 頁面：
   - **Framework Preset**：Vercel 會自動偵測為 **Vite**（保持原樣）
   - **Build and Output Settings**：保持預設（我們的 `vercel.json` 已設定好）
   - **Root Directory**：保持預設 `./`
   - **Branch to deploy**：如果有 `claude/setup-interview-components-UQCFe` 的選項記得選它
5. **先不要按 Deploy**，下面還要設環境變數

### 3. 建立 Vercel Postgres 資料庫

1. 在 Vercel Dashboard 左側選單點 **Storage**
2. 點 **Create Database** → 選 **Postgres**（由 Neon 提供）
3. 取一個名字（例如 `forfunfun-db`），地區選離你近的，按 **Create**
4. 建立完後，點 **Connect Project**，把它連到你剛剛匯入的 `forfunfun` 專案
5. Vercel 會自動把 `DATABASE_URL`、`POSTGRES_URL` 等環境變數加到專案裡，**不需要手動設定**

### 4. 設定環境變數

回到 Vercel 專案頁面 → **Settings** → **Environment Variables**，加入：

| 變數名稱 | 值 | 必填 |
|---------|-----|------|
| `ANTHROPIC_API_KEY` | 你剛剛建立的 `sk-ant-...` key | **是** |
| `FRONTEND_URL` | 你的 Vercel 網址（例如 `https://forfunfun.vercel.app`）| 可選（寄信用） |
| `SMTP_HOST` | SMTP 伺服器（例如 `smtp.gmail.com`） | 可選 |
| `SMTP_PORT` | SMTP 埠（例如 `587`） | 可選 |
| `SMTP_USER` | SMTP 帳號 | 可選 |
| `SMTP_PASS` | SMTP 密碼或應用程式密碼 | 可選 |
| `SMTP_FROM` | 寄件人 Email | 可選 |

未設定 SMTP 時，系統會自動把面試連結複製到剪貼簿，不會影響核心功能。

### 5. 部署

1. 回到專案的 **Deployments** 頁面
2. 點最新一筆 deployment 右邊的 **...** → **Redeploy**
   - 或直接推送新 commit 到 GitHub，會自動觸發
3. 等 1-2 分鐘讓 Vercel 建置完成
4. 成功後會看到綠色勾勾，點 **Visit** 就能打開網站

### 6. 確認資料庫已建表

首次部署時，`vercel-build` 腳本會自動執行 `prisma db push` 建立資料表。

如果第一次開啟網站時遇到「找不到面試」之類的錯誤，重新部署一次即可。

## 本地開發（選用）

本地如果要繼續開發，需要：

1. 自己的 PostgreSQL（或也用 Neon 免費方案）
2. 在 `.env` 設定：

```env
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

3. 執行：

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

## 疑難排解

### 部署失敗：Prisma Client 找不到
在專案 Settings → Environment Variables 確認 `DATABASE_URL` 已經設定（連接 Vercel Postgres 後應該會自動帶入）。

### AI 回應失敗
確認 `ANTHROPIC_API_KEY` 已設定且有效。到 Vercel 專案 → Functions → Logs 可以看到詳細錯誤訊息。

### 面試連結無效
前面 `FRONTEND_URL` 沒設正確，導致 Email 中的連結指向錯誤網址。改成你真實的 Vercel 網址並重新部署。
