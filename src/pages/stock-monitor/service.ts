import { MOCK_SNAPSHOT } from "./mock";
import type { StockSnapshot } from "./types";

const PROVIDER = (import.meta.env.VITE_STOCK_PROVIDER as string | undefined) ?? "mock";

export async function fetchSnapshot(symbol: string): Promise<StockSnapshot> {
  if (PROVIDER === "finmind") {
    return fetchFromFinMind(symbol);
  }
  await sleep(120);
  // Slightly perturb price each poll to simulate live ticking.
  const jitter = (Math.random() - 0.5) * 4;
  const price = round(MOCK_SNAPSHOT.quote.price + jitter);
  const change = round(price - (MOCK_SNAPSHOT.quote.price - MOCK_SNAPSHOT.quote.change));
  const base = MOCK_SNAPSHOT.quote.price - MOCK_SNAPSHOT.quote.change;
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

async function fetchFromFinMind(symbol: string): Promise<StockSnapshot> {
  // Stub for real provider; falls back to mock until wired up.
  console.warn("[stock-monitor] FinMind provider not implemented; using mock.", symbol);
  return MOCK_SNAPSHOT;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}
