# 部署到 Cloudflare Pages（5 分鐘）

> 為什麼不用 GitHub Pages？因為 GitHub Actions 因帳務鎖定無法執行，
> 且 Cloudflare Pages 完全免費、不綁卡、CDN 全球節點更快。

---

## 一、建立 Cloudflare 帳號

1. 到 https://dash.cloudflare.com/sign-up 註冊（用 email 即可，**不用綁卡**）
2. 信箱收驗證信點開即可

## 二、建立 Pages 專案

1. 登入後左側選單 → **Workers & Pages**
2. 右上角 **Create** → **Pages** 分頁 → **Connect to Git**
3. 第一次會要授權 GitHub，按 **Authorize Cloudflare**
4. 選擇 repo：`kuoyo20/forfunfun`
5. 按 **Begin setup**

## 三、Build 設定（最重要）

| 欄位 | 填這個 |
|---|---|
| Project name | `forfunfun`（或任何你喜歡的名字） |
| Production branch | `main` |
| Framework preset | `Vite`（下拉選單可選） |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | （留空） |
| Environment variables | （留空，要 FinMind token 再加） |

按 **Save and Deploy**。

## 四、等 1-3 分鐘

Cloudflare 會：
1. clone repo
2. 跑 `npm install`
3. 跑 `npm run build`
4. 上傳 `dist/` 到全球 CDN

完成後你會拿到一個網址：`https://forfunfun.pages.dev`

## 五、家人怎麼用

| 頁面 | 網址 |
|---|---|
| 苗林行業務系統（原本的 CRM） | `https://forfunfun.pages.dev/` |
| **家庭看盤儀表板** | `https://forfunfun.pages.dev/stock-monitor.html` |

LINE 把 **stock-monitor.html** 那個網址丟給家人就可以。

iPhone Safari → 分享 → 加入主畫面 = 像 app 一樣。

---

## 後續更新

只要 push 到 `main` branch，Cloudflare Pages 就會**自動重新部署**，不用手動操作。

Preview deployments：push 到非 main 的 branch 會自動產生一個臨時網址（給你測試用）。

---

## 之後想加 FinMind token

家人切換股票太頻繁可能撞到免費版 quota（600 次/hr）。要升級的話：

1. 到 https://finmindtrade.com 註冊拿 token
2. Cloudflare Pages dashboard → 你的專案 → **Settings** → **Environment variables**
3. 加一筆：
   - Variable name: `VITE_FINMIND_TOKEN`
   - Value: （你的 token）
   - Environment: **Production**
4. 觸發一次重新 deploy（push 任何 commit 或在 dashboard 按 **Retry deployment**）

quota 從 600/hr → 6000/hr。

---

## 常見問題

**Q：build 失敗、紅 X？**
看 Cloudflare 給的 build log，最常見是 Node 版本不對。
到 **Settings** → **Environment variables** 加 `NODE_VERSION = 20`。

**Q：頁面打開空白？**
打開瀏覽器 console (F12)，看是 404 還是 JavaScript 錯誤。
如果 404，確認 build output directory 是 `dist`。

**Q：要自訂網域（例如 `stock.kuoyo.com`）？**
專案 → **Custom domains** → **Set up custom domain** → 跟著它走 DNS 設定即可。
