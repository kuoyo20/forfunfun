import {
  Bar,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { KBarWithMA } from "../types";

interface Props {
  bars: KBarWithMA[];
  recentHigh: number;
  supportUpper: number;
  supportLower: number;
}

export function KLineChart({ bars, recentHigh, supportUpper, supportLower }: Props) {
  const data = bars.map((b) => ({
    date: b.date.slice(5),
    high: b.high,
    low: b.low,
    open: b.open,
    close: b.close,
    range: [b.low, b.high],
    body: [Math.min(b.open, b.close), Math.max(b.open, b.close)],
    up: b.close >= b.open,
    volume: b.volume,
    volColor: b.close >= b.open ? "#ef4444" : "#22c55e",
    ma5: b.ma5,
    ma20: b.ma20,
    ma60: b.ma60,
  }));

  const last = bars[bars.length - 1];

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] sm:text-xs px-1 sm:px-2">
        <span className="text-cyan-300 font-bold">日K線圖</span>
        <span className="text-yellow-300">MA5 {fmt(last?.ma5)}</span>
        <span className="text-cyan-300">MA20 {fmt(last?.ma20)}</span>
        <span className="text-fuchsia-400">MA60 {fmt(last?.ma60)}</span>
      </div>
      <div className="h-[200px] sm:h-[240px] md:h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 36, left: 0, bottom: 0 }}>
          <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 10 }} interval={Math.floor(data.length / 8)} />
          <YAxis
            yAxisId="price"
            domain={["dataMin - 20", "dataMax + 20"]}
            tick={{ fill: "#94a3b8", fontSize: 10 }}
            orientation="right"
          />
          <Tooltip content={<KTip />} />
          <ReferenceLine y={recentHigh} yAxisId="price" stroke="#f87171" strokeDasharray="4 4" label={{ value: `近期高 ${recentHigh}`, fill: "#f87171", fontSize: 10, position: "insideTopRight" }} />
          <ReferenceLine y={supportUpper} yAxisId="price" stroke="#22d3ee" strokeDasharray="4 4" label={{ value: `支撐 ${supportUpper}`, fill: "#22d3ee", fontSize: 10, position: "insideBottomRight" }} />
          <ReferenceLine y={supportLower} yAxisId="price" stroke="#a78bfa" strokeDasharray="4 4" />
          {/* Wick (high/low) */}
          <Bar yAxisId="price" dataKey="range" barSize={1} fill="#64748b" />
          {/* Body */}
          <Bar yAxisId="price" dataKey="body" barSize={5} shape={<CandleBody />} />
          <Line yAxisId="price" type="monotone" dataKey="ma5" stroke="#fde047" dot={false} strokeWidth={1.2} />
          <Line yAxisId="price" type="monotone" dataKey="ma20" stroke="#22d3ee" dot={false} strokeWidth={1.2} />
          <Line yAxisId="price" type="monotone" dataKey="ma60" stroke="#e879f9" dot={false} strokeWidth={1.2} />
        </ComposedChart>
      </ResponsiveContainer>
      </div>
      <div className="h-[60px] sm:h-[70px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 4, right: 36, left: 0, bottom: 0 }}>
          <XAxis dataKey="date" hide />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} orientation="right" width={36} />
          <Tooltip content={<VolTip />} />
          <Bar dataKey="volume" shape={<VolBar />} />
        </ComposedChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}

function CandleBody(props: any) {
  const { x, y, width, height, payload } = props;
  const fill = payload.up ? "#ef4444" : "#22c55e";
  return <rect x={x} y={y} width={width} height={Math.max(1, height)} fill={fill} />;
}

function VolBar(props: any) {
  const { x, y, width, height, payload } = props;
  return <rect x={x} y={y} width={width} height={Math.max(1, height)} fill={payload.volColor} opacity={0.85} />;
}

function KTip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded border border-cyan-500/40 bg-slate-900/90 px-2 py-1 text-[11px] text-slate-100 shadow">
      <div>{p.date}</div>
      <div>開 {fmt(p.open)} 高 {fmt(p.high)}</div>
      <div>低 {fmt(p.low)} 收 {fmt(p.close)}</div>
      <div className="text-slate-400">量 {p.volume}</div>
    </div>
  );
}

function VolTip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded border border-cyan-500/40 bg-slate-900/90 px-2 py-1 text-[11px] text-slate-100">
      {p.date}　量 {p.volume}
    </div>
  );
}

function fmt(n?: number) {
  if (n === undefined || Number.isNaN(n)) return "-";
  return n.toFixed(2);
}
