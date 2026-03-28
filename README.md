# AI 模擬面試平台

一個全端的 AI 面試管理系統，讓 HR 可以上傳履歷與職缺說明，自動產生面試連結寄送給候選人，候選人完成面試後 HR 可即時查看評分報告。

---

## 功能總覽

### HR 端
- **面試管理 Dashboard** — 一覽所有面試的狀態（等待中 / 進行中 / 已完成）、分數
- **建立面試** — 上傳候選人履歷（PDF/Word/TXT）+ 職位說明書（JD），設定職位、難度、主題、題數、時間
- **產生唯一連結** — 每場面試產生獨立的 token 連結，可複製或寄 Email 給候選人
- **Email 寄送** — 整合 nodemailer，一鍵寄出面試邀請信（未設定 SMTP 時自動降級為複製連結）
- **查看報告** — 完整的面試報告含總分、優勢、待改進、改進建議、逐題分析（可展開看題目/回答/評語）

### 候選人端
- **透過連結進入面試** — 不需帳號，點連結即開始
- **即時對話介面** — 自動展開的 textarea、倒數計時、題數追蹤
- **自動結束** — 時間到或題數滿自動進入報告
- **面試完成後查看報告** — 即時看到自己的表現

### 自主練習
- 不需後端即可使用的個人練習模式
- 本地歷史紀錄（localStorage）

---

## 技術架構

```
┌──────────────────┐     ┌──────────────────┐     ┌───────────┐
│   React 前端      │────▶│   Express 後端    │────▶│  SQLite   │
│   (Vite + TS)    │     │   (tsx)          │     │  (Prisma) │
│   Port: 5173     │     │   Port: 3001     │     │           │
└──────────────────┘     └──────────────────┘     └───────────┘
```

### 前端
| 技術 | 用途 |
|------|------|
| React 19 | UI 框架 |
| TypeScript | 型別安全 |
| Vite 8 | 打包與開發伺服器 |
| Tailwind CSS 4 | 樣式（自訂主題色） |
| React Router | 頁面路由 |
| Sonner | Toast 通知 |
| Lucide React | 圖示 |

### 後端
| 技術 | 用途 |
|------|------|
| Express | API 伺服器 |
| Prisma + SQLite | 資料庫 ORM |
| Multer | 檔案上傳 |
| pdf-parse | PDF 文字提取 |
| Nodemailer | Email 寄送 |
| tsx | TypeScript 直接執行 |

---

## 專案結構

```
forfunfun/
├── server/                    # 後端
│   ├── index.ts               # Express API（面試 CRUD、檔案上傳、Email）
│   ├── parse.ts               # 檔案文字提取（PDF/Word/TXT）
│   ├── email.ts               # Email 寄送（nodemailer）
│   └── tsconfig.json
├── prisma/
│   ├── schema.prisma          # 資料庫 schema（Interview model）
│   └── migrations/            # 資料庫遷移
├── src/                       # 前端
│   ├── App.tsx                # 路由設定
│   ├── main.tsx               # 入口
│   ├── index.css              # Tailwind 主題
│   ├── pages/
│   │   ├── HRDashboard.tsx    # HR 面試管理首頁
│   │   ├── CreateInterview.tsx # 建立面試（上傳文件+設定）
│   │   ├── CandidateInterview.tsx # 候選人面試頁
│   │   ├── InterviewReport.tsx # HR 查看報告
│   │   └── Practice.tsx       # 自主練習模式
│   ├── components/
│   │   ├── FileUpload.tsx     # 拖曳上傳元件
│   │   ├── InterviewChat.tsx  # 對話介面
│   │   ├── ReportView.tsx     # 報告呈現
│   │   ├── SetupForm.tsx      # 練習設定表單
│   │   └── HistoryView.tsx    # 練習歷史紀錄
│   ├── hooks/
│   │   └── useInterview.ts    # 面試狀態管理
│   ├── lib/
│   │   ├── api.ts             # 模擬 AI 問題引擎 + 評分
│   │   ├── storage.ts         # localStorage 歷史紀錄
│   │   └── utils.ts           # cn() 工具
│   └── types/
│       └── interview.ts       # TypeScript 型別定義
├── uploads/                   # 上傳的檔案（gitignored）
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## 頁面路由

| 路徑 | 頁面 | 說明 |
|------|------|------|
| `/` | HR Dashboard | 管理所有面試 |
| `/create` | 建立面試 | 上傳履歷 + JD，產生連結 |
| `/interview/:token` | 候選人面試 | 候選人用連結進入 |
| `/report/:id` | 面試報告 | HR 查看完整報告 |
| `/practice` | 自主練習 | 個人練習模式 |

---

## 快速開始

### 前置需求
- Node.js 18+
- npm

### 安裝與啟動

```bash
git clone https://github.com/kuoyo20/forfunfun.git
cd forfunfun
git checkout claude/setup-interview-components-UQCFe

npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

啟動後：
- 前端：http://localhost:5173
- 後端 API：http://localhost:3001

### Email 設定（可選）

在專案根目錄的 `.env` 加入：

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your@gmail.com
```

未設定 SMTP 時，系統會自動將面試連結複製到剪貼簿，不影響核心功能。

---

## API 端點

| 方法 | 路徑 | 說明 |
|------|------|------|
| `POST` | `/api/upload` | 上傳檔案，回傳提取的文字 |
| `POST` | `/api/interviews` | 建立面試 |
| `GET` | `/api/interviews` | 列出所有面試（HR Dashboard） |
| `GET` | `/api/interviews/:id` | 取得單一面試詳情 |
| `GET` | `/api/interview/:token` | 候選人用 token 取得面試資料 |
| `PUT` | `/api/interviews/:id` | 更新面試（狀態/對話/報告） |
| `DELETE` | `/api/interviews/:id` | 刪除面試 |
| `POST` | `/api/email/send-invite` | 寄送面試邀請 Email |

---

## 已知問題與待完成項目

### 已知問題
- **AI 回應為模擬** — 目前的面試問題和評分是本地模擬邏輯，非真正 AI（需接入 Claude API / OpenAI API 才能根據履歷和 JD 動態生成問題）
- **Word 檔解析不完整** — `.doc/.docx` 僅做基本文字提取，複雜格式可能產生亂碼（PDF 和 TXT 正常）
- **模擬延遲** — `fetchNextQuestion` 和 `fetchReport` 有 800-2000ms 人為延遲模擬 AI 思考時間

### 未完成功能
- [ ] 接入真正的 AI API（Claude/OpenAI），根據履歷 + JD 動態生成面試問題
- [ ] 防作弊機制（連結一次性使用、偵測分頁切換、限制貼上）
- [ ] 使用者身份驗證（HR 登入系統）
- [ ] 批量上傳履歷 → 批量產生面試連結
- [ ] 自訂評分維度（技術深度、溝通能力、問題解決等）
- [ ] 多語言面試支援
- [ ] 面試中斷偵測（候選人離開時標記為已放棄）
- [ ] 生產環境部署配置（Docker、環境變數、資料庫遷移）

---

## 授權

Private project.
