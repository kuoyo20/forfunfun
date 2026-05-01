import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fetchMarketSnapshot, type RankRow } from "./finmindMarket";
import { Panel } from "./components/Panel";
import { Disclaimer } from "./components/Disclaimer";
import { FinalDisclaimer } from "./components/FinalDisclaimer";

export function MarketView({ onPick }: { onPick: (symbol: string) => void }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["market-snapshot"],
    queryFn: fetchMarketSnapshot,
    refetchInterval: 10 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return (
    <div className="space-y-2 sm:space-y-3">
      <Disclaimer />
      {error ? (
        <div className="rounded border border-red-500/30 bg-red-900/20 px-4 py-6 text-center text-red-200">
          {(error as Error).message}
        </div>
      ) : isLoading || !data ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3 animate-pulse">
          <div className="h-64 rounded-md border border-cyan-500/20 bg-slate-900/40 lg:col-span-3" />
          <div className="h-96 rounded-md border border-cyan-500/20 bg-slate-900/40" />
          <div className="h-96 rounded-md border border-cyan-500/20 bg-slate-900/40" />
          <div className="h-96 rounded-md border border-cyan-500/20 bg-slate-900/40" />
        </div>
      ) : (
        <>
          <TaiexCard data={data.taiex} asOf={data.asOf} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3">
            <RankCard title="漲幅榜 Top 20" rows={data.gainers} kind="up" onPick={onPick} />
            <RankCard title="跌幅榜 Top 20" rows={data.losers} kind="down" onPick={onPick} />
            <RankCard title="成交量榜 Top 20" rows={data.volume} kind="vol" onPick={onPick} />
          </div>
          <FinalDisclaimer />
        </>
      )}
    </div>
  );
}

function TaiexCard({ data, asOf }: { data: { date: string; close: number; change: number; changePct: number }[]; asOf: string }) {
  if (data.length === 0) {
    return <Panel title="加權指數">無資料</Panel>;
  }
  const last = data[data.length - 1];
  const up = last.change >= 0;
  return (
    <Panel title="加權指數 TAIEX" badge={`截至 ${asOf}`}>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-2">
        <span className={`text-2xl sm:text-3xl font-black tabular-nums ${up ? "text-red-400" : "text-green-400"}`}>
          {last.close.toFixed(2)}
        </span>
        <span className={`text-sm font-bold ${up ? "text-red-400" : "text-green-400"}`}>
          {up ? "▲" : "▼"} {Math.abs(last.change).toFixed(2)} ({last.changePct.toFixed(2)}%)
        </span>
      </div>
      <div className="h-[120px] sm:h-[160px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="taiexFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 9 }} interval={Math.floor(data.length / 6)} tickFormatter={(d) => d.slice(5)} />
            <YAxis domain={["dataMin - 100", "dataMax + 100"]} tick={{ fill: "#94a3b8", fontSize: 9 }} orientation="right" width={42} />
            <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #22d3ee", borderRadius: 4, fontSize: 11 }} />
            <Area type="monotone" dataKey="close" stroke="#22d3ee" strokeWidth={1.5} fill="url(#taiexFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

function RankCard({ title, rows, kind, onPick }: { title: string; rows: RankRow[]; kind: "up" | "down" | "vol"; onPick: (s: string) => void }) {
  return (
    <Panel title={title}>
      <div className="space-y-0.5 max-h-[420px] overflow-y-auto">
        {rows.map((r, i) => {
          const cls = kind === "up" ? "text-red-300" : kind === "down" ? "text-green-300" : "text-yellow-300";
          return (
            <button
              key={r.symbol}
              onClick={() => onPick(r.symbol)}
              className="grid w-full grid-cols-[20px_56px_1fr_56px_56px] items-center gap-1 rounded px-1 py-1 text-[11px] text-left hover:bg-cyan-500/10"
            >
              <span className="text-slate-500">{i + 1}</span>
              <span className="text-cyan-300 font-mono">{r.symbol}</span>
              <span className="text-slate-200 truncate">{r.name}</span>
              <span className={`text-right font-mono ${kind === "vol" ? "text-yellow-200" : cls}`}>
                {kind === "vol" ? r.volume.toLocaleString() : `${r.changePct >= 0 ? "+" : ""}${r.changePct.toFixed(2)}%`}
              </span>
              <span className="text-right text-slate-300 font-mono">{r.close.toFixed(2)}</span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}
