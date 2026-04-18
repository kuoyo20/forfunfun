import app from "../server/app.js";

export default app;

// Vercel 需要較長的 timeout 以處理 AI 請求
export const config = {
  maxDuration: 60,
};
