import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { fetchSeries } from "./finmindMarket";
import { useWatchlist } from "./useWatchlist";
import { Panel } from "./components/Panel";
import { Disclaimer } from "./components/Disclaimer";
import { FinalDisclaimer } from "./components/FinalDisclaimer";

const COLORS = ["#22d3ee", "#fde047", "#a78bfa", "#f472b6"];

export function CompareView({ onPick }: { onPick: (symbol: string) => void }) {
  const watchlist = useWatchlist();
  const [picked, setPicked] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const symbols = picked.length > 0 ? picked : watchlist.list.slice(0, 4).map((w) => w.symbol);
  const limited = symbols.slice(0, 4);

  const queries = useQueries({
    queries: limited.map((s) => ({
      queryKey: ["compare-series", s],
      queryFn: () => fetchSeries(s),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const chartData = useMemo(() => {
    if (queries.some((q) => !q.data)) return [];
    const dateSet = new Set<string>();
    queries.forEach((q) => q.data?.forEach((p) => dateSet.add(p.date)));
    const dates = [...dateSet].sort();
    return dates.map((date) => {
      const row: any = { date: date.slice(5) };
      limited.forEach((sym, i) => {
        const series = queries[i].data;
        if (!series || series.length === 0) return;
        const base = series[0].close;
        const point = series.find((p) => p.date === date);
        if (point && base > 0) row[sym] = round(((point.close - base) / base) * 100);
      });
      return row;
    });
  }, [queries, limited]);

  const stats = limited.map((sym, i) => {
    const series = queries[i].data;
    if (!series || series.length < 2) return { sym, last: 0, day: 0, m1: 0, m3: 0 };
    const last = series[series.length - 1].close;
    const prev = series[series.length - 2].close;
    const day = prev > 0 ? round(((last - prev) / prev) * 100) : 0;
    const m1Idx = Math.max(0, series.length - 22);
    const m1 = series[m1Idx].close > 0 ? round(((last - series[m1Idx].close) / series[m1Idx].close) * 100) : 0;
    const m3Idx = 0;
    const m3 = series[m3Idx].close > 0 ? round(((last - series[m3Idx].close) / series[m3Idx].close) * 100) : 0;
    return { sym, last, day, m1, m3 };
  });

  const allLoading = queries.some((q) => q.isLoading);

  return (
    <div className="space-y-2 sm:space-y-3">
      <Disclaimer />
      <Panel title="多檔對比" badge="(最多 4 檔，% 變化以區間第一日為基準)">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1 items-center">
            <span className="text-[11px] text-slate-400 mr-1">已選 ({limited.length}/4)：</span>
            {limited.length === 0 && (
              <span className="text-[11px] text-slate-500">未選擇 — 預設使用自選股前 4 檔，或在下方輸入</span>
            )}
            {limited.map((s, i) => (
              <span key={s} className="inline-flex items-center gap-1 rounded border border-cyan-500/40 bg-slate-900/60 px-2 py-0.5 text-[11px]">
                <span className="inline-block w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
                <span className="text-cyan-200 font-mono">{s}</span>
                <button onClick={() => setPicked(picked.filter((x) => x !== s))} className="opacity-50 hover:opacity-100 hover:text-red-300">×</button>
              </span>
            ))}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const v = input.trim();
                if (!v) return;
                if (limited.length >= 4) return;
                if (limited.includes(v)) return;
                setPicked([...limited, v]);
                setInput("");
              }}
              className="flex items-center gap-1 ml-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="加入代號"
                inputMode="numeric"
                className="w-20 rounded border border-cyan-500/40 bg-slate-900 px-2 py-1 text-xs text-cyan-200 focus:outline-none"
              />
              <button type="submit" className="rounded bg-cyan-500/20 px-2 py-1 text-xs text-cyan-200" disabled={limited.length >= 4}>+</button>
            </form>
            {watchlist.list.length > 0 && (
              <button onClick={() => setPicked(watchlist.list.slice(0, 4).map((w) => w.symbol))} className="rounded border border-yellow-500/40 px-2 py-0.5 text-[11px] text-yellow-200 ml-2">
                ★ 用自選股前 4 檔
              </button>
            )}
          </div>

          {allLoading ? (
            <div className="h-[300px] rounded border border-cyan-500/20 bg-slate-900/40 animate-pulse" />
          ) : limited.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">請至少加入 1 檔股票</div>
          ) : (
            <>
              <div className="h-[260px] sm:h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 10 }} interval={Math.floor(chartData.length / 8)} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} orientation="right" tickFormatter={(v) => `${v}%`} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #22d3ee", borderRadius: 4, fontSize: 11 }} formatter={(v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {limited.map((sym, i) => (
                      <Line key={sym} type="monotone" dataKey={sym} stroke={COLORS[i]} dot={false} strokeWidth={1.5} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <table className="w-full text-[11px] mt-2">
                <thead className="text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="text-left py-1">代號</th>
                    <th className="text-right">收盤</th>
                    <th className="text-right">當日%</th>
                    <th className="text-right">月%</th>
                    <th className="text-right">3月%</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((s, i) => (
                    <tr key={s.sym} className="border-b border-slate-800/60">
                      <td className="py-1">
                        <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: COLORS[i] }} />
                        <span className="font-mono text-cyan-200">{s.sym}</span>
                      </td>
                      <td className="text-right font-mono text-slate-200">{s.last.toFixed(2)}</td>
                      <td className={`text-right font-mono ${s.day >= 0 ? "text-red-300" : "text-green-300"}`}>{s.day >= 0 ? "+" : ""}{s.day.toFixed(2)}%</td>
                      <td className={`text-right font-mono ${s.m1 >= 0 ? "text-red-300" : "text-green-300"}`}>{s.m1 >= 0 ? "+" : ""}{s.m1.toFixed(2)}%</td>
                      <td className={`text-right font-mono ${s.m3 >= 0 ? "text-red-300" : "text-green-300"}`}>{s.m3 >= 0 ? "+" : ""}{s.m3.toFixed(2)}%</td>
                      <td className="text-right">
                        <button onClick={() => onPick(s.sym)} className="rounded border border-cyan-500/40 px-1.5 py-0.5 text-[10px] text-cyan-200 hover:bg-cyan-500/20">看詳細 →</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </Panel>
      <FinalDisclaimer />
    </div>
  );
}

function round(n: number) { return Math.round(n * 100) / 100; }
