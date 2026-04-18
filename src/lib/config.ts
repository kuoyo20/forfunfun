/**
 * API base URL
 * - 開發環境：http://localhost:3001
 * - 生產環境（Vercel）：使用相對路徑（同網域）
 */
export const API = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "http://localhost:3001" : "");
