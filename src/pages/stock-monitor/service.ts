import { MOCK_SNAPSHOT } from "./mock";
import { fetchSnapshotFinMind } from "./finmind";
import type { StockSnapshot } from "./types";

const PROVIDER = ((import.meta.env.VITE_STOCK_PROVIDER as string | undefined) ?? "finmind").toLowerCase();

export interface SnapshotResult {
  snapshot: StockSnapshot;
  source: "finmind" | "mock";
  warning?: string;
}

export async function fetchSnapshot(symbol: string): Promise<SnapshotResult> {
  if (PROVIDER === "mock") {
    return { snapshot: tweakMock(symbol), source: "mock" };
  }
  try {
    const snap = await fetchSnapshotFinMind(symbol);
    return { snapshot: snap, source: "finmind" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "未知錯誤";
    return { snapshot: tweakMock(symbol), source: "mock", warning: `FinMind 失敗：${msg}` };
  }
}

function tweakMock(symbol: string): StockSnapshot {
  const jitter = (Math.random() - 0.5) * 4;
  const price = round(MOCK_SNAPSHOT.quote.price + jitter);
  const base = MOCK_SNAPSHOT.quote.price - MOCK_SNAPSHOT.quote.change;
  const change = round(price - base);
  return {
    ...MOCK_SNAPSHOT,
    quote: {
      ...MOCK_SNAPSHOT.quote,
      symbol,
      price,
      change,
      changePct: round((change / base) * 100),
      time: new Date().toLocaleTimeString("zh-TW", { hour12: false }),
    },
  };
}

function round(n: number) { return Math.round(n * 100) / 100; }
