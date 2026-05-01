import type { KBar, StockSnapshot } from "./types";

function genKBars(): KBar[] {
  const bars: KBar[] = [];
  const start = new Date("2025-02-01");
  let price = 335;
  for (let i = 0; i < 62; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;

    const drift = i < 50 ? 0.012 : -0.004;
    const noise = (Math.random() - 0.5) * 0.04;
    const open = price;
    const close = Math.max(50, open * (1 + drift + noise));
    const high = Math.max(open, close) * (1 + Math.random() * 0.025);
    const low = Math.min(open, close) * (1 - Math.random() * 0.025);
    const volume = Math.round(2000 + Math.random() * 8000 - (i > 50 ? 3000 : 0));

    bars.push({
      date: d.toISOString().slice(0, 10),
      open: round(open),
      high: round(high),
      low: round(low),
      close: round(close),
      volume: Math.max(800, volume),
    });
    price = close;
  }
  bars[bars.length - 6] = { ...bars[bars.length - 6], high: 931, close: 905 };
  const last = bars[bars.length - 1];
  bars[bars.length - 1] = {
    ...last,
    open: 729,
    high: 791,
    low: 721,
    close: 772,
    volume: 3949,
  };
  return bars;
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}

export const MOCK_SNAPSHOT: StockSnapshot = {
  quote: {
    symbol: "3583",
    name: "辛耘",
    price: 772,
    change: 34,
    changePct: 4.61,
    lotSize: 7,
    totalVolume: 3949,
    time: "04/29 14:30",
    innerVolume: 1720,
    outerVolume: 2229,
  },
  kbars: genKBars(),
  chip: {
    mainForceNet5d: -52,
    foreignNet5d: 36,
    itrustNet5d: 86,
    concentration: 8.4,
    stability: 0.55,
  },
  industry: {
    industry: [
      "半導體設備業",
      "受惠先進製程擴產需求",
      "產業景氣維持高檔",
      "設備族群表現強勢",
    ],
    company: [
      "半導體濕製程設備廠",
      "技術領先，毛利率佳",
      "訂單能見度高",
      "營運成長動能強勁",
    ],
  },
  shortTermWinRate: 62,
  valuation: {
    current: { date: "2025-04-29", per: 18.5, pbr: 3.2, dividendYield: 1.8 },
    perMin: 11.2, perMax: 26.4,
    perQ1: 13.5, perMedian: 16.8, perQ3: 20.3,
    perPercentile: 65,
    pbrMin: 1.8, pbrMax: 4.5, pbrMedian: 2.7,
    samples: 720,
  },
  revenues: [
    { yearMonth: "2024-05", revenue: 580_000_000, yoy: 12.5, mom: 3.2 },
    { yearMonth: "2024-06", revenue: 612_000_000, yoy: 14.8, mom: 5.5 },
    { yearMonth: "2024-07", revenue: 638_000_000, yoy: 18.2, mom: 4.2 },
    { yearMonth: "2024-08", revenue: 655_000_000, yoy: 22.4, mom: 2.7 },
    { yearMonth: "2024-09", revenue: 682_000_000, yoy: 25.1, mom: 4.1 },
    { yearMonth: "2024-10", revenue: 705_000_000, yoy: 27.6, mom: 3.4 },
    { yearMonth: "2024-11", revenue: 720_000_000, yoy: 29.2, mom: 2.1 },
    { yearMonth: "2024-12", revenue: 752_000_000, yoy: 31.5, mom: 4.4 },
    { yearMonth: "2025-01", revenue: 698_000_000, yoy: 28.4, mom: -7.2 },
    { yearMonth: "2025-02", revenue: 715_000_000, yoy: 26.8, mom: 2.4 },
    { yearMonth: "2025-03", revenue: 742_000_000, yoy: 24.1, mom: 3.8 },
    { yearMonth: "2025-04", revenue: 768_000_000, yoy: 22.5, mom: 3.5 },
  ],
};
