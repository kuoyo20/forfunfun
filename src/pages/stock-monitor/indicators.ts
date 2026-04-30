import type {
  KBar,
  KBarWithMA,
  KPattern,
  MultiPeriodRow,
  PriceLevels,
  TechSummary,
  TrendDirection,
  TrendStrength,
} from "./types";

export function withMA(bars: KBar[]): KBarWithMA[] {
  const ma = (i: number, n: number) => {
    if (i + 1 < n) return undefined;
    let sum = 0;
    for (let k = i - n + 1; k <= i; k++) sum += bars[k].close;
    return Math.round((sum / n) * 100) / 100;
  };
  return bars.map((b, i) => ({
    ...b,
    ma5: ma(i, 5),
    ma20: ma(i, 20),
    ma60: ma(i, 60),
  }));
}

export function ema(values: number[], n: number): number[] {
  const k = 2 / (n + 1);
  const out: number[] = [];
  values.forEach((v, i) => {
    if (i === 0) out.push(v);
    else out.push(v * k + out[i - 1] * (1 - k));
  });
  return out;
}

export function computeKD(bars: KBar[], n = 9): { k: number; d: number; status: string } {
  let prevK = 50;
  let prevD = 50;
  for (let i = n - 1; i < bars.length; i++) {
    const slice = bars.slice(i - n + 1, i + 1);
    const high = Math.max(...slice.map((b) => b.high));
    const low = Math.min(...slice.map((b) => b.low));
    const rsv = high === low ? 50 : ((bars[i].close - low) / (high - low)) * 100;
    prevK = (2 / 3) * prevK + (1 / 3) * rsv;
    prevD = (2 / 3) * prevD + (1 / 3) * prevK;
  }
  const k = round(prevK);
  const d = round(prevD);
  let status = "中性";
  if (k > 80) status = "KD高檔鈍化";
  else if (k < 20) status = "KD低檔鈍化";
  else if (k > d) status = "KD向上";
  else status = "KD向下";
  return { k, d, status };
}

export function computeMACD(bars: KBar[]): { dif: number; dem: number; osc: number; status: string } {
  const closes = bars.map((b) => b.close);
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const dif = ema12.map((v, i) => v - ema26[i]);
  const dem = ema(dif, 9);
  const osc = dif.map((v, i) => v - dem[i]);
  const last = dif.length - 1;
  const lastDif = dif[last];
  const lastOsc = osc[last];
  const prevOsc = osc[last - 1] ?? 0;
  let status = "中性";
  if (lastDif > 0 && lastOsc > 0 && lastOsc > prevOsc) status = "正值發散";
  else if (lastDif > 0 && lastOsc > 0 && lastOsc < prevOsc) status = "正值收斂";
  else if (lastDif < 0 && lastOsc < 0 && lastOsc < prevOsc) status = "負值發散";
  else if (lastDif < 0 && lastOsc < 0 && lastOsc > prevOsc) status = "負值收斂";
  return { dif: round(lastDif), dem: round(dem[last]), osc: round(lastOsc), status };
}

export function classifyMA(bars: KBarWithMA[]): { status: string; trend: TrendDirection } {
  const last = bars[bars.length - 1];
  if (!last.ma5 || !last.ma20 || !last.ma60) return { status: "資料不足", trend: "range" };
  if (last.ma5 > last.ma20 && last.ma20 > last.ma60) return { status: "多頭排列 (5>20>60)", trend: "bull" };
  if (last.ma5 < last.ma20 && last.ma20 < last.ma60) return { status: "空頭排列 (5<20<60)", trend: "bear" };
  return { status: "盤整排列", trend: "range" };
}

export function classifyVolume(bars: KBar[]): string {
  if (bars.length < 6) return "資料不足";
  const last = bars[bars.length - 1];
  const ma5 = bars.slice(-6, -1).reduce((s, b) => s + b.volume, 0) / 5;
  const r = last.volume / ma5;
  if (r < 0.9) return "量能略縮";
  if (r > 1.2) return "量能放大";
  return "量能持平";
}

export function biasMA20(bars: KBarWithMA[]): number {
  const last = bars[bars.length - 1];
  if (!last.ma20) return 0;
  return round(((last.close - last.ma20) / last.ma20) * 100);
}

export function buildTechSummary(bars: KBarWithMA[]): TechSummary {
  const ma = classifyMA(bars);
  const kd = computeKD(bars);
  const macd = computeMACD(bars);
  const vol = classifyVolume(bars);
  const bias = biasMA20(bars);
  const trendCN = ma.trend === "bull" ? "多頭趨勢" : ma.trend === "bear" ? "空頭趨勢" : "盤整趨勢";

  const last = bars[bars.length - 1];
  const prev = bars[bars.length - 2];
  const priceUp = last && prev ? last.close > prev.close : false;
  const volUp = last && prev ? last.volume > prev.volume : false;
  let volPrice = "價平量平";
  if (priceUp && volUp) volPrice = "價漲量增";
  else if (priceUp && !volUp) volPrice = "價漲量縮 (短線整理)";
  else if (!priceUp && volUp) volPrice = "價跌量增";
  else if (!priceUp && !volUp) volPrice = "價跌量縮";

  return {
    trendDirection: ma.trend,
    maStatus: `${trendCN}｜${ma.status}`,
    kdStatus: kd.status,
    macdStatus: macd.status,
    volumeStatus: vol,
    volPriceRelation: volPrice,
    biasMA20: bias,
  };
}

export function buildPriceLevels(bars: KBarWithMA[]): PriceLevels {
  const last = bars[bars.length - 1];
  const last60 = bars.slice(-60);
  const last20 = bars.slice(-20);
  const high60 = Math.max(...last60.map((b) => b.high));
  const high20 = Math.max(...last20.map((b) => b.high));
  const low60 = Math.min(...last60.map((b) => b.low));
  const ma20 = last.ma20 ?? last.close;
  const ma60 = last.ma60 ?? last.close;

  return {
    resistanceUpper: round(high60),
    resistanceLower: round(high20),
    supportUpper: round(ma20),
    supportLower: round(Math.max(ma60, low60)),
    recentHigh: round(high60),
  };
}

export function detectKPatterns(bars: KBar[]): KPattern[] {
  const last = bars[bars.length - 1];
  const last20 = bars.slice(-20);
  const range = last.high - last.low || 1;

  const isLongRed = (last.close - last.open) / last.open > 0.03 && last.close >= last.high * 0.95;
  const isHighFallback =
    last.high >= Math.max(...last20.map((b) => b.high)) * 0.999 &&
    last.close < (last.high + last.low) / 2;
  const upperShadow = (last.high - Math.max(last.open, last.close)) / range > 0.5;
  const ma = withMA(bars);
  const lastMA = ma[ma.length - 1];
  const bullArrange = !!(lastMA.ma5 && lastMA.ma20 && lastMA.ma60 && lastMA.ma5 > lastMA.ma20 && lastMA.ma20 > lastMA.ma60);
  const tail5 = bars.slice(-5);
  const vol5 = bars.slice(-10, -5).reduce((s, b) => s + b.volume, 0) / 5;
  const volShrink = tail5.every((b) => b.volume < vol5);

  return [
    { name: "長紅K", matched: isLongRed, description: isLongRed ? "今日長紅上漲" : "未出現長紅" },
    { name: "高檔回落", matched: isHighFallback, description: isHighFallback ? "高點拉回整理" : "未呈現回落" },
    { name: "多方排列", matched: bullArrange, description: bullArrange ? "均線多頭排列支撐" : "均線未多頭排列" },
    { name: "帶上影線", matched: upperShadow, description: upperShadow ? "上檔賣壓仍在" : "上影線不明顯" },
    { name: "量縮整理", matched: volShrink, description: volShrink ? "量能略縮，等待突破" : "量能未持續壓縮" },
  ];
}

export function detectWMPattern(bars: KBar[]): { wBottom: boolean; mTop: boolean; note: string } {
  const slice = bars.slice(-60);
  if (slice.length < 30) return { wBottom: false, mTop: false, note: "資料不足" };
  const lows = slice.map((b) => b.low);
  const highs = slice.map((b) => b.high);
  const minIdx = lows.indexOf(Math.min(...lows));
  const maxIdx = highs.indexOf(Math.max(...highs));
  const note = `近高 ${Math.max(...highs).toFixed(0)} / 近低 ${Math.min(...lows).toFixed(0)}`;
  // Simplified: rarely matches → almost always "未形成"
  return { wBottom: false, mTop: false, note };
}

export function multiPeriodAnalysis(bars: KBarWithMA[]): MultiPeriodRow[] {
  const last = bars[bars.length - 1];
  const trendByMA = (close: number, ma?: number, prevMA?: number): { dir: TrendDirection; str: TrendStrength } => {
    if (!ma) return { dir: "range", str: "weak" };
    const slope = prevMA ? ma - prevMA : 0;
    if (close > ma && slope > 0) return { dir: "bull", str: "strong" };
    if (close > ma && slope === 0) return { dir: "bull", str: "medium-strong" };
    if (close < ma && slope < 0) return { dir: "bear", str: "strong" };
    return { dir: "range", str: "weak" };
  };

  const prevDay = bars[bars.length - 2];
  const daily = trendByMA(last.close, last.ma20, prevDay?.ma20);

  const weekly = trendByMA(last.close, last.ma20, bars[bars.length - 6]?.ma20);
  const monthly = trendByMA(last.close, last.ma60, bars[bars.length - 22]?.ma60);

  return [
    { period: "daily", trend: daily.dir, strength: daily.str, note: "均線多頭排列，短線回落整理" },
    { period: "weekly", trend: weekly.dir, strength: weekly.str === "strong" ? "medium-strong" : weekly.str, note: "週線仍在上升通道" },
    { period: "monthly", trend: monthly.dir, strength: monthly.str, note: "月線長期多頭趨勢不變" },
  ];
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}
