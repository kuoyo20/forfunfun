import type {
  ChipFlow, IndustryInfo, KBar, MonthRevenuePoint, Quote, StockSnapshot, ValuationStats,
} from "./types";

const BASE = "https://api.finmindtrade.com/api/v4/data";
const TOKEN = (import.meta.env.VITE_FINMIND_TOKEN as string | undefined) ?? "";

interface FinMindResp<T> {
  msg?: string;
  status?: number;
  data?: T[];
}

async function fm<T>(dataset: string, params: Record<string, string>): Promise<T[]> {
  const q = new URLSearchParams({ dataset, ...params });
  if (TOKEN) q.set("token", TOKEN);
  const res = await fetch(`${BASE}?${q.toString()}`);
  if (!res.ok) throw new Error(`FinMind ${dataset} HTTP ${res.status}`);
  const json = (await res.json()) as FinMindResp<T>;
  if (json.status && json.status !== 200) {
    throw new Error(`FinMind ${dataset}: ${json.msg ?? "unknown error"}`);
  }
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

interface FmInstRow {
  date: string;
  stock_id: string;
  name: string;
  buy: number;
  sell: number;
}

interface FmInfoRow {
  date: string;
  industry_category: string;
  stock_id: string;
  stock_name: string;
  type: string;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

async function fetchInfo(symbol: string): Promise<FmInfoRow | null> {
  try {
    const rows = await fm<FmInfoRow>("TaiwanStockInfo", { data_id: symbol });
    return rows[0] ?? null;
  } catch (e) {
    console.warn("[finmind] TaiwanStockInfo failed", e);
    return null;
  }
}

async function fetchPrice(symbol: string): Promise<KBar[]> {
  const rows = await fm<FmPriceRow>("TaiwanStockPrice", {
    data_id: symbol,
    start_date: daysAgo(150),
  });
  return rows
    .filter((r) => r.open > 0 && r.close > 0)
    .map<KBar>((r) => ({
      date: r.date,
      open: r.open,
      high: r.max,
      low: r.min,
      close: r.close,
      volume: Math.max(1, Math.round(r.Trading_Volume / 1000)),
    }));
}

async function fetchInst(symbol: string): Promise<FmInstRow[]> {
  return fm<FmInstRow>("TaiwanStockInstitutionalInvestorsBuySell", {
    data_id: symbol,
    start_date: daysAgo(35),
  });
}

function lotsFromShares(shares: number): number {
  return Math.round(shares / 1000);
}

function classifyInst(name: string): "foreign" | "itrust" | "dealer" | null {
  if (/Foreign/i.test(name)) return "foreign";
  if (/Trust/i.test(name)) return "itrust";
  if (/Dealer/i.test(name)) return "dealer";
  return null;
}

function buildChipFlow(rows: FmInstRow[]): ChipFlow {
  const sortedDates = [...new Set(rows.map((r) => r.date))].sort();
  const last5 = new Set(sortedDates.slice(-5));
  let foreign = 0, itrust = 0, dealer = 0;
  for (const r of rows) {
    if (!last5.has(r.date)) continue;
    const k = classifyInst(r.name);
    const net = lotsFromShares(r.buy - r.sell);
    if (k === "foreign") foreign += net;
    else if (k === "itrust") itrust += net;
    else if (k === "dealer") dealer += net;
  }
  const main = foreign + itrust + dealer;

  const last20 = new Set(sortedDates.slice(-20));
  const dailyNet: Record<string, number> = {};
  for (const r of rows) {
    if (!last20.has(r.date)) continue;
    dailyNet[r.date] = (dailyNet[r.date] ?? 0) + (r.buy - r.sell);
  }
  const days = Object.values(dailyNet);
  const sameDir = days.length === 0 ? 0 : days.filter((v) => Math.sign(v) === Math.sign(days[days.length - 1])).length;
  const stability = days.length === 0 ? 0 : sameDir / days.length;

  const concentration = clamp(Math.abs(main) / Math.max(1, Math.abs(foreign) + Math.abs(itrust) + Math.abs(dealer)) * 12 + 4, 3, 20);

  return {
    mainForceNet5d: main,
    foreignNet5d: foreign,
    itrustNet5d: itrust,
    concentration: round(concentration),
    stability: round(stability),
  };
}

function buildQuote(symbol: string, name: string, bars: KBar[]): Quote {
  if (bars.length === 0) {
    return {
      symbol, name: name || symbol, price: 0, change: 0, changePct: 0,
      lotSize: 0, totalVolume: 0, time: "—",
      innerVolume: 0, outerVolume: 0,
    };
  }
  const last = bars[bars.length - 1];
  const prev = bars[bars.length - 2] ?? last;
  const change = round(last.close - prev.close);
  const changePct = round((change / prev.close) * 100);

  const range = (last.high - last.low) || 1;
  const outerRatio = clamp((last.close - last.low) / range, 0.05, 0.95);
  const outerVolume = Math.round(last.volume * outerRatio);
  const innerVolume = Math.max(0, last.volume - outerVolume);

  return {
    symbol,
    name: name || symbol,
    price: last.close,
    change,
    changePct,
    lotSize: 1,
    totalVolume: last.volume,
    time: `${last.date.slice(5)} 收盤`,
    innerVolume,
    outerVolume,
  };
}

function buildIndustryInfo(info: FmInfoRow | null): IndustryInfo {
  const cat = info?.industry_category ?? "未分類";
  return {
    industry: [
      `產業類別：${cat}`,
      "資料來自 FinMind 公開資訊",
      "產業景氣請參考公開新聞",
      "本表僅顯示分類，不評論榮枯",
    ],
    company: [
      `${info?.stock_name ?? info?.stock_id ?? "-"}（${info?.stock_id ?? "-"}）`,
      `市場別：${info?.type ?? "-"}`,
      "詳細財務請參考公開資訊觀測站",
      "資料延遲一個交易日（FinMind 免費版）",
    ],
  };
}

function shortTermWinRate(bars: KBar[]): number {
  if (bars.length < 11) return 0;
  let wins = 0;
  for (let i = bars.length - 11; i < bars.length - 1; i++) {
    if (bars[i + 1].close > bars[i].close) wins++;
  }
  return wins * 10;
}

interface FmPerRow {
  date: string;
  stock_id: string;
  PER: number;
  PBR: number;
  dividend_yield: number;
}

interface FmRevenueRow {
  date: string;
  stock_id: string;
  revenue: number;
  revenue_year: number;
  revenue_month: number;
}

async function fetchValuation(symbol: string): Promise<ValuationStats> {
  try {
    const rows = await fm<FmPerRow>("TaiwanStockPER", {
      data_id: symbol,
      start_date: daysAgo(365 * 3 + 30),
    });
    const valid = rows.filter((r) => r.PER > 0 && r.PER < 200);
    if (valid.length === 0) return emptyValuation();

    const pers = valid.map((r) => r.PER).sort((a, b) => a - b);
    const pbrs = valid.map((r) => r.PBR).filter((v) => v > 0).sort((a, b) => a - b);
    const last = valid[valid.length - 1];
    const currentPer = last.PER;
    const belowCount = pers.filter((p) => p <= currentPer).length;

    return {
      current: {
        date: last.date,
        per: round(last.PER),
        pbr: round(last.PBR),
        dividendYield: round(last.dividend_yield),
      },
      perMin: round(pers[0]),
      perMax: round(pers[pers.length - 1]),
      perMedian: round(quantile(pers, 0.5)),
      perQ1: round(quantile(pers, 0.25)),
      perQ3: round(quantile(pers, 0.75)),
      perPercentile: Math.round((belowCount / pers.length) * 100),
      pbrMin: pbrs.length ? round(pbrs[0]) : 0,
      pbrMax: pbrs.length ? round(pbrs[pbrs.length - 1]) : 0,
      pbrMedian: pbrs.length ? round(quantile(pbrs, 0.5)) : 0,
      samples: pers.length,
    };
  } catch (e) {
    console.warn("[finmind] PER failed", e);
    return emptyValuation();
  }
}

async function fetchRevenue(symbol: string): Promise<MonthRevenuePoint[]> {
  try {
    const rows = await fm<FmRevenueRow>("TaiwanStockMonthRevenue", {
      data_id: symbol,
      start_date: daysAgo(800),
    });
    const sorted = [...rows].sort((a, b) =>
      a.revenue_year !== b.revenue_year ? a.revenue_year - b.revenue_year : a.revenue_month - b.revenue_month,
    );
    const byKey = new Map<string, FmRevenueRow>();
    for (const r of sorted) {
      byKey.set(`${r.revenue_year}-${String(r.revenue_month).padStart(2, "0")}`, r);
    }
    const points: MonthRevenuePoint[] = sorted.map((r) => {
      const yearMonth = `${r.revenue_year}-${String(r.revenue_month).padStart(2, "0")}`;
      const yoyKey = `${r.revenue_year - 1}-${String(r.revenue_month).padStart(2, "0")}`;
      const prevYear = byKey.get(yoyKey);
      const prevMonth = byKey.get(prevMonthKey(r.revenue_year, r.revenue_month));
      return {
        yearMonth,
        revenue: r.revenue,
        yoy: prevYear && prevYear.revenue ? round(((r.revenue - prevYear.revenue) / prevYear.revenue) * 100) : null,
        mom: prevMonth && prevMonth.revenue ? round(((r.revenue - prevMonth.revenue) / prevMonth.revenue) * 100) : null,
      };
    });
    return points.slice(-12);
  } catch (e) {
    console.warn("[finmind] revenue failed", e);
    return [];
  }
}

export async function fetchSnapshotFinMind(symbol: string): Promise<StockSnapshot> {
  const [info, bars, inst, valuation, revenues] = await Promise.all([
    fetchInfo(symbol),
    fetchPrice(symbol),
    fetchInst(symbol).catch((e) => {
      console.warn("[finmind] inst failed", e);
      return [] as FmInstRow[];
    }),
    fetchValuation(symbol),
    fetchRevenue(symbol),
  ]);
  if (bars.length === 0) {
    throw new Error(`找不到 ${symbol} 的歷史資料，請確認代號是否正確`);
  }

  return {
    quote: buildQuote(symbol, info?.stock_name ?? "", bars),
    kbars: bars,
    chip: buildChipFlow(inst),
    industry: buildIndustryInfo(info),
    shortTermWinRate: shortTermWinRate(bars),
    valuation,
    revenues,
  };
}

function emptyValuation(): ValuationStats {
  return {
    current: null,
    perMin: 0, perMax: 0, perMedian: 0, perQ1: 0, perQ3: 0, perPercentile: 0,
    pbrMin: 0, pbrMax: 0, pbrMedian: 0, samples: 0,
  };
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  return sorted[base];
}

function prevMonthKey(year: number, month: number): string {
  if (month === 1) return `${year - 1}-12`;
  return `${year}-${String(month - 1).padStart(2, "0")}`;
}

function round(n: number) { return Math.round(n * 100) / 100; }
function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }
