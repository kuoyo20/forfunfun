# 人脈管理系統 — 部署指南

## 推薦部署方式：Render.com + Docker（含 OCR、資料永久保存）

這是目前最完整的設定，支援 OCR、檔案上傳、資料備份。

### 步驟

1. 到 [render.com](https://render.com) 用 GitHub 登入
2. 點 **New → Web Service**
3. 選 repo `kuoyo20/forfunfun`
4. 填寫：
   - **Branch**: `claude/contact-management-system-W1wLH`
   - **Runtime**: `Docker`（會自動用專案根目錄的 Dockerfile）
   - **Instance Type**: Free（或 Starter 以獲得永久磁碟）

5. **重要：設定 Persistent Disk**（資料不會遺失）
   - 在服務設定頁的 **Disks** 分頁
   - 點 **Add Disk**
   - Name: `contact-data`
   - Mount Path: `/app/data`
   - Size: 1 GB（$0.25/月）
   - 再加一個：Mount Path: `/app/uploads`, Size: 1 GB（放上傳照片、附件）

   > ⚠ Free 方案**不支援** Persistent Disk，資料每次重新部署會遺失。如要測試可先用 Free，正式使用建議 Starter（$7/月）。

6. **設定 SECRET_KEY 環境變數**
   - **Environment → Add Environment Variable**
   - Key: `SECRET_KEY`
   - Value: 任意長隨機字串（建議 32 字元以上）

7. 點 **Create Web Service** → 等待部署完成

部署網址會像 `https://forfunfun-xxxx.onrender.com`

## 📷 一鍵拍名片自動建檔（關鍵功能）

部署完成後，用手機瀏覽器開啟網址 → 登入 → 導航列點「📷 拍名片」（或右下角浮動按鈕）：

1. 點擊拍攝區 → 手機相機自動開啟
2. 拍下名片
3. 系統自動 OCR 辨識（中/英/日/韓）並擷取姓名、公司、職稱、Email、電話、地址
4. 自動建立聯絡人並跳轉到詳情頁

**前置條件：**
- **必須使用 Docker 部署**（Dockerfile 已預裝 tesseract-ocr 及 chi_tra/chi_sim/jpn/kor 語言包）
- 若用純 Python 部署（非 Docker），OCR 會回傳錯誤訊息，因為主機缺 tesseract

**建議：**
- 將網站「加入主畫面」(PWA) 後，拍名片體驗與原生 App 無異
- 使用後鏡頭拍攝（`capture="environment"` 已設定）
- 若辨識率不佳，可檢查光線、角度，或改用文字貼上模式 (`/import` → 文字貼上)

## 備份 / 還原

登入後（admin 角色）→ 管理使用者 → 下方有備份區：
- **下載資料庫備份** — 隨時下載當前 SQLite 檔
- **還原資料庫** — 上傳備份檔覆蓋（舊資料會自動保留為 .before-restore-xxx）

建議：
- 每週下載一次備份
- 重要編輯前手動備份一次

## LINE Notify 通知

1. 到 [notify-bot.line.me/my/](https://notify-bot.line.me/my/) 用 LINE 登入
2. 點「發行權杖」→ 選「透過 1 對 1 聊天接收」
3. 複製權杖，到系統「設定」頁貼上並儲存
4. 到「提醒」頁點「📱 推送到 LINE」即可把到期提醒推到 LINE

## 本地開發

```bash
pip install -r requirements.txt
python run.py
```

或用 Docker：

```bash
docker build -t contact-mgr .
docker run -p 8000:8000 -v $(pwd)/data:/app/data -v $(pwd)/uploads:/app/uploads contact-mgr
```

打開 http://localhost:8000，首次使用請先註冊（第一個註冊的自動成為管理員）。

## PWA 離線支援

部署完成後，用手機 Safari/Chrome 開啟網址，選「加入主畫面」就能像 App 一樣使用，部分頁面支援離線瀏覽。

## 常見問題

**Q: OCR 掃描名片不能用？**
A: 請確認使用 Docker 部署（Dockerfile 已預裝 tesseract）。純 Python 部署需要主機本身裝好 tesseract。

**Q: 資料不見了？**
A: 極有可能是 Render Free 方案重啟時清空磁碟。升級到 Starter + 設定 Persistent Disk 可解決。暫時可先用備份/還原功能。

**Q: 忘記密碼？**
A: 登入頁點「忘記密碼」，輸入帳號後回答安全問題即可重設。若沒設定安全問題，請聯絡其他管理員直接改密碼。
