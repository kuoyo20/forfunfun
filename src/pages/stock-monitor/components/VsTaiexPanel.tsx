import { useQuery } from "@tanstack/react-query";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, ReferenceLine } from "recharts";
import { fetchSeries } from "../finmindMarket";
import type { KBar } from "../types";
import { Panel } from "./Panel";

export function VsTaiexPanel({ symbol, bars }: { symbol: string; bars: KBar[] }) {
  const { data: taiex } = useQuery({
    queryKey: ["compare-taiex"],
    queryFn: () => fetchSeries("TAIEX"),
    staleTime: 5 * 60 * 1000,
  });

  if (!taiex || bars.length < 30) {
    return (
      <Panel title="與大盤同期比較" badge="(個股 vs 加權指數)">
        <div className="text-center text-slate-500 text-[11px] py-4">載入加權指數中...</div>
      </Panel>
    );
  }

  const stockMap = new Map(bars.map((b) => [b.date, b.close]));
  const taiexMap = new Map(taiex.map((p) => [p.date, p.close]));
  const commonDates = [...stockMap.keys()].filter((d) => taiexMap.has(d)).sort();

  if (commonDates.length < 5) {
    return <Panel title="與大盤同期比較"><div className="text-[11px] text-slate-500">資料不足對齊</div></Panel>;
  }

  const stockBase = stockMap.get(commonDates[0])!;
  const taiexBase = taiexMap.get(commonDates[0])!;

  const data = commonDates.map((d) => {
    const sc = stockMap.get(d)!;
    const tc = taiexMap.get(d)!;
    return {
      date: d.slice(5),
      [symbol]: round(((sc - stockBase) / stockBase) * 100),
      "加權指數": round(((tc - taiexBase) / taiexBase) * 100),
    };
  });

  const last = data[data.length - 1];
  const stockRet = last[symbol] as number;
  const taiexRet = last["加權指數"] as number;
  const diff = round(stockRet - taiexRet);

  const note = diff > 5
    ? `${symbol} 同期勝大盤 ${diff.toFixed(1)}%`
    : diff < -5
    ? `${symbol} 同期輸大盤 ${Math.abs(diff).toFixed(1)}% — 個股不一定會贏指數`
    : `${symbol} 與大盤幾乎同步 (差 ${diff.toFixed(1)}%)`;

  return (
    <Panel title="與大盤同期比較" badge={`(近 ${commonDates.length} 個交易日)`}>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] mb-1">
        <span><span className="text-cyan-400">●</span> {symbol} <span className={stockRet >= 0 ? "text-red-300" : "text-green-300"}>{stockRet >= 0 ? "+" : ""}{stockRet.toFixed(1)}%</span></span>
        <span><span className="text-fuchsia-400">●</span> 加權指數 <span className={taiexRet >= 0 ? "text-red-300" : "text-green-300"}>{taiexRet >= 0 ? "+" : ""}{taiexRet.toFixed(1)}%</span></span>
      </div>
      <div className="h-[140px] sm:h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 9 }} interval={Math.floor(data.length / 6)} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 9 }} orientation="right" tickFormatter={(v) => `${v}%`} width={42} />
            <ReferenceLine y={0} stroke="#475569" strokeDasharray="2 2" />
            <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #22d3ee", borderRadius: 4, fontSize: 11 }} formatter={(v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Line type="monotone" dataKey={symbol} stroke="#22d3ee" dot={false} strokeWidth={1.5} />
            <Line type="monotone" dataKey="加權指數" stroke="#e879f9" dot={false} strokeWidth={1.5} strokeDasharray="3 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="text-[11px] text-cyan-200 mt-1">📊 {note}</div>
      <div className="text-[10px] text-amber-200 mt-1">
        💡 <b>多數人選股輸給大盤 ETF</b>。如果這檔長期輸 0050，思考一下繼續持有的理由是什麼。
      </div>
    </Panel>
  );
}

function round(n: number) { return Math.round(n * 100) / 100; }
