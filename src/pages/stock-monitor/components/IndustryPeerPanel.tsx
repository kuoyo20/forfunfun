import { useQuery } from "@tanstack/react-query";
import { Panel } from "./Panel";

const PEERS: Record<string, { name: string; symbols: string[] }> = {
  "半導體業": { name: "半導體", symbols: ["2330", "2454", "2303", "2379", "3034", "3711", "5347", "6770"] },
  "電子零組件業": { name: "電子零組件", symbols: ["2308", "2317", "2327", "3008", "2474"] },
  "電腦及週邊設備業": { name: "電腦週邊", symbols: ["2353", "2357", "2382", "3231", "2376"] },
  "光電業": { name: "光電", symbols: ["3008", "3481", "3037", "2409"] },
  "通信網路業": { name: "通信", symbols: ["2412", "3045", "4904"] },
  "金融保險業": { name: "金融", symbols: ["2881", "2882", "2884", "2885", "2886", "2891", "2892"] },
  "航運業": { name: "航運", symbols: ["2603", "2609", "2615", "2618"] },
  "塑膠工業": { name: "塑膠", symbols: ["1301", "1303", "1326"] },
  "鋼鐵工業": { name: "鋼鐵", symbols: ["2002", "2014"] },
  "紡織纖維": { name: "紡織", symbols: ["1402", "1409", "1434"] },
};

const BASE = "https://api.finmindtrade.com/api/v4/data";
const TOKEN = (import.meta.env.VITE_FINMIND_TOKEN as string | undefined) ?? "";

interface PerRow { date: string; stock_id: string; PER: number; PBR: number; dividend_yield: number; }

async function fetchLatestPER(symbols: string[]): Promise<Record<string, { per: number; yield_: number }>> {
  const today = new Date();
  today.setDate(today.getDate() - 7);
  const start = today.toISOString().slice(0, 10);
  const result: Record<string, { per: number; yield_: number }> = {};
  await Promise.all(symbols.map(async (s) => {
    try {
      const q = new URLSearchParams({ dataset: "TaiwanStockPER", data_id: s, start_date: start });
      if (TOKEN) q.set("token", TOKEN);
      const res = await fetch(`${BASE}?${q.toString()}`);
      if (!res.ok) return;
      const json = await res.json();
      const data: PerRow[] = json.data ?? [];
      const last = data[data.length - 1];
      if (last && last.PER > 0) result[s] = { per: last.PER, yield_: last.dividend_yield ?? 0 };
    } catch { /* ignore */ }
  }));
  return result;
}

export function IndustryPeerPanel({ industry, currentSymbol, currentPer }: {
  industry: string;
  currentSymbol: string;
  currentPer: number;
}) {
  const peerGroup = PEERS[industry];
  const { data, isLoading } = useQuery({
    queryKey: ["peer-per", industry],
    queryFn: () => fetchLatestPER(peerGroup?.symbols ?? []),
    enabled: !!peerGroup,
    staleTime: 60 * 60 * 1000,
  });

  if (!peerGroup) {
    return (
      <Panel title="同產業比較" badge="(PER 對照)">
        <div className="text-[11px] text-slate-500 py-4 text-center">
          {industry === "未分類" ? "未分類產業，無對照組" : `產業 "${industry}" 暫未建立對照組`}
        </div>
      </Panel>
    );
  }

  if (isLoading || !data) {
    return (
      <Panel title="同產業比較" badge={peerGroup.name}>
        <div className="text-[11px] text-slate-500 py-4 text-center">載入中...</div>
      </Panel>
    );
  }

  const pers = Object.values(data).map((d) => d.per).filter((v) => v > 0).sort((a, b) => a - b);
  const median = pers.length === 0 ? 0 : pers[Math.floor(pers.length / 2)];
  const min = pers[0] ?? 0;
  const max = pers[pers.length - 1] ?? 0;

  let note = "與產業相當";
  if (currentPer > median * 1.2) note = `比產業中位數貴 ${(((currentPer - median) / median) * 100).toFixed(0)}%`;
  else if (currentPer < median * 0.8) note = `比產業中位數便宜 ${(((median - currentPer) / median) * 100).toFixed(0)}%`;

  const sorted = peerGroup.symbols.map((s) => ({ s, per: data[s]?.per ?? 0 })).filter((r) => r.per > 0).sort((a, b) => a.per - b.per);

  return (
    <Panel title="同產業比較" badge={`${peerGroup.name} (${sorted.length} 檔)`}>
      <div className="text-[11px] mb-2">
        <span className="text-slate-400">產業 PE：</span>
        <span className="text-slate-300">{min.toFixed(1)} ~ {max.toFixed(1)}（中位 <b className="text-cyan-300">{median.toFixed(1)}</b>）</span>
      </div>
      <div className="space-y-0.5 max-h-[180px] overflow-y-auto">
        {sorted.map((r) => {
          const isMe = r.s === currentSymbol;
          const cls = isMe ? "bg-cyan-500/30 text-cyan-100 ring-1 ring-cyan-400" : "text-slate-300";
          return (
            <div key={r.s} className={`grid grid-cols-[60px_1fr_50px] gap-2 items-baseline rounded px-2 py-0.5 text-[11px] ${cls}`}>
              <span className="font-mono">{r.s}{isMe ? " ●" : ""}</span>
              <div className="h-1.5 rounded bg-slate-800 relative">
                <div
                  className={`absolute inset-y-0 left-0 rounded ${isMe ? "bg-cyan-400" : "bg-slate-500"}`}
                  style={{ width: `${Math.min(100, (r.per / (max || 1)) * 100)}%` }}
                />
              </div>
              <span className="text-right font-mono">{r.per.toFixed(1)}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-[10px] text-amber-200">
        📊 {currentSymbol} 目前 PE {currentPer.toFixed(1)} 倍 — <b>{note}</b>。
        <br />⚠ PE 高不一定貴、低不一定便宜，要對照產業景氣循環。
      </div>
    </Panel>
  );
}
