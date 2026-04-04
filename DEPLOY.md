# 人脈管理系統 (Contact Management System)

## 部署到 Render.com

1. 到 [render.com](https://render.com) 註冊（可用 GitHub 登入）
2. 點 **New → Web Service**
3. 連結你的 GitHub repo `kuoyo20/forfunfun`
4. 設定：
   - **Branch**: `claude/contact-management-system-W1wLH`
   - **Runtime**: Python
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. 點 **Deploy**

部署完成後會給你一個 `https://xxx.onrender.com` 網址。

## 本地運行

```bash
pip install -r requirements.txt
python run.py
```

打開 http://localhost:8000，首次使用請先註冊帳號（第一個註冊的自動成為管理員）。
