# 人脈管理系統 (Contact Management System)

一個支援多人協作的人脈管理系統，可以管理聯絡人、公司、身分角色、標籤和人脈關係。

## 功能

- **多重身分管理**：一個人可以有多個身分（如：A 公司 CEO + B 公司顧問）
- **公司管理**：記錄公司資訊，自動關聯旗下聯絡人
- **標籤系統**：自由標記聯絡人，支援標籤篩選和自動完成
- **產業彩色標籤**：同一標籤永遠顯示同一顏色（hash-based palette）
- **人脈關係**：記錄人與人之間的關係（引薦人、同學、合作夥伴等）
- **熟識程度 1-5 星**：獨立於送禮層級的親疏評分，支援篩選
- **智慧自然排序**：依產業→公司→職稱→熟識度多層排序
- **中英文姓名格式化**：自動拆分中英文姓名顯示（張三 → 張三(Sam)）
- **TBC 佔位符**：空白欄位自動以粉紅斜體 (TBC) 標示
- **重複偵測掃描器**：一鍵找出重複姓名的聯絡人
- **多人協作**：多位使用者可以共同編輯同一份資料庫，附編輯紀錄
- **批次匯入**：支援 CSV / Excel 匯入，同名+同公司自動合併，公司名誤放偵測
- **批次選取匯出 Excel**：勾選聯絡人匯出「貴賓選取名單.xlsx」
- **📷 一鍵拍名片自動建檔**：手機拍照 → OCR 辨識（中/英/日/韓）→ 自動建立聯絡人及公司
- **全文搜尋**：跨聯絡人、公司、職稱、標籤搜尋

## 快速開始

```bash
# 安裝相依套件
pip install -r requirements.txt

# 啟動伺服器
python run.py
```

開啟瀏覽器前往 http://localhost:8000，註冊帳號後即可開始使用。

## 技術架構

- **後端**：Python + FastAPI
- **資料庫**：SQLite
- **模板**：Jinja2
- **樣式**：自訂白色系 CSS（Inter + Noto Sans TC）
- **OCR**：pytesseract（需安裝 Tesseract OCR）

## 名片掃描功能

需要額外安裝 Tesseract OCR：

```bash
# Ubuntu/Debian
sudo apt-get install tesseract-ocr tesseract-ocr-chi-tra

# macOS
brew install tesseract tesseract-lang
```

## 專案結構

```
app/
├── main.py              # FastAPI 應用程式進入點
├── config.py            # 設定檔
├── database.py          # 資料庫連線和初始化
├── schema.sql           # 資料庫 Schema
├── auth.py              # 認證模組
├── routes/              # 路由
│   ├── auth_routes.py   # 登入/註冊
│   ├── person_routes.py # 聯絡人 CRUD
│   ├── company_routes.py# 公司 CRUD
│   ├── search_routes.py # 搜尋和儀表板
│   ├── import_routes.py # 匯入功能
│   └── api_routes.py    # API 端點
├── services/            # 商業邏輯
│   ├── import_service.py# CSV/Excel 解析和匯入
│   └── ocr_service.py   # 名片 OCR
├── templates/           # HTML 模板
└── static/              # CSS 和 JavaScript
```
