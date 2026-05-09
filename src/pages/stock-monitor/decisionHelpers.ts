import type { KBar } from "./types";

export interface RiskFlag {
  level: "red" | "yellow";
  label: string;
  desc: string;
}

export function computeRiskFlags(bars: KBar[]): RiskFlag[] {
  const flags: RiskFlag[] = [];
  if (bars.length < 30) return flags;

  const last = bars[bars.length - 1];

  // 1. 近 3 個月漲幅
  const idx3m = Math.max(0, bars.length - 65);
  const ret3m = ((last.close - bars[idx3m].close) / bars[idx3m].close) * 100;
  if (ret3m > 50)
    flags.push({ level: "red", label: "近 3 月漲幅過大", desc: `+${ret3m.toFixed(1)}%，追高風險高` });
  else if (ret3m > 30)
    flags.push({ level: "yellow", label: "近 3 月漲幅偏大", desc: `+${ret3m.toFixed(1)}%` });

  // 2. RSI(14)
  if (bars.length >= 15) {
    const rsi = computeRSI(bars, 14);
    if (rsi > 80)
      flags.push({ level: "red", label: "RSI 進入超買區", desc: `${rsi.toFixed(1)} (>80)` });
    else if (rsi > 70)
      flags.push({ level: "yellow", label: "RSI 偏高", desc: `${rsi.toFixed(1)} (>70)` });
    else if (rsi < 20)
      flags.push({ level: "yellow", label: "RSI 進入超賣區", desc: `${rsi.toFixed(1)} (<20)` });
  }

  // 3. MA20 乖離
  if (bars.length >= 20) {
    const ma20 = avg(bars.slice(-20).map((b) => b.close));
    const bias = ((last.close - ma20) / ma20) * 100;
    if (Math.abs(bias) > 15)
      flags.push({
        level: "red",
        label: "MA20 乖離過大",
        desc: `${bias >= 0 ? "+" : ""}${bias.toFixed(1)}%，常見短線反轉訊號`,
      });
    else if (Math.abs(bias) > 10)
      flags.push({
        level: "yellow",
        label: "MA20 乖離偏大",
        desc: `${bias >= 0 ? "+" : ""}${bias.toFixed(1)}%`,
      });
  }

  // 4. 連漲 / 連跌
  let consUp = 0;
  let consDown = 0;
  for (let i = bars.length - 1; i >= 1; i--) {
    if (bars[i].close > bars[i - 1].close) {
      if (consDown > 0) break;
      consUp++;
    } else if (bars[i].close < bars[i - 1].close) {
      if (consUp > 0) break;
      consDown++;
    } else break;
  }
  if (consUp >= 7)
    flags.push({ level: "red", label: `連漲 ${consUp} 日`, desc: "短線過熱，注意修正" });
  else if (consUp >= 5)
    flags.push({ level: "yellow", label: `連漲 ${consUp} 日`, desc: "短線偏熱" });
  if (consDown >= 7)
    flags.push({ level: "yellow", label: `連跌 ${consDown} 日`, desc: "短線可能超賣" });

  // 5. 近 60 日波動度（日報酬標準差）
  if (bars.length >= 60) {
    const closes = bars.slice(-60).map((b) => b.close);
    const rets = closes.slice(1).map((c, i) => (c - closes[i]) / closes[i]);
    const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
    const variance = rets.reduce((s, r) => s + (r - mean) ** 2, 0) / rets.length;
    const std = Math.sqrt(variance) * 100;
    if (std > 5)
      flags.push({ level: "yellow", label: "近 60 日波動高", desc: `日標準差 ${std.toFixed(2)}%，心臟要強` });
  }

  // 6. 流動性
  if (bars.length >= 20) {
    const avgVol = avg(bars.slice(-20).map((b) => b.volume));
    if (avgVol < 500)
      flags.push({ level: "red", label: "流動性偏低", desc: `日均量 ${Math.round(avgVol)} 張，新手不適合` });
    else if (avgVol < 1500)
      flags.push({ level: "yellow", label: "流動性中等", desc: `日均量 ${Math.round(avgVol)} 張` });
  }

  return flags;
}

function computeRSI(bars: KBar[], n: number): number {
  let gains = 0;
  let losses = 0;
  const start = bars.length - n - 1;
  for (let i = start; i < bars.length - 1; i++) {
    const diff = bars[i + 1].close - bars[i].close;
    if (diff >= 0) gains += diff;
    else losses += -diff;
  }
  const avgGain = gains / n;
  const avgLoss = losses / n;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function avg(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export interface BacktestRow {
  label: string;
  daysBack: number;
  startPrice: number;
  totalReturn: number;
  annualized: number;
  maxDrawdown: number;
  drawdownAt?: string;
}

export function computeBacktest(bars: KBar[]): BacktestRow[] {
  if (bars.length < 5) return [];
  const last = bars[bars.length - 1].close;
  const periods: { label: string; days: number }[] = [
    { label: "近 1 年", days: 250 },
    { label: "近 3 年", days: 750 },
    { label: "近 5 年", days: 1250 },
  ];

  const rows: BacktestRow[] = [];
  for (const p of periods) {
    if (bars.length < 30) continue;
    const startIdx = Math.max(0, bars.length - p.days);
    const slice = bars.slice(startIdx);
    if (slice.length < 30) continue;
    const start = slice[0].close;
    const totalReturn = ((last - start) / start) * 100;
    const years = slice.length / 250;
    const annualized = (Math.pow(last / start, 1 / years) - 1) * 100;

    let peak = slice[0].close;
    let maxDD = 0;
    let ddAtIdx = 0;
    for (let i = 0; i < slice.length; i++) {
      if (slice[i].close > peak) peak = slice[i].close;
      const dd = ((slice[i].close - peak) / peak) * 100;
      if (dd < maxDD) {
        maxDD = dd;
        ddAtIdx = i;
      }
    }

    rows.push({
      label: p.label,
      daysBack: slice.length,
      startPrice: round(start),
      totalReturn: round(totalReturn),
      annualized: round(annualized),
      maxDrawdown: round(maxDD),
      drawdownAt: slice[ddAtIdx]?.date,
    });
  }
  return rows;
}

export interface WorstScenario {
  label: string;
  worstReturn: number;
  worstStart: string;
  worstEnd: string;
}

export function computeWorstScenarios(bars: KBar[]): WorstScenario[] {
  if (bars.length < 60) return [];
  const ranges: { label: string; window: number }[] = [
    { label: "單日", window: 1 },
    { label: "1 週", window: 5 },
    { label: "1 個月", window: 21 },
    { label: "1 季", window: 63 },
    { label: "半年", window: 125 },
  ];
  return ranges
    .filter((r) => bars.length > r.window)
    .map((r) => {
      let worst = 0;
      let worstI = 0;
      for (let i = r.window; i < bars.length; i++) {
        const ret = ((bars[i].close - bars[i - r.window].close) / bars[i - r.window].close) * 100;
        if (ret < worst) {
          worst = ret;
          worstI = i;
        }
      }
      return {
        label: r.label,
        worstReturn: round(worst),
        worstStart: bars[Math.max(0, worstI - r.window)].date,
        worstEnd: bars[worstI].date,
      };
    });
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}
