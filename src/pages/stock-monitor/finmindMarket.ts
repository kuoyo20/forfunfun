const BASE = "https://api.finmindtrade.com/api/v4/data";
const TOKEN = (import.meta.env.VITE_FINMIND_TOKEN as string | undefined) ?? "";

interface Resp<T> { msg?: string; status?: number; data?: T[]; }

async function fm<T>(dataset: string, params: Record<string, string>): Promise<T[]> {
  const q = new URLSearchParams({ dataset, ...params });
  if (TOKEN) q.set("token", TOKEN);
  const res = await fetch(`${BASE}?${q.toString()}`);
  if (!res.ok) throw new Error(`FinMind ${dataset} HTTP ${res.status}`);
  const json = (await res.json()) as Resp<T>;
  if (json.status && json.status !== 200) throw new Error(`FinMind ${dataset}: ${json.msg ?? "?"}`);
  return json.data ?? [];
}

interface FmPriceRow {
  date: string;
  stock_id: string;
  Trading_Volume: number;
  open: number;
  max: number;
  min: number;
  close: number;
  spread: number;
}

interface FmIndexRow {
  date: string;
  stock_id: string;
  price: number;
}

interface FmInfoRow {
  date: string;
  industry_category: string;
  stock_id: string;
  stock_name: string;
  type: string;
}

export interface RankRow {
  symbol: string;
  name: string;
  close: number;
  change: number;
  changePct: number;
  volume: number;
}

export interface TaiexPoint {
  date: string;
  close: number;
  change: number;
  changePct: number;
}

const NAME_CACHE_KEY = "stock-monitor:names";
const NAME_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

function loadNameCache(): Record<string, string> | null {
  try {
    const raw = localStorage.getItem(NAME_CACHE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj.ts || Date.now() - obj.ts > NAME_CACHE_TTL) return null;
    return obj.names || null;
  } catch { return null; }
}

function saveNameCache(names: Record<string, string>) {
  try {
    localStorage.setItem(NAME_CACHE_KEY, JSON.stringify({ ts: Date.now(), names }));
  } catch { /* ignore */ }
}

async function fetchAllNames(): Promise<Record<string, string>> {
  const cached = loadNameCache();
  if (cached) return cached;
  try {
    const rows = await fm<FmInfoRow>("TaiwanStockInfo", {});
    const map: Record<string, string> = {};
    for (const r of rows) map[r.stock_id] = r.stock_name;
    saveNameCache(map);
    return map;
  } catch (e) {
    console.warn("[market] names failed", e);
    return {};
  }
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export interface MarketSnapshot {
  asOf: string;
  taiex: TaiexPoint[];
  gainers: RankRow[];
  losers: RankRow[];
  volume: RankRow[];
  warnings: string[];
}

async function fetchAllStocks(): Promise<FmPriceRow[]> {
  return fm<FmPriceRow>("TaiwanStockPrice", { start_date: daysAgo(10) });
}

async function fetchTaiexIndex(days: number): Promise<TaiexPoint[]> {
  const rows = await fm<FmIndexRow>("TaiwanStockTotalReturnIndex", {
    data_id: "TAIEX",
    start_date: daysAgo(days),
  });
  const sorted = rows
    .filter((r) => r.price > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
  return sorted.map((r, i) => {
    const prev = i > 0 ? sorted[i - 1].price : r.price;
    const change = r.price - prev;
    return {
      date: r.date,
      close: round(r.price),
      change: round(change),
      changePct: prev > 0 ? round((change / prev) * 100) : 0,
    };
  });
}

export async function fetchMarketSnapshot(): Promise<MarketSnapshot> {
  const warnings: string[] = [];
  const [allSettled, taiexSettled, namesSettled] = await Promise.allSettled([
    fetchAllStocks(),
    fetchTaiexIndex(120),
    fetchAllNames(),
  ]).then((r) => r);

  const allRows = allSettled.status === "fulfilled" ? allSettled.value : [];
  const taiex = taiexSettled.status === "fulfilled" ? taiexSettled.value : [];
  const names = namesSettled.status === "fulfilled" ? namesSettled.value : {};

  if (allSettled.status === "rejected") {
    warnings.push(`漲跌榜資料失敗：${(allSettled.reason as Error)?.message ?? "未知錯誤"}（FinMind 免費版可能限制全市場查詢，可註冊免費 token 解除）`);
  }
  if (taiexSettled.status === "rejected") {
    warnings.push(`加權指數資料失敗：${(taiexSettled.reason as Error)?.message ?? "未知錯誤"}`);
  }

  let gainers: RankRow[] = [];
  let losers: RankRow[] = [];
  let volume: RankRow[] = [];
  let lastDate = "—";

  if (allRows.length > 0) {
    const dates = [...new Set(allRows.map((r) => r.date))].sort();
    lastDate = dates[dates.length - 1];
    const lastRows = allRows.filter((r) => r.date === lastDate);

    const enriched: RankRow[] = lastRows
      .filter((r) => r.close > 0 && /^[0-9A-Z]{4,6}$/.test(r.stock_id) && r.spread !== undefined)
      .map((r) => {
        const prevClose = r.close - r.spread;
        const pct = prevClose > 0 ? round((r.spread / prevClose) * 100) : 0;
        return {
          symbol: r.stock_id,
          name: names[r.stock_id] ?? r.stock_id,
          close: r.close,
          change: round(r.spread),
          changePct: pct,
          volume: Math.round(r.Trading_Volume / 1000),
        };
      });

    gainers = [...enriched].sort((a, b) => b.changePct - a.changePct).slice(0, 20);
    losers = [...enriched].sort((a, b) => a.changePct - b.changePct).slice(0, 20);
    volume = [...enriched].sort((a, b) => b.volume - a.volume).slice(0, 20);
  }

  return { asOf: lastDate, taiex, gainers, losers, volume, warnings };
}

export async function fetchSeries(symbol: string): Promise<{ date: string; close: number }[]> {
  if (symbol === "TAIEX") {
    const rows = await fm<FmIndexRow>("TaiwanStockTotalReturnIndex", {
      data_id: "TAIEX",
      start_date: daysAgo(90),
    });
    return rows.filter((r) => r.price > 0).map((r) => ({ date: r.date, close: r.price }));
  }
  const rows = await fm<FmPriceRow>("TaiwanStockPrice", {
    data_id: symbol,
    start_date: daysAgo(90),
  });
  return rows.filter((r) => r.close > 0).map((r) => ({ date: r.date, close: r.close }));
}

function round(n: number) { return Math.round(n * 100) / 100; }
