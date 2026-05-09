import type { RiskFlag } from "../decisionHelpers";
import { Panel } from "./Panel";

export function RiskFlagsPanel({ flags }: { flags: RiskFlag[] }) {
  const reds = flags.filter((f) => f.level === "red");
  const yellows = flags.filter((f) => f.level === "yellow");

  if (flags.length === 0) {
    return (
      <Panel title="⚠ 風險警示" badge="(過熱 / 流動性 / 波動)">
        <div className="rounded border border-green-500/30 bg-green-500/10 px-2 py-1.5 text-[11px] text-green-300">
          目前未觸發任何過熱 / 風險警示。
        </div>
        <p className="mt-2 text-[10px] text-slate-500">※ 警示為演算法統計，不代表「沒風險」。任何投資都有風險。</p>
      </Panel>
    );
  }

  return (
    <Panel title="⚠ 風險警示" badge={`(${reds.length} 紅 / ${yellows.length} 黃)`}>
      <div className="space-y-1.5">
        {reds.map((f, i) => (
          <Flag key={`r${i}`} f={f} />
        ))}
        {yellows.map((f, i) => (
          <Flag key={`y${i}`} f={f} />
        ))}
      </div>
      <div className="mt-2 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-[10px] text-amber-200 leading-relaxed">
        💭 看到紅黃燈不代表「該賣 / 該空」 — 只是提醒你<b>不要在過熱時追高</b>。冷靜想一下：
        <b>如果隔天跌 10%，你今天還會買嗎？</b>
      </div>
    </Panel>
  );
}

function Flag({ f }: { f: RiskFlag }) {
  const cls =
    f.level === "red"
      ? "border-red-500/50 bg-red-500/15 text-red-100"
      : "border-yellow-500/50 bg-yellow-500/15 text-yellow-100";
  const icon = f.level === "red" ? "🔴" : "🟡";
  return (
    <div className={`rounded border px-2 py-1.5 text-[11px] ${cls}`}>
      <div className="flex items-baseline gap-1.5">
        <span>{icon}</span>
        <span className="font-bold">{f.label}</span>
      </div>
      <div className="text-[10px] text-slate-300 mt-0.5">{f.desc}</div>
    </div>
  );
}
