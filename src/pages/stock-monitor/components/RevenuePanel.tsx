import { Bar, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonthRevenuePoint } from "../types";
import { Panel } from "./Panel";

export function RevenuePanel({ revenues }: { revenues: MonthRevenuePoint[] }) {
  if (revenues.length === 0) {
    return (
      <Panel title="月營收 yoy" badge="(近 12 個月)">
        <div className="text-center text-slate-500 text-[11px] py-4">無營收資料</div>
        <div className="text-[10px] text-slate-500">※ 歷史事實，非預測</div>
      </Panel>
    );
  }

  const data = revenues.map((r) => ({
    month: r.yearMonth.slice(2),
    revenue: r.revenue / 1_000_000,
    yoy: r.yoy ?? 0,
    yoyColor: r.yoy === null ? "#64748b" : r.yoy >= 0 ? "#ef4444" : "#22c55e",
  }));

  const last = revenues[revenues.length - 1];
  const last3 = revenues.slice(-3);
  const last3Yoy = last3.filter((r) => r.yoy !== null).map((r) => r.yoy!);
  const avgLast3 = last3Yoy.length ? last3Yoy.reduce((a, b) => a + b, 0) / last3Yoy.length : null;

  let trendNote = "近 3 月 YoY 平均 持平";
  if (avgLast3 !== null) {
    if (avgLast3 > 15) trendNote = `近 3 月 YoY 平均 +${avgLast3.toFixed(1)}%（強勁成長）`;
    else if (avgLast3 > 5) trendNote = `近 3 月 YoY 平均 +${avgLast3.toFixed(1)}%（穩定成長）`;
    else if (avgLast3 > -5) trendNote = `近 3 月 YoY 平均 ${avgLast3.toFixed(1)}%（持平）`;
    else if (avgLast3 > -15) trendNote = `近 3 月 YoY 平均 ${avgLast3.toFixed(1)}%（小幅衰退）`;
    else trendNote = `近 3 月 YoY 平均 ${avgLast3.toFixed(1)}%（明顯衰退）`;
  }

  return (
    <Panel title="月營收 YoY" badge="(近 12 個月)">
      <div className="flex justify-between text-[11px] mb-1">
        <span className="text-slate-400">最新 {last.yearMonth}</span>
        <span className="text-cyan-200 font-bold">{(last.revenue / 1_000_000).toFixed(0)} 百萬</span>
        <span className={last.yoy && last.yoy >= 0 ? "text-red-400" : "text-green-400"}>
          YoY {last.yoy !== null ? `${last.yoy >= 0 ? "+" : ""}${last.yoy.toFixed(1)}%` : "—"}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 9 }} interval={0} />
          <YAxis yAxisId="rev" tick={{ fill: "#94a3b8", fontSize: 9 }} hide />
          <YAxis yAxisId="yoy" orientation="right" tick={{ fill: "#fde047", fontSize: 9 }} width={28} />
          <Tooltip content={<RevTip />} />
          <Bar yAxisId="rev" dataKey="revenue" shape={<RevBar />} />
          <Line yAxisId="yoy" type="monotone" dataKey="yoy" stroke="#fde047" strokeWidth={1.5} dot={{ r: 2 }} />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="text-[10px] text-cyan-300 mt-1">{trendNote}</div>
      <div className="text-[10px] text-slate-500 mt-0.5">※ 歷史已公布事實，非預測</div>
    </Panel>
  );
}

function RevBar(props: any) {
  const { x, y, width, height, payload } = props;
  return <rect x={x} y={y} width={width} height={Math.max(1, height)} fill="#0ea5e9" opacity={0.7} />;
}

function RevTip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded border border-cyan-500/40 bg-slate-900/90 px-2 py-1 text-[11px] text-slate-100">
      <div>{p.month}</div>
      <div>營收 {p.revenue.toFixed(0)} 百萬</div>
      <div>YoY {p.yoy >= 0 ? "+" : ""}{p.yoy.toFixed(1)}%</div>
    </div>
  );
}
