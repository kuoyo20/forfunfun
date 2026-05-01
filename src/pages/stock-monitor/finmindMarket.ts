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
}

export async function fetchMarketSnapshot(): Promise<MarketSnapshot> {
  const [allRows, taiex, names] = await Promise.all([
    fm<FmPriceRow>("TaiwanStockPrice", { start_date: daysAgo(7) }),
    fm<FmPriceRow>("TaiwanStockPrice", { data_id: "TAIEX", start_date: daysAgo(120) }),
    fetchAllNames(),
  ]);

  if (allRows.length === 0) throw new Error("無資料，可能 FinMind 暫時無法取得");

  const dates = [...new Set(allRows.map((r) => r.date))].sort();
  const lastDate = dates[dates.length - 1];
  const lastRows = allRows.filter((r) => r.date === lastDate);

  const enriched: RankRow[] = lastRows
    .filter((r) => r.close > 0 && /^\d{4}$/.test(r.stock_id))
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

  const gainers = [...enriched].sort((a, b) => b.changePct - a.changePct).slice(0, 20);
  const losers = [...enriched].sort((a, b) => a.changePct - b.changePct).slice(0, 20);
  const volume = [...enriched].sort((a, b) => b.volume - a.volume).slice(0, 20);

  const taiexPoints: TaiexPoint[] = taiex
    .filter((r) => r.close > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((r) => {
      const prev = r.close - r.spread;
      return {
        date: r.date,
        close: round(r.close),
        change: round(r.spread),
        changePct: prev > 0 ? round((r.spread / prev) * 100) : 0,
      };
    });

  return { asOf: lastDate, taiex: taiexPoints, gainers, losers, volume };
}

export async function fetchSeries(symbol: string): Promise<{ date: string; close: number }[]> {
  const rows = await fm<FmPriceRow>("TaiwanStockPrice", {
    data_id: symbol,
    start_date: daysAgo(90),
  });
  return rows.filter((r) => r.close > 0).map((r) => ({ date: r.date, close: r.close }));
}

function round(n: number) { return Math.round(n * 100) / 100; }
